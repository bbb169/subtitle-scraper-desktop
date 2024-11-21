export interface PreloadAPITypes {
  recognizeVerifyNumber: (imgBase64: string) => Promise<string>
}