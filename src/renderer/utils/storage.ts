import { UserSettingfo } from "../../type"

type ResolveValue<T> = T extends Record<string, any> ? [keyof T, T[keyof T]] : never

type StorageKeyDataMap = Omit<UserSettingfo, 'setUserSettingfo'>

// 存储数据
export const storeData = async (
  ...[key, value]: ResolveValue<StorageKeyDataMap>
): Promise<void> => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error storing data:', error)
  }
}

// 获取数据
export const getStoreData = <T extends keyof StorageKeyDataMap>(key: T): StorageKeyDataMap[T] | null => {
  const value = localStorage.getItem(key)
  return value !== null ? JSON.parse(value) : null
}
