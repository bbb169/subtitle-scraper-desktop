import { IframeHTMLAttributes, useEffect } from "react";
import {
  webviewExcuteJsPromiseWrapprer,
  webviewExcuteJsRedirectPromiseWrapprer,
} from "../utils";
import useFileInfoStore from "../store/fileInfo";
import useUserSettingfoStore from "../store/userSetting";
import useDomStatusProcess from "./useDomStatusProcess";
import { message } from "antd";
import { useRequest } from "ahooks";

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
      subtree: true
    });`;
};

export const getResourceLink = (index = 0) => `
const ops${index} = document.querySelectorAll('[id*=post] ignore_js_op'); 
const resourceLink${index} = ops${index}[ops${index}.length - 1].querySelector('a');
`;

const subtitleDomExecuteJsMap = {
  searchPage: (subtitleSiteDom: HTMLWebViewElement, keyWord: string) => {
    return webviewExcuteJsRedirectPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const input = document.querySelector("#scform_srchtxt");
            const button = document.querySelector('#scform_submit');
            if (input && button) {
              input.value = '【自提】 ${keyWord}';
              button.click();
              return input.value
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
    const excuteStr = `
      new Promise((resolve, reject) => {
        try {
          const ops = document.querySelectorAll('[id*=post] ignore_js_op'); 
          const rarLink = ops[ops.length - 1].querySelector('a');
          if (rarLink) {
            if (!rarLink.href.includes('forum.php')) { // buyed ============================
              if (${downloadFileByRequest}) {
                return resolve(rarLink.href)
              }
              window.location.href = rarLink.href;
              resolve(true)
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
                      ${getResourceLink(1)}

                      if (${downloadFileByRequest}) {
                        resolve(resourceRarLink${1}.href)
                        return
                      }
                      window.location.href = resourceRarLink${1}.href;
                      resolve(true)
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
        } catch (error) {
          reject(error);
        }
      })
    `;

    console.log("excuteStr", excuteStr);
    return subtitleSiteDom.executeJavaScript(excuteStr);
  },
};

export default function ({
  keyWord,
  ...props
}: IframeHTMLAttributes<any> & { keyWord: string }) {
  const { src } = props;
  const { filePath, setFileInfo } = useFileInfoStore();
  const { defaultDownloadFolderPath, downloadToFolderDirectly } =
    useUserSettingfoStore();
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
    },
    {
      searchPage: [keyWord],
      viewingDetailPage: [downloadToFolderDirectly],
    }
  );

  useRequest(
    async () => {
      setSubtitleDomStatus("searchPage");
    },
    {
      refreshDeps: [src, downloadToFolderDirectly, defaultDownloadFolderPath, keyWord],
      debounceWait: 500,
    }
  );

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
