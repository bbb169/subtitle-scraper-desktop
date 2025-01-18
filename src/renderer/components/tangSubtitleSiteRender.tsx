import {
  forwardRef,
  IframeHTMLAttributes,
  useRef,
} from "react";

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
