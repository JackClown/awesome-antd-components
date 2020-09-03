import React, { useRef, useMemo, ReactText } from 'react';
import { Input, Button, Checkbox, DatePicker, Select } from 'antd';
import moment, { Moment } from 'moment';

import { Section, Layout, Actions, Popup, Form, FormTable } from '../lib';
import { Store, ColumnType } from '../lib/FormTable';

export default function Demo() {
  const [form] = Form.useForm();

  const initialValue = {
    username: 'test',
    password: '1234134',
    age: 14,
    sex: 1,
    remember: true,
    birth: moment('2020-07-01', 'YYYY-MM-DD'),
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      console.log(values);
    } catch (err) {
      console.log(err);
    }
  };

  const id = useRef(0);

  const data = useMemo(
    () =>
      [...new Array(10)].map(() => {
        id.current += 1;

        return {
          id: id.current,
          out_app_type: '',
          create_time: moment('2020-02-03 12:00:00', 'YYYY-MM-DD HH:mm:ss'),
          type: '企业',
          name: '测试',
          enable: true,
          description: '',
        };
      }),
    [],
  );

  const columns = useMemo(() => {
    return [
      {
        title: '往来单位编号',
        dataIndex: 'id',
        width: 200,
      },
      {
        title: '往来单位来源',
        dataIndex: 'out_app_type',
        formItem: {
          rules: [
            {
              required: true,
            },
          ],
          children: <Input autoComplete="off" />,
        },
      },
      {
        title: '日期',
        dataIndex: 'create_time',
        dataFormat: 'datetime',
        formItem: {
          children: <DatePicker showTime />,
          rules: [
            {
              required: true,
            },
          ],
        },
        render: (value: Moment | null) => (value ? value.format('YYYY-MM-DD HH:mm:ss') : null),
      },
      {
        title: '往来单位类型',
        dataIndex: 'type',
        formItem: {
          children: (
            <Select
              showSearch
              options={[
                {
                  label: '企业',
                  value: '企业',
                },
                {
                  label: '单位',
                  value: '单位',
                },
              ]}
            />
          ),
        },
      },
      {
        title: '启用状态',
        dataIndex: 'enable',
        formItem: {
          valuePropName: 'checked',
          persist: true,
          children: <input type="checkbox" />,
        },
      },
      {
        title: '描述',
        dataIndex: 'description',
        formItem: {
          children: <Input />,
        },
      },
    ] as ColumnType<any>[];
  }, []);

  const store = useRef<Store<any>>(null);

  const handleSave = async () => {
    if (!store.current) {
      return;
    }

    try {
      await store.current.getData();
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = () => {
    id.current += 1;

    store.current?.add({
      id: id.current,
      out_app_type: '',
      create_time: moment('2020-02-03 12:00:00', 'YYYY-MM-DD HH:mm:ss'),
      type: '企业',
      name: '测试',
      enable: true,
      description: '',
    });
  };

  const selectedRows = useRef<ReactText[]>([]);

  const handleDelete = () => {
    if (store.current) {
      store.current.remove(...selectedRows.current);
      selectedRows.current = [];
    }
  };

  return (
    <Layout style={{ backgroundColor: '#F4F4F4' }}>
      <Actions
        actions={[
          {
            text: '保存',
            action: submit,
          },
          {
            text: '下拉菜单',
            dropDown: [
              {
                text: '菜单1',
                onClick: () => {
                  alert('hello world');
                },
              },
              {
                text: '菜单2',
                onClick: () => {},
              },
            ],
          },
        ]}
      />
      <Section title="基本">
        <Form form={form} initialValues={initialValue}>
          <Form.Item label="Username" name="username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Br />
          <Form.Item label="Sex" name="sex" rules={[{ required: true }]}>
            <Popup<number>
              title="Popup"
              disabled
              formatLabel={val => val.toString()}
              component={props => <Button onClick={() => props.onChange(1)}>hello world</Button>}
            />
          </Form.Item>
          <Form.Item label="Remember" name="remember" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Br />
          <Form.Item label="Eyes" name="eyes">
            <Select
              options={[
                {
                  label: '1',
                  value: '1',
                },
                {
                  label: '2',
                  value: '2',
                },
              ]}
            />
          </Form.Item>
          <Form.Br />
          <Form.Item label="Notes" name="notes" colSpan={24}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Section>
      <Section title="中间">
        <Form name="middle" form={form} initialValues={initialValue}>
          <Form.Item label="Age" name="age" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Birth" name="birth" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
        </Form>
      </Section>
      <Section type="table" title="表格">
        <Actions
          style={{ paddingTop: 0 }}
          actions={[
            {
              text: '保存',
              action: handleSave,
            },
            {
              text: '新增',
              action: handleAdd,
            },
            {
              text: '删除',
              action: handleDelete,
            },
          ]}
        />
        <FormTable
          rowKey="id"
          storeRef={store}
          dataSource={data}
          onValuesChange={changedValues => {
            if (!('out_app_type' in changedValues)) {
              return {};
            }

            return {
              description: changedValues.out_app_type,
            };
          }}
          rowSelection={{
            onChange: rows => {
              selectedRows.current = rows;
              console.log(selectedRows);
            },
          }}
          columns={columns}
        />
      </Section>
    </Layout>
  );
}
