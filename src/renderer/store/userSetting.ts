import { create } from "zustand";

export interface UserSettingfo {
  downloadToFolderDirectly?: boolean;
  defaultDownloadFolderPath?: string;
  setUserSettingfo: (value: Omit<UserSettingfo, 'setUserSettingfo'>) => void;
}

// 创建 store
const useUserSettingfoStore = create<UserSettingfo>((set) => ({
  downloadToFolderDirectly: true,
  setUserSettingfo: (value) => set((state) => ({ ...state, ...value })),
}));

export default useUserSettingfoStore;