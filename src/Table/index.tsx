import React from 'react';
import { Pagination } from 'antd';
import { PaginationProps } from 'antd/lib/pagination';

import Table, { Props as TableProps, ColumnType as TableColumnType } from './Table';
import Section from '../Section';

export type ColumnType<T> = TableColumnType<T>;

interface Props<T> extends Omit<TableProps<T>, 'title'> {
  title?: string;
  pagination?: PaginationProps;
}

export default function TableSection<T extends object = any>(props: Props<T>) {
  const { pagination, title, ...restProps } = props;

  return (
    <Section type="table" title={title} footer={!!pagination && <Pagination {...pagination} />}>
      <Table {...restProps} />
    </Section>
  );
}
