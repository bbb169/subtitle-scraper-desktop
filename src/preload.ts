import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PreloadAPITypes } from './type';


// Custom APIs for renderer
const api: PreloadAPITypes = {
  async openUploadDialog() {
    return await ipcRenderer.invoke('openUploadDialog')
  },
  async useFs() {
    return await ipcRenderer.invoke('useFs')
  },
  async downloadFile(fileUrl: string, savePath: string) {
    return await ipcRenderer.invoke('downloadFile', fileUrl, savePath)
  },
  async openDirectory() {
    return ipcRenderer.invoke('openDirectory')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}