import React, { useMemo, useState, ReactNode, useEffect, memo } from 'react';
import { Select, Input, DatePicker, Button, Tag } from 'antd';
import moment from 'moment';

import { useDeepCompareMemoize } from '../hooks';
import Popup, { PopupProps } from '../Popup';
import Down from './Down';
import './index.less';

export enum Operators {
  IN = 'EQUAL',
  NOT_IN = 'NOT_EQUAL',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  LIKE = 'LIKE',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_EQUAL = 'LESS_THAN_EQUAL',
  MORE_THAN = 'MORE_THAN',
  MORE_THAN_EQUAL = 'MORE_THAN_EQUAL',
  BETWEEN = 'BETWEEN',
}

export enum OperatorLabels {
  IN = '是',
  NOT_IN = '不是',
  EQUAL = '是',
  NOT_EQUAL = '不是',
  LIKE = '包含',
  LESS_THAN = '小于',
  LESS_THAN_EQUAL = '小于等于',
  MORE_THAN = '大于',
  MORE_THAN_EQUAL = '大于等于',
  BETWEEN = '范围',
}

export type FormType =
  | 'input'
  | 'select'
  | 'multi-select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'popup';

export interface LabeledValue<T = string | number> {
  value: T;
  label: string;
}

export interface Option<T = string> {
  field: T;
  type: FormType;
  label: string;
  operators: Operators[];
  hideOperators?: boolean;
  enums?: LabeledValue[];
  popup?: Omit<PopupProps<any>, 'value' | 'onChange' | 'children'>;
  required?: boolean;
  format?: string;
}

export interface TagValue<T = string> {
  field: T;
  operator: Operators;
  value: Value;
}

type Value = string | number | (string | number)[] | any;

type OptionValue = [Operators, Value | undefined];

interface State {
  [field: string]: OptionValue | undefined;
}

export interface Props<T> {
  options: Option<T>[];
  value: TagValue<T>[];
  onChange?: (value: TagValue<T>[]) => void;
  onSubmit?: (value: TagValue<T>[]) => void;
  groupBy?: (item: Option<T>) => string;
  extra?: ReactNode;
}

function Filter<T extends string = string>(props: Props<T>) {
  const {
    options,
    value,
    onChange,
    onSubmit,
    groupBy = (item: Option<T>): string => {
      if (item.type === 'date') {
        return 'date';
      }

      return 'normal';
    },
    extra,
  } = props;

  const memoizedOptions = useDeepCompareMemoize(options);

  const [groups, defaultGroupsState, defaultState, fieldOptionMap] = useMemo(() => {
    const groups: Map<string, Option<T>[]> = new Map();
    const defaultGroupsState: { [key: string]: T } = {};
    const defaultState: State = {};
    const fieldOptionMap: { [field: string]: Option<T> } = {};

    options.forEach(option => {
      const key = groupBy(option);

      let group = groups.get(key);

      if (group === undefined) {
        group = [];
      }

      group.push(option);

      groups.set(key, group);

      const optionValue = value.find(item => item.field === option.field);

      if (optionValue !== undefined && option.required) {
        defaultState[option.field] = [optionValue.operator, optionValue.value];
      } else {
        defaultState[option.field] = [option.operators[0], undefined];
      }

      fieldOptionMap[option.field] = option;
    });

    for (const [key, item] of groups) {
      defaultGroupsState[key] = item[0].field;
    }

    const sortedGroups = [...groups];

    sortedGroups.sort((a, b) => {
      if (a[0] < b[0]) {
        return -1;
      }

      if (a[0] > b[0]) {
        return 1;
      }

      return 0;
    });

    return [new Map(sortedGroups), defaultGroupsState, defaultState, fieldOptionMap];
  }, [memoizedOptions]);

  const [groupsState, setGroupsState] = useState(defaultGroupsState);

  const [state, setState] = useState(defaultState);

  const [tags, setTags] = useState(value || []);

  useEffect(() => {
    setTags(value);

    if (value !== tags) {
      const nextState: State = {};

      value.forEach(item => {
        nextState[item.field] = [item.operator, item.value];
      });

      setState(nextState);
    }
  }, [value]);

  useEffect(() => {
    setGroupsState(defaultGroupsState);
    setState(defaultState);
  }, [memoizedOptions]);

  const changeTags = (tags: TagValue<T>[]) => {
    setTags(tags);

    if (onChange) {
      onChange(tags);
    }
  };

  const handleChangeField = (groupKey: string, field: T) => {
    setGroupsState(prev => ({
      ...prev,
      [groupKey]: field,
    }));
  };

  const handleChangeOperator = (key: string, val: any) => {
    setState(prev => {
      const prevValue = prev[key];

      if (prevValue === undefined) {
        return {
          ...prev,
          [key]: [val, undefined],
        };
      }

      return {
        ...prev,
        [key]: [val, prevValue[1]],
      };
    });
  };

  const handleChangeValue = (key: string, val: any) => {
    setState(prev => {
      const option = fieldOptionMap[key];

      if (option === undefined) {
        return prev;
      }

      const prevValue = prev[key];
      const fieldValue = val ?? undefined;

      if (prevValue === undefined) {
        return {
          ...prev,
          [key]: [option.operators[0], fieldValue],
        };
      }

      return {
        ...prev,
        [key]: [prevValue[0], fieldValue],
      };
    });
  };

  const handleDeleteTag = (tag: TagValue<T>) => {
    let index = tags.findIndex(item => item.field === tag.field);

    if (index >= 0) {
      const nextTags = [...tags];

      nextTags.splice(index, 1);

      changeTags(nextTags);

      index = value.findIndex(item => item.field === tag.field);

      if (onSubmit && index >= 0) {
        onSubmit(nextTags);
      }
    }
  };

  const handleClickTag = (tag: TagValue<T>) => {
    const option = options.find(item => item.field === tag.field);

    if (option === undefined) {
      return;
    }

    const groupKey = groupBy(option);

    setGroupsState(prev => ({
      ...prev,
      [groupKey]: option.field,
    }));

    setState(prev => ({
      ...prev,
      [tag.field]: [tag.operator, tag.value],
    }));
  };

  const getNextTags = () => {
    const activeFields: T[] = [];

    for (const key in groupsState) {
      if (groupsState[key] !== undefined) {
        activeFields.push(groupsState[key]);
      }
    }

    const nextTags = [...tags];

    activeFields.forEach(field => {
      const option = fieldOptionMap[field];

      if (!option) {
        return;
      }

      const value = state[field];

      if (value !== undefined) {
        const val = value[1];
        const index = nextTags.findIndex(item => item.field === field);

        if (val !== '' && val !== undefined && val !== null) {
          const tag = {
            field,
            operator: value[0],
            value: value[1],
          };

          if (index >= 0) {
            nextTags[index] = tag;
          } else {
            nextTags.push(tag);
          }
        } else if (!option.required) {
          if (index >= 0) {
            nextTags.splice(index, 1);
          }
        }
      }
    });

    return nextTags;
  };

  const handleAdd = () => {
    const nextTags = getNextTags();

    changeTags(nextTags);
  };

  const handleSubmit = () => {
    const nextTags = getNextTags();

    changeTags(nextTags);

    if (onSubmit) {
      onSubmit(nextTags);
    }
  };

  const renderGroupContent = (option: Option<T>) => {
    if (option === undefined) {
      return null;
    }

    const { operators, field, format = 'YYYY-MM-DD', hideOperators, label } = option;
    const optionValue: OptionValue = state[field] || [option.operators[0], undefined];
    const [operator, value] = optionValue;

    const operatorItem =
      operators !== undefined && !hideOperators ? (
        <Select
          className="filter-operator"
          value={operator}
          defaultValue={operators[0]}
          options={operators.map(value => ({
            value,
            label: OperatorLabels[value],
          }))}
          onChange={val => handleChangeOperator(field, val)}
          suffixIcon={<Down />}
        />
      ) : null;

    let formItem: ReactNode;

    const { enums = [] } = option;

    switch (option.type) {
      case 'input':
        formItem = (
          <Input value={value} onInput={e => handleChangeValue(field, e.currentTarget.value)} />
        );
        break;
      case 'select':
        formItem = (
          <Select
            dropdownMatchSelectWidth
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) => {
              if (option && option.label) {
                return (option.label as string).toLowerCase().indexOf(input.toLowerCase()) >= 0;
              }
              return false;
            }}
            value={value}
            options={option.required ? enums : [{ value: '', label: '' }, ...enums]}
            onChange={val => handleChangeValue(field, val)}
            suffixIcon={<Down />}
          />
        );
        break;
      case 'multi-select':
        formItem = (
          <Select
            dropdownMatchSelectWidth
            mode="multiple"
            value={value}
            options={enums}
            onChange={val => handleChangeValue(field, val)}
            suffixIcon={<Down />}
          />
        );
        break;
      case 'date':
        formItem = (
          <DatePicker.RangePicker
            format={format}
            value={value ? [moment(value[0], format), moment(value[1], format)] : null}
            onChange={val =>
              handleChangeValue(
                field,
                val?.map(item => (item ? item.format(format) : undefined)),
              )
            }
          />
        );
        break;
      case 'popup':
        formItem = (
          <Popup
            value={value}
            title={label}
            onChange={val => {
              handleChangeValue(field, val);
            }}
            allowClear
            {...option.popup!}
          />
        );
        break;
      default:
        formItem = null;
    }

    return (
      <>
        {operatorItem}
        <div className="filter-value">{formItem}</div>
      </>
    );
  };

  const getTagName = (tag: TagValue<T>) => {
    const option = options.find(item => item.field === tag.field);

    if (option === undefined) {
      return '';
    }

    const { label, enums, type, popup } = option;

    let val: string = '';

    switch (type) {
      case 'date':
        val = (tag.value as [string, string]).join('~');
        break;
      case 'select':
        val = enums?.find(item => item.value === tag.value)?.label || '';
        break;
      case 'multi-select':
        if (Array.isArray(tag.value) && enums !== undefined) {
          val = enums
            .filter(item => (tag.value as (string | number)[]).includes(item.value))
            .map(item => item.label)
            .join(',');
        }
        break;
      case 'popup':
        if (popup) {
          val = popup.formatLabel ? popup.formatLabel(tag.value) : tag.value;
        }
        break;
      default:
        val = tag.value.toString();
    }

    return `${label} ${tag.operator ? OperatorLabels[tag.operator] : ''} ${val}`;
  };

  return (
    <div className="filter">
      <div className="filter-form">
        <div>
          {[...groups].map(([key, options]) => {
            if (options.length > 0) {
              const optionKey = groupsState[key];
              const option = options.find(item => item.field === optionKey);

              return (
                <div key={key} className="filter-group">
                  {options.length > 1 ? (
                    <Select
                      className="filter-field"
                      onSelect={val => handleChangeField(key, val as T)}
                      value={groupsState[key]}
                      options={options.map(item => ({
                        value: item.field,
                        label: item.label,
                      }))}
                      suffixIcon={<Down />}
                    />
                  ) : (
                    <div className="filter-field filter-field-single">{options[0].label}</div>
                  )}
                  {!!option && renderGroupContent(option)}
                </div>
              );
            }

            return null;
          })}
        </div>
        <Button onClick={handleAdd}>添加条件</Button>
        <Button type="primary" onClick={handleSubmit}>
          查询
        </Button>
        {extra}
      </div>
      {tags.length > 0 && (
        <div className="filter-tags">
          {tags.map(item => (
            <Tag
              color="blue"
              closable={!fieldOptionMap[item.field]?.required}
              key={item.field}
              onClose={() => handleDeleteTag(item)}
              onClick={() => handleClickTag(item)}
            >
              {getTagName(item)}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(Filter) as typeof Filter;
