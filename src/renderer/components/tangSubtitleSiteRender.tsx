import { forwardRef, IframeHTMLAttributes, useRef, useState } from "react";
import { domNavigateing, webviewExcuteJsPromiseWrapprer } from "../utils";
import useFileInfoStore from "../store/fileInfo";
import useUserSettingfoStore from "../store/userSetting";

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
    return new Promise<void>((resolve, reject) => {
      subtitleSiteDom
        .executeJavaScript(
          `
          new Promise((resolve, reject) => {
            const rarLink = document.querySelector('span[id*="attach"] > a');
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
                        const resourceRarLink = document.querySelector('.attnm');

                        resourceRarLink.click();
                        `,
                        rejectCallbackStr:  `reject(new Error('未找到资源链接'))`,
                        valueIndex: 1
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
        )
        .then((res) => {
          if (res && res !== true) {
            resolve(res);
          } else {
            domNavigateing(subtitleSiteDom)
              .then(() => {
                if (res) {
                  console.log("funcPromiseres: ", res);
                  resolve(res);
                } else {
                  reject(new Error("未找到指定dom"));
                }
              })
              .catch((err) => {
                console.log("domNavigateing err: ", err);
                console.log("domNavigateing res: ", res);
                reject(err);
              });
          }
        });
    });
  },
};

type SUBTITLE_DOM_STATUS = keyof typeof subtitleDomExecuteJsMap;

export default forwardRef(function (props: IframeHTMLAttributes<any>) {
  const { src } = props;
  const { filePath, setFileInfo } = useFileInfoStore();
  const { downloadToFolderDirectly, defaultDownloadFolderPath } = useUserSettingfoStore();
  const subtitleSiteRef = useRef<HTMLWebViewElement>();
  const [subtitleDomStatus, setSubtitleDomStatus] =
    useState<SUBTITLE_DOM_STATUS>();

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
