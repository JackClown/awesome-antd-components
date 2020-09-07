import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface Props {
  value?: string;
  title: string;
  onChange: (value?: string) => void;
  align?: string;
  index?: number;
}

enum SortValue {
  ASC = 'asc',
  DESC = 'desc',
}

export default function Sort(props: Props) {
  const { value, title, onChange, align, index } = props;

  const [val, setVal] = useState(value);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleChange = useCallback(
    debounce((value?: string) => {
      onChange(value);
    }, 500),
    [onChange],
  );

  let node;

  if (val === SortValue.DESC) {
    node = (
      <svg xmlns="http://www.w3.org/2000/svg" width="8px" height="10px">
        <path
          fillRule="evenodd"
          fill="rgb(6, 57, 133)"
          d="M3.971,9.785 L-0.000,6.000 L8.000,6.000 L3.971,9.785 Z"
        />
        <path
          fillRule="evenodd"
          fill="rgb(153, 153, 153)"
          d="M4.000,-0.000 L8.000,4.000 L-0.000,4.000 L4.000,-0.000 Z"
        />
      </svg>
    );
  } else if (val === SortValue.ASC) {
    node = (
      <svg xmlns="http://www.w3.org/2000/svg" width="8px" height="10px">
        <path
          fillRule="evenodd"
          fill="rgb(6, 57, 133)"
          d="M4.029,0.215 L8.000,4.000 L-0.000,4.000 L4.029,0.215 Z"
        />
        <path
          fillRule="evenodd"
          fill="rgb(153, 153, 153)"
          d="M4.000,10.000 L-0.000,6.000 L8.000,6.000 L4.000,10.000 Z"
        />
      </svg>
    );
  } else {
    node = (
      <svg xmlns="http://www.w3.org/2000/svg" width="8px" height="10px">
        <path
          fillRule="evenodd"
          fill="rgb(153, 153, 153)"
          d="M4.029,0.215 L8.000,4.000 L-0.000,4.000 L4.029,0.215 ZM4.000,10.000 L0.004,6.008 L8.000,6.000 L4.000,10.000 Z"
        />
      </svg>
    );
  }

  const handleClick = () => {
    let nextVal;

    if (val === SortValue.DESC) {
      nextVal = undefined;
    } else if (val === SortValue.ASC) {
      nextVal = SortValue.DESC;
    } else {
      nextVal = SortValue.ASC;
    }

    setVal(nextVal);
    handleChange(nextVal);
  };

  let justify;

  switch (align) {
    case 'right':
      justify = 'flex-end';
      break;
    case 'center':
      justify = 'center';
      break;
    default:
  }

  return (
    <div
      className="itable-sort"
      onClick={handleClick}
      style={justify ? { justifyContent: justify } : undefined}
    >
      <div className="itable-sort-title">{title}</div>
      <div>
        {node}
        {index !== undefined && <span className="itable-sort-number">{index}</span>}
      </div>
    </div>
  );
}
