/**
 * 商品管理命令组
 */

import { Command } from "commander";
import { createUpCommand } from "./up/index.js";
import { createShopsCommand } from "./shops.js";
import { createStocksCommand } from "./stocks.js";
import { createListCommand } from "./list.js";
import { createListingCommand } from "./listing.js";
import { createDownCommand } from "./down.js";
import { createPriceCommand } from "./price.js";
import { createHangUpCommand } from "./hang-up.js";

export function createGoodsCommand(): Command {
  const command = new Command("goods");
  command.description("商品管理");

  command.addCommand(createShopsCommand());
  command.addCommand(createStocksCommand());
  command.addCommand(createListCommand());
  command.addCommand(createListingCommand());
  command.addCommand(createDownCommand());
  command.addCommand(createPriceCommand());
  command.addCommand(createUpCommand());
  command.addCommand(createHangUpCommand());

  return command;
}
