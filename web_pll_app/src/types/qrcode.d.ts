declare module 'qrcode' {
  export interface QRCodeRenderOptions {
    width?: number;
    margin?: number;
  }

  export function toDataURL(text: string, options?: QRCodeRenderOptions): Promise<string>;

  interface QRCodeModule {
    toDataURL: typeof toDataURL;
  }

  const QRCode: QRCodeModule;
  export default QRCode;
}
