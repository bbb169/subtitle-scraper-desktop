import { Cheerio } from "cheerio";
import { forwardRef, IframeHTMLAttributes, RefObject, useEffect, useRef } from "react";

export default forwardRef(function(props: IframeHTMLAttributes<any>, ref: RefObject<HTMLIFrameElement>) {
  const { src } = props;
  const subtitleSiteRef = useRef<HTMLIFrameElement>();
  

  useEffect(() => {
    const subtitleSiteDom = subtitleSiteRef.current;
    console.log('subtitleSiteDom: ', subtitleSiteDom);
    subtitleSiteDom.onload = (evt) => {
      console.log('213', subtitleSiteDom.getElementsByClassName('verifyimg'));
    }
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

  return <iframe frameBorder="0" style={{ visibility: 'hidden' }} {...props} ref={subtitleSiteRef}></iframe>
})