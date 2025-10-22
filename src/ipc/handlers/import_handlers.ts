import { dialog } from "electron";
import fs from "fs/promises";
import path from "path";
import { createLoggedHandler } from "./safe_handle";
import log from "electron-log";
import { getDyadAppPath } from "../../paths/paths";
import { apps } from "@/db/schema";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { eq } from "drizzle-orm";
import git from "isomorphic-git";

import { ImportAppParams, ImportAppResult, ImportGithubRepoParams, ImportGithubRepoResult } from "../ipc_types";
import { copyDirectoryRecursive } from "../utils/file_utils";
import { gitCommit } from "../utils/git_utils";
import { spawn } from "child_process";
import { promisify } from "util";
const execPromise = promisify(require("child_process").exec);

const logger = log.scope("import-handlers");
const handle = createLoggedHandler(logger);

export function registerImportHandlers() {
  // Handler for selecting an app folder
  handle("select-app-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: "Select App Folder to Import",
    });

    if (result.canceled) {
      return { path: null, name: null };
    }

    const selectedPath = result.filePaths[0];
    const folderName = path.basename(selectedPath);

    return { path: selectedPath, name: folderName };
  });

  // Handler for checking if AI_RULES.md exists
  handle("check-ai-rules", async (_, { path: appPath }: { path: string }) => {
    try {
      await fs.access(path.join(appPath, "AI_RULES.md"));
      return { exists: true };
    } catch {
      return { exists: false };
    }
  });

  // Handler for checking if an app name is already taken
  handle("check-app-name", async (_, { appName }: { appName: string }) => {
    // Check filesystem
    const appPath = getDyadAppPath(appName);
    try {
      await fs.access(appPath);
      return { exists: true };
    } catch {
      // Path doesn't exist, continue checking database
    }

    // Check database
    const existingApp = await db.query.apps.findFirst({
      where: eq(apps.name, appName),
    });

    return { exists: !!existingApp };
  });

  // Handler for importing an app
  handle(
    "import-app",
    async (
      _,
      {
        path: sourcePath,
        appName,
        installCommand,
        startCommand,
      }: ImportAppParams,
    ): Promise<ImportAppResult> => {
      // Validate the source path exists
      try {
        await fs.access(sourcePath);
      } catch {
        throw new Error("Source folder does not exist");
      }

      const destPath = getDyadAppPath(appName);

      // Check if the app already exists
      const errorMessage = "An app with this name already exists";
      try {
        await fs.access(destPath);
        throw new Error(errorMessage);
      } catch (error: any) {
        if (error.message === errorMessage) {
          throw error;
        }
      }
      // Copy the app folder to the Dyad apps directory.
      // Why not use fs.cp? Because we want stable ordering for
      // tests.
      await copyDirectoryRecursive(sourcePath, destPath);

      const isGitRepo = await fs
        .access(path.join(destPath, ".git"))
        .then(() => true)
        .catch(() => false);
      if (!isGitRepo) {
        // Initialize git repo and create first commit
        await git.init({
          fs: fs,
          dir: destPath,
          defaultBranch: "main",
        });

        // Stage all files
        await git.add({
          fs: fs,
          dir: destPath,
          filepath: ".",
        });

        // Create initial commit
        await gitCommit({
          path: destPath,
          message: "Init Nati app",
        });
      }

      // Create a new app
      const [app] = await db
        .insert(apps)
        .values({
          name: appName,
          // Use the name as the path for now
          path: appName,
          installCommand: installCommand ?? null,
          startCommand: startCommand ?? null,
        })
        .returning();

      // Create an initial chat for this app
      const [chat] = await db
        .insert(chats)
        .values({
          appId: app.id,
        })
        .returning();
      return { appId: app.id, chatId: chat.id };
    },
  );

  // Handler for importing from GitHub
  handle(
    "import-github-repo",
    async (
      _,
      {
        githubUrl,
        branch = "main",
        appName,
        installCommand,
        startCommand,
      }: ImportGithubRepoParams,
    ): Promise<ImportGithubRepoResult> => {
      const destPath = getDyadAppPath(appName);

      // Check if the app already exists
      const errorMessage = "An app with this name already exists";
      try {
        await fs.access(destPath);
        throw new Error(errorMessage);
      } catch (error: any) {
        if (error.message === errorMessage) {
          throw error;
        }
      }

      // Parse GitHub URL to extract org and repo
      let githubOrg: string | null = null;
      let githubRepo: string | null = null;
      let githubBranch: string | null = branch;

      try {
        const match = githubUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(\.git)?$/);
        if (match) {
          githubOrg = match[1];
          githubRepo = match[2].replace(/\.git$/, "");
        }
      } catch (error) {
        logger.warn("Could not parse GitHub URL:", error);
      }

      // Clone the repository using git command
      logger.info(`Cloning GitHub repository: ${githubUrl} to ${destPath}`);
      try {
        const cloneCommand = `git clone --branch ${branch} --depth 1 "${githubUrl}" "${destPath}"`;
        await execPromise(cloneCommand);
        logger.info("Repository cloned successfully");
      } catch (error: any) {
        logger.error("Failed to clone repository:", error);
        throw new Error(
          `Failed to clone repository: ${error.message || "Unknown error"}. Make sure git is installed and the URL is correct.`,
        );
      }

      // Verify the clone was successful
      try {
        await fs.access(destPath);
      } catch {
        throw new Error("Repository was not cloned successfully");
      }

      // Create a new app in the database
      const [app] = await db
        .insert(apps)
        .values({
          name: appName,
          path: appName,
          githubOrg: githubOrg,
          githubRepo: githubRepo,
          githubBranch: githubBranch,
          installCommand: installCommand ?? null,
          startCommand: startCommand ?? null,
        })
        .returning();

      // Create an initial chat for this app
      const [chat] = await db
        .insert(chats)
        .values({
          appId: app.id,
        })
        .returning();

      logger.info(`GitHub repo imported successfully as app ${app.id}`);
      return { appId: app.id, chatId: chat.id };
    },
  );

  logger.debug("Registered import IPC handlers");
}
