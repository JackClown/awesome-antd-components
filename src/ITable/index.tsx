import React, { useState, useMemo, DependencyList, useImperativeHandle, Ref } from 'react';
import { TableProps } from 'antd/lib/table';

import { useAsyncEffect, useDeepCompareMemoize } from '../hooks';
import Filter, { TagValue, FormType, Option, Operators } from '../Filter';
import Table, { ColumnType } from '../Table';
import Layout from '../Layout';
import Section from '../Section';
import Actions from '../Actions';

export type IColumType<T> = Omit<ColumnType<T>, 'title'> &
  Omit<Option<string>, 'field' | 'label' | 'type' | 'operators'> & {
    title: string;
    type?: FormType;
    operators?: Operators[];
    hideInTable?: boolean;
  };

export interface ITableRef {
  fetch: (current?: number) => void;
  setQueries: (queries: TagValue[]) => void;
  getQueries: () => TagValue[];
}

export interface Props<T> extends Omit<TableProps<T>, 'columns' | 'rowKey' | 'title'> {
  columns: IColumType<T>[];
  fetch: (params: {
    page: number;
    pageSize: number;
    queries: TagValue[];
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
    ...restProps
  } = props;
  const [queries, setQueries] = useState<TagValue[]>(defaultQueries);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: (paginationProps && paginationProps.pageSize) || 50,
  });

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
    }),
    [queries],
  );

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

  let iRowSelection: TableProps<T>['rowSelection'];

  if (rowSelection !== undefined || actions?.find(item => item.useSelected) !== undefined) {
    iRowSelection = {
      onChange: selectedKeys => {
        const rows: T[] = [];

        state.data.forEach(item => {
          if (selectedKeys.includes(item[props.rowKey])) {
            rows.push(item);
          }
        });

        setSelectedRows(rows);
      },
      ...rowSelection,
    };
  }

  const memoizedColumns = useDeepCompareMemoize(columns);

  const [options, cols] = useMemo(() => {
    const options: Option<string>[] = [];
    const cols: ColumnType<T>[] = [];

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

      if (col.hideInTable) {
        return;
      }

      const enumsMap = new Map();

      const column: ColumnType<T> = { ...col };

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

    return [options, cols];
  }, [memoizedColumns]);

  useAsyncEffect(
    async flag => {
      if (cols.length <= 0 || !shouldFetch) {
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      try {
        const { total, data, summary } = await fetch({
          page: pagination.current,
          pageSize: pagination.pageSize,
          queries,
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
    [queries, pagination, cols, shouldFetch, ...extraDeps],
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

  return (
    <Layout>
      {actions && actions.length > 0 && (
        <Actions
          payload={selectedRows}
          actions={actions.map(item => {
            if (item.useSelected) {
              return {
                ...item,
                disabled: selectedRows.length <= 0,
              };
            }

            return item;
          })}
        />
      )}
      {options.length > 0 && (
        <Section title="默认">
          <Filter value={queries} options={options} onSubmit={setQueries} />
        </Section>
      )}
      {cols.length > 0 && (
        <Table
          dataSource={data}
          pagination={page}
          columns={cols}
          {...restProps}
          loading={loading}
          rowSelection={iRowSelection}
          summaryRecord={summary as T}
        />
      )}
    </Layout>
  );
}
