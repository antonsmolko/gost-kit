import type { User } from '../features/user/domain/entities/user';

/** Small synthetic OpenAPI shape for this example, not a production API. */
export type Paths = {
  '/user': {
    post: {
      requestBody: { content: { 'application/json': { email: string } } };
      responses: { 200: { content: { 'application/json': User } } };
    };
  };
};
