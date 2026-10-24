import type { Ulx } from './ulx.ts';

type ObjectToEntries<ObjectType extends object> = {
  [Key in keyof ObjectType]: [Key, ObjectType[Key]];
}[keyof ObjectType];

export interface TypedMap<ObjectType extends object> {
  readonly size: number;
  readonly [Symbol.toStringTag]: string;
  [Symbol.iterator](): IterableIterator<ObjectToEntries<ObjectType>>;
  entries(): IterableIterator<ObjectToEntries<ObjectType>>;
  forEach(
    callback: <Key extends keyof ObjectType>(
      value: ObjectType[Key],
      key: Key,
      map: TypedMap<ObjectType>,
    ) => void,
    thisArg?: unknown,
  ): void;
  get<Key extends keyof ObjectType>(key: Key): Ulx<ObjectType[Key]>;
  keys(): IterableIterator<keyof ObjectType>;
  set<Key extends keyof ObjectType>(key: Key, value: ObjectType[Key]): this;
  values(): IterableIterator<ObjectType[keyof ObjectType]>;
}
