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

/** 从单个 registry URL 获取最新版本号 */
async function fetchVersionFromRegistry(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return ((await res.json()) as { version?: string }).version ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** 并行请求多个 registry，返回第一个成功的版本号 */
async function fetchLatestVersion(): Promise<string | null> {
  const results = await Promise.allSettled(REGISTRY_URLS.map(fetchVersionFromRegistry));
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }
  return null;
}

/** semver 三段式比较，latest > current 时返回 true */
function isNewer(latest: string, current: string): boolean {
  const la = latest.split(".").map(Number);
  const cu = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((la[i] ?? 0) !== (cu[i] ?? 0)) return (la[i] ?? 0) > (cu[i] ?? 0);
  }
  return false;
}

// ——— 缓存最新的版本检查结果，供 --json 输出注入 _notice ———

let _latestCheckedVersion: string | null = null;
let _currentCheckedVersion: string | null = null;

/** 获取缓存的更新通知对象，无更新时返回 null */
export function getUpdateNotice(): Record<string, unknown> | null {
  if (!_latestCheckedVersion || !_currentCheckedVersion) return null;
  return {
    _notice: {
      update: {
        message: `Update available: ${_currentCheckedVersion} → ${_latestCheckedVersion}`,
        command: "npm update -g @round2ai/r2-cli && npx skills add Round2AI/r2-cli --all -y",
      },
    },
  };
}

export async function checkForUpdate(currentVersion: string): Promise<void> {
  const latest = await fetchLatestVersion();
  if (!latest) return;

  if (isNewer(latest, currentVersion)) {
    _latestCheckedVersion = latest;
    _currentCheckedVersion = currentVersion;
    showUpdateNotification(currentVersion, latest);
  } else {
    _currentCheckedVersion = currentVersion;
  }
}

function showUpdateNotification(current: string, latest: string): void {
  console.error(
    chalk.yellow(`\nUpdate available: ${current} → ${latest}`) +
      chalk.gray(`\nRun: r2-cli update\n`),
  );
}
