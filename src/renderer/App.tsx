import React, { useEffect, useState } from 'react'
import { stringify } from 'qs';
import SubtitleSiteRender from './components/subtitleSiteRender'
import { Input, Space } from 'antd';
import FileDragger from './components/fileDragger';
import { useRequest } from 'ahooks';
import useFileInfoStore from './store/fileInfo';
const { Search } = Input;

export default function () {
  const [searchValue, setSearchValue] = useState<string>('');

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
  </Space>
}