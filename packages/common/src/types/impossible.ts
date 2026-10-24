export type Impossible<Keys extends PropertyKey> = {
  [Key in Keys]: never;
};
