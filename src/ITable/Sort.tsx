import React from 'react';

interface Props {
  value?: string;
  title: string;
  onChange: (value?: string) => void;
}

enum SortValue {
  ASC = 'asc',
  DESC = 'desc',
}

export default function Sort(props: Props) {
  const { value, title, onChange } = props;

  let node;

  if (value === SortValue.DESC) {
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
  } else if (value === SortValue.ASC) {
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
    let nextValue;

    if (value === SortValue.DESC) {
      nextValue = undefined;
    } else if (value === SortValue.ASC) {
      nextValue = SortValue.DESC;
    } else {
      nextValue = SortValue.ASC;
    }

    onChange(nextValue);
  };

  return (
    <div className="itable-sort" onClick={handleClick}>
      <div className="itable-sort-title">{title}</div>
      <div>{node}</div>
    </div>
  );
}
