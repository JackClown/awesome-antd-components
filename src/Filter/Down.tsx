import React from 'react';
import Icon from '@ant-design/icons';

const DownSvg = () => (
  <svg
    viewBox="0 0 1024 1024"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
  >
    <path
      d="M512 626.816l270.336-247.808a30.976 30.976 0 0 1 41.152 0 25.152 25.152 0 0 1 0 37.76L532.48 683.328a30.976 30.976 0 0 1-41.088 0L200.512 416.704a25.152 25.152 0 0 1 0-37.696 30.976 30.976 0 0 1 41.152 0L512 626.816z"
      fillOpacity="1"
      fill="currentColor"
      p-id="3445"
    />
  </svg>
);

export default function Down(props: any) {
  return <Icon style={{ pointerEvents: 'none' }} component={DownSvg} {...props} />;
}
