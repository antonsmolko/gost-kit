import { describe, expect, it, vi } from 'vitest';
import { guard } from '../..';

describe('guard', () => {
  it('distinguishes missing and boolean values', () => {
    expect(guard.ulx(undefined)).toBe(true);

    expect(guard.ulx(null)).toBe(false);

    expect(guard.nlx(null)).toBe(true);

    expect(guard.nil(undefined)).toBe(true);

    expect(guard.nil(null)).toBe(true);

    expect(guard.nil(0)).toBe(false);

    expect(guard.boolean(false)).toBe(true);

    expect(guard.true(true)).toBe(true);

    expect(guard.true(1)).toBe(false);

    expect(guard.false(false)).toBe(true);

    expect(guard.not.nil(0)).toBe(true);

    expect(guard.not.boolean('false')).toBe(true);
  });

  it('distinguishes nonempty, filled, and safe integer strings', () => {
    expect(guard.string('')).toBe(true);

    expect(guard.stringTruly('')).toBe(false);

    expect(guard.stringTruly(' ')).toBe(true);

    expect(guard.stringFilled('\u2003')).toBe(false);

    expect(guard.stringFilled(' 0 ')).toBe(true);
    for (const value of ['0', '000', '42', String(Number.MAX_SAFE_INTEGER)]) {
      expect(guard.stringInt(value)).toBe(true);
    }
    for (const value of [
      '',
      ' 1',
      '+1',
      '-1',
      '1.0',
      '1e2',
      '9007199254740992',
      '0'.repeat(20),
    ]) {
      expect(guard.stringInt(value)).toBe(false);
    }
  });
});

describe('guard for values and collections', () => {
  it('accepts only finite numbers', () => {
    expect(guard.number(0)).toBe(true);

    expect(guard.number(-1.5)).toBe(true);

    expect(guard.number(NaN)).toBe(false);

    expect(guard.number(Infinity)).toBe(false);

    expect(guard.number(-Infinity)).toBe(false);

    expect(guard.number('1')).toBe(false);
  });

  it('accepts only positive safe integers', () => {
    for (const value of [1, 17, Number.MAX_SAFE_INTEGER]) {
      expect(guard.positiveSafeInteger(value)).toBe(true);
    }

    for (const value of [
      0,
      -1,
      1.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
      '1',
    ]) {
      expect(guard.positiveSafeInteger(value)).toBe(false);
    }
  });

  it('accepts only absolute HTTP(S) URLs', () => {
    for (const value of [
      'https://example.org/file',
      'http://example.org/file',
    ]) {
      expect(guard.httpURL(value)).toBe(true);
    }

    for (const value of [
      '',
      ' ',
      '/relative',
      '//example.org/file',
      'mailto:a@example.org',
      'javascript:alert(1)',
      'ftp://example.org/file',
      1,
    ]) {
      expect(guard.httpURL(value)).toBe(false);
    }
  });
});

describe('guard for objects and collections', () => {
  it('classifies records and collections', () => {
    expect(guard.record({ value: 1 })).toBe(true);

    expect(guard.record([])).toBe(false);

    expect(guard.record(null)).toBe(false);

    expect(guard.recordEmpty({})).toBe(true);

    expect(guard.recordEmpty({ value: undefined })).toBe(false);

    expect(guard.array([])).toBe(true);

    expect(guard.arrayEmpty([])).toBe(true);

    expect(guard.not.arrayEmpty([0])).toBe(true);

    expect(guard.not.arrayEmpty([])).toBe(false);

    expect(guard.set(new Set())).toBe(true);

    expect(
      guard.function(() => {
        return undefined;
      }),
    ).toBe(true);
  });

  it('recognizes Error and native Promise instances', () => {
    expect(guard.error(new Error('failure'))).toBe(true);

    expect(guard.error({ name: 'Error', message: 'failure' })).toBe(false);

    expect(guard.promise(Promise.resolve(1))).toBe(true);

    expect(
      guard.promise({
        then: () => {
          return undefined;
        },
      }),
    ).toBe(false);
  });

  it('recognizes DOM elements without throwing for ordinary values', () => {
    // This suite runs in Node; provide constructors for the instanceof checks.
    class Element {}
    class Anchor extends Element {}
    class Svg {}

    vi.stubGlobal('HTMLElement', Element);
    vi.stubGlobal('HTMLAnchorElement', Anchor);
    vi.stubGlobal('SVGSVGElement', Svg);
    try {
      const anchor = new Anchor();
      const svg = new Svg();

      expect(guard.HTMLElement(anchor)).toBe(true);
      expect(guard.HTMLAnchorElement(anchor)).toBe(true);
      expect(guard.HTMLAnchorElement(new Element())).toBe(false);
      expect(guard.SVGSVGElement(svg)).toBe(true);
      expect(guard.SVGSVGElement(anchor)).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('returns false when DOM constructors are unavailable', () => {
    vi.stubGlobal('HTMLElement', undefined);

    vi.stubGlobal('HTMLAnchorElement', undefined);

    vi.stubGlobal('SVGSVGElement', undefined);
    try {
      expect(guard.HTMLElement({})).toBe(false);

      expect(guard.HTMLAnchorElement({})).toBe(false);

      expect(guard.SVGSVGElement({})).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('accepts nil values in optional guards', () => {
    expect(guard.optional.string(null)).toBe(true);

    expect(guard.optional.string(undefined)).toBe(true);

    expect(guard.optional.string('')).toBe(true);

    expect(guard.optional.string(0)).toBe(false);

    expect(guard.optional.number(0)).toBe(true);

    expect(guard.optional.number(Infinity)).toBe(false);

    expect(guard.optional.array([])).toBe(true);

    expect(guard.optional.array(null)).toBe(true);

    expect(guard.optional.array({})).toBe(false);
  });
});
