import React, { ReactNode, CSSProperties } from 'react';
import classNames from 'classnames';

import './index.less';

interface Props {
  title?: string | ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  footer?: ReactNode;
  type?: 'table';
}

export default function Section(props: Props) {
  const { title, children, footer, style, className, type } = props;

  return (
    <div
      className={classNames('section', type === 'table' ? 'table-section' : '', className)}
      style={style}
    >
      {!!title && <div className="section-header">{title}</div>}
      {!!children && <div className="section-body">{children}</div>}
      {!!footer && <div className="section-footer">{footer}</div>}
    </div>
  );
}
