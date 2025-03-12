import {
  IframeHTMLAttributes,
  useEffect,
} from "react";
import { recognize } from "tesseract.js";
import useFileInfoStore from "../store/fileInfo";
import { message } from "antd";
import useUserSettingfoStore from "../store/userSetting";
import { webviewExcuteJsPromiseWrapprer } from "../utils";
import useDomStatusProcess from "./useDomStatusProcess";


const verifyingCodeFunc = (subtitleSiteDom: HTMLWebViewElement) => {
  return new Promise<void>((resolve, reject) => {
    subtitleSiteDom
      .executeJavaScript(
        `
        (function() {
          const element = document.querySelector('.verifyimg');
          return element ? element.getAttribute('src') : null;
        })();
        `
      )
      .then((html: string) => {
        if (html) {
          const imageBuffer = Buffer.from(html.split(",")[1], "base64");

          // 调用 Tesseract.js 进行识别
          recognize(imageBuffer, "eng").then(({ data: { text } }) => {
            console.log(`验证码 : ${text.trim()}`);

            webviewExcuteJsPromiseWrapprer(
              subtitleSiteDom,
              subtitleSiteDom.executeJavaScript(
                `
                (function() {
                  // 获取输入框 DOM 元素
                  const inputElement = document.querySelector("#intext");
        
                  if (inputElement) {
                  
                    // 填入数字
                    inputElement.value = "${text.trim()}";
          
                    // 创建一个键盘事件，模拟按下 Enter 键
                      const enterEvent = new KeyboardEvent("keypress", {
                        bubbles: true,
                        cancelable: true,
                        key: "Enter",
                        code: "Enter",
                        keyCode: 13, // 兼容性处理
                        which: 13,   // 兼容性处理
                      });
        
                    // 派发键盘事件到输入框
                    document.body.dispatchEvent(enterEvent);
                    return true
                  } else {
                    return false
                  }
                })();
              `
              )
            )
              .then(() => {
                setTimeout(() => {
                  subtitleSiteDom
                    .executeJavaScript(
                      `
                      (function() {
                        const element = document.getElementsByClassName('item prel clearfix').length;
                        return !!element;
                      })();
                      `
                    )
                    .then((res: any) => {
                      console.log("res: ", res);
                      if (res) {
                        resolve();
                      } else {
                        setTimeout(() => {
                          verifyingCodeFunc(subtitleSiteDom)
                            .then((res) => {
                              resolve(res);
                            })
                            .catch((err) => {
                              reject(err);
                            });
                        }, 1000);
                      }
                    })
                    .catch((err: any) => {
                      console.log("err: ", err);
                      reject();
                    });
                }, 0);
              })
              .catch(() => {
                setTimeout(() => {
                  verifyingCodeFunc(subtitleSiteDom)
                    .then((res) => {
                      resolve(res);
                    })
                    .catch((innerErr) => {
                      reject(innerErr);
                    });
                }, 1000);
              });
          });
        } else {
          resolve();
        }
      });
  });
};

const subtitleDomExecuteJsMap = {
  verifyingCode: verifyingCodeFunc,
  viewingSearchList: (subtitleSiteDom: HTMLWebViewElement) => {
    return webviewExcuteJsPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const firstSubtitle = document.getElementsByClassName('item prel clearfix')?.[0]?.getElementsByTagName('tr')?.[0]?.getElementsByTagName('a')?.[0];
            if (firstSubtitle) {
              window.location.href = firstSubtitle.href;
              return firstSubtitle.href;
            } else {
              return false;
            }
          })();
        `
      )
    );
  },
  subtitleDetailPage: (subtitleSiteDom: HTMLWebViewElement) => {
    return webviewExcuteJsPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const down1Link = document.getElementById('down1')

            if (down1Link) {
              window.location.href = down1Link.href;
              return down1Link.href
            } else {
              return false
            }
          })();
        `
      )
    );
  },
  finnalDownloadPage: (subtitleSiteDom: HTMLWebViewElement, downloadFileByRequest = false) => {
    return subtitleSiteDom.executeJavaScript(
      `
        (function() {
          const down1Link = document.querySelector("li:nth-child(1) > a")

          if (down1Link) {
            if (!${downloadFileByRequest}) {
              window.location.href = down1Link.href;
              return true
            }
            return down1Link.href
          } else {
            return false
          }
        })();
      `
    );
  },
};


export default function (
  props: IframeHTMLAttributes<any>,
) {
  const { src } = props;
  const { filePath, setFileInfo } = useFileInfoStore();
  const { defaultDownloadFolderPath } = useUserSettingfoStore();
  const mergedFilePath = filePath || defaultDownloadFolderPath;
  const { setSubtitleDomStatus, subtitleSiteRef } = useDomStatusProcess(subtitleDomExecuteJsMap, {
    finnalDownloadPage: (res) => {
      if (res?.length) {
        console.log('res, filePath: ', res, mergedFilePath);

        window.api.downloadFile(res, mergedFilePath).then((res) => {
          if (res.unziped) {
            message.success(`字幕成功解压缩到${res.savePath}`)
          } else {
            message.success(`字幕成功写入${res.savePath}`)
          }
        }).catch(err => {
          message.error(`字幕下载失败：${err}`)
        })
      }
    },
    viewingSearchList: (res) => setFileInfo({ fileDetailPageUrl: res })
  });

  useEffect(() => {
    setSubtitleDomStatus("verifyingCode");
  }, [src]);

  return (
    <>
      <webview
        webpreferences="contextIsolation=no, nodeIntegration=yes"
        frameBorder="0"
        style={{ width: "100%", height: 800 }}
        {...props}
        ref={subtitleSiteRef}
      ></webview>
    </>
  );
}
