import { message } from "antd";

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text); // 使用 Clipboard API
    message.success(`复制成功: ${text}`);
  } catch (err) {
    message.error(`复制失败: ${err}`);
  }
}
