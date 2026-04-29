/**
 * 本地存储服务
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { UserInfo } from "../../types/auth.js";
import type { IStorageService, LocalConfig, StoredCredentials, StoredAddress, StoredShop } from "./types.js";
import { StorageError } from "../../errors/index.js";

// ==================== 常量 ====================

/** 配置文件名 */
const CONFIG_FILE_NAME = ".r2-cli";

/** Token 过期安全边际（5 分钟） */
const TOKEN_EXPIRY_MARGIN_MS = 5 * 60 * 1000;

// ==================== 存储服务 ====================

/**
 * 存储服务实现
 */
export class StorageService implements IStorageService {
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

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 加载配置（带内存缓存）
   */
  private async loadConfig(): Promise<LocalConfig> {
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

  /**
   * 确保配置目录存在（仅执行一次）
   */
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

  /**
   * 保存配置
   */
  private async saveConfig(config: LocalConfig): Promise<void> {
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

  /**
   * 检查凭证是否已过期
   */
  private isTokenExpired(cred: StoredCredentials): boolean {
    if (!cred.expire) return false;
    return Date.now() >= cred.expire - TOKEN_EXPIRY_MARGIN_MS;
  }

  /**
   * 保存登录凭证
   */
  async saveCredentials(token: string, userInfo: UserInfo): Promise<void> {
    const now = Date.now();
    const durationMs = userInfo.expire ? Number.parseInt(userInfo.expire, 10) : 0;
    const credentials: StoredCredentials = {
      token,
      userInfo,
      timestamp: now,
      ...(durationMs > 0 && { expire: now + durationMs }),
    };

    let config: LocalConfig;
    try {
      config = await this.loadConfig();
    } catch {
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
    if (!config.credentials) return null;
    if (this.isTokenExpired(config.credentials)) return null;
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

  /**
   * 获取缓存的发货地址
   */
  async getAddress(): Promise<StoredAddress | null> {
    const config = await this.loadConfig();
    if (!config.address || !config.address.divisionId) return null;
    return config.address;
  }

  /**
   * 保存发货地址
   */
  async saveAddress(address: StoredAddress): Promise<void> {
    const config = await this.loadConfig();
    config.address = address;
    await this.saveConfig(config);
  }

  /**
   * 获取缓存的店铺
   */
  async getShop(): Promise<StoredShop | null> {
    const config = await this.loadConfig();
    if (!config.shop || !config.shop.thirdUserId) return null;
    return config.shop;
  }

  /**
   * 保存店铺选择
   */
  async saveShop(shop: StoredShop): Promise<void> {
    const config = await this.loadConfig();
    config.shop = shop;
    await this.saveConfig(config);
  }
}

// ==================== 工厂函数 ====================

let instance: StorageService | null = null;

export function createStorageService(): StorageService {
  if (!instance) instance = new StorageService();
  return instance;
}
