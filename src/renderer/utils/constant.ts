import { stringify } from "qs";

export const enum subtitleSourceEnum {
  zimuku = "zimuku",
  tang = "98tang",
}

export const subtitleSourceMap = new Map([
  [subtitleSourceEnum.zimuku, "字幕库"],
  [subtitleSourceEnum.tang, "大堂"],
]);

export const getSubtitleAddressMap = {
  [subtitleSourceEnum.zimuku]: (mergedSearchValue: string) =>
    `https://so.zimuku.org/search?${stringify({
      q: mergedSearchValue,
      chost: "zimuku.org",
    })}`,
  [subtitleSourceEnum.tang]: (value: string) =>
    `https://www.sehuatang.net/search.php?mod=forum&searchid=0&searchmd5=5c95cc6125347931c90bed8fdcf1135e&orderby=lastpost&ascdesc=desc&searchsubmit=yes&${stringify(
      {
        kw: `【自提】 ${value}`,
      }
    )}`,
};