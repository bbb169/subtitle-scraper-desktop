import {
  forwardRef,
  IframeHTMLAttributes,
  useRef,
} from "react";
import { domNavigateing, webviewExcuteJsPromiseWrapprer } from "../utils";

const subtitleDomExecuteJsMap = {
  viewingSearchList: (subtitleSiteDom: HTMLWebViewElement) => {
    return webviewExcuteJsPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const firstSubtitle = document.querySelector(".xs3");
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
  viewingDetailPage: (subtitleSiteDom: HTMLWebViewElement, downloadFileByRequest = false) => {
    return new Promise<void>((resolve, reject) => {
      subtitleSiteDom.executeJavaScript(
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

                // 监听购买弹窗是否出现
                const modalObserver = new MutationObserver((mutationsList, observer) => {
                  // 遍历每个变动记录
                  for (const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.target.id === 'fwin_attachpay') {
                      showPayModal = true
                      const payButton = document.querySelector('button[name*="paysubmit"]');
                      payButton.click();

                      // 监听新资源链接是否发生更新
                      const newResourceObserver = new MutationObserver((newResourcMutationsList, newResourcObserver) => {
                        // 遍历每个变动记录
                        for (const mutation of mutationsList) {
                          if (mutation.type === 'childList' && mutation.target.id === 'fwin_attachpay') {
                            const newResourceObserver = 

                          }
                        }
                      })

                      resovle(true)
                      observer.disconnect();
                    }
                  }
                });

                setTimeout(() => {
                  if (!showPayModal) {
                    reject(new Error('购买弹窗未显示'));
                    modalObserver.disconnect();
                  }
                }, 1000);

                // 开始观察
                modalObserver.observe(targetNode, {
                  childList: true, // 监听子节点的增删
                });
              }
            } else {
              reject(new Error('未找到字幕文件dom节点'));
            }
          })
        `
      ).then((res) => {
          if (res && res !== true) {
            resolve(res);
          } else {
            domNavigateing(subtitleSiteDom)
              .then(() => {
                if (res) {
                  console.log('funcPromiseres: ', res);
                  resolve(res);
                } else {
                  reject(new Error("未找到指定dom"));
                }
              })
              .catch((err) => {
                console.log('domNavigateing err: ', err);
                console.log('domNavigateing res: ', res);
                reject(err);
              });
          }

            
          });
    })
  },
};


type SUBTITLE_DOM_STATUS = keyof typeof subtitleDomExecuteJsMap;

export default forwardRef(function (
  props: IframeHTMLAttributes<any>,
) {
  const subtitleSiteRef = useRef<HTMLWebViewElement>();

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
