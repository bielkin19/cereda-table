import { useCallback, useRef, useState } from 'react';

import { resolveUpdater } from '../lib/resolve-updater';

interface ControllableStateOptions<T> {
  value: T | undefined;
  onChange: ((value: T) => void) | undefined;
  defaultValue: T;
}

/**
 * Manages one table state slice with three modes:
 *
 * 1. **Fully uncontrolled** — `value` and `onChange` both omitted.
 *    Internal state is maintained; no external notification.
 *
 * 2. **Uncontrolled + observer** — only `onChange` provided, `value` omitted.
 *    Internal state is maintained AND `onChange` is called with the resolved
 *    next value after every change. The table still updates its own rows.
 *
 * 3. **Fully controlled** — both `value` and `onChange` provided.
 *    The parent owns the state; `onChange` is called with the resolved next
 *    value and the parent must feed it back via the `value` prop. Without that
 *    feedback the table stays at the current `value`.
 *
 * External `onChange` is **always** called with the resolved `T` value —
 * never with a raw TanStack functional updater.
 *
 * From TanStack's perspective the slice is always "controlled": we always pass
 * a concrete value and always provide a setter. The controlled/uncontrolled
 * distinction is handled entirely inside this hook.
 */
export function useControllableState<T>({
  value,
  onChange,
  defaultValue,
}: ControllableStateOptions<T>): readonly [T, (updater: T | ((old: T) => T)) => void] {
  const [internalValue, setInternalValue] = useState<T>(defaultValue);

  // Refs let the stable setter callback read the latest values without
  // needing to be recreated on every render.
  const valueRef = useRef(value);
  valueRef.current = value;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track internalValue in a ref so the setter can read it without listing it
  // as a dependency (which would destabilise the callback on every update).
  const internalValueRef = useRef(internalValue);
  internalValueRef.current = internalValue;

  const setter = useCallback((updater: T | ((old: T) => T)) => {
    const isControlled = valueRef.current !== undefined;

    // When controlled, valueRef.current is guaranteed non-undefined by the
    // isControlled check — the cast is safe and intentional.
    const current: T = isControlled
      ? (valueRef.current as T)
      : internalValueRef.current;

    const nextValue = resolveUpdater(updater, current);

    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onChangeRef.current?.(nextValue);
  }, []); // Stable reference — all mutable reads flow through refs.

  const currentValue = value !== undefined ? value : internalValue;
  return [currentValue, setter] as const;
}
