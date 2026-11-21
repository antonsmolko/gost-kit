export type CommonRuleOptions = [{ commonRoot?: string }?];

export const commonRuleSchema = [
  {
    type: 'object',
    properties: { commonRoot: { type: 'string' } },
    additionalProperties: false,
  },
] as const;
