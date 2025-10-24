import fetch from "node-fetch"; // Electron main process might need node-fetch
import log from "electron-log";
import { createLoggedHandler } from "./safe_handle";
import { readSettings } from "../../main/settings"; // Assuming settings are read this way
import { UserBudgetInfo, UserBudgetInfoSchema } from "../ipc_types";
import { IS_TEST_BUILD } from "../utils/test_utils";

const logger = log.scope("pro_handlers");
const handle = createLoggedHandler(logger);

const CONVERSION_RATIO = 15; // $1 in LiteLLM = 15 credits (matches website)
const LITELLM_PROXY_URL = process.env.LITELLM_PROXY_URL || "http://localhost:4000";

/**
 * Creates or updates an end user in LiteLLM with budget tracking
 */
async function ensureEndUserExists(userId: string, masterKey: string): Promise<boolean> {
  try {
    const url = `${LITELLM_PROXY_URL}/end_user/new`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${masterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        // Budget will be managed via the budget_id system
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Failed to create end user. Status: ${response.status}. Body: ${errorBody}`);
      return false;
    }

    logger.info(`Successfully ensured end user exists: ${userId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error creating end user: ${error.message}`, error);
    return false;
  }
}

/**
 * Fetches end user spend from LiteLLM
 */
async function getEndUserSpend(userId: string, masterKey: string): Promise<number | null> {
  try {
    const url = `${LITELLM_PROXY_URL}/end_user/info?end_user_id=${encodeURIComponent(userId)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${masterKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`Failed to fetch end user info. Status: ${response.status}. Body: ${errorBody}`);
      return null;
    }

    const data: any = await response.json();
    logger.info(`End user spend for ${userId}: $${data.spend || 0}`);
    return data.spend || 0;
  } catch (error: any) {
    logger.error(`Error fetching end user spend: ${error.message}`, error);
    return null;
  }
}

export function registerProHandlers() {
  // Ensure end user exists in LiteLLM when Pro is enabled
  handle("ensure-pro-user", async (_event, userId: string): Promise<boolean> => {
    if (IS_TEST_BUILD) {
      return true;
    }

    const masterKey = process.env.LITELLM_MASTER_KEY;
    if (!masterKey) {
      logger.error("LITELLM_MASTER_KEY not configured");
      return false;
    }

    return await ensureEndUserExists(userId, masterKey);
  });

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
    const userId = settings.natiUser?.id;

    logger.info("Budget fetch - API Key present:", !!apiKey);
    logger.info("Budget fetch - User ID:", userId);
    logger.info("Budget fetch - LITELLM_MASTER_KEY present:", !!process.env.LITELLM_MASTER_KEY);

    if (!apiKey) {
      logger.warn("Nati Pro API key is not configured - skipping LiteLLM integration");
      // Still try to fetch from Supabase for basic budget info
    }

    if (!userId) {
      logger.error("User ID not available.");
      return null;
    }

    const masterKey = process.env.LITELLM_MASTER_KEY;
    if (!masterKey) {
      logger.warn("LITELLM_MASTER_KEY not configured - will skip LiteLLM spend tracking");
    }

    try {
      let spend: number | null = null;
      
      // Only try LiteLLM if we have the master key
      if (masterKey) {
        // Ensure user exists in LiteLLM
        await ensureEndUserExists(userId, masterKey);
        // Fetch spend from LiteLLM
        spend = await getEndUserSpend(userId, masterKey);
      }
      
      // Fetch user's total budget from Supabase
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo";
      const url = "https://cvsqiyjfqvdptjnxefbk.supabase.co/functions/v1/get-user-credits-desktop";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      };
      
      if (apiKey) {
        headers["x-nati-api-key"] = apiKey;
      }

      logger.info(`Fetching budget from Supabase Edge Function: ${url}`);
      
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ apiKey, userId }),
      });

      logger.info(`Supabase response status: ${response.status}`);

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(
          `Failed to fetch user budget. Status: ${response.status}. Body: ${errorBody}`,
        );
        return null;
      }

      const data = await response.json();
      logger.info("Successfully fetched user budget information.");
      logger.info("Budget data:", JSON.stringify(data));
      
      // Convert LiteLLM spend (USD) to credits
      const usedCredits = spend !== null ? spend * CONVERSION_RATIO : data.usedCredits || 0;
      
      return UserBudgetInfoSchema.parse({
        usedCredits: usedCredits,
        totalCredits: data.totalCredits,
        budgetResetDate: new Date(data.budgetResetDate),
      });
    } catch (error: any) {
      logger.error(`Error fetching user budget: ${error.message}`, error);
      return null;
    }
  });
}
