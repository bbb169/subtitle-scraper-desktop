import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { PreloadAPITypes } from './type';


// Custom APIs for renderer
const api: PreloadAPITypes = {
  async openUploadDialog() {
    return await ipcRenderer.invoke('openUploadDialog')
  },
  async getPathForFile() {
    return await ipcRenderer.invoke('getPathForFile')
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