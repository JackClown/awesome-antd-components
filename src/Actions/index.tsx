import React, { CSSProperties } from 'react';
import { Space, Dropdown, Menu, Button } from 'antd';
import classNames from 'classnames';

import Down from '../Filter/Down';
import './index.less';

interface Props<T extends Function> {
  actions: {
    text: string;
    action?: T;
    disabled?: boolean;
    dropDown?: {
      text: string;
      onClick: T;
      disabled?: boolean;
    }[];
  }[];
  className?: string;
  style?: CSSProperties;
}

function Actions<T>(props: Props<(payload: T) => void> & { payload: T }): JSX.Element;

function Actions(props: Props<() => void>): JSX.Element;

function Actions<T>(props: Props<(payload?: T) => void> & { payload?: T }) {
  const { actions, payload, className, style } = props;

  return (
    <div className={classNames('actions', className)} style={style}>
      <Space direction="horizontal">
        {actions.map(item => {
          const { disabled } = item;

          return Array.isArray(item.dropDown) ? (
            <Dropdown
              key={item.text}
              disabled={disabled}
              overlay={
                <Menu>
                  {item.dropDown.map(item => (
                    <Menu.Item
                      onClick={() => item.onClick(payload)}
                      key={item.text}
                      disabled={item.disabled}
                    >
                      {item.text}
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Button disabled={disabled}>
                {item.text}
                <Down />
              </Button>
            </Dropdown>
          ) : (
            <Button key={item.text} disabled={disabled} onClick={() => item.action?.(payload)}>
              {item.text}
            </Button>
          );
        })}
      </Space>
    </div>
  );
}

export default Actions;
