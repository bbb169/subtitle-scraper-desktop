import { webUtils } from "electron"

export interface PreloadAPITypes {
  openUploadDialog: () => Promise<Electron.OpenDialogReturnValue>
  getPathForFile: () => Promise<typeof webUtils.getPathForFile>
}