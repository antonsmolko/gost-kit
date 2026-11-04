/** Internal shape of the already parsed openapi-fetch response. */
export type TransportResponse<TData> =
  | { data: TData; response: Response }
  | { error: unknown; response: Response };
