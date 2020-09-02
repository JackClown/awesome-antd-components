import React from 'react';
import { Checkbox, Tooltip, Space } from 'antd';
import {
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';

import Popup from '../Popup';
import Table from '../Table/Table';

export type ColumnPlan = {
  key: string | number;
  visible: boolean;
  width?: number | string;
  title?: string;
}[];

interface Props {
  value?: ColumnPlan;
  onChange: (value?: ColumnPlan) => void;
}

function Customize(props: Props) {
  const { value = [], onChange } = props;

  let checked = 0;

  value.forEach(item => {
    if (item.visible) {
      checked += 1;
    }
  });

  const handleChangeVisible = (visible: boolean, index: number) => {
    const nextValue = [...value];

    nextValue[index] = {
      ...nextValue[index],
      visible,
    };

    onChange(nextValue);
  };

  const handleTop = (index: number) => {
    if (index === 0) {
      return;
    }

    const nextValue = [...value];

    const [item] = nextValue.splice(index, 1);

    nextValue.unshift(item);

    onChange(nextValue);
  };

  const handleUp = (index: number) => {
    if (index === 0) {
      return;
    }

    const nextValue = [...value];
    const des = index - 1;
    const temp = nextValue[index];

    nextValue[index] = nextValue[des];
    nextValue[des] = temp;

    onChange(nextValue);
  };

  const handleDown = (index: number) => {
    if (index === value.length - 1) {
      return;
    }

    const nextValue = [...value];
    const des = index + 1;
    const temp = nextValue[index];

    nextValue[index] = nextValue[des];
    nextValue[des] = temp;

    onChange(nextValue);
  };

  const handleBottom = (index: number) => {
    if (index === value.length - 1) {
      return;
    }

    const nextValue = [...value];

    const [item] = nextValue.splice(index, 1);

    nextValue.push(item);

    onChange(nextValue);
  };

  const handleToggle = (e: CheckboxChangeEvent) => {
    const flag = e.target.checked;
    let nextValue;

    if (flag) {
      nextValue = value.map(item => ({ ...item, visible: true }));
    } else {
      nextValue = value.map(item => ({ ...item, visible: false }));
    }

    onChange(nextValue);
  };

  return (
    <Table
      dataSource={value}
      rowKey="key"
      columns={[
        {
          title: (
            <Checkbox
              checked={checked === value.length}
              indeterminate={checked > 0 && checked < value.length}
              onChange={handleToggle}
            />
          ),
          render: (_, record, index) => {
            return (
              <Checkbox
                checked={record.visible}
                onChange={e => handleChangeVisible(e.target.checked, index)}
              />
            );
          },
          align: 'center',
          width: 40,
        },
        {
          title: '列名',
          dataIndex: 'title',
          width: 300,
        },
        {
          title: '排序',
          width: 300,
          render: (_1, _2, index) => {
            return (
              <Space>
                <VerticalAlignTopOutlined
                  className="itable-toolbar-icon"
                  onClick={() => handleTop(index)}
                />
                <ArrowUpOutlined className="itable-toolbar-icon" onClick={() => handleUp(index)} />
                <ArrowDownOutlined
                  className="itable-toolbar-icon"
                  onClick={() => handleDown(index)}
                />
                <VerticalAlignBottomOutlined
                  className="itable-toolbar-icon"
                  onClick={() => handleBottom(index)}
                />
              </Space>
            );
          },
        },
      ]}
    />
  );
}

export default function CustomizeColumn(props: Props) {
  return (
    <Popup
      title="列设置"
      {...props}
      showLabel={false}
      component={popProps => <Customize {...popProps} />}
    >
      <Tooltip title="列设置">
        <SettingOutlined className="itable-toolbar-icon" />
      </Tooltip>
    </Popup>
  );
}
