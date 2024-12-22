import { create } from "zustand";
import { getStoreData, storeData } from "../utils/storage";
import { UserSettingfo } from "../../type";

// 创建 store
const useUserSettingfoStore = create<UserSettingfo>((set) => ({
  downloadToFolderDirectly: getStoreData('downloadToFolderDirectly') ?? true,
  defaultDownloadFolderPath: getStoreData('defaultDownloadFolderPath') || '',
  setUserSettingfo: (value) => set((state) => {
    const nextState = { ...state, ...value };
    storeData('defaultDownloadFolderPath', nextState.defaultDownloadFolderPath)
    storeData('downloadToFolderDirectly', nextState.downloadToFolderDirectly)
    return nextState
  }),
}));

export default useUserSettingfoStore;