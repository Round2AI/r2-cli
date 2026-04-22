/**
 * 命令设置模块
 */

import { Command } from "commander";
import chalk from "chalk";

import { createLoginCommand, createLogoutCommand, createStatusCommand } from "./auth/login.js";
import { createPricingCommand } from "./business/pricing.js";
import { createReportCommand } from "./business/report.js";
import { createRiskCommand } from "./inventory/risk.js";
import { createChatCommand } from "./ai/chat.js";
import { createSkillsCommand } from "./ai/skills.js";
import { createXyCommand } from "./xy/index.js";

/** 未实现命令的统一提示 */
function notImplemented(name: string): void {
  console.log(chalk.yellow(`⚠️  "${name}" 功能开发中，暂不可用`));
}

export function setupCommands(program: Command): void {
  // ==================== 认证命令 ====================
  const authCommand = program.command("auth").description("授权管理");
  authCommand.addCommand(createLoginCommand());
  authCommand.addCommand(createLogoutCommand());
  authCommand.addCommand(createStatusCommand());

  // ==================== 数据对接命令 ====================
  program
    .command("ingest")
    .description("对接主流 ERP，统一多渠道经营数据")
    .action(() => notImplemented("ingest"));

  // ==================== 经营分析命令 ====================
  const reportCommand = program.command("report").description("生成经营日报/周报");
  reportCommand.addCommand(createReportCommand());

  // ==================== 自然语言查询命令 ====================
  program
    .command("ask")
    .description("自然语言查询经营数据")
    .action(() => notImplemented("ask"));

  // ==================== 市场分析命令 ====================
  program
    .command("demand")
    .description("扫描市场需求热度与供需缺口")
    .option("--sku <sku>", "商品SKU")
    .option("--region <region>", "区域")
    .action(() => notImplemented("demand"));

  // ==================== 价格分析命令 ====================
  const pricingCommand = program.command("pricing").description("基于真实成交数据给出收货价与售卖价建议");
  pricingCommand.addCommand(createPricingCommand());

  // ==================== 库存与履约命令 ====================
  const inventoryCommand = program.command("inventory").description("库存管理");
  inventoryCommand.addCommand(createRiskCommand());

  program
    .command("fulfillment")
    .description("履约全链路追踪")
    .action(() => notImplemented("fulfillment"));

  // ==================== AI 命令模块 ====================
  const aiCommand = program.command("ai").description("AI 相关功能");
  aiCommand.addCommand(createChatCommand());
  aiCommand.addCommand(createSkillsCommand());

  // ==================== 闲鱼管理命令 ====================
  program.addCommand(createXyCommand());

  // ==================== 竞价模拟命令 ====================
  program
    .command("simulate")
    .description("竞价成交模拟")
    .option("--sku <sku>", "商品SKU")
    .option("--price <price>", "出价")
    .action(() => notImplemented("simulate"));

  program
    .command("bidding-strategy")
    .description("基于预算与品类生成竞价策略建议")
    .action(() => notImplemented("bidding-strategy"));

  // ==================== 经营决策命令 ====================
  program
    .command("decide")
    .description("综合数据输出经营动作建议")
    .option("--store <store>", "店铺代码")
    .option("--horizon <horizon>", "预测周期")
    .action(() => notImplemented("decide"));

  // ==================== AI Agent 集成命令 ====================
  program
    .command("agent")
    .description("AI Agent 集成")
    .action(() => {
      console.log(chalk.blue("AI Agent 集成"));
      console.log(chalk.green("支持的 AI Agent 框架:"));
      console.log(chalk.green("   - Claude Code"));
      console.log(chalk.green("   - OpenClaw"));
      console.log(chalk.green("   - Codex"));
      console.log(chalk.yellow("安装: npx skills add Round2AI/r2-cli --all -y"));
    });
}
