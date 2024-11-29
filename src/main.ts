import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  ipcRenderer,
  session,
  webUtils,
} from "electron";
import * as fs from "node:fs";
import path from "path";
import https from "https";
import http from "http";
import axios from "axios";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = async () => {
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    // 忽略所有证书验证错误
    callback(0);
  });

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true, // 如果需要 Node.js 支持
      contextIsolation: false, // 如果需要共享上下文
      webSecurity: false, // 禁用同源策略
      allowRunningInsecureContent: true,
      webviewTag: true, // 启用 webview
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // 打开文件选择对话框
  ipcMain.handle("openUploadDialog", async () => {
    const options = {
      title: "选择文件",
      buttonLabel: "确认",
    };

    return dialog.showOpenDialog(mainWindow, options);
  });

  ipcMain.handle("useFs", async () => {
    return fs;
  });

  ipcMain.handle("downloadFile", async (_, fileUrl: string, saveDir: string) => {
    try {
      console.log('savePath: ',fileUrl, saveDir);

      // 提取文件名
      let fileName = '字幕压缩包.rar'; // 从 URL 提取文件名
      console.log('fileName: ', fileName);

      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
  
      // 使用 axios 发起 GET 请求，并指定响应类型为流
      const response = await axios.get(fileUrl, { responseType: 'stream', headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-US;q=0.7',
        'connection': 'keep-alive',
        'host': 'zimuku.org',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      } });
      console.log('response: ', response.headers);
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        fileName = contentDisposition
          .split('filename=')[1]
          .split(';')[0]
          .replace(/"/g, '');
      } else {
        // 尝试从 URL 提取文件名
        const urlPath = new URL(fileUrl).pathname;
        fileName = path.basename(urlPath) || fileName;
      }
      
      const savePath = path.join(saveDir, fileName); // 完整的文件路径
      console.log('savePath: ', savePath);
      // 将响应数据写入文件
      const writer = fs.createWriteStream(savePath);
      response.data.pipe(writer);
  
      // 返回一个 Promise，以便在写入完成后继续执行
      return new Promise<string>((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`文件已成功下载到: ${savePath}`);
          resolve(savePath);
        });
        writer.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error(`下载文件时出错: ${error.message}`);
      throw error;
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
