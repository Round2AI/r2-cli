/**
 * 城市数据查找工具
 */

import cityData from "../assets/citys.json" with { type: "json" };

export type Province = (typeof cityData)[number];
export type City = Province["citys"][number];
export type Area = City["areas"][number];

export function findProvince(name: string): Province | undefined {
  return cityData.find((p) => p.province === name);
}

export function findCity(province: Province, name: string): City | undefined {
  return province.citys.find((c) => c.city === name);
}

export function findArea(city: City, code: string): Area | undefined {
  return city.areas.find((a) => a.code === code);
}

export { cityData };
