import { Dialog } from "electron"
import * as fs from 'node:fs';

export interface DownloadFileResult {
  unziped: boolean;
  savePath: string;
}

export interface UserSettingfo {
  downloadToFolderDirectly?: boolean;
  defaultDownloadFolderPath?: string;
  setUserSettingfo: (value: Omit<UserSettingfo, 'setUserSettingfo'>) => void;
}

export interface PreloadAPITypes {
  openUploadDialog: () => Promise<Electron.OpenDialogReturnValue>
  useFs: () =>Promise<typeof fs>
  downloadFile: (fileUrl: string, savePath: string) => Promise<DownloadFileResult>
  openDirectory:  () => ReturnType<Dialog['showOpenDialog']>
}