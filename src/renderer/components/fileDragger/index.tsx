import React, { useEffect, useState } from 'react';
import { CopyOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Space, Upload } from 'antd';
import { copyToClipboard } from '../../utils/handleDom';
import useFileInfoStore from '../../store/fileInfo';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { webUtils } = require('electron');

const { Dragger } = Upload;

export default function(props: UploadProps) {
  const { setFileInfo } = useFileInfoStore();
  
  return <Dragger {...{
      multiple: true,
      showUploadList: {
        extra: (file) => <Button size='small' style={{ marginLeft: 8 }} type='text' onClick={() => { copyToClipboard(file.name) }} icon={<CopyOutlined />} />
      },
      customRequest({ file, onError, onProgress, onSuccess }) {
        console.log('file: ', file,  webUtils.getPathForFile(file as any));
       
        const filename = (file as any).name || '' as string;
        onProgress({ percent: 50 })
        
        let validContentTimes = 0;

        setFileInfo({
          resolvedFileName: filename.split(/[^\u4e00-\u9fa5a-zA-Z]+/).reduce((preValue: string, curValue: string) => {
            // only collect two valid content in filename
            if (curValue && validContentTimes < 2) {
              validContentTimes++
              return preValue + ' ' + curValue; 
            }
            return preValue
          }, ''),
          filePath
        })
        if (filename) {
          onSuccess(filename)
        } else {
          onError(new Error('未获取到文件名'))
        }
      },
      ...otherProps,
    }}>
    <p className="ant-upload-drag-icon">
      <VideoCameraAddOutlined />
    </p>
    <p className="ant-upload-text">点击或拖拽视频文件到此处</p>
    <p className="ant-upload-hint">
      将自动识别您的文件名称以搜寻匹配字幕
    </p>
  </Dragger>
}