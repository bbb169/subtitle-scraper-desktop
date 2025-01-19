import { CheckboxOptionType } from "antd";
import { ReactNode } from "react";

export const tryCathWrapper = async (
  callback: () => Promise<any>,
  customPrefix = "tryCathWrapper error: "
) => {
  try {
    return await callback();
  } catch (error) {
    console.log(customPrefix, error);
  }
};

export const getEnumOptions = <K extends string | number, V extends ReactNode>(map: Map<K, V>)  => {
  const options: CheckboxOptionType[] = [];

  for (const [key, value] of map) {
    options.push({
      label: value,
      value: key,
    })
  }

  return options
}



export const domNavigateing = (subtitleSiteDom: HTMLWebViewElement) => {
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

export const webviewExcuteJsPromiseWrapprer = <T,>(
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