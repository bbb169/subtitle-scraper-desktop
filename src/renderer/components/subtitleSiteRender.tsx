import { Cheerio } from "cheerio";
import { forwardRef, IframeHTMLAttributes, RefObject, useEffect, useRef } from "react";
import Tesseract, { recognize } from "tesseract.js";

export default forwardRef(function(props: IframeHTMLAttributes<any>, ref: RefObject<HTMLIFrameElement>) {
  const { src } = props;
  const subtitleSiteRef = useRef<HTMLWebViewElement>();
  

  useEffect(() => {
    const subtitleSiteDom = subtitleSiteRef.current;
    // console.log('subtitleSiteDom: ', subtitleSiteDom);
    // (subtitleSiteDom as any).executeJavaScript(`
    //   console.log('document',document);
    // `);
    subtitleSiteDom.addEventListener('dom-ready', () => {
      console.log('21321321');

      (subtitleSiteDom as any).executeJavaScript(`
        (function() {
          const element = document.querySelector('.verifyimg');
          return element ? element.getAttribute('src') : null;
        })();
      `).then((html) => {
        if (html) {
          console.log('Element HTML:', html);
          const imageBuffer = Buffer.from(html, 'base64');

          // Tesseract.({
          //   langPath: 'https://cdn.jsdelivr.net/npm/@tesseract.js-data/', // 使用CDN路径
          // }).then((tesseract) => {
          //   tesseract.recognize(image)
          //     .then(result => console.log(result));
          // });
          // 调用 Tesseract.js 进行识别
          // recognize(imageBuffer, 'chi_sim', {
          //   langPath: 'src/assets/',
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
    });
    subtitleSiteDom.addEventListener('did-fail-load', (event) => {
      console.error('Failed to load:', event);
    });
      // subtitleSiteDom.contentWindow.document
      // console.log('213',subtitleSiteDom.contentWindow.document.getElementsByClassName('verifyimg'));
    // document.querySelector('#root > div > iframe').getElementsByClassName('verifyimg')('img')
    // const $ = Cheerio.load(all.data);
    // console.log('$: ');

    // // 定义一个结果数组来存储解析的字幕信息
    // const subtitles: any[] = [];

    // // 假设字幕信息在某些特定的 HTML 元素中
    // $('.verifyimg').each((index, element) => {
    //   const imgSrc = $(element).attr('src'); // 获取图片路径
    //   console.log('imgSrc: ', imgSrc);
    //   try {
    //     const imageBuffer = Buffer.from(imgSrc, 'base64');

    //       // 调用 Tesseract.js 进行识别
    //       recognize(imageBuffer, '')
    //         .then(({ data: { text } }) => {
    //           console.log(`验证码 ${index}: ${text.trim()}`);
    //         })
    //         .catch((error) => {
    //           console.error(`验证码 ${index} 识别失败:`, error);
    //         });
    //     return !!subtitles
    //   } catch (error) {
    //     console.error(`获取验证码图片失败 (${imgSrc}):`, error);
    //   }
    // });
  }, [src])

  return <webview webpreferences="contextIsolation=no, nodeIntegration=yes" frameBorder="0" 
  
  // style={{ visibility: 'hidden' }} 
  {...props} ref={subtitleSiteRef}></webview>
})