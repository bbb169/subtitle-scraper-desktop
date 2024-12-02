import { webUtils } from "electron"
import * as fs from 'node:fs';

export interface DownloadFileResult {
  unziped: boolean;
  savePath: string;
}

export interface PreloadAPITypes {
  openUploadDialog: () => Promise<Electron.OpenDialogReturnValue>
  useFs: () =>Promise<typeof fs>
  downloadFile: (fileUrl: string, savePath: string) => Promise<DownloadFileResult>
}