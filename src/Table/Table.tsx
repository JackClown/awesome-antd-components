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
import { get } from 'lodash';

import './Table.less';

export interface ColumnType<T> extends AntdColumnType<T> {
  dataFormat?: 'date' | 'datetime' | 'number';
}

export interface Props<T> extends Omit<TableProps<T>, 'columns' | 'pagination'> {
  columns?: ColumnType<T>[];
  loading?: boolean;
  summaryRecord?: T;
  summaryTitle?: string;
}

const Th = (props: { width?: number; index: number; tableRef: RefObject<HTMLDivElement> }) => {
  const { index, width, tableRef, ...restProps } = props;
  const [size, setSize] = useState(width || 0);

  if (!width) {
    return <th {...restProps} />;
  }

  const handleResize = (_: SyntheticEvent, { size: { width } }: ResizeCallbackData) => {
    if (!tableRef.current) {
      return;
    }

    setSize(width);

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
};

function Table<T extends object = any>(props: Props<T>) {
  const {
    loading = false,
    summaryRecord,
    summaryTitle = '总合计',
    rowSelection,
    columns,
    rowKey,
    ...restProps
  } = props;

  const hasRowSelection = !!rowSelection;
  const hasSummaryRecord = summaryRecord !== undefined;

  const tableWrapper = useRef<HTMLDivElement>(null);

  const cols = useMemo(() => {
    if (columns === undefined) {
      return [];
    }

    const cols: ColumnType<T>[] = [];

    columns.forEach((col, index) => {
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

      cols.push({
        ellipsis: true,
        width,
        align,
        onHeaderCell: (column: ColumnType<T>) =>
          ({
            width: column.width,
            tableRef: tableWrapper,
            index: index + (hasRowSelection ? 1 : 0),
          } as any),
        ...col,
      });
    });

    cols.push({
      title: '',
      dataIndex: 'empty_col',
      width: 'auto',
      shouldCellUpdate: () => false,
      render: () => '',
    });

    return cols;
  }, [columns, hasRowSelection]);

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
          rowSelection={rowSelection}
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
              rowSelection?.onChange?.(
                [typeof rowKey === 'function' ? rowKey(record) : record[rowKey || 'key']],
                [record],
              );
            },
          })}
          columns={cols}
          rowSelection={rowSelection}
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
