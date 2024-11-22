import { PreloadAPITypes } from "./type";

declare global {
  interface Window {
    electron: ElectronAPI
    api: PreloadAPITypes
  }

  interface HTMLWebViewElement {
    executeJavaScript: (value: string) => Promise<T>
  }
}

declare namespace NodeJS {
  interface Global {
    MAIN_WINDOW_VITE_DEV_SERVER_URL: string; // 声明全局变量
  }
}
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare module 'vite-plugin-copy';

export {}