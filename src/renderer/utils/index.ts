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