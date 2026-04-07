/**
 * 本地存储服务
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { stat, mkdir } from "node:fs/promises";
import type { UserInfo } from "../../types/auth.js";

// ==================== 类型定义 ====================

/** 存储的凭证信息 */
export interface StoredCredentials {
  token: string;
  userInfo: UserInfo;
  timestamp: number;
}

/** 本地配置文件内容 */
export interface LocalConfig {
  credentials: StoredCredentials | null;
}

// ==================== 常量 ====================

/** 配置文件名 */
const CONFIG_FILE_NAME = ".r2-cli";

/** 配置文件版本 */
const CONFIG_VERSION = "1.0.0";

// ==================== 存储服务 ====================

/**
 * 存储服务类
 */
export class StorageService {
  private configPath: string;
  private config: LocalConfig;

  constructor() {
    // 获取用户主目录
    const homeDir = os.homedir();
    // 创建 .r2-cli 目录
    const configDir = path.join(homeDir, CONFIG_FILE_NAME);
    // 配置文件路径
    this.configPath = path.join(configDir, "config.json");

    this.config = { credentials: null };
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<LocalConfig> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8");
      const config = JSON.parse(content) as LocalConfig;
      this.config = config;
      return config;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // 文件不存在，返回空配置
        return { credentials: null };
      }
      throw error;
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config: LocalConfig): Promise<void> {
    this.config = config;
    const content = JSON.stringify(config, null, 2);

    const dirPath = path.dirname(this.configPath);

    try {
      // 检查目录是否存在，不存在则创建
      await stat(dirPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // 目录不存在，创建目录
        await mkdir(dirPath, { recursive: true });
      }
    }

    await fs.writeFile(this.configPath, content, "utf-8");
  }

  /**
   * 保存登录凭证
   */
  async saveCredentials(token: string, userInfo: UserInfo): Promise<void> {
    const credentials: StoredCredentials = {
      token,
      userInfo,
      timestamp: Date.now(),
    };

    let config: LocalConfig;
    try {
      config = await this.loadConfig();
    } catch (error) {
      // 如果文件不存在，创建空配置
      config = { credentials: null };
    }
    config.credentials = credentials;
    await this.saveConfig(config);
  }

  /**
   * 获取登录凭证
   */
  async getCredentials(): Promise<StoredCredentials | null> {
    const config = await this.loadConfig();
    return config.credentials;
  }

  /**
   * 清除登录凭证
   */
  async clearCredentials(): Promise<void> {
    const config = await this.loadConfig();
    config.credentials = null;
    await this.saveConfig(config);
  }

  /**
   * 获取 token
   */
  async getToken(): Promise<string | null> {
    const credentials = await this.getCredentials();
    return credentials?.token ?? null;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<UserInfo | null> {
    const credentials = await this.getCredentials();
    return credentials?.userInfo ?? null;
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn(): Promise<boolean> {
    const credentials = await this.getCredentials();
    return credentials !== null;
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建存储服务
 */
export function createStorageService(): StorageService {
  return new StorageService();
}
