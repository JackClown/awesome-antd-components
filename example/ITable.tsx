import React from 'react';

import { ITable } from '../lib';
import { Operators } from '../lib/Filter';
import { Button } from 'antd';

export default function Demo() {
  const fetch = () => {
    return Promise.resolve({
      total: 3,
      data: [
        {
          id: '001',
          name: '张三',
          sex: '男',
          tag: 1,
        },
        {
          id: '002',
          name: '李四',
          sex: '男',
          tag: 2,
        },
        {
          id: '003',
          name: '赵五',
          sex: '男',
          tag: 3,
        },
      ],
    });
  };

  return (
    <ITable
      fetch={fetch}
      rowKey="id"
      actions={[
        {
          text: '测试',
          action: () => {},
          useSelected: true,
        },
      ]}
      columns={[
        {
          title: '序号',
          dataIndex: 'id',
        },
        {
          title: '名称',
          dataIndex: 'name',
          operators: [Operators.EQUAL],
          type: 'popup',
          popup: {
            formatLabel: value => value,
            component: props => <Button onClick={() => props.onChange(1)}>hello world</Button>,
          },
        },
        {
          title: '性别',
          dataIndex: 'sex',
          type: 'select',
          operators: [Operators.EQUAL],
          enums: [
            {
              label: '男',
              value: '男',
            },
            {
              label: '女',
              value: '女',
            },
          ],
        },
        {
          title: '标签',
          dataIndex: 'tag',
          type: 'multi-select',
          operators: [Operators.BETWEEN],
          enums: [
            {
              label: '金',
              value: 1,
            },
            {
              label: '木',
              value: 2,
            },
            {
              label: '水',
              value: 3,
            },
            {
              label: '火',
              value: 4,
            },
            {
              label: '土',
              value: 5,
            },
          ],
        },
      ]}
    />
  );
}
