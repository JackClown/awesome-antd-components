import React, {
  ComponentType,
  useState,
  createElement,
  ReactElement,
  cloneElement,
  ReactNode,
  SyntheticEvent,
  useEffect,
  useRef,
} from 'react';
import { Modal, Input } from 'antd';
import { ModalProps } from 'antd/lib/modal';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';

import './index.less';

export interface PopupProps<T> extends ModalProps {
  formatLabel: (value: T) => string;
  children?: ReactElement<any>;
  value?: T;
  onChange?: (value?: T) => void;
  allowClear?: boolean;
  component: ComponentType<{
    value?: T;
    onChange: (value?: T) => void;
  }>;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function Popup<T>(props: PopupProps<T>) {
  const {
    value: valueProp,
    onChange,
    component,
    children,
    formatLabel,
    disabled = false,
    allowClear = false,
    autoFocus,
    ...restProps
  } = props;

  const [value, setValue] = useState(valueProp);

  const [visible, setVisible] = useState(false);

  const inputRef = useRef<Input>(null);

  useEffect(() => {
    setValue(valueProp);
  }, [valueProp]);

  const handleCancel = () => {
    setVisible(false);
  };

  const handleOpen = () => {
    setVisible(true);
  };

  const handleOk = () => {
    setVisible(false);

    if (onChange) {
      onChange(value);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = (e: SyntheticEvent) => {
    e.stopPropagation();

    if (onChange) {
      onChange(undefined);
    }
  };

  const label = valueProp ? formatLabel(valueProp) : '';

  let trigger: ReactNode;

  if (children) {
    trigger = cloneElement(
      children,
      {
        onClick: handleOpen,
      },
      label,
    );
  } else {
    trigger = (
      <Input
        className="popup-input"
        value={label}
        readOnly
        ref={inputRef}
        disabled={disabled}
        onClick={handleOpen}
        autoFocus={autoFocus}
        suffix={
          <>
            {allowClear && label && (
              <CloseCircleFilled className="ant-input-clear-icon" onClick={handleClear} />
            )}
            <SearchOutlined style={{ color: '#999' }} />
          </>
        }
      />
    );
  }

  return (
    <>
      {trigger}
      <Modal
        destroyOnClose
        visible={visible}
        width={896}
        centered
        onCancel={handleCancel}
        onOk={handleOk}
        okText="确认"
        cancelText="取消"
        bodyStyle={{ height: '525px', padding: '10px' }}
        {...restProps}
      >
        {createElement(component, {
          value,
          onChange: val => {
            setValue(val);
          },
        })}
      </Modal>
    </>
  );
}