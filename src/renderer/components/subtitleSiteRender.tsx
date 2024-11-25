import {
  forwardRef,
  IframeHTMLAttributes,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { recognize } from "tesseract.js";
import { reject } from "lodash";

const didFailLoadListener = (event: Event) => {
  console.error("Failed to load:", event);
};

const domNavigateing = (subtitleSiteDom: HTMLWebViewElement) => {
  return new Promise<void>((resolve, reject) => {
    let navigated = false;

    const didiNavigateListener = () => {
      console.log("did-navigate: ");

      navigated = true;
      subtitleSiteDom.removeEventListener("did-navigate", didiNavigateListener);
      resolve();
    };
    subtitleSiteDom.addEventListener("did-navigate", didiNavigateListener);

    setTimeout(() => {
      if (!navigated) {
        console.log("navigated: ", navigated);
        reject();
        subtitleSiteDom.removeEventListener(
          "did-navigate",
          didiNavigateListener
        );
      }
    }, 2000);
  });
};

const webviewExcuteJsPromiseWrapprer = <T,>(
  originDom: HTMLWebViewElement,
  funcPromise: Promise<T>
) => {
  return new Promise<T>((resolve, reject) => {
    funcPromise.then((res) => {
      domNavigateing(originDom)
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
    });
  });
};

const verifyingCodeFunc = async (subtitleSiteDom: HTMLWebViewElement) => {
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
  viewingSearchList: async (subtitleSiteDom: HTMLWebViewElement) => {
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
  subtitleDetailPage: async (subtitleSiteDom: HTMLWebViewElement) => {
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
  finnalDownloadPage: async (subtitleSiteDom: HTMLWebViewElement) => {
    return webviewExcuteJsPromiseWrapprer(
      subtitleSiteDom,
      subtitleSiteDom.executeJavaScript(
        `
          (function() {
            const down1Link = document.querySelector("li:nth-child(1) > a")

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
};

type SUBTITLE_DOM_STATUS = keyof typeof subtitleDomExecuteJsMap;

export default forwardRef(function (
  props: IframeHTMLAttributes<any>,
  ref: RefObject<HTMLIFrameElement>
) {
  const { src } = props;
  const subtitleSiteRef = useRef<HTMLWebViewElement>();
  const [subtitleDomStatus, setSubtitleDomStatus] =
    useState<SUBTITLE_DOM_STATUS>();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const subtitleSiteDomListenerRef = useRef(async () => {});

  useEffect(() => {
    if (!subtitleDomStatus) {
      return;
    }

    const subtitleSiteDom = subtitleSiteRef.current;
    let evtExcuted = false;

    const removeAllListener = () => {
      console.log("removed", subtitleDomStatus);

      subtitleSiteDom.removeEventListener(
        "dom-ready",
        subtitleSiteDomListenerRef.current
      );
      subtitleSiteDom.removeEventListener("did-fail-load", didFailLoadListener);
    };

    subtitleSiteDomListenerRef.current = async () => {
      console.log("subtitleDomStatus: ", subtitleDomStatus);
      if (evtExcuted) {
        return
      }
      evtExcuted = true;
      subtitleDomExecuteJsMap[subtitleDomStatus](subtitleSiteRef.current)
          .then((res) => {
            console.log(`${subtitleDomStatus} res: `, res);
            const allStatus = Object.keys(
              subtitleDomExecuteJsMap
            ) as SUBTITLE_DOM_STATUS[];
            const curStatusIndex = allStatus.findIndex(
              (item) => item === subtitleDomStatus
            );

            const nextStatusIndex = curStatusIndex + 1;

            if (nextStatusIndex >= allStatus.length) {
              removeAllListener();
              return;
            }

            const nextStatus = allStatus[nextStatusIndex];
            console.log("nextStatus: ", nextStatus);
            setSubtitleDomStatus(nextStatus);
          })
          .catch((err) => {
            console.log(`${subtitleDomStatus} err: `, err);
          });
    };
    subtitleSiteDom.addEventListener(
      "dom-ready",
      subtitleSiteDomListenerRef.current
    );
    subtitleSiteDom.addEventListener("did-fail-load", didFailLoadListener);

    setTimeout(() => {
      if (!evtExcuted) {
        console.log(`${subtitleDomStatus} evtExcuted: `, evtExcuted);
        subtitleSiteDomListenerRef.current();
        evtExcuted = true;
      }
    }, 1000);

    return removeAllListener;
  }, [subtitleDomStatus]);

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
});
