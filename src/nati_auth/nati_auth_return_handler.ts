import { writeSettings } from "../main/settings";
import log from "electron-log";
import { startDesktopHeartbeat } from "../desktop_heartbeat";

const logger = log.scope("nati_auth");

export function handleNatiAuthReturn({
  userId,
  email,
  name,
  avatar,
  accessToken,
  refreshToken,
  expiresIn,
  isPro,
  isAdmin,
}: {
  userId: string;
  email: string;
  name?: string;
  avatar?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isPro?: boolean;
  isAdmin?: boolean;
}) {
  logger.info(`User authenticated: ${email} (Pro: ${isPro}, Admin: ${isAdmin})`);
  
  writeSettings({
    natiUser: {
      id: userId,
      email,
      name,
      avatar,
      isPro,
      isAdmin,
      accessToken: {
        value: accessToken,
      },
      refreshToken: {
        value: refreshToken,
      },
      expiresIn,
      tokenTimestamp: Math.floor(Date.now() / 1000),
    },
  });
  
  // Start sending heartbeat to enable remote control
  startDesktopHeartbeat();
  logger.info('Desktop heartbeat started after login');
}
