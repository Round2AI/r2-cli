/**
 * 版本更新检查服务
 * 每次执行检查，静默失败，不阻塞 CLI
 */

import chalk from "chalk";

const PKG_NAME = "@round2ai/r2-cli";
const REGISTRY_URLS = [
  `https://registry.npmmirror.com/${encodeURIComponent(PKG_NAME)}/latest`,
  `https://registry.npmjs.org/${encodeURIComponent(PKG_NAME)}/latest`,
];
const FETCH_TIMEOUT_MS = 5000;

async function fetchLatestVersion(): Promise<string | null> {
  for (const url of REGISTRY_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = (await res.json()) as { version?: string };
      return data.version ?? null;
    } catch {
      continue;
    }
  }
  return null;
}

function isNewer(latest: string, current: string): boolean {
  const la = latest.split(".").map(Number);
  const cu = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((la[i] ?? 0) > (cu[i] ?? 0)) return true;
    if ((la[i] ?? 0) < (cu[i] ?? 0)) return false;
  }
  return false;
}

export async function checkForUpdate(currentVersion: string): Promise<void> {
  const latest = await fetchLatestVersion();
  if (!latest) return;

  if (isNewer(latest, currentVersion)) {
    showUpdateNotification(currentVersion, latest);
  }
}

function showUpdateNotification(current: string, latest: string): void {
  console.error(
    chalk.yellow(`\nUpdate available: ${current} → ${latest}`) +
      chalk.gray(`\nRun: npm update -g ${PKG_NAME}\n`),
  );
}
