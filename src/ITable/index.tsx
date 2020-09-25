import React, {
  useState,
  useMemo,
  DependencyList,
  useImperativeHandle,
  Ref,
  useCallback,
  useRef,
} from 'react';
import { TableProps } from 'antd/lib/table';
import { debounce } from 'lodash';

import { useAsyncEffect, useDeepCompareMemoize } from '../hooks';
import { TagValue, FormType, Option, Operators } from '../Filter';
import Filter, { Plan, DEFUALT_FILTER_NAME } from './MultiFilter';
import Table, { ColumnType } from '../Table';
import Layout from '../Layout';
import Section from '../Section';
import Actions from '../Actions';
import SetColumn, { ColumnPlan } from './SetColumn';
import Sort from './Sort';

export type IColumType<T> = Omit<ColumnType<T>, 'title'> &
  Omit<Option<string>, 'field' | 'label' | 'type' | 'operators'> & {
    title: string;
    type?: FormType;
    operators?: Operators[];
    hideInTable?: boolean;
    sortable?: boolean;
    dataFormat?: 'date' | 'datetime' | 'number';
  };

export interface ITableRef {
  fetch: (current?: number) => void;
  setQueries: (queries: TagValue[]) => void;
  getQueries: () => TagValue[] | null;
  gteSelected: () => any[];
}

export interface Storage {
  filter: {
    getAllItems: (key: string) => Plan[] | Promise<Plan[]>;
    setItem: (key: string, filter: Plan) => Promise<Plan | void> | Plan | void;
    removeItem: (key: string, filter: Plan) => void;
  };
  column: {
    set: (key: string, data: ColumnPlan) => void | Promise<void>;
    get: (key: string) => ColumnPlan | Promise<ColumnPlan>;
  };
}

export interface Props<T> extends Omit<TableProps<T>, 'columns' | 'rowKey' | 'title'> {
  columns: IColumType<T>[];
  fetch: (params: {
    page: number;
    pageSize: number;
    queries: TagValue[];
    sort: [string | number, string][];
  }) => Promise<{
    total: number;
    data: T[];
    summary?: Partial<T>;
  }>;
  defaultQueries?: TagValue[];
  actions?: {
    text: string;
    useSelected?: boolean;
    action?: (selectedRows: T[]) => void;
    dropDown?: {
      text: string;
      onClick: (selectedRows: T[]) => void;
    }[];
  }[];
  rowKey: string;
  extraDeps?: DependencyList[];
  actionRef?: Ref<ITableRef>;
  summaryTitle?: string;
  shouldFetch?: boolean;
  storage?: Storage;
  name?: string | {
    filter?: string,
    column?:string
  };
  toolbar?: {
    setting?: boolean;
  };
}

let defaultStorage: Storage = {
  filter: {
    getAllItems(key) {
      const data = localStorage.getItem(`filters-${key}`);

      if (data) {
        return JSON.parse(data);
      }

      return [];
    },
    setItem(key, filter) {
      const data = localStorage.getItem(`filters-${key}`);
      let filters: Plan[] = [];

      if (data) {
        filters = JSON.parse(data);
      }

      const index = filters.findIndex(item => item.name === filter.name);

      if (index >= 0) {
        filters[index] = filter;
      } else {
        filters.push(filter);
      }

      localStorage.setItem(`filters-${key}`, JSON.stringify(filters));

      return filter;
    },
    removeItem(key, filter) {
      const data = localStorage.getItem(`filters-${key}`);
      let filters: Plan[] = [];

      if (data) {
        filters = JSON.parse(data);
      }

      const index = filters.findIndex(item => item.name === filter.name);

      if (index >= 0) {
        filters.splice(index, 1);
      }

      localStorage.setItem(`filters-${key}`, JSON.stringify(filters));
    },
  },
  column: {
    get(key) {
      const data = localStorage.getItem(`columns-${key}`);

      if (data) {
        return JSON.parse(data);
      }

      return [];
    },
    set(key, data) {
      localStorage.setItem(`columns-${key}`, JSON.stringify(data));
    },
  },
};

export function setStorage(storage: { filter?: Storage['filter']; column?: Storage['column'] }) {
  defaultStorage = { ...defaultStorage, ...storage };
}

export function keyExtractor(item: ColumnType<any>) {
  if (item.dataIndex) {
    if (Array.isArray(item.dataIndex)) {
      return item.dataIndex.join('.');
    }

    return item.dataIndex;
  }

  return item.key || '';
}

function useBatchUpdate(cb: (data: ColumnPlan) => void, origin: ColumnPlan = []) {
  const queue = useRef<ColumnType<any>[]>([]);

  const data = useRef(origin);

  data.current = origin;

  const update = useCallback(
    debounce(() => {
      const map = new Map(data.current.map(item => [item.key, item]));

      queue.current.forEach(col => {
        const key = keyExtractor(col);

        const item = map.get(key);

        if (item === undefined) {
          return;
        }

        map.set(key, {
          ...item,
          width: col.width,
        });
      });

      queue.current = [];

      cb([...map.values()]);
    }, 3000),
    [],
  );

  return (column: ColumnType<any>) => {
    queue.current.push(column);

    update();
  };
}

export default function ITable<T extends object>(props: Props<T>) {
  const {
    columns,
    fetch,
    defaultQueries = [],
    actions,
    extraDeps = [],
    actionRef,
    pagination: paginationProps,
    rowSelection,
    shouldFetch = true,
    name,
    storage = defaultStorage,
    toolbar,
    ...restProps
  } = props;

  const defaultFilter = {
    name: DEFUALT_FILTER_NAME,
    value: defaultQueries,
  };

  let filterName: string | undefined;
  let columnName: string | undefined;
  if (name !== undefined) {
    if (typeof name === 'string') {
      filterName = name;
      columnName = name;
    } else {
      filterName = name.filter;
      columnName = name.column;
    }
  }

  const [filters, setFilters] = useState<Plan[] | undefined>(undefined);

  const [column, setColumn] = useState<ColumnPlan | undefined>(undefined);

  const [queries, setQueries] = useState<TagValue[]>(defaultQueries);

  const [sort, setSort] = useState<Map<string | number, string>>(new Map());

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: (paginationProps && paginationProps.pageSize) || 50,
  });

  const ready = column !== undefined && filters !== undefined && shouldFetch;

  const [state, setState] = useState<{
    loading: boolean;
    total: number;
    data: T[];
    summary?: Partial<T>;
  }>({
    loading: false,
    total: 0,
    data: [],
  });

  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const iRowSelection = useMemo(() => {
    let selection: TableProps<T>['rowSelection'];

    if (rowSelection !== undefined || actions?.find(item => item.useSelected) !== undefined) {
      selection = {
        onChange: (_, rows) => {
          setSelectedRows(rows);
        },
        ...rowSelection,
      };
    }

    return selection;
  }, [rowSelection, actions]);

  const memoizedColumns = useDeepCompareMemoize(columns);

  const [options, allCols] = useMemo(() => {
    const options: Option<string>[] = [];
    const cols: IColumType<T>[] = [];

    columns.forEach(col => {
      if (col.type && typeof col.dataIndex === 'string') {
        options.push({
          field: col.dataIndex,
          label: col.title,
          type: col.type,
          operators: col.operators!,
          enums: col.enums,
          required: col.required,
          format: col.format,
          hideOperators: col.hideOperators,
          popup: col.popup,
        });
      }

      if (col.hideInTable || (col.dataIndex === undefined && col.key === undefined)) {
        return;
      }

      let width: number;
      let align: 'left' | 'center' | 'right' | undefined;

      switch (col.dataFormat) {
        case 'date':
          width = 160;
          break;
        case 'datetime':
          width = 200;
          break;
        case 'number':
          width = 120;
          align = 'right';
          break;
        default:
          width = 120;
      }

      const column = { width, align, ...col };

      const enumsMap = new Map();

      if (col.enums !== undefined) {
        col.enums.forEach(item => {
          enumsMap.set(item.value, item.label);
        });
      }

      if (column.render === undefined && enumsMap.size > 0) {
        column.render = (val: any) => {
          let value = val;

          if (typeof value === 'boolean') {
            value = value.toString();
          }

          if (enumsMap.has(value)) {
            return enumsMap.get(value);
          }

          return value;
        };
      }

      cols.push(column);
    });

    return [options, new Map(cols.map(col => [keyExtractor(col), col]))];
  }, [memoizedColumns]);

  useImperativeHandle(
    actionRef,
    () => ({
      fetch: (current?: number) => {
        setPagination(prev => {
          if (current) {
            return {
              ...prev,
              current,
            };
          }

          return { ...prev };
        });
      },
      setQueries,
      getQueries: () => queries,
      gteSelected: () => selectedRows,
    }),
    [queries, selectedRows],
  );

  useAsyncEffect(async flag => {
    setState(prev => ({ ...prev, loading: true }));

    let nextFilters: Plan[] = [defaultFilter];
    const data: ColumnPlan = [];

    try {
      if (filterName) {
        const filter = (await storage.filter.getAllItems(filterName)) || [];

        if (flag.cancelled) {
          return;
        }

        if (filter.length > 0) {
          nextFilters = [...nextFilters, ...filter];
        }
      }
      if (columnName) {
        const column = (await storage.column.get(columnName)) || [];

        if (flag.cancelled) {
          return;
        }

        column.forEach(item => {
          const col = allCols.get(item.key);

          if (col) {
            data.push({
              title: col.title,
              width: col.width,
              ...item,
            });
          }
        });
      }
    } catch (err) {
      // noop
    }

    [...allCols].forEach(([key, col], index) => {
      const item = data.find(item => item.key === key);

      if (item === undefined) {
        data.splice(index, 0, {
          key,
          title: col.title,
          width: col.width,
          visible: true,
        });
      }
    });

    setFilters(nextFilters);
    setColumn(data);
  }, []);

  const handleSort = (key: string | number, value?: string) => {
    const nextSort = new Map(sort);

    if (value === undefined) {
      nextSort.delete(key);
    } else {
      nextSort.set(key, value);
    }

    setSort(nextSort);
  };

  const cols = useMemo(() => {
    if (column === undefined) {
      return [];
    }

    const data: ColumnType<T>[] = [];

    column.forEach(item => {
      const col = allCols.get(item.key);

      if (item.visible && col) {
        const nextCol: ColumnType<T> = { ...col };

        if (item.width !== undefined) {
          nextCol.width = item.width;
        }

        if (col.sortable === undefined || col.sortable) {
          let value = '';
          let index: undefined | number;
          let i = 0;

          for (const [key, val] of sort) {
            if (key === item.key) {
              value = val;
              index = i + 1;
            }

            i++;
          }

          nextCol.title = (
            <Sort
              align={col.align}
              value={value}
              title={col.title}
              index={index}
              onChange={val => handleSort(item.key, val)}
            />
          );
        }

        data.push(nextCol);
      }
    });

    return data;
  }, [allCols, column, sort]);

  useAsyncEffect(
    async flag => {
      if (!ready) {
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      try {
        const { total, data, summary } = await fetch({
          page: pagination.current,
          pageSize: pagination.pageSize,
          queries: queries || [],
          sort: [...sort],
        });

        if (flag.cancelled) {
          return;
        }

        setState(prev => ({
          ...prev,
          total,
          data,
          summary,
          loading: false,
        }));
      } catch (err) {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [ready, queries, sort, pagination, ...extraDeps],
  );

  const { total, data, summary, loading } = state;

  const page = useMemo(() => {
    const handlePage = (current: number, pageSize: number | undefined = 50) => {
      setPagination(prev => ({
        ...prev,
        current,
        pageSize,
      }));
    };

    return {
      ...pagination,
      total,
      showSizeChanger: true,
      showQuickJumper: true,
      onShowSizeChange: handlePage,
      onChange: handlePage,
      ...paginationProps,
    };
  }, [total, pagination, paginationProps]);

  const handleSaveFilter = async (filter: Plan, filters: Plan[]) => {
    try {
      setFilters(filters);

      if (filterName) {
        const result = await storage.filter.setItem(filterName, filter);

        if (result) {
          const index = filters.findIndex(item => item.name === filter.name);

          if (index >= 0) {
            const nextFilters = [...filters];

            nextFilters[index] = result;

            setFilters(nextFilters);
          }
        }
      }
    } catch (err) {
      // noop
    }
  };

  const handleDeleteFilter = async (filter: Plan, filters: Plan[]) => {
    setFilters(filters);

    try {
      if (filterName) {
        await storage.filter.removeItem(filterName, filter);
      }
    } catch (err) {
      // noop
    }
  };

  const hanldeSaveColumns = async (column?: ColumnPlan) => {
    if (column === undefined) {
      return;
    }

    setColumn(column);

    try {
      if (columnName) {
        await storage.column.set(columnName, column);
      }
    } catch (err) {
      // noop
    }
  };

  const update = useBatchUpdate(hanldeSaveColumns, column);

  const disabled = selectedRows.length <= 0;

  return (
    <Layout>
      {actions && actions.length > 0 && (
        <Actions
          payload={selectedRows}
          actions={actions.map(item => {
            if (item.useSelected) {
              return { ...item, disabled };
            }

            return item;
          })}
        />
      )}
      <Section className="itable-toolbar">
        <div className="itable-toolbar-search">
          {options.length > 0 && (
            <Filter
              value={queries}
              options={options}
              filters={filters || [defaultFilter]}
              onSubmit={setQueries}
              onSave={handleSaveFilter}
              onDelete={handleDeleteFilter}
              multiple={!!filterName}
            />
          )}
        </div>
        <div className="itable-toolbar-option">
          {toolbar?.setting !== false && columnName && (
            <SetColumn value={column} onChange={hanldeSaveColumns} />
          )}
        </div>
      </Section>
      <Table
        dataSource={data}
        pagination={page}
        columns={cols}
        {...restProps}
        loading={loading}
        rowSelection={iRowSelection}
        summaryRecord={summary as T}
        onColumnChange={update}
      />
    </Layout>
  );
}
