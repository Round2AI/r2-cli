/**
 * 闲鱼命令组
 */

import { Command } from "commander";
import { createShopsCommand } from "./shops.js";
import { createListCommand } from "./list.js";
import { createUpCommand } from "./up.js";
import { createDownCommand, createReUpCommand } from "./down.js";
import { createPriceCommand } from "./price.js";

export function createXyCommand(): Command {
  const command = new Command("xy");
  command.description("闲鱼商品管理");

  command.addCommand(createShopsCommand());
  command.addCommand(createListCommand());
  command.addCommand(createUpCommand());
  command.addCommand(createDownCommand());
  command.addCommand(createReUpCommand());
  command.addCommand(createPriceCommand());

  return command;
}
