import { forwardRef, IframeHTMLAttributes, useEffect } from "react";
import { webviewExcuteJsPromiseWrapprer } from "../utils";
import useFileInfoStore from "../store/fileInfo";
import useUserSettingfoStore from "../store/userSetting";
import useDomStatusProcess from "./useDomStatusProcess";
import { message } from "antd";

export const getResourceObserver = ({
  callbackStr,
  rejectCallbackStr = "",
  valueIndex = 0,
}: {
  callbackStr: string;
  rejectCallbackStr?: string;
  valueIndex?: number;
}) => {
  return `// 监听购买弹窗是否出现
    let domChanged${valueIndex} = false;
    const modalObserver${valueIndex} = new MutationObserver((mutationsList, observer) => {
      // 遍历每个变动记录
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
          domChanged${valueIndex} = true
          ${callbackStr}

          resolve(true)
          observer.disconnect();
        }
      }
    });

    setTimeout(() => {
      if (!domChanged${valueIndex}) {
        ${rejectCallbackStr}
        modalObserver${valueIndex}.disconnect();
      }
    }, 1000);

    // 开始观察
    modalObserver${valueIndex}.observe(targetNode, {
      childList: true, // 监听子节点的增删
    });`;
};

const subtitleDomExecuteJsMap = {
  searchPage: (subtitleSiteDom: HTMLWebViewElement, keyWord: string) => {
    return webviewExcuteJsPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const input = document.querySelector("#scform_srchtxt");
            const button = document.querySelector('#scform_submit');
            if (input && button) {
              input.value = '【自提】 ${keyWord}';
              button.click();
            } else {
              return false;
            }
          })();
        `
      )
    );
  },
  viewingSearchList: (subtitleSiteDom: HTMLWebViewElement) => {
    return webviewExcuteJsPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const firstSubtitle = document.querySelector(".xs3 > a");
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
  viewingDetailPage: (
    subtitleSiteDom: HTMLWebViewElement,
    downloadFileByRequest = false
  ) => {
    return subtitleSiteDom.executeJavaScript(
      `
      new Promise((resolve, reject) => {
        const rarLink = document.querySelector('.attnm > a');
        if (rarLink) {
          if (!rarLink.href.includes('forum.php')) { // buyed ============================
            if (${downloadFileByRequest}) {
              return rarLink.href
            }
            rarLink.click();
            resolve(rarLink.href)
          } else { // ready to buy ============================
            rarLink.click();
            // 选择要观察的目标节点
            const targetNode = document.getElementById('nv_forum');

            let showPayModal = false;

            ${getResourceObserver({
              // get pay button and click =======================
              callbackStr: `const payButton = document.querySelector('button[name*="paysubmit"]');
                  payButton.click();
                  ${getResourceObserver({
                    // find resource link and click =======================
                    callbackStr: `
                    // 监听新资源链接是否发生更新
                    const resourceRarLink = document.querySelector('.attnm > a');

                    if (${downloadFileByRequest}) {
                      return resourceRarLink
                    }
                    resourceRarLink.click();
                    `,
                    rejectCallbackStr: `reject(new Error('未找到资源链接'))`,
                    valueIndex: 1,
                  })}
                  `,
              rejectCallbackStr: `reject(new Error('购买弹窗未显示'))`,
            })}
          }
        } else {
          reject(new Error('未找到字幕文件dom节点'));
        }
      })
    `
    );
  },
};

export default forwardRef(function (props: IframeHTMLAttributes<any>) {
  const { src } = props;
  const { filePath, setFileInfo } = useFileInfoStore();
  const { defaultDownloadFolderPath } = useUserSettingfoStore();
  const mergedFilePath = filePath || defaultDownloadFolderPath;
  const { setSubtitleDomStatus, subtitleSiteRef } = useDomStatusProcess(
    subtitleDomExecuteJsMap,
    {
      viewingDetailPage: (res) => {
        if (res?.length) {
          console.log("res, filePath: ", res, mergedFilePath);

          window.api
            .downloadFile(res, mergedFilePath)
            .then((res) => {
              if (res.unziped) {
                message.success(`字幕成功解压缩到${res.savePath}`);
              } else {
                message.success(`字幕成功写入${res.savePath}`);
              }
            })
            .catch((err) => {
              message.error(`字幕下载失败：${err}`);
            });
        }
      },
      viewingSearchList: (res) => setFileInfo({ fileDetailPageUrl: res }),
    }
  );

  useEffect(() => {
    setSubtitleDomStatus('searchPage');
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
});
