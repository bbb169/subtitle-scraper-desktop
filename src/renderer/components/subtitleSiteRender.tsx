import { Button } from "antd";
import {
  forwardRef,
  IframeHTMLAttributes,
  RefObject,
  useEffect,
  useRef,
} from "react";
import { recognize } from "tesseract.js";

export default forwardRef(function (
  props: IframeHTMLAttributes<any>,
  ref: RefObject<HTMLIFrameElement>
) {
  const { src } = props;
  const subtitleSiteRef = useRef<HTMLWebViewElement>();

  const getContent = () => {
    const subtitleSiteDom = subtitleSiteRef.current;

    (subtitleSiteDom as any)
      .executeJavaScript(
        `
      (function() {
        const element = document.querySelector('.verifyimg');
        return element ? element.getAttribute('src') : null;
      })();
    `
      )
      .then((html: any) => {
        if (html) {
          const imageBuffer = Buffer.from(html.split(",")[1], "base64");

          // 调用 Tesseract.js 进行识别
          recognize(imageBuffer, "eng")
            .then(({ data: { text } }) => {
              console.log(`验证码 : ${text.trim()}`);

              (subtitleSiteDom as any)
                .executeJavaScript(
                  `
                (function() {
                  // 获取输入框 DOM 元素
                  const inputElement = document.querySelector("#intext");

                  // 填入数字
                  inputElement.value = "${text.trim()}";

                  setTimeout(() => {
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
                  }, 2000);

                })();
              `
                )
            })
            .catch((error) => {
              console.error(`验证码  识别失败:`, error);
            });
        } else {
          console.error('Element with class "verifyimg" not found.');
        }
      });
  };

  useEffect(() => {
    const subtitleSiteDom = subtitleSiteRef.current;
    subtitleSiteDom.addEventListener("dom-ready", () => {
      getContent();
    });
    subtitleSiteDom.addEventListener("did-fail-load", (event) => {
      console.error("Failed to load:", event);
    });
  }, [src]);

  return (
    <>
      <Button
        onClick={() => {
          getContent();
        }}
      >
        click to get content
      </Button>
      <webview
        webpreferences="contextIsolation=no, nodeIntegration=yes"
        frameBorder="0"
        {...props}
        ref={subtitleSiteRef}
      ></webview>
    </>
  );
});
