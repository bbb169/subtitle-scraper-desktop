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
          (function() {
            const rarLink = document.querySelector('span[id*="attach"] > a');
            if (rarLink) {
              if (!rarLink.href.includes('forum.php')) { // buyed
                if (${downloadFileByRequest}) {
                  return rarLink.href
                }
                rarLink.click();
                return rarLink.href
              } else { // ready to buy
                rarLink.click();
                return true
              }
            } else {
              return false;
            }
          })();
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
// fetch({
//   url: 'https://www.sehuatang.net/forum.php?mod=misc&action=attachpay&tid=427724&paysubmit=yes&infloat=yes&inajax=1',
//   method: 'POST',
// })
// fetch({
//   url: 'https://www.sehuatang.net/forum.php?mod=misc&action=attachpay&tid=427724&paysubmit=yes&infloat=yes&inajax=1',
//   method: 'POST',
//   formData: {

//   },
// })

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
