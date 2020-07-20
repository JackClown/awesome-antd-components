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
} from 'react';
import { Form } from 'antd';
import { FormInstance, FormItemProps } from 'antd/lib/form';
import { debounce } from 'lodash';

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

interface RowForm {
  getFieldsValue: FormInstance['getFieldsValue'];
  validateFields: FormInstance['validateFields'];
}

const formatKey = (row: ReactText, col: ReactText) => {
  return `${row}|${col}`;
};

export class Store<T> {
  private data: Map<ReactText, T>;

  private rowKey: string;

  private state: State;

  private observers: Map<ReactText, (state: State) => void> = new Map();

  private forms: Map<ReactText, RowForm> = new Map();

  private listeners: Set<(data: T[]) => void> = new Set();

  constructor(state: State, data: T[], rowKey: string) {
    this.state = state;
    this.rowKey = rowKey;
    this.data = new Map(data.map(item => [item[rowKey] as ReactText, item]));
  }

  public observe(key: ReactText, cb: (state: State) => void) {
    this.observers.set(key, cb);
  }

  public unobserve(key: ReactText) {
    this.observers.delete(key);
  }

  public register(key: ReactText, form: RowForm) {
    this.forms.set(key, form);
  }

  public unregister(key: ReactText) {
    this.forms.delete(key);
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
      for (const [key, form] of this.forms) {
        rowKey = key;

        if (validate) {
          await form.validateFields();
        }

        data.push(form.getFieldsValue());
      }

      return data;
    } catch (err) {
      this.setState({ row: rowKey });

      throw err;
    }
  }

  public async setState(state: Partial<State>) {
    const prev = this.state;
    const next = { ...this.state, ...state };

    let observer = this.observers.get(formatKey(prev.row, prev.col));

    if (observer) {
      observer(next);
    }

    observer = this.observers.get(formatKey(next.row, next.col));

    if (observer) {
      observer(next);
    }

    this.state = next;
  }
}

const Context = createContext(new Store<any>({ row: '', col: '' }, [], ''));

const RowContext = createContext<{
  rowKey: string;
}>({
  rowKey: '',
});

const Row: React.FC<{
  record: object;
  className: string;
  onValuesChange: (changedValues: object, values: object) => object;
}> = props => {
  const { record, onValuesChange, ...restProps } = props;

  const store = useContext(Context);
  const [form] = Form.useForm();

  const rowKey = props['data-row-key'];

  useEffect(() => {
    store.register(rowKey, {
      getFieldsValue: () => {
        return {
          ...record,
          ...form.getFieldsValue(),
        };
      },
      validateFields: () => form.validateFields(),
    });

    return () => {
      store.unregister(rowKey);
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

  const ctx = useMemo(() => {
    return { rowKey };
  }, [form, rowKey, record]);

  return (
    <Form
      form={form}
      initialValues={record}
      component={false}
      name={rowKey}
      onValuesChange={handleChange}
    >
      <RowContext.Provider value={ctx}>
        <tr {...restProps} />
      </RowContext.Provider>
    </Form>
  );
};

const MaskInputItem = (props: {
  value?: any;
  render?: (value: any) => any;
  onFocus?: () => void;
}) => {
  const { value, render, ...restProps } = props;

  return (
    <div className="ant-input ant-input-mask" tabIndex={0} {...restProps}>
      {render ? render(value) : value}
    </div>
  );
};

const FormItemCol = React.memo((props: { column: ColumnType<object>; index: number }) => {
  const { column, index, ...restProps } = props;

  const store = useContext(Context);
  const { rowKey } = useContext(RowContext);
  const [focused, setFocused] = useState(false);

  const key = formatKey(rowKey, index);

  useEffect(() => {
    store.observe(key, (state: State) => {
      setFocused(state.row === rowKey && state.col === index);
    });

    return () => {
      store.unobserve(key);
    };
  }, []);

  const handleClick = () => {
    store.setState({ col: index, row: rowKey });
  };

  const { children, persist, ...formItemProps } = column.formItem!;
  let formItem;

  if (focused || persist) {
    formItem = cloneElement(children, {
      autoFocus: focused,
    });
  } else {
    formItem = <MaskInputItem onFocus={handleClick} render={column.render as any} />;
  }

  return (
    <td {...restProps} onClick={handleClick}>
      <Form.Item
        name={column.dataIndex}
        {...formItemProps}
        label={column.title}
        noStyle={formItem === undefined}
      >
        {formItem}
      </Form.Item>
    </td>
  );
});

const Col = (props: any) => {
  const { column } = props;

  if (column === undefined || column.formItem === undefined) {
    return <td {...props} />;
  }

  return <FormItemCol {...props} />;
};

export default function FormTable<T extends object>(props: Props<T>) {
  const { columns, rowKey, storeRef, onValuesChange, dataSource = [], ...restProps } = props;

  const mergedColumns = columns.map((column, index) => ({
    ...column,
    shouldCellUpdate: (record: T, prevRecord: T) => {
      return record !== prevRecord;
    },
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
