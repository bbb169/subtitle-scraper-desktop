import { webUtils } from "electron"
import * as fs from 'node:fs';

export interface PreloadAPITypes {
  openUploadDialog: () => Promise<Electron.OpenDialogReturnValue>
  useFs: () =>Promise<typeof fs>
  downloadFile: (fileUrl: string, savePath: string) => Promise<string>
}