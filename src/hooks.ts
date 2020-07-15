import { useEffect, useRef } from 'react';
import { isEqualWith, isEqual } from 'lodash';

export function useAsyncEffect(
  cb: (flag: { cancelled: boolean }) => Promise<any>,
  deps: any[] = [],
) {
  useEffect(() => {
    const flag = { cancelled: false };

    cb(flag);

    return () => {
      flag.cancelled = true;
    };
  }, deps);
}

export function useDeepCompareMemoize<T = any>(value: T) {
  const ref = useRef(value);

  if (
    !isEqualWith(ref.current, value, (value, other) => {
      if (typeof value === 'function' && typeof other === 'function') {
        return true;
      }

      return undefined;
    })
  ) {
    ref.current = value;
  }

  return ref.current;
}

export function useCompareMemoize<T = any>(value: T) {
  const ref = useRef(value);

  if (!isEqual(ref.current, value)) {
    ref.current = value;
  }

  return ref.current;
}
