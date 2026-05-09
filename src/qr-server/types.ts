export type QrPageStatus = "waiting" | "scanning" | "success" | "expired";

export interface QRCodeOutput {
  url: string;
  qrUrl: string;
  setStatus: (status: QrPageStatus) => void;
  closeServer: () => void;
}
