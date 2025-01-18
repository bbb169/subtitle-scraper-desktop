import { useEffect, useMemo, useState } from "react";
import { stringify } from "qs";
import SubtitleSiteRender from "./components/subtitleSiteRender";
import { Form, Input, message, Radio, Space } from "antd";
import FileDragger from "./components/fileDragger";
import { useRequest } from "ahooks";
import useFileInfoStore from "./store/fileInfo";
import useUserSettingfoStore from "./store/userSetting";
import Dragger from "antd/es/upload/Dragger";
import { getEnumOptions } from "./utils";
import { subtitleSourceEnum, subtitleSourceMap } from "./utils/constant";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Search } = Input;

export default function () {
  const [form] = Form.useForm();
  const [searchValue, setSearchValue] = useState<string>("");

  const { resolvedFileName, fileDetailPageUrl } = useFileInfoStore();
  const {
    defaultDownloadFolderPath,
    downloadToFolderDirectly,
    setUserSettingfo,
  } = useUserSettingfoStore();
  const { mutate: searchSubtitleSync, data: mergedSearchValue } = useRequest(
    async (value?: string) => {
      return value || searchValue;
    },
    {
      debounceWait: 1000,
      refreshDeps: [searchValue],
    }
  );

  useEffect(() => {
    setSearchValue(resolvedFileName);
    searchSubtitleSync(resolvedFileName);
  }, [resolvedFileName]);

  const subtitleOptions = useMemo(() => getEnumOptions(subtitleSourceMap), []);
  const subtitleSource = Form.useWatch("subtitleSource", form);

  return (
    <Form form={form}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Search
          placeholder="输入您要搜索的字幕"
          value={searchValue}
          onChange={(evt) => {
            setSearchValue(evt.target.value);
          }}
          onSearch={(value) => {
            if (mergedSearchValue === value) {
              searchSubtitleSync();
              setTimeout(() => {
                searchSubtitleSync(value);
              }, 1000);
            } else {
              searchSubtitleSync(value);
            }
          }}
          enterButton
        />
        <FileDragger />
        <Form.Item key="downloadToFolderDirectly" label="不询问直接下载字幕">
          <Radio.Group
            block
            options={[
              { label: "是", value: true },
              { label: "否", value: false },
            ]}
            value={downloadToFolderDirectly}
            onChange={(e) =>
              setUserSettingfo({ downloadToFolderDirectly: e.target.value })
            }
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>
        <Form.Item
          key="defaultDownloadFolderPath"
          label="直接下载字幕默认目录路径"
        >
          <Dragger
            {...{
              directory: true,
              style: { position: "relative" },
            }}
          >
            <div
              style={{ width: "100%", height: "100%", position: "absolute" }}
              onClick={(evt) => {
                window.api
                  .openDirectory()
                  .then((res) => {
                    if (!res.canceled) {
                      const dirPath = res.filePaths[0];

                      setUserSettingfo({ defaultDownloadFolderPath: dirPath });
                    }
                  })
                  .catch((err) => {
                    message.error(`选择失败： ${JSON.stringify(err)}`);
                  });
                evt.stopPropagation();
              }}
            ></div>
            浏览或拖拽目录 当前默认路径：{defaultDownloadFolderPath}
          </Dragger>
        </Form.Item>
        {fileDetailPageUrl && (
          <Form.Item key="subtitleDetailLink" label="字幕详情页网址">
            <a href={fileDetailPageUrl} target="_blank">
              {fileDetailPageUrl}
            </a>
          </Form.Item>
        )}
        <Form.Item
          key="subtitleSource"
          label="字幕来源"
          initialValue={subtitleSourceEnum.zimuku}
        >
          <Radio.Group
            block
            options={subtitleOptions}
            value={downloadToFolderDirectly}
            onChange={(e) =>
              setUserSettingfo({ downloadToFolderDirectly: e.target.value })
            }
            optionType="button"
            buttonStyle="solid"
          />
        </Form.Item>
        {subtitleSource === subtitleSourceEnum.zimuku ? (
          <>
            {mergedSearchValue && (
              <SubtitleSiteRender
                src={`https://so.zimuku.org/search?${stringify({
                  q: mergedSearchValue,
                  chost: "zimuku.org",
                })}`}
              />
            )}
          </>
        ) : (
          <>
            {mergedSearchValue && (
              <SubtitleSiteRender
                src={`https://so.zimuku.org/search?${stringify({
                  q: mergedSearchValue,
                  chost: "zimuku.org",
                })}`}
              />
            )}
          </>
        )}
      </Space>
    </Form>
  );
}
