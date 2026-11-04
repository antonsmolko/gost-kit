import type { createApiClient } from '../lib/create-api-client';

/** Keep the public contract identical to the factory's inferred request signature. */
export type ApiClient<TPaths extends object> = ReturnType<typeof createApiClient<TPaths>>;
