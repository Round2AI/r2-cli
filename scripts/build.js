#!/usr/bin/env node
/**
 * 构建脚本 - 使用 esbuild 打包 CLI 为单文件
 *
 * 工作流：
 *   1. 读取 package.json 获取 dependencies 列表，自动生成 esbuild external
 *   2. 清空并重建 dist/
 *   3. esbuild 打包入口 → dist/r2-cli.js
 *   4. 复制 QR 页面 HTML 到 dist/pages/
 *
 * 环境变量：
 *   - SERVER_BASEURL 通过 esbuild define 在构建时注入
 *   - .env / .env.production 作为默认值，CI 中 workflow env 优先
 */

import esbuild from "esbuild";
import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";
const envFile = isProd ? ".env.production" : ".env";

// 加载 .env，dotenv.config() 不覆盖已有的 process.env
dotenv.config({ path: path.join(rootDir, envFile) });

const entryPoint = "src/entrypoints/r2-cli.tsx";
const outDir = path.join(rootDir, "dist");

/**
 * 从 package.json 读取 runtime dependencies 作为 external 列表。
 * esbuild 不打包 runtime 依赖，由 node_modules 在运行时提供。
 * native 模块（sharp）和大型库（react, ink）必须 externalize。
 */
async function getExternals() {
  const pkg = JSON.parse(
    await fs.readFile(path.join(rootDir, "package.json"), "utf-8")
  );
  return Object.keys(pkg.dependencies || {});
}

/**
 * 清理并重建 dist/ 目录。
 * Windows 上文件可能被进程占用导致 EBUSY，此时逐文件删除 + 重试。
 */
async function cleanDist() {
  try {
    await fs.rm(outDir, { recursive: true, force: true });
  } catch (e) {
    if (e.code === "EBUSY" || e.code === "EPERM") {
      const files = await fs.readdir(outDir);
      for (const file of files) {
        await fs.rm(path.join(outDir, file), { recursive: true, force: true });
      }
    } else {
      throw e;
    }
  }
  await fs.mkdir(outDir, { recursive: true });
}

/**
 * 复制 QR 扫码页面 HTML 到 dist/pages/。
 * 运行时 QrServer 从 pages/ 目录读取静态页面。
 */
async function copyPages() {
  const pagesOut = path.join(outDir, "pages");
  await fs.mkdir(pagesOut, { recursive: true });

  const pagesSrc = path.join(rootDir, "src", "qr-server", "pages");
  const files = await fs.readdir(pagesSrc);

  for (const file of files) {
    if (file.endsWith(".html")) {
      await fs.copyFile(path.join(pagesSrc, file), path.join(pagesOut, file));
    }
  }
}

async function build() {
  const externals = await getExternals();
  const serverBaseUrl = process.env.SERVER_BASEURL || "https://api.qiuxietang.com";

  await cleanDist();

  await esbuild.build({
    entryPoints: [path.join(rootDir, entryPoint)],
    outdir: outDir,
    bundle: true,
    platform: "node",
    format: "esm",
    minify: isProd,
    sourcemap: false,
    external: externals,
    treeShaking: true,
    banner: {
      js: "#!/usr/bin/env node\n",
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(nodeEnv),
      "process.env.SERVER_BASEURL": JSON.stringify(serverBaseUrl),
    },
  });

  await copyPages();

  console.log(`\n✅ 构建完成 → ${path.join(outDir, "r2-cli.js")}`);
}

build().catch((e) => {
  console.error("❌ 构建失败:", e.message);
  process.exit(1);
});
