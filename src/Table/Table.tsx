import React, {
  RefObject,
  useState,
  SyntheticEvent,
  useRef,
  useEffect,
  memo,
  useMemo,
} from 'react';
import { Table as AntdTable, Spin } from 'antd';
import { TableProps, ColumnType as AntdColumnType } from 'antd/lib/table';
import { ResizeCallbackData, Resizable } from 'react-resizable';
import { get, debounce } from 'lodash';

import './Table.less';

export interface ColumnType<T> extends AntdColumnType<T> {
  dataFormat?: 'date' | 'datetime' | 'number';
}

export interface Props<T> extends Omit<TableProps<T>, 'columns' | 'pagination'> {
  columns?: ColumnType<T>[];
  loading?: boolean;
  summaryRecord?: T;
  summaryTitle?: string;
  onColumnsChange?: (columns: ColumnType<T>[]) => void;
}

const Th = React.memo(function Th(props: {
  width?: number;
  index: number;
  tableRef: RefObject<HTMLDivElement>;
  onChange?: (width: number) => void;
}) {
  const { index, width, tableRef, onChange, ...restProps } = props;
  const [size, setSize] = useState(width || 0);

  if (!width) {
    return <th {...restProps} />;
  }

  const handleResize = (_: SyntheticEvent, { size: { width } }: ResizeCallbackData) => {
    if (!tableRef.current) {
      return;
    }

    setSize(width);

    if (onChange) {
      onChange(width);
    }

    const elm = tableRef.current;

    const colgroups = elm.querySelectorAll('colgroup');

    colgroups.forEach(group => {
      const cols = group.getElementsByTagName('col');

      cols[index].setAttribute('style', `width: ${width}px; min-width: ${width}px;`);
    });
  };

  return (
    <Resizable
      width={size}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={e => {
            e.stopPropagation();
          }}
        />
      }
      onResize={handleResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
});

function Table<T extends object = any>(props: Props<T>) {
  const {
    loading = false,
    summaryRecord,
    summaryTitle = '总合计',
    rowSelection,
    columns,
    rowKey,
    onColumnsChange,
    ...restProps
  } = props;

  const hasRowSelection = !!rowSelection;
  const hasSummaryRecord = summaryRecord !== undefined;

  const tableWrapper = useRef<HTMLDivElement>(null);

  const cols = useMemo(() => {
    if (columns === undefined) {
      return [];
    }

    const cols = columns.map((col, index) => {
      let handleChange: (width: number) => void;
      let idx = index;

      if (onColumnsChange) {
        handleChange = debounce((width: number) => {
          const nextCols = [...columns];

          nextCols[index] = {
            ...nextCols[index],
            width,
          };

          onColumnsChange(nextCols);
        }, 500);
      }

      if (hasRowSelection) {
        idx += 1;
      }

      return {
        ellipsis: true,
        onHeaderCell: (column: ColumnType<T>) => ({
          index: idx,
          width: column.width,
          tableRef: tableWrapper,
          onChange: handleChange,
        }),
        ...col,
      } as ColumnType<T>;
    });

    cols.push({
      title: '',
      dataIndex: 'empty_col',
      width: 'auto',
      shouldCellUpdate: () => false,
      render: () => '',
    });

    return cols;
  }, [columns, hasRowSelection, onColumnsChange]);

  const [selectedKeys, setSelectedKeys] = useState<(string | number)[]>(
    rowSelection?.selectedRowKeys || [],
  );

  let mergedRowSelection: TableProps<T>['rowSelection'];

  if (rowSelection !== undefined) {
    mergedRowSelection = {
      columnWidth: '34px',
      selectedRowKeys: selectedKeys,
      ...rowSelection,
      onChange: (...args) => {
        if (rowSelection.onChange) {
          rowSelection.onChange(...args);
        }

        setSelectedKeys(args[0]);
      },
    };
  }

  useEffect(() => {
    const elm = tableWrapper.current;

    if (elm === null) {
      return undefined;
    }

    const { 0: head, 1: body, 2: foot } = elm.querySelectorAll<HTMLDivElement>(
      '.ant-table-wrapper',
    );

    if (!body) {
      return undefined;
    }

    function handler() {
      if (head) {
        head.scrollLeft = body.scrollLeft;
      }

      if (foot) {
        foot.scrollLeft = body.scrollLeft;
      }
    }

    body.addEventListener('scroll', handler);

    return () => {
      body.removeEventListener('scroll', handler);
    };
  }, [hasSummaryRecord]);

  return (
    <div className="table" ref={tableWrapper}>
      <Spin spinning={loading}>
        <AntdTable
          rowKey={rowKey}
          columns={cols}
          rowSelection={mergedRowSelection}
          {...restProps}
          pagination={false}
          components={{
            header: {
              cell: Th,
            },
            body: {
              row: () => null,
              wrapper: () => null,
              cell: () => null,
            },
          }}
        />
        <AntdTable
          rowKey={rowKey}
          onRow={record => ({
            onClick: () => {
              mergedRowSelection?.onChange?.(
                [typeof rowKey === 'function' ? rowKey(record) : record[rowKey || 'key']],
                [record],
              );
            },
          })}
          columns={cols}
          rowSelection={mergedRowSelection}
          {...restProps}
          showHeader={false}
          pagination={false}
        />
        {summaryRecord !== undefined && (
          <AntdTable
            rowSelection={rowSelection}
            rowKey={rowKey}
            showHeader={false}
            pagination={false}
            columns={cols.map((col, index) => {
              let render = () => '';

              if (index === 0 && summaryTitle) {
                render = () => summaryTitle;
              } else if (col.dataIndex) {
                const value = get(summaryRecord, col.dataIndex, undefined);

                if (value !== undefined) {
                  render = () => (col.render ? col.render(value, summaryRecord, index) : value);
                }
              }

              return {
                ...col,
                render,
              };
            })}
            dataSource={[summaryRecord]}
          />
        )}
      </Spin>
    </div>
  );
}

export default memo(Table) as typeof Table;
