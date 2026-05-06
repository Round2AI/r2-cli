/**
 * 查看/设置发货地址
 */

import { Command } from "commander";
import { getBusinessStorage } from "../../../services/storage/index.js";
import { cityData, findProvince, findCity, findArea } from "../../../utils/city.js";
import { agentError } from "../../shared.js";

export function createUpAddressCommand(): Command {
  const cmd = new Command("address");
  cmd.description("查看或设置发货地址（JSON 输出）");
  cmd.option("--set", "交互选择地址并保存");
  cmd.option("--provinces", "列出所有省份");
  cmd.option("--cities <province>", "列出指定省份的城市");
  cmd.option("--areas <city>", "列出指定城市的地区（需配合 --province）");
  cmd.option("--save", "直接保存地址（需配合 --province, --city, --area-code）");
  cmd.option("--province <name>", "省份名称（配合 --areas 或 --save）");
  cmd.option("--city <name>", "城市名称（配合 --save）");
  cmd.option("--area-code <code>", "地区编码（配合 --save）");

  cmd.action(
    async (options: {
      set?: boolean;
      provinces?: boolean;
      cities?: string;
      areas?: string;
      save?: boolean;
      province?: string;
      city?: string;
      areaCode?: string;
    }) => {
      try {
        const storage = getBusinessStorage();

        if (options.provinces) {
          console.log(JSON.stringify(cityData.map((p) => ({ name: p.province, code: p.code })), null, 2));
          return;
        }

        if (options.cities) {
          const prov = findProvince(options.cities);
          if (!prov) {
            console.log(JSON.stringify({ success: false, error: `未找到省份: ${options.cities}` }));
            return;
          }
          console.log(JSON.stringify(prov.citys.map((c) => ({ name: c.city, code: c.code })), null, 2));
          return;
        }

        if (options.areas) {
          if (!options.province) {
            console.log(JSON.stringify({ success: false, error: "请用 --province 指定省份" }));
            return;
          }
          const prov = findProvince(options.province);
          if (!prov) {
            console.log(JSON.stringify({ success: false, error: `未找到省份: ${options.province}` }));
            return;
          }
          const city = findCity(prov, options.areas);
          if (!city) {
            console.log(JSON.stringify({ success: false, error: `未找到城市: ${options.areas}` }));
            return;
          }
          console.log(JSON.stringify(city.areas.map((a) => ({ name: a.area, code: a.code })), null, 2));
          return;
        }

        if (options.save) {
          if (!options.province || !options.city || !options.areaCode) {
            console.log(JSON.stringify({ success: false, error: "保存地址需要 --province, --city, --area-code" }));
            return;
          }
          const prov = findProvince(options.province);
          if (!prov) {
            console.log(JSON.stringify({ success: false, error: `未找到省份: ${options.province}` }));
            return;
          }
          const city = findCity(prov, options.city);
          if (!city) {
            console.log(JSON.stringify({ success: false, error: `未找到城市: ${options.city}` }));
            return;
          }
          const area = findArea(city, options.areaCode);
          if (!area) {
            console.log(JSON.stringify({ success: false, error: `未找到地区编码: ${options.areaCode}` }));
            return;
          }
          const saved = { divisionId: area.code, province: prov.province, city: city.city, area: area.area };
          await storage.saveAddress(saved);
          console.log(JSON.stringify({ saved }, null, 2));
          return;
        }

        if (options.set) {
          const { select } = await import("@inquirer/prompts");
          const province = await select({
            message: "选择省份",
            choices: cityData.map((p) => ({ name: p.province, value: p })),
          });

          const city = await select({
            message: "选择城市",
            choices: province.citys.map((c) => ({ name: c.city, value: c })),
          });

          const areaCode = await select({
            message: "选择地区",
            choices: city.areas.map((a) => ({ name: a.area, value: a.code })),
          });

          const areaName = city.areas.find((a) => a.code === areaCode)?.area ?? "";
          const saved = { divisionId: areaCode, province: province.province, city: city.city, area: areaName };
          await storage.saveAddress(saved);
          console.log(JSON.stringify({ saved }, null, 2));
          return;
        }

        const address = await storage.getAddress();
        console.log(JSON.stringify({ address }, null, 2));
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        agentError(msg);
      }
    },
  );

  return cmd;
}
