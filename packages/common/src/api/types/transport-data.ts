/** Only the success branch has a required data field. */
export type TransportData<TResponse> = TResponse extends { data: infer TData }
  ? TData
  : never;
