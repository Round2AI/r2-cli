/**
 * 业务缓存 — 店铺选择 / 发货地址
 */

import type { StoredAddress, StoredShop } from "./types.js";
import { getConfigStore } from "./config-store.js";

export class BusinessStorage {
  private store = getConfigStore();

  async getAddress(): Promise<StoredAddress | null> {
    const config = await this.store.loadConfig();
    if (!config.address || !config.address.divisionId) return null;
    return config.address;
  }

  async saveAddress(address: StoredAddress): Promise<void> {
    const config = await this.store.loadConfig();
    config.address = address;
    await this.store.saveConfig(config);
  }

  async getShop(): Promise<StoredShop | null> {
    const config = await this.store.loadConfig();
    if (!config.shop || !config.shop.thirdUserId) return null;
    return config.shop;
  }

  async saveShop(shop: StoredShop): Promise<void> {
    const config = await this.store.loadConfig();
    config.shop = shop;
    await this.store.saveConfig(config);
  }
}

let instance: BusinessStorage | null = null;

export function getBusinessStorage(): BusinessStorage {
  if (!instance) instance = new BusinessStorage();
  return instance;
}
