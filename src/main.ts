import axios from 'axios';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import * as cheerio from 'cheerio';
import { recognize } from 'tesseract.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = async () => {
  try {
    // 发起 HTTP 请求
    const all = await axios.request({
      maxRedirects: 5,
      url: 'http://so.zimuku.org/search',
      method: 'GET',
      params: {
        q: '金刚狼',
        chost: 'zimuku.org',
      },
      validateStatus: function () {
        // 返回 true 表示所有状态码都被视为有效
        return true;
      },
    });
    console.log('data: ', all.status, all.data);

    // recognize()
    // 使用 Cheerio 加载 data
    const $ = cheerio.load(all.data);

    // 定义一个结果数组来存储解析的字幕信息
    const subtitles: any[] = [];

    // 假设字幕信息在某些特定的 HTML 元素中
    $('.verifyimg').each(async (index, element) => {
      const imgSrc = $(element).attr('src'); // 获取图片路径
      try {
        // 获取图片数据
        const response = await axios.get(imgSrc, {
          responseType: 'arraybuffer',
        });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // 调用 Tesseract.js 进行识别
        recognize(imageBuffer, 'eng')
          .then(({ data: { text } }) => {
            console.log(`验证码 ${index}: ${text.trim()}`);
          })
          .catch((error) => {
            console.error(`验证码 ${index} 识别失败:`, error);
          });
      } catch (error) {
        console.error(`获取验证码图片失败 (${imgSrc}):`, error);
      }
    });

    return subtitles;
  } catch (error) {
    console.log('error: ', error);
    
  }

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
