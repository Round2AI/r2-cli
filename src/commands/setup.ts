/**
 * 命令设置模块
 */

import { Command } from "commander";

import { createLoginCommand, createLogoutCommand, createStatusCommand, createXianyuAuthCommand } from "./auth/index.js";
import { createPricingCommand } from "./business/pricing.js";
import { createReportCommand } from "./business/report.js";
import { createRiskCommand } from "./inventory/risk.js";
import { createChatCommand } from "./ai/chat.js";
import { createSkillsCommand } from "./ai/skills.js";
import { createGoodsCommand } from "./goods/index.js";
import { createUninstallCommand } from "./uninstall.js";
import { setupStubCommands } from "./stubs.js";

export function setupCommands(program: Command): void {
  // 已实现命令
  const authCommand = program.command("auth").description("授权管理");
  authCommand.addCommand(createLoginCommand());
  authCommand.addCommand(createLogoutCommand());
  authCommand.addCommand(createStatusCommand());
  authCommand.addCommand(createXianyuAuthCommand());

  const reportCommand = program.command("report", { hidden: true }).description("生成经营日报/周报");
  reportCommand.addCommand(createReportCommand());

  const pricingCommand = program.command("pricing", { hidden: true }).description("基于真实成交数据给出收货价与售卖价建议");
  pricingCommand.addCommand(createPricingCommand());

  const inventoryCommand = program.command("inventory", { hidden: true }).description("库存管理");
  inventoryCommand.addCommand(createRiskCommand());

  const aiCommand = program.command("ai", { hidden: true }).description("AI 相关功能");
  aiCommand.addCommand(createChatCommand());
  aiCommand.addCommand(createSkillsCommand());

  program.addCommand(createGoodsCommand());
  program.addCommand(createUninstallCommand());

  // 开发中命令
  setupStubCommands(program);
}
