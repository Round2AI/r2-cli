# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Development (runs src/entrypoints/cli.tsx via tsx, inherits TTY for interactive prompts)
npm run dev
npm run dev -- xy list

# Build (esbuild, outputs to dist/cli.js)
npm run build          # development: reads .env, sourcemap on
npm run build:prod     # production: reads .env.production, minified

# Run built CLI
node dist/cli.js --help
```

No test framework is configured.

## Architecture Overview

R2-CLI is a CLI tool for the luxury resale market (二手潮奢交易). It exposes business capabilities as CLI commands and AI Agent skills.

### Entry Flow
1. `src/entrypoints/cli.tsx` — CLI entry point, sets up Commander, SIGINT handler
2. `src/commands/setup.ts` — Registers all domain commands (auth, xy, business, inventory, ai)
3. Domain command factories in `src/commands/*/` each return a `Command` instance

### Service Layer

**API Client** (`src/services/api/`):
- `api-client.service.ts` — Base HTTP client using `fetch`, handles response envelope `{ success, status, data, msg }`. Base URL from `process.env.R2_API_URL` (replaced at build time by esbuild define). Includes `refreshToken()` for `user/refresh` endpoint.
- `authenticated-client.service.ts` — Wraps `ApiClientService`. Auto-loads token from storage, on 401 calls `refreshToken` → saves new token → retries original request. Only clears credentials and prompts re-login if refresh also fails.
- `api-client.interface.ts` — `IApiClient`, `IQRCodeAuthApi`, `ApiConfig`, `ApiResponse<T>`

**Storage** (`src/services/storage/`):
- `index.ts` — `StorageService`, file-based storage at `~/.r2-cli/config.json`. Manages credentials (token + userInfo + expire), cached address (province/city/area/divisionId).
- `storage-service.interface.ts` — `StoredCredentials` (with optional `expire`), `StoredAddress`, `LocalConfig`

**Domain Services** (`src/services/xy/`):
- `xianyu-api.service.ts` — Xianyu API wrapper, singleton via `getXianyuApi()`. Uses `AuthenticatedApiClient`.
- `up-flow.service.ts` — Interactive 5-step upload wizard with `@inquirer/prompts`. Auto-matches brand/size/condition from product data.

**AI** (`src/services/ai/`):
- `alibaba.ts` — Alibaba Bailian AI with streaming SSE
- `index.ts` — `MultiAIService` facade, exports singleton `aiService`

### Auth Flow
`src/commands/auth/login.ts` → `LoginService` → `poll()` → polls QR code scan status → saves credentials

### Error Handling
- `src/errors/index.ts` — `R2Error` → `ApiError` (with `status`, `response`), `AuthError`, `StorageError`, `PollingError`, `CliError`
- `src/commands/xy/shared.ts` — `handleCommandError()` dispatches by error type: AuthError → login hint, ApiError → message + status code, else → generic

### Build System
- `scripts/build.js` — esbuild. Reads `.env` / `.env.production` via `loadEnvFile()`. Uses `cross-env NODE_ENV` to select env. `process.env.R2_API_URL` is defined at build time. Externalizes all runtime deps (commander, chalk, @inquirer/*, ora, react, ink, etc.)
- `scripts/dev.js` — Spawns `tsx src/entrypoints/cli.tsx` with `stdio: 'inherit'` for interactive prompts

### Key Types
- `src/types/auth.ts` — `UserInfo`, `QRCodeStatus`, `GenerateQRCodeData`, `QRCodeStatusData`
- `src/types/xianyu.ts` — `XyShop`, `SellerGoodsItem`, `XyGoodsDetail`, `XyGoodsUpParams`, `ItemAttr`, `StuffLevel`, `ITEM_BIZ_TYPES`, `STUFF_LABELS`

### Environment
- `.env` — `SERVER_BASEURL='https://api.qiuxietang.com'` (development)
- `.env.production` — `SERVER_BASEURL='https://api.puresnake.com'` (production)
- `ALIBABA_API_KEY` — For AI service (env only, never hardcoded)

### tsconfig
- `module: "nodenext"`, `strict: true`, `jsx: "react-jsx"`, `verbatimModuleSyntax: true`
- All imports must use `.js` extension for ESM resolution
- JSON imports use `import ... from "..." with { type: "json" }` (bundled inline by esbuild)

### Xianyu Upload Params
When building `XyGoodsUpParams` from `XyGoodsDetail`, the `price` field from the detail must be excluded (use destructuring `const { price, ...rest } = detail`) — only `reservePrice` and `originalPrice` should be sent, both set to the user-confirmed price.
