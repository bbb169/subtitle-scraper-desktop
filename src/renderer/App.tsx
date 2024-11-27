import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { stringify } from 'qs';
import SubtitleSiteRender from './components/subtitleSiteRender'
import { Button, Input, Space } from 'antd';
import { debounce }  from 'lodash';
import FileDragger from './components/fileDragger';
import { useRequest } from 'ahooks';
const { Search } = Input;

export default function () {
  const [searchValue, setSearchValue] = useState<string>('');
  console.log('searchValue: ', searchValue);

  const { data: searchSubtitleValue, run: searchSubtitle, mutate: searchSubtitleSync } = useRequest(async (value?: string) => {
    return value || searchValue;
  }, {
    debounceWait: 1000,
    refreshDeps: [searchValue]
  })


  return <Space direction='vertical' style={{ width: '100%' }}>
    <Search placeholder="输入您要搜索的字幕" value={searchValue} onChange={(evt) => {
      setSearchValue(evt.target.value);
    }} onSearch={(value) => {
      searchSubtitleSync(value)
    }} enterButton />
    <FileDragger onFilenameHandled={(value) => {
      setSearchValue(value);
      searchSubtitleSync(value);
    }} />
    {searchSubtitleValue}
    {searchValue && <SubtitleSiteRender src={`https://so.zimuku.org/search?${stringify({
      q: searchValue,
      chost: 'zimuku.org',
    })}`}/>}
    <Button onClick={() => { window.api.openUploadDialog().then(res => {
      console.log('res: ', res.filePaths[0]);
      const fullPath = res.filePaths[0];
      const pathNodes = fullPath.split('\\');
      const fileName = pathNodes?.[pathNodes.length - 1] || '';
      console.log('fileName: ', fileName);
    }) }}>打开系统上传</Button>
  </Space>
}