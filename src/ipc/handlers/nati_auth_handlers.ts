import log from "electron-log";
import { readSettings, writeSettings } from "../../main/settings";
import { createLoggedHandler } from "./safe_handle";
import { stopDesktopHeartbeat } from "../../desktop_heartbeat";

const logger = log.scope("nati_auth_handlers");
const handle = createLoggedHandler(logger);

export function registerNatiAuthHandlers() {
  logger.info("Registering Nati Auth IPC handlers...");
  
  handle("nati-auth:logout", async () => {
    logger.info("User logging out");
    
    // Stop heartbeat
    stopDesktopHeartbeat();
    
    writeSettings({
      natiUser: undefined,
    });
    
    logger.info("User logged out successfully");
  });

  handle("nati-auth:update-pro-status", async (_event, params: { isPro: boolean; isAdmin?: boolean }) => {
    logger.info(`Updating Pro status: ${params.isPro}, Admin: ${params.isAdmin}`);
    
    const settings = readSettings();
    if (settings.natiUser) {
      writeSettings({
        natiUser: {
          ...settings.natiUser,
          isPro: params.isPro,
          isAdmin: params.isAdmin,
        },
      });
      logger.info("Pro and Admin status updated successfully");
    }
  });
  
  logger.info("Nati Auth IPC handlers registered successfully");
}
