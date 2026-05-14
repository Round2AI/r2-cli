/**
 * 闲鱼挂售上架命令组
 *
 * 子命令：categories / props / brands / upload-images / submit
 */

import { Command } from "commander";
import { createCategoriesCommand } from "./categories.js";
import { createPropsCommand } from "./props.js";
import { createBrandsCommand } from "./brands.js";
import { createUploadImagesCommand } from "./upload-images.js";
import { createSubmitCommand } from "./submit.js";

export function createHangUpCommand(): Command {
  const command = new Command("hang-up");
  command.description("闲鱼挂售上架（完整商品信息模式）");

  command.addCommand(createCategoriesCommand());
  command.addCommand(createPropsCommand());
  command.addCommand(createBrandsCommand());
  command.addCommand(createUploadImagesCommand());
  command.addCommand(createSubmitCommand());

  return command;
}
