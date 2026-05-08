/**
 * 商品管理命令组
 */

import { Command } from "commander";
import { createShopsCommand } from "./shops.js";
import { createListCommand } from "./list.js";
import { createUpCommand } from "./up/index.js";
import { createDownCommand, createReUpCommand } from "./down.js";
import { createPriceCommand } from "./price.js";
import { createSelectCommand } from "./select.js";

export function createGoodsCommand(): Command {
  const command = new Command("goods");
  command.description("商品管理");

  command.addCommand(createShopsCommand());
  command.addCommand(createListCommand());
  command.addCommand(createUpCommand());
  command.addCommand(createDownCommand());
  command.addCommand(createReUpCommand());
  command.addCommand(createPriceCommand());
  command.addCommand(createSelectCommand());

  return command;
}
