import React, { useEffect, useState } from 'react'
import { stringify } from 'qs';
import SubtitleSiteRender from './components/subtitleSiteRender'
import { Button, Input, Space } from 'antd';
import FileDragger from './components/fileDragger';
import { useRequest } from 'ahooks';
import useFileInfoStore from './store/fileInfo';
const { Search } = Input;

export default function () {
  const [searchValue, setSearchValue] = useState<string>('');
  console.log('searchValue: ', searchValue);

  const { resolvedFileName } = useFileInfoStore();
  const { data: searchSubtitleValue, mutate: searchSubtitleSync } = useRequest(async (value?: string) => {
    return value || searchValue;
  }, {
    debounceWait: 1000,
    refreshDeps: [searchValue]
  })

  useEffect(() => {
    setSearchValue(resolvedFileName);
    searchSubtitleSync(resolvedFileName);
  }, [resolvedFileName])


  return <Space direction='vertical' style={{ width: '100%' }}>
    <Search placeholder="输入您要搜索的字幕" value={searchValue} onChange={(evt) => {
      setSearchValue(evt.target.value);
    }} onSearch={(value) => {
      searchSubtitleSync(value)
    }} enterButton />
    <FileDragger />
    {searchSubtitleValue}
    {searchValue && <SubtitleSiteRender src={`https://so.zimuku.org/search?${stringify({
      q: searchValue,
      chost: 'zimuku.org',
    })}`}/>}
    <Button onClick={() => { window.api.openUploadDialog().then(res => {
      console.log('res: ', res);
      const fullPath = res.filePaths[0];
      const pathNodes = fullPath.split('\\');
      const fileName = pathNodes?.[pathNodes.length - 1] || '';
      console.log('fileName: ', fileName);
    }) }}>打开系统上传</Button>
    <input name="file" type="file" accept="" ></input>
  </Space>
}