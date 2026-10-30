import type { AnyFn, Nil, Rec } from '../../types';

const MAX_SAFE_INTEGER_DIGITS = 19;

const HTTP_PROTOCOLS = ['http:', 'https:'];

export const guard = {
  ulx: (value: unknown): value is undefined => {
    return value === undefined;
  },
  nlx: (value: unknown): value is null => {
    return value === null;
  },
  nil: (value: unknown): value is null | undefined => {
    return guard.ulx(value) || guard.nlx(value);
  },
  boolean: (value: unknown): value is boolean => {
    return typeof value === 'boolean';
  },
  true: (value: unknown): value is true => {
    return value === true;
  },
  false: (value: unknown): value is false => {
    return value === false;
  },
  string: (value: unknown): value is string => {
    return typeof value === 'string';
  },
  stringTruly: (value: unknown): value is string => {
    return guard.string(value) && value.length > 0;
  },
  stringFilled: (value: unknown): value is string => {
    return guard.string(value) && value.trim().length > 0;
  },
  stringInt: (value: unknown): value is string => {
    return (
      guard.stringFilled(value) &&
      value.length <= MAX_SAFE_INTEGER_DIGITS &&
      /^\d+$/.test(value) &&
      BigInt(value) <= BigInt(Number.MAX_SAFE_INTEGER)
    );
  },
  number: (value: unknown): value is number => {
    return typeof value === 'number' && Number.isFinite(value);
  },
  positiveSafeInteger: (value: unknown): value is number => {
    return guard.number(value) && Number.isSafeInteger(value) && value > 0;
  },
  httpURL: (value: unknown): value is string => {
    if (!guard.stringFilled(value)) {
      return false;
    }

    try {
      const url = new URL(value);
      return HTTP_PROTOCOLS.includes(url.protocol);
    } catch {
      return false;
    }
  },
  record: (value: unknown): value is Rec => {
    return typeof value === 'object' && !guard.nlx(value) && !guard.array(value);
  },
  recordEmpty: (value: unknown): value is Rec<never> => {
    return guard.record(value) && Object.keys(value).length === 0;
  },
  function: (value: unknown): value is AnyFn => {
    return typeof value === 'function';
  },
  array: <T = unknown>(value: unknown): value is T[] => {
    return Array.isArray(value);
  },
  arrayEmpty: (value: unknown): value is [] => {
    return guard.array(value) && value.length === 0;
  },
  set: <T = unknown>(value: unknown): value is Set<T> => {
    return value instanceof Set;
  },
  error: (value: unknown): value is Error => {
    return value instanceof Error;
  },
  HTMLElement: (value: unknown): value is HTMLElement => {
    return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
  },
  HTMLAnchorElement: (value: unknown): value is HTMLAnchorElement => {
    return (
      typeof HTMLAnchorElement !== 'undefined' &&
      value instanceof HTMLAnchorElement
    );
  },
  SVGSVGElement: (value: unknown): value is SVGSVGElement => {
    return typeof SVGSVGElement !== 'undefined' && value instanceof SVGSVGElement;
  },
  promise: (value: unknown): value is Promise<unknown> => {
    return value instanceof Promise;
  },
  not: {
    nil: <T>(value: Nil<T>): value is T => {
      return !guard.nil(value);
    },
    boolean: <T>(value: T | boolean): value is T => {
      return !guard.boolean(value);
    },
    arrayEmpty: <T = unknown>(value: unknown): value is [T, ...T[]] => {
      return guard.array<T>(value) && value.length > 0;
    },
  },
  optional: {
    string: (value: unknown): value is Nil<string> => {
      return guard.string(value) || guard.nil(value);
    },
    number: (value: unknown): value is Nil<number> => {
      return guard.number(value) || guard.nil(value);
    },
    array: <T = unknown>(value: unknown): value is Nil<T[]> => {
      return guard.array<T>(value) || guard.nil(value);
    },
  },
};
