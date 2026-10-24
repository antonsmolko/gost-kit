type CompareSame<T> = {
  type: 'same';
  data: T;
};

type CompareDifferent<T> = {
  type: 'different';
  data: T;
};

export type Compare<T> = CompareSame<T> | CompareDifferent<T>;
