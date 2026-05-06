/**
 * 共享配置文件读写（内存缓存 + 原子写入）
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { LocalConfig } from "./types.js";
import { StorageError } from "../../errors/index.js";

const CONFIG_FILE_NAME = ".r2-cli";

export class ConfigStore {
  private configPath: string;
  private config: LocalConfig;
  private configLoaded = false;
  private dirEnsured = false;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, CONFIG_FILE_NAME);
    this.configPath = path.join(configDir, "config.json");
    this.config = { credentials: null };
  }

  getConfigPath(): string {
    return this.configPath;
  }

  async loadConfig(): Promise<LocalConfig> {
    if (this.configLoaded) return this.config;

    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      this.config = JSON.parse(content) as LocalConfig;
      this.configLoaded = true;
      return this.config;
    } catch {
      this.config = { credentials: null };
      this.configLoaded = true;
      return this.config;
    }
  }

  private async ensureDir(): Promise<void> {
    if (this.dirEnsured) return;

    const dirPath = path.dirname(this.configPath);
    try {
      await fs.stat(dirPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        await fs.mkdir(dirPath, { recursive: true });
      } else {
        throw new StorageError("Failed to create directory", dirPath, (error as NodeJS.ErrnoException).code);
      }
    }
    this.dirEnsured = true;
  }

  async saveConfig(config: LocalConfig): Promise<void> {
    this.config = config;
    await this.ensureDir();

    const content = JSON.stringify(config, null, 2);
    const tmpPath = this.configPath + ".tmp";
    try {
      await fs.writeFile(tmpPath, content, "utf-8");
      await fs.rename(tmpPath, this.configPath);
      this.configLoaded = true;
    } catch (error) {
      await fs.unlink(tmpPath).catch(() => {});
      throw new StorageError("Failed to save config", this.configPath, (error as NodeJS.ErrnoException).code);
    }
  }
}

let instance: ConfigStore | null = null;

export function getConfigStore(): ConfigStore {
  if (!instance) instance = new ConfigStore();
  return instance;
}
