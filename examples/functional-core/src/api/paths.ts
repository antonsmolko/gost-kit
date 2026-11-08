/** Small synthetic OpenAPI shape for this example, not a production API. */
export type Paths = {
  '/user': {
    post: {
      requestBody: { content: { 'application/json': { email: string } } };
      responses: {
        200: {
          content: {
            'application/json': {
              user_id: number;
              full_name: string;
              email: string;
            };
          };
        };
      };
    };
  };
};
