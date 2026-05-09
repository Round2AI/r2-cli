export type QrPageStatus = "waiting" | "scanning" | "success" | "expired";

export interface QRCodeOutput {
  unicodeQR: string;
  url: string;
  qrUrl: string;
  setStatus: (status: QrPageStatus) => void;
  closeServer: () => void;
}
