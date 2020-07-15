import React from 'react';
import { Form as AntdForm } from 'antd';
import { FormProps, FormItemProps } from 'antd/lib/form';
import classNames from 'classnames';

import './index.less';

interface FormType extends Pick<typeof AntdForm, 'List' | 'Provider' | 'useForm'> {
  (props: FormProps): JSX.Element;
  Item(
    props: FormItemProps & {
      colSpan?: number;
    },
  ): JSX.Element;
  Br(): JSX.Element;
}

const Form = (props: FormProps) => {
  const { className, children, ...restProps } = props;

  const formItemLayout = {
    labelCol: {
      flex: '0 0 120px',
    },
    wrapperCol: {
      flex: '1 1',
    },
  };

  return (
    <AntdForm
      layout="inline"
      className={classNames('form', className)}
      {...formItemLayout}
      {...restProps}
    >
      {children}
    </AntdForm>
  );
};

Object.assign(Form, AntdForm);

Form.Item = (props: FormItemProps & { colSpan?: number }) => {
  const { colSpan = 6, ...restProps } = props;

  return <AntdForm.Item {...restProps} style={{ width: `${(colSpan / 24) * 100}%` }} />;
};

Form.Br = () => {
  return <div className="form-br" />;
};

export default Form as FormType;
