import { Button } from "antd";
import { Cheerio } from "cheerio";
import { forwardRef, IframeHTMLAttributes, RefObject, useEffect, useRef } from "react";
import Tesseract, { recognize } from "tesseract.js";


export default forwardRef(function(props: IframeHTMLAttributes<any>, ref: RefObject<HTMLIFrameElement>) {
  const { src } = props;
  const subtitleSiteRef = useRef<HTMLWebViewElement>();
  
  const getContent = () => {
    const subtitleSiteDom = subtitleSiteRef.current;

    (subtitleSiteDom as any).executeJavaScript(`
      (function() {
        const element = document.querySelector('.verifyimg');
        return element ? element.getAttribute('src') : null;
      })();
    `).then((html: any) => {
      if (html) {
        console.log('Element HTML:', html);

        window.api.recognizeVerifyNumber(html).then(res => {
          console.log('res: ', res);
        }).catch(err => {
          console.error('err: ', err);
        })
        // Tesseract.({
        //   langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/', // 使用CDN路径
        // }).then((tesseract) => {
        //   tesseract.recognize(image)
        //     .then(result => console.log(result));
        // });
        // console.log('rootPath: ', rootPath);

        // // 调用 Tesseract.js 进行识别
        // recognize(imageBuffer, 'chi_sim', {
        //   langPath: rootPath,
        //   gzip: false,
        //   dataPath: 'chi_sim.traineddata'
        // })
        //   .then(({ data: { text } }) => {
        //     console.log(`验证码 : ${text.trim()}`);
        //   })
        //   .catch((error) => {
        //     console.error(`验证码  识别失败:`, error);
        //   });
      } else {
        console.error('Element with class "verifyimg" not found.');
      }
    });
  }

  useEffect(() => {
    const subtitleSiteDom = subtitleSiteRef.current;

    // console.log('subtitleSiteDom: ', subtitleSiteDom);
    // (subtitleSiteDom as any).executeJavaScript(`
    //   console.log('document',document);
    // `);
    subtitleSiteDom.addEventListener('dom-ready', () => {
      console.log('21321321');
      getContent();
     
    });
    subtitleSiteDom.addEventListener('did-fail-load', (event) => {
      console.error('Failed to load:', event);
    });
  }, [src])

  return <>
    <Button onClick={() => { 
      getContent();
     }}>click to get content</Button>
    <webview webpreferences="contextIsolation=no, nodeIntegration=yes" frameBorder="0" 
  
    // style={{ visibility: 'hidden' }} 
    {...props} ref={subtitleSiteRef}></webview>
  </>
})