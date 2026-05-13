#!/usr/bin/env node
/**
 * 构建脚本 - 使用 esbuild 打包
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
dotenv.config({ path: path.join(rootDir, envFile) });
const serverBaseUrl = process.env.SERVER_BASEURL || "https://api.qiuxietang.com";

// 入口点配置
const entryPoints = {
  "r2-cli": "src/entrypoints/r2-cli.tsx",
};

// esbuild 配置
const esbuildConfig = {
  bundle: true,
  platform: "node",
  format: "esm",
  sourcemap: false,
  minify: isProd,
  external: [
    "commander",
    "chalk",
    "figlet",
    "@inquirer/prompts",
    "@inquirer/core",
    "@inquirer/input",
    "@inquirer/select",
    "@inquirer/confirm",
    "@inquirer/checkbox",
    "mute-stream",
    "qrcode",
    "ora",
    "react",
    "ink",
    "react-dom",
    "react-devtools-core",
    "sharp",
  ],
  banner: {
    js: '"use strict";',
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(nodeEnv),
    "process.env.SERVER_BASEURL": JSON.stringify(serverBaseUrl),
  },
  treeShaking: true,
  splitting: false,
};

/**
 * 清理输出目录
 */
async function cleanDist() {
  const distDir = path.join(rootDir, "dist");
  try {
    await fs.rm(distDir, { recursive: true, force: true });
  } catch (e) {
    if (e.code === "EBUSY" || e.code === "EPERM") {
      const files = await fs.readdir(distDir);
      for (const file of files) {
        await fs.rm(path.join(distDir, file), { recursive: true, force: true });
      }
    } else {
      throw e;
    }
  }
  await fs.mkdir(distDir, { recursive: true });
  console.log("🧹 清理输出目录完成");
}

/**
 * 构建单个入口点
 */
async function buildEntryPoint(name, entry) {
  const outputDir = path.join(rootDir, "dist");
  console.log(`🔨 构建 ${name} -> ${path.relative(rootDir, outputDir)}`);

  const config = { ...esbuildConfig };
  if (name === "r2-cli") {
    config.banner = {
      js: "#!/usr/bin/env node\n",
    };
  }

  try {
    await esbuild.build({
      ...config,
      entryPoints: [path.join(rootDir, entry)],
      outdir: outputDir,
      // 保持原始文件名，不加 outdir 的 hash 前缀
      // outdir 会自动生成文件名，不需要 outfile
    });
    console.log(`✅ ${name} 构建成功`);
  } catch (error) {
    console.error(`❌ ${name} 构建失败:`, error.message);
    throw error;
  }
}

/**
 * 复制必要文件
 */
async function copyFiles() {
  const filesToCopy = ["README.md"];

  for (const file of filesToCopy) {
    const src = path.join(rootDir, file);
    const dest = path.join(rootDir, "dist", file);

    try {
      await fs.copyFile(src, dest);
      console.log(`📄 已复制 ${file}`);
    } catch {
      // file doesn't exist, skip
    }
  }

  // 复制 QR 页面 HTML 文件到 dist/pages/
  const pagesDir = path.join(rootDir, "dist", "pages");
  await fs.mkdir(pagesDir, { recursive: true });
  const htmlSrcDir = path.join(rootDir, "src", "qr-server", "pages");
  const htmlFiles = await fs.readdir(htmlSrcDir);
  for (const file of htmlFiles) {
    if (file.endsWith(".html")) {
      await fs.copyFile(path.join(htmlSrcDir, file), path.join(pagesDir, file));
      console.log(`📄 已复制 pages/${file}`);
    }
  }
}

/**
 * 构建项目
 */
async function build() {
  console.log("🚀 开始构建 R2-CLI...\n");

  try {
    // 1. 清理输出目录
    await cleanDist();

    // 2. 构建所有入口点
    console.log("🔨 开始构建入口点...\n");
    for (const [name, entry] of Object.entries(entryPoints)) {
      await buildEntryPoint(name, entry);
    }

    // 3. 复制必要文件
    await copyFiles();

    console.log("\n✅ 构建完成！");
    console.log("\n📦 输出文件:");
    Object.keys(entryPoints).forEach((name) => {
      console.log(`   • dist/${name}.js`);
    });
  } catch (error) {
    console.error("❌ 构建失败:", error);
    process.exit(1);
  }
}

// 运行构建
build();
