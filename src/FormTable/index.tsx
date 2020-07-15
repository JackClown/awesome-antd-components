import React, {
  useState,
  createContext,
  useContext,
  useMemo,
  useEffect,
  ReactElement,
  cloneElement,
  useImperativeHandle,
  RefObject,
  ReactText,
  memo,
} from 'react';
import { Form } from 'antd';
import { FormInstance, FormItemProps } from 'antd/lib/form';
import { debounce } from 'lodash';
import classNames from 'classnames';

import Table, { Props as TableProps, ColumnType as TableColumnType } from '../Table/Table';
import './index.less';

export interface ColumnType<T> extends TableColumnType<T> {
  formItem?: FormItemProps & {
    children: ReactElement<any>;
    persist?: boolean;
  };
}

export interface Props<T> extends Omit<TableProps<T>, 'title' | 'rowKey'> {
  columns: ColumnType<T>[];
  rowKey: string;
  storeRef?: RefObject<Store<T>>;
  onValuesChange?: (changedValues: Partial<T>, values: Partial<T>) => Partial<T> | void;
}

interface State {
  row: string | number;
  col: string | number;
}

interface Observer {
  update: (state: State) => void;
  getFieldsValue: FormInstance['getFieldsValue'];
  validateFields: FormInstance['validateFields'];
}

export class Store<T> {
  private data: Map<ReactText, T>;

  private rowKey: string;

  private state: State;

  private observers = new Map<ReactText, Observer>();

  private listeners: Set<(data: T[]) => void> = new Set();

  constructor(state: State, data: T[], rowKey: string) {
    this.state = state;
    this.rowKey = rowKey;
    this.data = new Map(data.map(item => [item[rowKey] as ReactText, item]));
  }

  public subscribe(key: string, observer: Observer) {
    this.observers.set(key, observer);
  }

  public unsubscribe(key: string) {
    this.observers.delete(key);
  }

  public getState() {
    return this.state;
  }

  public add(...rows: T[]) {
    if (rows.length <= 0) {
      return;
    }

    const { data, rowKey, listeners } = this;

    rows.forEach(row => {
      if (!data.has(row[rowKey])) {
        data.set(row[rowKey], row);
      }
    });

    const dataSource = [...data.values()];

    for (const cb of listeners) {
      cb(dataSource);
    }
  }

  public remove(...rows: ReactText[]) {
    if (rows.length <= 0) {
      return;
    }

    const { data, listeners } = this;

    rows.forEach(row => {
      if (data.has(row)) {
        data.delete(row);
      }
    });

    const dataSource = [...data.values()];

    for (const cb of listeners) {
      cb(dataSource);
    }
  }

  public addListener(cb: (data: T[]) => void) {
    this.listeners.add(cb);
  }

  public removeListener(cb: (data: T[]) => void) {
    this.listeners.delete(cb);
  }

  public async getData(validate: boolean = true) {
    const data = [];

    let rowKey;

    try {
      for (const [key, observer] of this.observers) {
        rowKey = key;

        if (validate) {
          await observer.validateFields();
        }

        data.push(observer.getFieldsValue());
      }

      return data;
    } catch (err) {
      this.setState({ row: rowKey });

      throw err;
    }
  }

  public async setState(state: Partial<State>) {
    Object.assign(this.state, state);

    for (const [, observer] of this.observers) {
      observer.update(this.state);
    }
  }
}

const Context = createContext(new Store<any>({ row: '', col: '' }, [], ''));

const RowContext = createContext<{
  form?: FormInstance;
  focused: boolean;
  rowKey: string;
  record: object;
}>({
  form: undefined,
  focused: false,
  rowKey: '',
  record: {},
});

const Row: React.FC<{
  record: object;
  className: string;
  onValuesChange: (changedValues: object, values: object) => object;
}> = props => {
  const { record, className, onValuesChange, ...restProps } = props;

  const store = useContext(Context);
  const [focused, setFocused] = useState(false);
  const [form] = Form.useForm();

  const rowKey = props['data-row-key'];

  useEffect(() => {
    store.subscribe(rowKey, {
      update: (state: State) => {
        setFocused(state.row === rowKey);
      },
      getFieldsValue: () => {
        return {
          ...record,
          ...form.getFieldsValue(),
        };
      },
      validateFields: () => form.validateFields(),
    });

    return () => {
      store.unsubscribe(rowKey);
    };
  }, []);

  const handleChange = debounce((changedValues: object, values: object) => {
    if (onValuesChange) {
      const val = onValuesChange(changedValues, values);

      if (val) {
        form.setFieldsValue(val);
      }
    }
  }, 300);

  return (
    <Form
      form={form}
      initialValues={record}
      component={false}
      name={rowKey}
      onValuesChange={handleChange}
    >
      <RowContext.Provider
        value={{
          focused,
          form,
          rowKey,
          record,
        }}
      >
        <tr {...restProps} className={classNames(className, focused ? 'editing' : '')} />
      </RowContext.Provider>
    </Form>
  );
};

const Col = memo((props: { column?: ColumnType<object>; index: number }) => {
  const { column, index, ...restProps } = props;

  const { focused, form, rowKey, record } = useContext(RowContext);
  const store = useContext(Context);

  if (form === undefined || column === undefined || column.formItem === undefined) {
    return <td {...restProps} />;
  }

  const { col } = store.getState();

  const handleClick = () => {
    store.setState({ col: index, row: rowKey });
  };

  const { children, persist, ...formItemProps } = column.formItem;
  let formItem;
  let cellItem;

  if (focused || persist) {
    formItem = cloneElement(children, {
      autoFocus: col === index,
    });
  } else {
    const data = { ...record, ...form.getFieldsValue() };
    const value = column.dataIndex ? form.getFieldValue(column.dataIndex) : '';

    cellItem = (
      <div className="ant-input ant-input-mask" tabIndex={0} onFocus={handleClick}>
        {column.render ? column.render(value, data, index) : value}
      </div>
    );
  }

  return (
    <td {...restProps} onClick={handleClick}>
      <Form.Item
        name={column.dataIndex}
        {...formItemProps}
        label={column.title}
        noStyle={formItem === undefined}
      >
        {formItem || cellItem}
      </Form.Item>
    </td>
  );
});

export default function FormTable<T extends object>(props: Props<T>) {
  const { columns, rowKey, storeRef, onValuesChange, dataSource = [], ...restProps } = props;

  const mergedColumns = columns.map((column, index) => ({
    ...column,
    onCell: () => {
      return {
        column,
        index,
      };
    },
  }));

  const [data, setData] = useState(dataSource);

  const store = useMemo(() => {
    let col = 0;

    for (let i = 0; i < columns.length; i++) {
      if (columns[i].formItem) {
        col = i;
        break;
      }
    }

    return new Store(
      {
        row: '',
        col,
      },
      dataSource,
      rowKey,
    );
  }, []);

  useImperativeHandle(storeRef, () => store, [store]);

  useEffect(() => {
    store.addListener(setData);

    return () => {
      store.removeListener(setData);
    };
  }, []);

  return (
    <Context.Provider value={store}>
      <Table
        {...restProps}
        dataSource={data}
        rowKey={rowKey}
        columns={mergedColumns as TableColumnType<T>[]}
        onRow={record => ({ record, onValuesChange } as any)}
        components={{
          body: {
            row: Row,
            cell: Col,
          },
        }}
      />
    </Context.Provider>
  );
}
