/** 认证服务导出（扫码登录 / 闲鱼授权） */
export { LoginService, getLoginService } from "./login.js";
export { generateAuthQR, waitForAuth, authorize } from "./xianyu-auth.js";
