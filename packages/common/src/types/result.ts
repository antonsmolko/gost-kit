type ResultOk<T> = {
  type: 'ok';
  data: T;
};

type ResultFail = {
  type: 'error';
  error?: Error;
};

export type Result<T = unknown> = ResultOk<T> | ResultFail;
