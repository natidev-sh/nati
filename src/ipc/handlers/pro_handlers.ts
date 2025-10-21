import fetch from "node-fetch"; // Electron main process might need node-fetch
import log from "electron-log";
import { createLoggedHandler } from "./safe_handle";
import { readSettings } from "../../main/settings"; // Assuming settings are read this way
import { UserBudgetInfo, UserBudgetInfoSchema } from "../ipc_types";
import { IS_TEST_BUILD } from "../utils/test_utils";

const logger = log.scope("pro_handlers");
const handle = createLoggedHandler(logger);

const CONVERSION_RATIO = 15; // $1 in LiteLLM = 15 credits (matches website)

export function registerProHandlers() {
  // This method should try to avoid throwing errors because this is auxiliary
  // information and isn't critical to using the app
  handle("get-user-budget", async (): Promise<UserBudgetInfo | null> => {
    if (IS_TEST_BUILD) {
      // Avoid spamming the API in E2E tests.
      return null;
    }
    logger.info("Attempting to fetch user budget information.");

    const settings = readSettings();

    const apiKey = settings.providerSettings?.auto?.apiKey?.value;

    if (!apiKey) {
      logger.error("Nati Pro API key is not configured.");
      return null;
    }

    // Use Nati's Supabase Edge Function
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo";
    const url = "https://cvsqiyjfqvdptjnxefbk.supabase.co/functions/v1/get-user-credits-desktop";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${anonKey}`,
      "apikey": anonKey,
      "x-nati-api-key": apiKey, // Send the user's Nati Pro API key
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(
          `Failed to fetch user budget. Status: ${response.status}. Body: ${errorBody}`,
        );
        return null;
      }

      const data = await response.json();
      logger.info("Successfully fetched user budget information.");
      
      // Data comes from LiteLLM via the Edge Function
      return UserBudgetInfoSchema.parse({
        usedCredits: data.usedCredits,
        totalCredits: data.totalCredits,
        budgetResetDate: new Date(data.budgetResetDate),
      });
    } catch (error: any) {
      logger.error(`Error fetching user budget: ${error.message}`, error);
      return null;
    }
  });
}
