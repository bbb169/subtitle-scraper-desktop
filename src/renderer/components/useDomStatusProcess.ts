import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import useFileInfoStore from "../store/fileInfo";
import useUserSettingfoStore from "../store/userSetting";



export default function <T extends Record<string, (subtitleSiteDom: HTMLWebViewElement, ...args: any) => Promise<any>>>(subtitleDomExecuteJsMap: T, evtCallback?: Partial<Record<keyof T, (result: any) => void>>, appendArgsMap?: Partial<Record<keyof T, any[]>>) {
  const { filePath } = useFileInfoStore();
  const { downloadToFolderDirectly, defaultDownloadFolderPath } = useUserSettingfoStore();
  const subtitleSiteRef = useRef<HTMLWebViewElement>();
  const [subtitleDomStatus, setSubtitleDomStatus] =
    useState<string>();
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const subtitleSiteDomListenerRef = useRef(async () => {});
  const mergedFilePath = filePath || defaultDownloadFolderPath;

  const [domError, setDomError] = useState<Event | undefined>();
  const [loading, setLoading] = useState<boolean>();

  const didFailLoadListener = useCallback((event: Event) => {
    subtitleSiteRef.current.removeEventListener(
      "dom-ready",
      subtitleSiteDomListenerRef.current
    );
    console.error("Failed to load:", event);
    setDomError(event)
    setLoading(false)
  }, []);


  useEffect(() => {
    if (!subtitleDomStatus) {
      return;
    }

    const subtitleSiteDom = subtitleSiteRef.current;
    let evtExcuted = false;

    // get currentIndex =============
    const allStatus = Object.keys(
      subtitleDomExecuteJsMap
    ) as string[];
    const curStatusIndex = allStatus.findIndex(
      (item) => item === subtitleDomStatus
    );

    if (curStatusIndex === 0) {
      setLoading(true)
      setDomError(undefined);
    }

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

      setLoading(true)
      evtExcuted = true;
      const appendArgs: any[] = [];

      // `finnalDownloadPage` downloadFileByRequest = true
      if (subtitleDomStatus === 'finnalDownloadPage' && (downloadToFolderDirectly && (mergedFilePath  || defaultDownloadFolderPath))) {
        appendArgs.push(true)
      }

      // add more args from appendArgsMap ===================
      const curAppendArgs = appendArgsMap[subtitleDomStatus] || [];

      subtitleDomExecuteJsMap[subtitleDomStatus](subtitleSiteRef.current, ...appendArgs, ...curAppendArgs)
          .then((res) => {
            console.log(`${subtitleDomStatus} res: `, res);

            evtCallback?.[subtitleDomStatus]?.(res); // 调用当前页面的回调

            // 流转下一个页面 =========================
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
            removeAllListener();
            console.log(`${subtitleDomStatus} err: `, err);
            if (err) {
              setDomError(err);
              setLoading(false)
            }
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
    }, 2000);

    return removeAllListener;
  }, [subtitleDomStatus]);

  return {
    setSubtitleDomStatus: setSubtitleDomStatus as Dispatch<SetStateAction<keyof T>>,
    subtitleDomStatus: subtitleDomStatus as keyof T,
    subtitleSiteRef,
    domError,
    loading
  }
}