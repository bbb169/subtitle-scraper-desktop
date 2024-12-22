import { create } from "zustand";

export interface FileInfo {
  resolvedFileName?: string;
  filePath?: string;
  fileDetailPageUrl?: string;
  setFileInfo: (value: Omit<FileInfo, 'setFileInfo'>) => void;
}

// 创建 store
const useFileInfoStore = create<FileInfo>((set) => ({
  setFileInfo: (value) => set((state) => ({ ...state, ...value })),
}));

export default useFileInfoStore;