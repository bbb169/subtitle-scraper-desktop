import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { stringify } from 'qs';
import SubtitleSiteRender from './components/subtitleSiteRender'

export default function () {

  return <div>
    <div>2132</div>
    <SubtitleSiteRender src={`http://so.zimuku.org/search?${stringify({
      q: '金刚狼',
      chost: 'zimuku.org',
    })}`}/>
  </div>
}