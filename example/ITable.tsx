import React from 'react';
import { delay } from 'lodash';

import { ITable } from '../lib';
import { Operators } from '../lib/Filter';

export default function Demo() {
  const fetch = async ({ page, sort }: { page: number; sort: [string | number, string][] }) => {
    await new Promise(res => delay(res, 1000));

    return {
      total: 3,
      data: [...new Array(50)].map((_, idx) => ({
        id: `00${idx}`,
        name: idx,
        sex: '男',
        tag: 1,
        age: 18,
      })),
    };
  };

  return (
    <ITable
      name="测试"
      fetch={fetch}
      rowKey="id"
      actions={[
        {
          text: '测试',
          action: selectedRows => {
            console.log(selectedRows);
          },
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
          type: 'input',
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
          title: '年龄',
          dataIndex: 'age',
          dataFormat: 'number',
          width: 80,
        },
        {
          title: '标签',
          dataIndex: 'tag',
          type: 'multi-select',
          operators: [Operators.BETWEEN],
          sortable: false,
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
