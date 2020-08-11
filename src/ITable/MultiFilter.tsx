import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Modal, Form, Button, Input, message } from 'antd';

import Filter, { TagValue, Props as FilterProps } from '../Filter';
import './index.less';

export interface Plan {
  id?: string | number;
  name: string;
  value: TagValue<any>[];
}

export interface Storage {
  removeItem: (name: string) => void;
  setItem: (plan: Plan) => void;
}

export interface Props<T> extends FilterProps<T> {
  filters: Plan[];
  onSave: (filter: Plan, filters: Plan[]) => void;
  onDelete: (fitler: Plan, filters: Plan[]) => void;
  multiple: boolean;
}

export const DEFUALT_FILTER_NAME = '默认';

export default function MultiFilter<T extends string = string>(props: Props<T>) {
  const { value, onSubmit, filters = [], onSave, onDelete, multiple, ...restProps } = props;

  const [state, setState] = useState({
    active: DEFUALT_FILTER_NAME,
    visible: false,
  });

  const [form] = Form.useForm();

  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const toggleModal = () => {
    setState(prev => ({
      ...prev,
      visible: !prev.visible,
    }));
  };

  const handleChange = (value: TagValue<any>[]) => {
    valueRef.current = value;
  };

  const handleClickPlan = (plan: Plan) => {
    setState(prev => ({
      ...prev,
      active: plan.name,
    }));

    if (onSubmit) {
      onSubmit(plan.value);
    }
  };

  const handleAddPlan = () => {
    if (filters.length > 6) {
      message.warning('查询方案总数不可超过6个');
      return;
    }

    if (valueRef.current.length <= 0) {
      message.warning('请先添加查询条件');
      return;
    }

    form.resetFields();

    toggleModal();
  };

  const handleSavePlan = async () => {
    try {
      const { name } = await form.validateFields();

      const filter = {
        name,
        value: valueRef.current,
      };

      onSave(filter, [...filters, filter]);

      if (valueRef.current !== value && onSubmit !== undefined) {
        onSubmit(valueRef.current);
      }

      setState({
        active: name,
        visible: false,
      });
    } catch (err) {
      // noop
    }
  };

  const handleRemovePlan = () => {
    const index = filters.findIndex(item => item.name === state.active);

    if (index >= 0) {
      Modal.confirm({
        title: '提示',
        content: `确认删除${filters[index].name}？`,
        maskClosable: true,
        width: 300,
        onOk: () => {
          const nextFilters = [...filters];

          nextFilters.splice(index, 1);

          onDelete(filters[index], nextFilters);

          setState(prev => ({
            ...prev,
            active: DEFUALT_FILTER_NAME,
          }));
        },
      });
    }
  };

  return (
    <>
      <Modal
        destroyOnClose
        visible={state.visible}
        onCancel={toggleModal}
        onOk={handleSavePlan}
        title="保存方案"
        width={300}
      >
        <Form
          form={form}
          initialValues={{
            name: '',
          }}
        >
          <Form.Item
            label="方案名称"
            name="name"
            rules={[
              {
                required: true,
              },
              {
                validator: (rule, value) => {
                  let flag = false;

                  for (const plan of filters) {
                    if (plan.name === value) {
                      flag = true;
                      break;
                    }
                  }

                  if (flag) {
                    return Promise.reject(new Error('方案名称已存在'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
      <div className="filter-plan">
        {filters.map(item => (
          <div
            className={classNames(
              'filter-plan-item',
              item.name === state.active ? 'filter-plan-item-active' : '',
            )}
            key={item.name}
            onClick={() => handleClickPlan(item)}
          >
            {item.name}
          </div>
        ))}
      </div>
      <Filter
        value={value}
        onSubmit={onSubmit}
        {...restProps}
        onChange={handleChange}
        extra={
          multiple && (
            <>
              <Button onClick={handleAddPlan}>保存方案</Button>
              <Button
                type="primary"
                danger
                onClick={handleRemovePlan}
                disabled={state.active === DEFUALT_FILTER_NAME}
              >
                删除方案
              </Button>
            </>
          )
        }
      />
    </>
  );
}
