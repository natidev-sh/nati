import { app, BrowserWindow, dialog, Menu, Tray, nativeImage, shell, ipcMain } from "electron";
import * as path from "node:path";
import { registerIpcHandlers } from "./ipc/ipc_host";
import dotenv from "dotenv";
// @ts-ignore
import started from "electron-squirrel-startup";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import log from "electron-log";
import {
  getSettingsFilePath,
  readSettings,
  writeSettings,
} from "./main/settings";
import { handleSupabaseOAuthReturn } from "./supabase_admin/supabase_return_handler";
import { handleDyadProReturn } from "./main/pro";
import { IS_TEST_BUILD } from "./ipc/utils/test_utils";
import { BackupManager } from "./backup_manager";
import { getDatabasePath, initializeDatabase } from "./db";
import { UserSettings } from "./lib/schemas";
import { handleNeonOAuthReturn } from "./neon_admin/neon_return_handler";
import { handleNatiAuthReturn } from "./nati_auth/nati_auth_return_handler";
import { startDesktopHeartbeat, stopDesktopHeartbeat } from "./desktop_heartbeat";

log.errorHandler.startCatching();
log.eventLogger.startLogging();
log.scope.labelPadding = false;

const logger = log.scope("main");

// Load environment variables from .env file
dotenv.config();

// Register IPC handlers before app is ready
registerIpcHandlers();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app#main-process-mainjs
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("nati", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("nati");
}

export async function onReady() {
  try {
    const backupManager = new BackupManager({
      settingsFile: getSettingsFilePath(),
      dbFile: getDatabasePath(),
    });
    await backupManager.initialize();
  } catch (e) {
    logger.error("Error initializing backup manager", e);
  }
  initializeDatabase();
  const settings = readSettings();
  await onFirstRunMaybe(settings);
  createWindow();

  // Start desktop heartbeat for remote control
  if (settings.natiUser?.id) {
    startDesktopHeartbeat();
    logger.info("Desktop heartbeat started for user:", settings.natiUser.email);
  }

  logger.info("Auto-update enabled=", settings.enableAutoUpdate);
  // Only enable auto-update in packaged builds
  if (settings.enableAutoUpdate && app.isPackaged) {
    // Technically we could just pass the releaseChannel directly to the host,
    // but this is more explicit and falls back to stable if there's an unknown
    // release channel.
    const postfix = settings.releaseChannel === "beta" ? "beta" : "stable";
    logger.info("Auto-update release channel=", postfix);
    updateElectronApp({
      logger,
      updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: "natidev-sh/nati",
      },
    }); // additional configuration options available

    // Hook into autoUpdater events and forward to renderer
    // Prefer electron-updater if available, otherwise fall back to Electron's autoUpdater
    let updater: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      updater = require("electron-updater").autoUpdater; // optional dep
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      updater = require("electron").autoUpdater;
    }

    const send = (payload: any) => mainWindow?.webContents.send("update-status", payload);

    // Configure updater to avoid OS-level restart prompts; we will handle UX in renderer
    try { updater.autoInstallOnAppQuit = false; } catch {}
    // Keep autoDownload as-is (default true). If you prefer manual download, set to false and expose IPC.
    // try { updater.autoDownload = false; } catch {}

    try {
      // Some updaters emit this when a check begins
      updater.on?.("checking-for-update", () => {
        isUpdateCheckInFlight = true;
        lastUpdateCheckAt = Date.now();
        send({ type: "checking" });
      });
      updater.on("update-available", (info: any) => {
        logger.info("update-available", info?.version || "");
        send({ type: "available", version: info?.version });
      });
      updater.on?.("update-not-available", () => {
        isUpdateCheckInFlight = false;
        send({ type: "not-available" });
      });
      updater.on("download-progress", (p: any) => {
        send({ type: "download-progress", percent: p?.percent ?? 0, bytesPerSecond: p?.bytesPerSecond ?? 0 });
      });
      updater.on("update-downloaded", (info: any) => {
        logger.info("update-downloaded", info?.version || "");
        send({ type: "downloaded", version: info?.version });
        isUpdateCheckInFlight = false;
      });
      updater.on("error", (err: any) => {
        logger.warn("autoUpdater error", err?.message || err);
        send({ type: "error", message: String(err?.message || err) });
        isUpdateCheckInFlight = false;
      });

      // Expose manual actions
      ipcMain.handle("update:check-now", async () => {
        try {
          const now = Date.now();
          // Debounce manual checks to avoid Squirrel lock conflicts
          if (isUpdateCheckInFlight) {
            return { ok: false, busy: true, reason: "in_flight" };
          }
          if (lastUpdateCheckAt && now - lastUpdateCheckAt < 30_000) {
            return { ok: false, busy: true, reason: "cooldown" };
          }
          isUpdateCheckInFlight = true;
          lastUpdateCheckAt = now;
          // For electron-updater this triggers flow; for built-in, same
          await updater.checkForUpdates();
          return { ok: true };
        } catch (e: any) {
          logger.warn("checkForUpdates failed", e);
          isUpdateCheckInFlight = false;
          return { ok: false, error: String(e?.message || e) };
        }
      });
      ipcMain.handle("update:quit-and-install", async () => {
        try {
          // Prevent close handler from hiding to tray
          isQuittingForUpdate = true;
          // Destroy tray so app can quit cleanly
          try { tray?.destroy(); } catch {}
          tray = null;
          // electron-updater supports immediate install; fallback to relaunch
          if (typeof updater.quitAndInstall === "function") {
            updater.quitAndInstall();
          } else {
            app.relaunch();
            app.exit(0);
          }
          return { ok: true };
        } catch (e: any) {
          logger.warn("quitAndInstall failed", e);
          return { ok: false, error: String(e?.message || e) };
        }
      });
    } catch (e) {
      logger.warn("Failed to bind autoUpdater events", e);
    }
  }
}

export async function onFirstRunMaybe(settings: UserSettings) {
  if (!settings.hasRunBefore) {
    await promptMoveToApplicationsFolder();
    writeSettings({
      hasRunBefore: true,
    });
  }
  if (IS_TEST_BUILD) {
    writeSettings({
      isTestMode: true,
    });
  }
}

/**
 * Ask the user if the app should be moved to the
 * applications folder.
 */
async function promptMoveToApplicationsFolder(): Promise<void> {
  // Why not in e2e tests?
  // There's no way to stub this dialog in time, so we just skip it
  // in e2e testing mode.
  if (IS_TEST_BUILD) return;
  if (process.platform !== "darwin") return;
  if (app.isInApplicationsFolder()) return;
  logger.log("Prompting user to move to applications folder");

  const { response } = await dialog.showMessageBox({
    type: "question",
    buttons: ["Move to Applications Folder", "Do Not Move"],
    defaultId: 0,
    message: "Move to Applications Folder? (required for auto-update)",
  });

  if (response === 0) {
    logger.log("User chose to move to applications folder");
    app.moveToApplicationsFolder();
  } else {
    logger.log("User chose not to move to applications folder");
  }
}

declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let didShowTrayTip = false;
let isUpdateCheckInFlight = false;
let lastUpdateCheckAt: number | null = null;
let isQuittingForUpdate = false;

function getWinIconPath() {
  // In packaged builds, use resourcesPath + extraResource
  const base = app.isPackaged
    ? path.join(process.resourcesPath)
    : path.resolve(__dirname, "..", "assets", "win");
  // If packaged, we copied ./assets/win/app.ico via extraResource to resources root
  return app.isPackaged ? path.join(base, "app.ico") : path.join(base, "app.ico");
}

function getGenericIconPngPath() {
  // In packaged builds, use resourcesPath + extraResource
  const base = app.isPackaged
    ? path.join(process.resourcesPath)
    : path.resolve(__dirname, "..", "assets", "icon");
  // If packaged, we copied ./assets/icon/logo.png via extraResource to resources root
  return app.isPackaged ? path.join(base, "logo.png") : path.join(base, "logo.png");
}

// Set app identity ASAP for Windows notifications and taskbar grouping
if (process.platform === "win32") {
  try {
    app.setName("Nati");
    app.setAppUserModelId("com.natidev.nati");
  } catch {}
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: process.env.NODE_ENV === "development" ? 1280 : 960,
    minWidth: 800,
    height: 700,
    minHeight: 500,
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    trafficLightPosition: {
      x: 10,
      y: 8,
    },
    icon: process.platform === "win32" ? getWinIconPath() : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      // transparent: true,
    },
    // backgroundColor: "#00000001",
    // frame: false,
  });
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "../renderer/main_window/index.html"),
    );
  }
  if (process.env.NODE_ENV === "development") {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  // Close should quit the app (no minimize-to-tray interception)
  // We still keep the tray for quick access while the app is running.
  mainWindow.on("close", () => {
    // If we ever need special handling when quitting for update, it's tracked by isQuittingForUpdate
  });
};

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine, _workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // the commandLine is array of strings in which last element is deep link url
    handleDeepLinkReturn(commandLine.pop()!);
  });
  app.whenReady().then(onReady);
}

// Handle the protocol. In this case, we choose to show an Error Box.
app.on("open-url", (event, url) => {
  handleDeepLinkReturn(url);
});

function handleDeepLinkReturn(url: string) {
  // example url: "nati://supabase-oauth-return?token=a&refreshToken=b"
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    log.info("Invalid deep link URL", url);
    return;
  }

  // Intentionally do NOT log the full URL which may contain sensitive tokens.
  log.log(
    "Handling deep link: protocol",
    parsed.protocol,
    "hostname",
    parsed.hostname,
  );
  if (parsed.protocol !== "nati:") {
    dialog.showErrorBox(
      "Invalid Protocol",
      `Expected nati://, got ${parsed.protocol}. Full URL: ${url}`,
    );
    return;
  }
  if (parsed.hostname === "neon-oauth-return") {
    const token = parsed.searchParams.get("token");
    const refreshToken = parsed.searchParams.get("refreshToken");
    const expiresIn = Number(parsed.searchParams.get("expiresIn"));
    if (!token || !refreshToken || !expiresIn) {
      dialog.showErrorBox(
        "Invalid URL",
        "Expected token, refreshToken, and expiresIn",
      );
      return;
    }
    handleNeonOAuthReturn({ token, refreshToken, expiresIn });
    // Send message to renderer to trigger re-render
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  if (parsed.hostname === "supabase-oauth-return") {
    const token = parsed.searchParams.get("token");
    const refreshToken = parsed.searchParams.get("refreshToken");
    const expiresIn = Number(parsed.searchParams.get("expiresIn"));
    if (!token || !refreshToken || !expiresIn) {
      dialog.showErrorBox(
        "Invalid URL",
        "Expected token, refreshToken, and expiresIn",
      );
      return;
    }
    handleSupabaseOAuthReturn({ token, refreshToken, expiresIn });
    // Send message to renderer to trigger re-render
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  // dyad://dyad-pro-return?key=123&budget_reset_at=2025-05-26T16:31:13.492000Z&max_budget=100
  if (parsed.hostname === "dyad-pro-return") {
    const apiKey = parsed.searchParams.get("key");
    if (!apiKey) {
      dialog.showErrorBox("Invalid URL", "Expected key");
      return;
    }
    handleDyadProReturn({
      apiKey,
    });
    // Send message to renderer to trigger re-render
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  // dyad://nati-auth-return?userId=123&email=user@example.com&name=John&avatar=https://...&accessToken=abc&refreshToken=xyz&expiresIn=3600&isPro=true&isAdmin=false
  if (parsed.hostname === "nati-auth-return") {
    const userId = parsed.searchParams.get("userId");
    const email = parsed.searchParams.get("email");
    const name = parsed.searchParams.get("name") || undefined;
    const avatar = parsed.searchParams.get("avatar") || undefined;
    const accessToken = parsed.searchParams.get("accessToken");
    const refreshToken = parsed.searchParams.get("refreshToken");
    const expiresIn = Number(parsed.searchParams.get("expiresIn"));
    const isPro = parsed.searchParams.get("isPro") === "true";
    const isAdmin = parsed.searchParams.get("isAdmin") === "true";
    
    if (!userId || !email || !accessToken || !refreshToken || !expiresIn) {
      dialog.showErrorBox(
        "Invalid URL",
        "Expected userId, email, accessToken, refreshToken, and expiresIn"
      );
      return;
    }
    
    handleNatiAuthReturn({
      userId,
      email,
      name,
      avatar,
      accessToken,
      refreshToken,
      expiresIn,
      isPro,
      isAdmin,
    });
    
    // Send message to renderer to trigger re-render
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  dialog.showErrorBox("Invalid deep link URL", url);
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
  mainWindow?.show();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Create Tray once app is ready
app.whenReady().then(() => {
  try {
    // Choose appropriate tray icon per platform
    let iconPath: string;
    if (process.platform === "win32") {
      iconPath = getWinIconPath();
    } else {
      iconPath = getGenericIconPngPath();
    }

    let image = nativeImage.createFromPath(iconPath);
    if (!image || image.isEmpty()) {
      // Fallback: try generic PNG if Windows icon failed for some reason
      const fallback = getGenericIconPngPath();
      const fallbackImage = nativeImage.createFromPath(fallback);
      if (!fallbackImage.isEmpty()) image = fallbackImage;
    }

    // On macOS, use template image for dark/light auto inversion
    if (process.platform === "darwin") {
      image.setTemplateImage?.(true);
    }

    tray = new Tray(image);
    const menu = Menu.buildFromTemplate([
      {
        label: "Show Nati",
        click: () => {
          if (!mainWindow) return;
          mainWindow.show();
          mainWindow.focus();
        },
      },
      {
        label: "Home",
        click: () => {
          if (!mainWindow) return;
          mainWindow.show();
          mainWindow.webContents.send("navigate", { to: "/" });
        },
      },
      {
        label: "Apps",
        click: () => {
          if (!mainWindow) return;
          mainWindow.show();
          mainWindow.webContents.send("navigate", { to: "/" });
        },
      },
      {
        label: "Settings",
        click: () => {
          if (!mainWindow) return;
          mainWindow.show();
          mainWindow.webContents.send("navigate", { to: "/settings" });
        },
      },
      { type: "separator" },
      {
        label: "GitHub Repo",
        click: () => shell.openExternal("https://github.com/natidev-sh/nati"),
      },
      {
        label: "GitHub Issues",
        click: () =>
          shell.openExternal("https://github.com/natidev-sh/nati/issues"),
      },
      {
        label: "Releases",
        click: () =>
          shell.openExternal("https://github.com/natidev-sh/nati/releases"),
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          // Allow quitting even if we intercept close elsewhere
          tray?.destroy();
          tray = null;
          app.quit();
        },
      },
    ]);
    tray.setToolTip("Nati");
    tray.setContextMenu(menu);
    tray.on("click", () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    logger.warn("Failed to create tray", err);
  }
});
