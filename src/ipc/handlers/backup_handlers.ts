import { createLoggedHandler } from "./safe_handle";
import log from "electron-log";
import { BackupManager } from "../../backup_manager";
import { getSettingsFilePath } from "../../main/settings";
import { getDatabasePath } from "../../db";

const logger = log.scope("backup_handlers");
const handle = createLoggedHandler(logger);

let backupManager: BackupManager | null = null;

async function getBackupManager(): Promise<BackupManager> {
  if (!backupManager) {
    backupManager = new BackupManager({
      settingsFile: getSettingsFilePath(),
      dbFile: getDatabasePath(),
    });
    try {
      await backupManager.initialize();
    } catch (e) {
      logger.error("Failed to initialize backup manager on first use", e);
    }
  }
  return backupManager;
}

export function registerBackupHandlers() {
  handle("backup:create", async (_event, reason?: string) => {
    const mgr = await getBackupManager();
    const path = await mgr.createBackup(reason ?? "manual");
    return { path };
  });

  handle("backup:list", async () => {
    const mgr = await getBackupManager();
    const list = await mgr.listBackups();
    return list;
  });

  handle("backup:delete", async (_event, name: string) => {
    const mgr = await getBackupManager();
    await mgr.deleteBackup(name);
    return { success: true } as const;
  });

  handle("backup:size", async (_event, name: string) => {
    const mgr = await getBackupManager();
    const size = await mgr.getBackupSize(name);
    return { size };
  });
}
