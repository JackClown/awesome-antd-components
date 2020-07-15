import React, { ReactNode, CSSProperties } from 'react';
import classNames from 'classnames';

import './index.less';

interface Props {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function Layout(props: Props) {
  const { className, style, children } = props;

  return (
    <div className={classNames('layout', className)} style={style}>
      {children}
    </div>
  );
}
