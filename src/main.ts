import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import * as electron from 'electron';
import * as fs from "node:fs";
import path from "path";
import { DownloadFileResult } from "./type";

import { decode } from "iconv-lite";
import sevenBin from "7zip-bin"; // 7z
import { createExtractorFromFile } from "node-unrar-js/esm"; // rar
import { extractFull } from "node-7z";
import decompress from "decompress";
import decompressTar from "decompress-tar"; //.tar
import decompressTarbz2 from "decompress-tarbz2"; // .bz2
import decompressTargz from "decompress-targz"; // .gz
import decompressUnzip from "decompress-unzip"; // .zip
import * as startUp from "electron-squirrel-startup";
import { homedir } from "node:os";
import * as log from "electron-log";


// 配置日志文件路径（可选）
log.transports.file.resolvePath = () =>
  path.join(homedir(), "subtitle-scraper-desktop.log");
log.error("homedir(): ", homedir());

// 使用日志
log.info("Application is starting...");
log.error("An error occurred!");

const logInfo = (...params: any[]) => {
  log.info(...params);
  log.error(...params);
};

const logError = (...params: any[]) => {
  log.error(...params);
  console.error(...params);
};

// logInfo('agent', (global as any).GLOBAL_AGENT)
// logInfo('process.env', process.env)


const pathTo7zip = sevenBin.path7za;
// 常见压缩包后缀
const compressedExtensions = [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"];

const plugins = [
  decompressTar(),
  decompressTarbz2(),
  decompressTargz(),
  decompressUnzip(),
];

// 识别并解压压缩包
function decompressFile(
  inputFile: string,
  outputDir: string,
  extensionName?: string
) {
  switch (extensionName) {
    case ".7z":
      return new Promise<void>((resolve, reject) => {
        logInfo("myStream: started", extensionName);

        const myStream = extractFull(inputFile, outputDir, {
          $bin: pathTo7zip,
        });
        logInfo("myStream: processing", extensionName);

        myStream.on("end", function () {
          logInfo("end: ");
          resolve();
        });

        myStream.on("error", (err: any) => {
          logInfo("err: ", err);
          reject(err);
        });
      });
    case ".rar":
      return new Promise<void>((resolve, reject) => {
        logInfo("myStream: started", extensionName);
        // eslint-disable-next-line import/namespace
        const myStream = createExtractorFromFile({
          targetPath: outputDir,
          filepath: inputFile,
        });
        logInfo("myStream: processing", extensionName);
        myStream
          .then((res) => {
            try {
              const gen = res.extract({}).files;
              let item = gen.next();
              while (!item.done) {
                item = gen.next();
              }

              resolve();
            } catch (error) {
              reject(error);
            }
          })
          .catch((err) => {
            logInfo("err: ", err);
            reject(err);
          });
      });

    default:
      return decompress(inputFile, outputDir, {
        plugins,
      }) as unknown as Promise<void>;
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (startUp?.default) {
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
    autoHideMenuBar: true,
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

  ipcMain.handle(
    "downloadFile",
    async (_, fileUrl: string, saveDir: string) => {
      try {
        logInfo("savePath: ", fileUrl, saveDir);

        // 提取文件名
        let fileName = "字幕压缩包.rar"; // 从 URL 提取文件名

        if (!fs.existsSync(saveDir)) {
          logInfo('starting make dir');

          fs.mkdirSync(saveDir, { recursive: true });
        }
        logInfo('starting request', fileUrl);

        const request = () => new Promise<Electron.IncomingMessage>((resolve, reject) => {
          const requ = electron.net.request({
            url: fileUrl,
          })
          requ.on('abort', () => {
            console.log('abort: ', 'abort');
  
          })
          requ.on('response', (response) => {
            resolve(response)
            logInfo('response: ', response);
          })
          requ.on('error', (err) => {
            logInfo('error: ', err);
            reject(err)
  
          });
          requ.end();
        })

        const response = await request();
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition && contentDisposition.includes("filename=")) {
          console.log('contentDisposition: ', contentDisposition);
          fileName = (contentDisposition as string)
            .split("filename=")[1]
            .split(";")[0]
            .replace(/"/g, "");

          // encoding the most possible filename
          fileName = decode(Buffer.from(fileName, "latin1"), "utf-8");
          logInfo("fileName: ", fileName);
        } else {
          // 尝试从 URL 提取文件名
          const urlPath = new URL(fileUrl).pathname;
          fileName = path.basename(urlPath) || fileName;
        }

        const extension = path.extname(fileName).toLowerCase();
        const savePath = path.join(saveDir, fileName); // 完整的文件路径
        logInfo(
          "downloaded: ",
          decode(Buffer.from(savePath, "latin1"), "utf-8")
        );
        // 将响应数据写入文件
        const writer = fs.createWriteStream(savePath, { encoding: "utf-8" });

        response.on('data', (chunk) => {
          console.log('data: ', 'data');
          writer.write(chunk);
        });
  
        response.on('end', () => {
          writer.end();
          console.log('File downloaded successfully!');
        });

        response.on('error', (err) => {
          console.error('Response error:', err);
          writer.close();
        });
  
        writer.on('error', (err) => {
          console.error('File stream error:', err);
        });

        // 返回一个 Promise，以便在写入完成后继续执行
        return new Promise<DownloadFileResult>((resolve, reject) => {
          writer.on("finish", async () => {
            logInfo(`文件已成功下载到: ${savePath}`, extension);
            try {
              if (compressedExtensions.includes(extension)) {
                logInfo("文件是压缩包，正在解压缩...", extension);

                const decompressFolder = path.join(
                  saveDir,
                  path
                    .basename(fileName, path.extname(fileName))
                    .replace(/\.*$/, "")
                );

                logInfo(
                  "decompressFolder: ",
                  decode(Buffer.from(decompressFolder, "latin1"), "utf-8")
                );

                decompressFile(savePath, decompressFolder, extension)
                  .then(() => {
                    resolve({
                      unziped: true,
                      savePath: decompressFolder,
                    });
                  })
                  .catch((err) => {
                    reject(err);
                  });
              } else {
                resolve({
                  unziped: false,
                  savePath,
                });
              }
            } catch (error) {
              reject(error);
            }
          });
          writer.on("error", (err) => {
            reject(err);
          });
        });
      } catch (error) {
        logError(`下载文件时出错: ${error.message}`);
        throw error;
      }
    }
  );

  ipcMain.handle("openDirectory", async () => {
    return await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    // 强制信任特定的 URL
    console.log('request.hostname: ', request.hostname);

    if (request.hostname === 'zimuku.org') {
      return callback(0); // 0 表示忽略错误，信任证书
    }
    // 对其他 URL 使用默认验证
    return callback(-2); // -2 表示使用默认验证
  });

  createWindow();
});

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
