import type { ApiOperationDefinition } from '../types/api-operation-definition';
import type { DefinedApiOperation } from '../types/defined-api-operation';

export const defineApiOperation = <TPaths extends object>() => {
  return <const TDefinition extends ApiOperationDefinition<TPaths>>(
    definition: TDefinition,
  ): DefinedApiOperation<TPaths, TDefinition> => {
    // The conditional return type selects either the supplied mapper or identity.
    // The runtime branches preserve precisely that relationship.
    return {
      method: definition.method,
      url: definition.url,
      mapResponse:
        definition.mapResponse ??
        ((dto: unknown) => {
          return dto;
        }),
    } as DefinedApiOperation<TPaths, TDefinition>;
  };
};
