# Effective rule inventory

Calculated with ESLint 10.14.0, @eslint/js 10.0.1, typescript-eslint 8.72.1,
Stylistic 5.10.0, Import-X 4.17.1 and eslint-config-prettier 10.1.8.
This records the complete base configuration before consumer overrides.
All active rules have error severity. Tests have no automatic exceptions.

## JavaScript: 77 active rules

| Rule                                         | Level/options                                                                                                                                                                                                                                                                                                                                               | Source                 | Policy      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------- |
| `@stylistic/padding-line-between-statements` | `["error",{"blankLine":"always","prev":"*","next":"if"},{"blankLine":"always","prev":"*","next":"return"},{"blankLine":"always","prev":["const","let","var","export"],"next":"*"},{"blankLine":"always","prev":"*","next":["const","let","var","export"]},{"blankLine":"any","prev":["const","let","var","export"],"next":["const","let","var","export"]}]` | Selected shared policy | E10/E11/E12 |
| `arrow-body-style`                           | `["error","always"]`                                                                                                                                                                                                                                                                                                                                        | Selected shared policy | A01         |
| `constructor-super`                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `curly`                                      | `["error","all"]`                                                                                                                                                                                                                                                                                                                                           | Selected shared policy | E02         |
| `eqeqeq`                                     | `["error","always"]`                                                                                                                                                                                                                                                                                                                                        | Selected shared policy | E03         |
| `for-direction`                              | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `getter-return`                              | `["error",{"allowImplicit":false}]`                                                                                                                                                                                                                                                                                                                         | @eslint/js recommended | E01         |
| `import-x/no-default-export`                 | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected shared policy | A02         |
| `import-x/no-duplicates`                     | `["error",{"prefer-inline":true}]`                                                                                                                                                                                                                                                                                                                          | Selected shared policy | E09         |
| `no-async-promise-executor`                  | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-await-in-loop`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected shared policy | A04         |
| `no-case-declarations`                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-class-assign`                            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-compare-neg-zero`                        | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-cond-assign`                             | `["error","except-parens"]`                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-const-assign`                            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-constant-binary-expression`              | `["error",{"checkRelationalComparisons":false}]`                                                                                                                                                                                                                                                                                                            | @eslint/js recommended | E01         |
| `no-constant-condition`                      | `["error",{"checkLoops":"allExceptWhileTrue"}]`                                                                                                                                                                                                                                                                                                             | @eslint/js recommended | E01         |
| `no-control-regex`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-debugger`                                | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-delete-var`                              | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-dupe-args`                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-dupe-class-members`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-dupe-else-if`                            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-dupe-keys`                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-duplicate-case`                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-else-return`                             | `["error",{"allowElseIf":false}]`                                                                                                                                                                                                                                                                                                                           | Selected shared policy | E06         |
| `no-empty`                                   | `["error",{"allowEmptyCatch":false}]`                                                                                                                                                                                                                                                                                                                       | @eslint/js recommended | E01         |
| `no-empty-character-class`                   | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-empty-pattern`                           | `["error",{"allowObjectPatternsAsParameters":false}]`                                                                                                                                                                                                                                                                                                       | @eslint/js recommended | E01         |
| `no-empty-static-block`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-ex-assign`                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-extra-boolean-cast`                      | `["error",{}]`                                                                                                                                                                                                                                                                                                                                              | @eslint/js recommended | E01         |
| `no-fallthrough`                             | `["error",{"allowEmptyCase":false,"reportUnusedFallthroughComment":false}]`                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-func-assign`                             | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-global-assign`                           | `["error",{"exceptions":[]}]`                                                                                                                                                                                                                                                                                                                               | @eslint/js recommended | E01         |
| `no-import-assign`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-invalid-regexp`                          | `["error",{}]`                                                                                                                                                                                                                                                                                                                                              | @eslint/js recommended | E01         |
| `no-irregular-whitespace`                    | `["error",{"skipComments":false,"skipJSXText":false,"skipRegExps":false,"skipStrings":true,"skipTemplates":false}]`                                                                                                                                                                                                                                         | @eslint/js recommended | E01         |
| `no-loss-of-precision`                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-misleading-character-class`              | `["error",{"allowEscape":false}]`                                                                                                                                                                                                                                                                                                                           | @eslint/js recommended | E01         |
| `no-new-native-nonconstructor`               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-nonoctal-decimal-escape`                 | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-obj-calls`                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-octal`                                   | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-param-reassign`                          | `["error",{"props":true}]`                                                                                                                                                                                                                                                                                                                                  | Selected shared policy | A03         |
| `no-plusplus`                                | `["error",{"allowForLoopAfterthoughts":false}]`                                                                                                                                                                                                                                                                                                             | Selected shared policy | A05         |
| `no-prototype-builtins`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-redeclare`                               | `["error",{"builtinGlobals":true}]`                                                                                                                                                                                                                                                                                                                         | @eslint/js recommended | E01         |
| `no-regex-spaces`                            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-restricted-syntax`                       | `["error",{"selector":"ForOfStatement","message":"for...of is disabled by the shared policy; use an appropriate alternative or an explicit project override."}]`                                                                                                                                                                                            | Selected shared policy | A06         |
| `no-self-assign`                             | `["error",{"props":true}]`                                                                                                                                                                                                                                                                                                                                  | @eslint/js recommended | E01         |
| `no-setter-return`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-shadow-restricted-names`                 | `["error",{"reportGlobalThis":true}]`                                                                                                                                                                                                                                                                                                                       | @eslint/js recommended | E01         |
| `no-sparse-arrays`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-this-before-super`                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-unassigned-vars`                         | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-undef`                                   | `["error",{"typeof":false}]`                                                                                                                                                                                                                                                                                                                                | @eslint/js recommended | E01         |
| `no-unreachable`                             | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-unsafe-finally`                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-unsafe-negation`                         | `["error",{"enforceForOrderingRelations":false}]`                                                                                                                                                                                                                                                                                                           | @eslint/js recommended | E01         |
| `no-unsafe-optional-chaining`                | `["error",{"disallowArithmeticOperators":false}]`                                                                                                                                                                                                                                                                                                           | @eslint/js recommended | E01         |
| `no-unused-labels`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-unused-private-class-members`            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-unused-vars`                             | `["error",{"vars":"all","args":"all","ignoreRestSiblings":false,"caughtErrors":"all","ignoreClassWithStaticInitBlock":false,"ignoreUsingDeclarations":false,"reportUsedIgnorePattern":false,"argsIgnorePattern":"^_"}]`                                                                                                                                     | Selected shared policy | E05         |
| `no-useless-assignment`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-useless-backreference`                   | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-useless-catch`                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `no-useless-escape`                          | `["error",{"allowRegexCharacters":[]}]`                                                                                                                                                                                                                                                                                                                     | @eslint/js recommended | E01         |
| `no-var`                                     | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected shared policy | E04         |
| `no-with`                                    | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `object-shorthand`                           | `["error","always"]`                                                                                                                                                                                                                                                                                                                                        | Selected shared policy | E07         |
| `prefer-const`                               | `["error",{"destructuring":"any","ignoreReadBeforeAssign":false}]`                                                                                                                                                                                                                                                                                          | Selected shared policy | E04         |
| `preserve-caught-error`                      | `["error",{"requireCatchParameter":false,"errorClassNames":[]}]`                                                                                                                                                                                                                                                                                            | @eslint/js recommended | E01         |
| `require-yield`                              | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |
| `use-isnan`                                  | `["error",{"enforceForIndexOf":false,"enforceForSwitchCase":true}]`                                                                                                                                                                                                                                                                                         | @eslint/js recommended | E01         |
| `valid-typeof`                               | `["error",{"requireStringLiterals":false}]`                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended | E01         |

Disabled inherited/compatibility rules (level off):

- `@babel/object-curly-spacing` — Prettier compatibility
- `@babel/semi` — Prettier compatibility
- `@stylistic/array-bracket-newline` — Prettier compatibility
- `@stylistic/array-bracket-spacing` — Prettier compatibility
- `@stylistic/array-element-newline` — Prettier compatibility
- `@stylistic/arrow-parens` — Prettier compatibility
- `@stylistic/arrow-spacing` — Prettier compatibility
- `@stylistic/block-spacing` — Prettier compatibility
- `@stylistic/brace-style` — Prettier compatibility
- `@stylistic/comma-dangle` — Prettier compatibility
- `@stylistic/comma-spacing` — Prettier compatibility
- `@stylistic/comma-style` — Prettier compatibility
- `@stylistic/computed-property-spacing` — Prettier compatibility
- `@stylistic/dot-location` — Prettier compatibility
- `@stylistic/eol-last` — Prettier compatibility
- `@stylistic/func-call-spacing` — Prettier compatibility
- `@stylistic/function-call-argument-newline` — Prettier compatibility
- `@stylistic/function-call-spacing` — Prettier compatibility
- `@stylistic/function-paren-newline` — Prettier compatibility
- `@stylistic/generator-star-spacing` — Prettier compatibility
- `@stylistic/implicit-arrow-linebreak` — Prettier compatibility
- `@stylistic/indent` — Prettier compatibility
- `@stylistic/indent-binary-ops` — Prettier compatibility
- `@stylistic/js/array-bracket-newline` — Prettier compatibility
- `@stylistic/js/array-bracket-spacing` — Prettier compatibility
- `@stylistic/js/array-element-newline` — Prettier compatibility
- `@stylistic/js/arrow-parens` — Prettier compatibility
- `@stylistic/js/arrow-spacing` — Prettier compatibility
- `@stylistic/js/block-spacing` — Prettier compatibility
- `@stylistic/js/brace-style` — Prettier compatibility
- `@stylistic/js/comma-dangle` — Prettier compatibility
- `@stylistic/js/comma-spacing` — Prettier compatibility
- `@stylistic/js/comma-style` — Prettier compatibility
- `@stylistic/js/computed-property-spacing` — Prettier compatibility
- `@stylistic/js/dot-location` — Prettier compatibility
- `@stylistic/js/eol-last` — Prettier compatibility
- `@stylistic/js/func-call-spacing` — Prettier compatibility
- `@stylistic/js/function-call-argument-newline` — Prettier compatibility
- `@stylistic/js/function-call-spacing` — Prettier compatibility
- `@stylistic/js/function-paren-newline` — Prettier compatibility
- `@stylistic/js/generator-star-spacing` — Prettier compatibility
- `@stylistic/js/implicit-arrow-linebreak` — Prettier compatibility
- `@stylistic/js/indent` — Prettier compatibility
- `@stylistic/js/jsx-quotes` — Prettier compatibility
- `@stylistic/js/key-spacing` — Prettier compatibility
- `@stylistic/js/keyword-spacing` — Prettier compatibility
- `@stylistic/js/linebreak-style` — Prettier compatibility
- `@stylistic/js/lines-around-comment` — Prettier compatibility
- `@stylistic/js/max-len` — Prettier compatibility
- `@stylistic/js/max-statements-per-line` — Prettier compatibility
- `@stylistic/js/multiline-ternary` — Prettier compatibility
- `@stylistic/js/new-parens` — Prettier compatibility
- `@stylistic/js/newline-per-chained-call` — Prettier compatibility
- `@stylistic/js/no-confusing-arrow` — Prettier compatibility
- `@stylistic/js/no-extra-parens` — Prettier compatibility
- `@stylistic/js/no-extra-semi` — Prettier compatibility
- `@stylistic/js/no-floating-decimal` — Prettier compatibility
- `@stylistic/js/no-mixed-operators` — Prettier compatibility
- `@stylistic/js/no-mixed-spaces-and-tabs` — Prettier compatibility
- `@stylistic/js/no-multi-spaces` — Prettier compatibility
- `@stylistic/js/no-multiple-empty-lines` — Prettier compatibility
- `@stylistic/js/no-tabs` — Prettier compatibility
- `@stylistic/js/no-trailing-spaces` — Prettier compatibility
- `@stylistic/js/no-whitespace-before-property` — Prettier compatibility
- `@stylistic/js/nonblock-statement-body-position` — Prettier compatibility
- `@stylistic/js/object-curly-newline` — Prettier compatibility
- `@stylistic/js/object-curly-spacing` — Prettier compatibility
- `@stylistic/js/object-property-newline` — Prettier compatibility
- `@stylistic/js/one-var-declaration-per-line` — Prettier compatibility
- `@stylistic/js/operator-linebreak` — Prettier compatibility
- `@stylistic/js/padded-blocks` — Prettier compatibility
- `@stylistic/js/quote-props` — Prettier compatibility
- `@stylistic/js/quotes` — Prettier compatibility
- `@stylistic/js/rest-spread-spacing` — Prettier compatibility
- `@stylistic/js/semi` — Prettier compatibility
- `@stylistic/js/semi-spacing` — Prettier compatibility
- `@stylistic/js/semi-style` — Prettier compatibility
- `@stylistic/js/space-before-blocks` — Prettier compatibility
- `@stylistic/js/space-before-function-paren` — Prettier compatibility
- `@stylistic/js/space-in-parens` — Prettier compatibility
- `@stylistic/js/space-infix-ops` — Prettier compatibility
- `@stylistic/js/space-unary-ops` — Prettier compatibility
- `@stylistic/js/switch-colon-spacing` — Prettier compatibility
- `@stylistic/js/template-curly-spacing` — Prettier compatibility
- `@stylistic/js/template-tag-spacing` — Prettier compatibility
- `@stylistic/js/wrap-iife` — Prettier compatibility
- `@stylistic/js/wrap-regex` — Prettier compatibility
- `@stylistic/js/yield-star-spacing` — Prettier compatibility
- `@stylistic/jsx-child-element-spacing` — Prettier compatibility
- `@stylistic/jsx-closing-bracket-location` — Prettier compatibility
- `@stylistic/jsx-closing-tag-location` — Prettier compatibility
- `@stylistic/jsx-curly-newline` — Prettier compatibility
- `@stylistic/jsx-curly-spacing` — Prettier compatibility
- `@stylistic/jsx-equals-spacing` — Prettier compatibility
- `@stylistic/jsx-first-prop-new-line` — Prettier compatibility
- `@stylistic/jsx-indent` — Prettier compatibility
- `@stylistic/jsx-indent-props` — Prettier compatibility
- `@stylistic/jsx-max-props-per-line` — Prettier compatibility
- `@stylistic/jsx-newline` — Prettier compatibility
- `@stylistic/jsx-one-expression-per-line` — Prettier compatibility
- `@stylistic/jsx-props-no-multi-spaces` — Prettier compatibility
- `@stylistic/jsx-quotes` — Prettier compatibility
- `@stylistic/jsx-tag-spacing` — Prettier compatibility
- `@stylistic/jsx-wrap-multilines` — Prettier compatibility
- `@stylistic/jsx/jsx-child-element-spacing` — Prettier compatibility
- `@stylistic/jsx/jsx-closing-bracket-location` — Prettier compatibility
- `@stylistic/jsx/jsx-closing-tag-location` — Prettier compatibility
- `@stylistic/jsx/jsx-curly-newline` — Prettier compatibility
- `@stylistic/jsx/jsx-curly-spacing` — Prettier compatibility
- `@stylistic/jsx/jsx-equals-spacing` — Prettier compatibility
- `@stylistic/jsx/jsx-first-prop-new-line` — Prettier compatibility
- `@stylistic/jsx/jsx-indent` — Prettier compatibility
- `@stylistic/jsx/jsx-indent-props` — Prettier compatibility
- `@stylistic/jsx/jsx-max-props-per-line` — Prettier compatibility
- `@stylistic/key-spacing` — Prettier compatibility
- `@stylistic/keyword-spacing` — Prettier compatibility
- `@stylistic/linebreak-style` — Prettier compatibility
- `@stylistic/lines-around-comment` — Prettier compatibility
- `@stylistic/max-len` — Prettier compatibility
- `@stylistic/max-statements-per-line` — Prettier compatibility
- `@stylistic/member-delimiter-style` — Prettier compatibility
- `@stylistic/multiline-ternary` — Prettier compatibility
- `@stylistic/new-parens` — Prettier compatibility
- `@stylistic/newline-per-chained-call` — Prettier compatibility
- `@stylistic/no-confusing-arrow` — Prettier compatibility
- `@stylistic/no-extra-parens` — Prettier compatibility
- `@stylistic/no-extra-semi` — Prettier compatibility
- `@stylistic/no-floating-decimal` — Prettier compatibility
- `@stylistic/no-mixed-operators` — Prettier compatibility
- `@stylistic/no-mixed-spaces-and-tabs` — Prettier compatibility
- `@stylistic/no-multi-spaces` — Prettier compatibility
- `@stylistic/no-multiple-empty-lines` — Prettier compatibility
- `@stylistic/no-tabs` — Prettier compatibility
- `@stylistic/no-trailing-spaces` — Prettier compatibility
- `@stylistic/no-whitespace-before-property` — Prettier compatibility
- `@stylistic/nonblock-statement-body-position` — Prettier compatibility
- `@stylistic/object-curly-newline` — Prettier compatibility
- `@stylistic/object-curly-spacing` — Prettier compatibility
- `@stylistic/object-property-newline` — Prettier compatibility
- `@stylistic/one-var-declaration-per-line` — Prettier compatibility
- `@stylistic/operator-linebreak` — Prettier compatibility
- `@stylistic/padded-blocks` — Prettier compatibility
- `@stylistic/quote-props` — Prettier compatibility
- `@stylistic/quotes` — Prettier compatibility
- `@stylistic/rest-spread-spacing` — Prettier compatibility
- `@stylistic/semi` — Prettier compatibility
- `@stylistic/semi-spacing` — Prettier compatibility
- `@stylistic/semi-style` — Prettier compatibility
- `@stylistic/space-before-blocks` — Prettier compatibility
- `@stylistic/space-before-function-paren` — Prettier compatibility
- `@stylistic/space-in-parens` — Prettier compatibility
- `@stylistic/space-infix-ops` — Prettier compatibility
- `@stylistic/space-unary-ops` — Prettier compatibility
- `@stylistic/switch-colon-spacing` — Prettier compatibility
- `@stylistic/template-curly-spacing` — Prettier compatibility
- `@stylistic/template-tag-spacing` — Prettier compatibility
- `@stylistic/ts/block-spacing` — Prettier compatibility
- `@stylistic/ts/brace-style` — Prettier compatibility
- `@stylistic/ts/comma-dangle` — Prettier compatibility
- `@stylistic/ts/comma-spacing` — Prettier compatibility
- `@stylistic/ts/func-call-spacing` — Prettier compatibility
- `@stylistic/ts/function-call-spacing` — Prettier compatibility
- `@stylistic/ts/indent` — Prettier compatibility
- `@stylistic/ts/key-spacing` — Prettier compatibility
- `@stylistic/ts/keyword-spacing` — Prettier compatibility
- `@stylistic/ts/lines-around-comment` — Prettier compatibility
- `@stylistic/ts/member-delimiter-style` — Prettier compatibility
- `@stylistic/ts/no-extra-parens` — Prettier compatibility
- `@stylistic/ts/no-extra-semi` — Prettier compatibility
- `@stylistic/ts/object-curly-spacing` — Prettier compatibility
- `@stylistic/ts/quotes` — Prettier compatibility
- `@stylistic/ts/semi` — Prettier compatibility
- `@stylistic/ts/space-before-blocks` — Prettier compatibility
- `@stylistic/ts/space-before-function-paren` — Prettier compatibility
- `@stylistic/ts/space-infix-ops` — Prettier compatibility
- `@stylistic/ts/type-annotation-spacing` — Prettier compatibility
- `@stylistic/type-annotation-spacing` — Prettier compatibility
- `@stylistic/type-generic-spacing` — Prettier compatibility
- `@stylistic/type-named-tuple-spacing` — Prettier compatibility
- `@stylistic/wrap-iife` — Prettier compatibility
- `@stylistic/wrap-regex` — Prettier compatibility
- `@stylistic/yield-star-spacing` — Prettier compatibility
- `@typescript-eslint/block-spacing` — Prettier compatibility
- `@typescript-eslint/brace-style` — Prettier compatibility
- `@typescript-eslint/comma-dangle` — Prettier compatibility
- `@typescript-eslint/comma-spacing` — Prettier compatibility
- `@typescript-eslint/func-call-spacing` — Prettier compatibility
- `@typescript-eslint/indent` — Prettier compatibility
- `@typescript-eslint/key-spacing` — Prettier compatibility
- `@typescript-eslint/keyword-spacing` — Prettier compatibility
- `@typescript-eslint/lines-around-comment` — Prettier compatibility
- `@typescript-eslint/member-delimiter-style` — Prettier compatibility
- `@typescript-eslint/no-extra-parens` — Prettier compatibility
- `@typescript-eslint/no-extra-semi` — Prettier compatibility
- `@typescript-eslint/object-curly-spacing` — Prettier compatibility
- `@typescript-eslint/quotes` — Prettier compatibility
- `@typescript-eslint/semi` — Prettier compatibility
- `@typescript-eslint/space-before-blocks` — Prettier compatibility
- `@typescript-eslint/space-before-function-paren` — Prettier compatibility
- `@typescript-eslint/space-infix-ops` — Prettier compatibility
- `@typescript-eslint/type-annotation-spacing` — Prettier compatibility
- `array-bracket-newline` — Prettier compatibility
- `array-bracket-spacing` — Prettier compatibility
- `array-element-newline` — Prettier compatibility
- `arrow-parens` — Prettier compatibility
- `arrow-spacing` — Prettier compatibility
- `babel/object-curly-spacing` — Prettier compatibility
- `babel/quotes` — Prettier compatibility
- `babel/semi` — Prettier compatibility
- `block-spacing` — Prettier compatibility
- `brace-style` — Prettier compatibility
- `comma-dangle` — Prettier compatibility
- `comma-spacing` — Prettier compatibility
- `comma-style` — Prettier compatibility
- `computed-property-spacing` — Prettier compatibility
- `dot-location` — Prettier compatibility
- `eol-last` — Prettier compatibility
- `flowtype/boolean-style` — Prettier compatibility
- `flowtype/delimiter-dangle` — Prettier compatibility
- `flowtype/generic-spacing` — Prettier compatibility
- `flowtype/object-type-curly-spacing` — Prettier compatibility
- `flowtype/object-type-delimiter` — Prettier compatibility
- `flowtype/quotes` — Prettier compatibility
- `flowtype/semi` — Prettier compatibility
- `flowtype/space-after-type-colon` — Prettier compatibility
- `flowtype/space-before-generic-bracket` — Prettier compatibility
- `flowtype/space-before-type-colon` — Prettier compatibility
- `flowtype/union-intersection-spacing` — Prettier compatibility
- `func-call-spacing` — Prettier compatibility
- `function-call-argument-newline` — Prettier compatibility
- `function-paren-newline` — Prettier compatibility
- `generator-star` — Prettier compatibility
- `generator-star-spacing` — Prettier compatibility
- `implicit-arrow-linebreak` — Prettier compatibility
- `indent` — Prettier compatibility
- `indent-legacy` — Prettier compatibility
- `jsx-quotes` — Prettier compatibility
- `key-spacing` — Prettier compatibility
- `keyword-spacing` — Prettier compatibility
- `linebreak-style` — Prettier compatibility
- `lines-around-comment` — Prettier compatibility
- `max-len` — Prettier compatibility
- `max-statements-per-line` — Prettier compatibility
- `multiline-ternary` — Prettier compatibility
- `new-parens` — Prettier compatibility
- `newline-per-chained-call` — Prettier compatibility
- `no-arrow-condition` — Prettier compatibility
- `no-comma-dangle` — Prettier compatibility
- `no-confusing-arrow` — Prettier compatibility
- `no-extra-parens` — Prettier compatibility
- `no-extra-semi` — Prettier compatibility
- `no-floating-decimal` — Prettier compatibility
- `no-mixed-operators` — Prettier compatibility
- `no-mixed-spaces-and-tabs` — Prettier compatibility
- `no-multi-spaces` — Prettier compatibility
- `no-multiple-empty-lines` — Prettier compatibility
- `no-reserved-keys` — Prettier compatibility
- `no-space-before-semi` — Prettier compatibility
- `no-spaced-func` — Prettier compatibility
- `no-tabs` — Prettier compatibility
- `no-trailing-spaces` — Prettier compatibility
- `no-unexpected-multiline` — Prettier compatibility
- `no-whitespace-before-property` — Prettier compatibility
- `no-wrap-func` — Prettier compatibility
- `nonblock-statement-body-position` — Prettier compatibility
- `object-curly-newline` — Prettier compatibility
- `object-curly-spacing` — Prettier compatibility
- `object-property-newline` — Prettier compatibility
- `one-var-declaration-per-line` — Prettier compatibility
- `operator-linebreak` — Prettier compatibility
- `padded-blocks` — Prettier compatibility
- `quote-props` — Prettier compatibility
- `quotes` — Prettier compatibility
- `react/jsx-child-element-spacing` — Prettier compatibility
- `react/jsx-closing-bracket-location` — Prettier compatibility
- `react/jsx-closing-tag-location` — Prettier compatibility
- `react/jsx-curly-newline` — Prettier compatibility
- `react/jsx-curly-spacing` — Prettier compatibility
- `react/jsx-equals-spacing` — Prettier compatibility
- `react/jsx-first-prop-new-line` — Prettier compatibility
- `react/jsx-indent` — Prettier compatibility
- `react/jsx-indent-props` — Prettier compatibility
- `react/jsx-max-props-per-line` — Prettier compatibility
- `react/jsx-newline` — Prettier compatibility
- `react/jsx-one-expression-per-line` — Prettier compatibility
- `react/jsx-props-no-multi-spaces` — Prettier compatibility
- `react/jsx-space-before-closing` — Prettier compatibility
- `react/jsx-tag-spacing` — Prettier compatibility
- `react/jsx-wrap-multilines` — Prettier compatibility
- `rest-spread-spacing` — Prettier compatibility
- `semi` — Prettier compatibility
- `semi-spacing` — Prettier compatibility
- `semi-style` — Prettier compatibility
- `space-after-function-name` — Prettier compatibility
- `space-after-keywords` — Prettier compatibility
- `space-before-blocks` — Prettier compatibility
- `space-before-function-paren` — Prettier compatibility
- `space-before-function-parentheses` — Prettier compatibility
- `space-before-keywords` — Prettier compatibility
- `space-in-brackets` — Prettier compatibility
- `space-in-parens` — Prettier compatibility
- `space-infix-ops` — Prettier compatibility
- `space-return-throw-case` — Prettier compatibility
- `space-unary-ops` — Prettier compatibility
- `space-unary-word-ops` — Prettier compatibility
- `standard/array-bracket-even-spacing` — Prettier compatibility
- `standard/computed-property-even-spacing` — Prettier compatibility
- `standard/object-curly-even-spacing` — Prettier compatibility
- `switch-colon-spacing` — Prettier compatibility
- `template-curly-spacing` — Prettier compatibility
- `template-tag-spacing` — Prettier compatibility
- `unicorn/empty-brace-spaces` — Prettier compatibility
- `unicorn/no-nested-ternary` — Prettier compatibility
- `unicorn/number-literal-case` — Prettier compatibility
- `unicorn/template-indent` — Prettier compatibility
- `vue/array-bracket-newline` — Prettier compatibility
- `vue/array-bracket-spacing` — Prettier compatibility
- `vue/array-element-newline` — Prettier compatibility
- `vue/arrow-spacing` — Prettier compatibility
- `vue/block-spacing` — Prettier compatibility
- `vue/block-tag-newline` — Prettier compatibility
- `vue/brace-style` — Prettier compatibility
- `vue/comma-dangle` — Prettier compatibility
- `vue/comma-spacing` — Prettier compatibility
- `vue/comma-style` — Prettier compatibility
- `vue/dot-location` — Prettier compatibility
- `vue/func-call-spacing` — Prettier compatibility
- `vue/html-closing-bracket-newline` — Prettier compatibility
- `vue/html-closing-bracket-spacing` — Prettier compatibility
- `vue/html-end-tags` — Prettier compatibility
- `vue/html-indent` — Prettier compatibility
- `vue/html-quotes` — Prettier compatibility
- `vue/html-self-closing` — Prettier compatibility
- `vue/key-spacing` — Prettier compatibility
- `vue/keyword-spacing` — Prettier compatibility
- `vue/max-attributes-per-line` — Prettier compatibility
- `vue/max-len` — Prettier compatibility
- `vue/multiline-html-element-content-newline` — Prettier compatibility
- `vue/multiline-ternary` — Prettier compatibility
- `vue/mustache-interpolation-spacing` — Prettier compatibility
- `vue/no-extra-parens` — Prettier compatibility
- `vue/no-multi-spaces` — Prettier compatibility
- `vue/no-spaces-around-equal-signs-in-attribute` — Prettier compatibility
- `vue/object-curly-newline` — Prettier compatibility
- `vue/object-curly-spacing` — Prettier compatibility
- `vue/object-property-newline` — Prettier compatibility
- `vue/operator-linebreak` — Prettier compatibility
- `vue/quote-props` — Prettier compatibility
- `vue/script-indent` — Prettier compatibility
- `vue/singleline-html-element-content-newline` — Prettier compatibility
- `vue/space-in-parens` — Prettier compatibility
- `vue/space-infix-ops` — Prettier compatibility
- `vue/space-unary-ops` — Prettier compatibility
- `vue/template-curly-spacing` — Prettier compatibility
- `wrap-iife` — Prettier compatibility
- `wrap-regex` — Prettier compatibility
- `yield-star-spacing` — Prettier compatibility

## TypeScript: 88 active rules

| Rule                                                     | Level/options                                                                                                                                                                                                                                                                                                                                               | Source                               | Policy      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| `@stylistic/padding-line-between-statements`             | `["error",{"blankLine":"always","prev":"*","next":"if"},{"blankLine":"always","prev":"*","next":"return"},{"blankLine":"always","prev":["const","let","var","export"],"next":"*"},{"blankLine":"always","prev":"*","next":["const","let","var","export"]},{"blankLine":"any","prev":["const","let","var","export"],"next":["const","let","var","export"]}]` | Selected shared policy               | E10/E11/E12 |
| `@typescript-eslint/await-thenable`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | T04         |
| `@typescript-eslint/ban-ts-comment`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/consistent-type-imports`             | `["error",{"prefer":"type-imports","fixStyle":"inline-type-imports"}]`                                                                                                                                                                                                                                                                                      | Selected TS policy                   | E08         |
| `@typescript-eslint/no-array-constructor`                | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-duplicate-enum-values`            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-empty-object-type`                | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-explicit-any`                     | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | T01         |
| `@typescript-eslint/no-extra-non-null-assertion`         | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-floating-promises`                | `["error",{"ignoreVoid":true}]`                                                                                                                                                                                                                                                                                                                             | Selected TS policy                   | T02         |
| `@typescript-eslint/no-import-type-side-effects`         | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | E08         |
| `@typescript-eslint/no-misused-new`                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-misused-promises`                 | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | T03         |
| `@typescript-eslint/no-namespace`                        | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-non-null-asserted-optional-chain` | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-non-null-assertion`               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | T07         |
| `@typescript-eslint/no-require-imports`                  | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-this-alias`                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-unnecessary-type-assertion`       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | T06         |
| `@typescript-eslint/no-unnecessary-type-constraint`      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-unsafe-declaration-merging`       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-unsafe-function-type`             | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-unused-expressions`               | `["error",{"allowShortCircuit":false,"allowTaggedTemplates":false,"allowTernary":false}]`                                                                                                                                                                                                                                                                   | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/no-unused-vars`                      | `["error",{"args":"all","argsIgnorePattern":"^_"}]`                                                                                                                                                                                                                                                                                                         | Selected TS policy                   | E05         |
| `@typescript-eslint/no-wrapper-object-types`             | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/prefer-as-const`                     | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/prefer-namespace-keyword`            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `@typescript-eslint/switch-exhaustiveness-check`         | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected TS policy                   | T05         |
| `@typescript-eslint/triple-slash-reference`              | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/recommended        | E01         |
| `arrow-body-style`                                       | `["error","always"]`                                                                                                                                                                                                                                                                                                                                        | Selected shared policy               | A01         |
| `curly`                                                  | `["error","all"]`                                                                                                                                                                                                                                                                                                                                           | Selected shared policy               | E02         |
| `eqeqeq`                                                 | `["error","always"]`                                                                                                                                                                                                                                                                                                                                        | Selected shared policy               | E03         |
| `for-direction`                                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `import-x/no-default-export`                             | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected shared policy               | A02         |
| `import-x/no-duplicates`                                 | `["error",{"prefer-inline":true}]`                                                                                                                                                                                                                                                                                                                          | Selected shared policy               | E09         |
| `no-async-promise-executor`                              | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-await-in-loop`                                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected shared policy               | A04         |
| `no-case-declarations`                                   | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-compare-neg-zero`                                    | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-cond-assign`                                         | `["error","except-parens"]`                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-constant-binary-expression`                          | `["error",{"checkRelationalComparisons":false}]`                                                                                                                                                                                                                                                                                                            | @eslint/js recommended               | E01         |
| `no-constant-condition`                                  | `["error",{"checkLoops":"allExceptWhileTrue"}]`                                                                                                                                                                                                                                                                                                             | @eslint/js recommended               | E01         |
| `no-control-regex`                                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-debugger`                                            | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-delete-var`                                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-dupe-else-if`                                        | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-duplicate-case`                                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-else-return`                                         | `["error",{"allowElseIf":false}]`                                                                                                                                                                                                                                                                                                                           | Selected shared policy               | E06         |
| `no-empty`                                               | `["error",{"allowEmptyCatch":false}]`                                                                                                                                                                                                                                                                                                                       | @eslint/js recommended               | E01         |
| `no-empty-character-class`                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-empty-pattern`                                       | `["error",{"allowObjectPatternsAsParameters":false}]`                                                                                                                                                                                                                                                                                                       | @eslint/js recommended               | E01         |
| `no-empty-static-block`                                  | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-ex-assign`                                           | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-extra-boolean-cast`                                  | `["error",{}]`                                                                                                                                                                                                                                                                                                                                              | @eslint/js recommended               | E01         |
| `no-fallthrough`                                         | `["error",{"allowEmptyCase":false,"reportUnusedFallthroughComment":false}]`                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-global-assign`                                       | `["error",{"exceptions":[]}]`                                                                                                                                                                                                                                                                                                                               | @eslint/js recommended               | E01         |
| `no-invalid-regexp`                                      | `["error",{}]`                                                                                                                                                                                                                                                                                                                                              | @eslint/js recommended               | E01         |
| `no-irregular-whitespace`                                | `["error",{"skipComments":false,"skipJSXText":false,"skipRegExps":false,"skipStrings":true,"skipTemplates":false}]`                                                                                                                                                                                                                                         | @eslint/js recommended               | E01         |
| `no-loss-of-precision`                                   | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-misleading-character-class`                          | `["error",{"allowEscape":false}]`                                                                                                                                                                                                                                                                                                                           | @eslint/js recommended               | E01         |
| `no-nonoctal-decimal-escape`                             | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-octal`                                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-param-reassign`                                      | `["error",{"props":true}]`                                                                                                                                                                                                                                                                                                                                  | Selected shared policy               | A03         |
| `no-plusplus`                                            | `["error",{"allowForLoopAfterthoughts":false}]`                                                                                                                                                                                                                                                                                                             | Selected shared policy               | A05         |
| `no-prototype-builtins`                                  | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-regex-spaces`                                        | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-restricted-syntax`                                   | `["error",{"selector":"ForOfStatement","message":"for...of is disabled by the shared policy; use an appropriate alternative or an explicit project override."}]`                                                                                                                                                                                            | Selected shared policy               | A06         |
| `no-self-assign`                                         | `["error",{"props":true}]`                                                                                                                                                                                                                                                                                                                                  | @eslint/js recommended               | E01         |
| `no-shadow-restricted-names`                             | `["error",{"reportGlobalThis":true}]`                                                                                                                                                                                                                                                                                                                       | @eslint/js recommended               | E01         |
| `no-sparse-arrays`                                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-unassigned-vars`                                     | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-unsafe-finally`                                      | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-unsafe-optional-chaining`                            | `["error",{"disallowArithmeticOperators":false}]`                                                                                                                                                                                                                                                                                                           | @eslint/js recommended               | E01         |
| `no-unused-labels`                                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-unused-private-class-members`                        | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-useless-assignment`                                  | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-useless-backreference`                               | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-useless-catch`                                       | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `no-useless-escape`                                      | `["error",{"allowRegexCharacters":[]}]`                                                                                                                                                                                                                                                                                                                     | @eslint/js recommended               | E01         |
| `no-var`                                                 | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | Selected shared policy               | E04         |
| `object-shorthand`                                       | `["error","always"]`                                                                                                                                                                                                                                                                                                                                        | Selected shared policy               | E07         |
| `prefer-const`                                           | `["error",{"destructuring":"any","ignoreReadBeforeAssign":false}]`                                                                                                                                                                                                                                                                                          | Selected shared policy               | E04         |
| `prefer-rest-params`                                     | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/eslint-recommended | E01         |
| `prefer-spread`                                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | typescript-eslint/eslint-recommended | E01         |
| `preserve-caught-error`                                  | `["error",{"requireCatchParameter":false,"errorClassNames":[]}]`                                                                                                                                                                                                                                                                                            | @eslint/js recommended               | E01         |
| `require-yield`                                          | `["error"]`                                                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |
| `use-isnan`                                              | `["error",{"enforceForIndexOf":false,"enforceForSwitchCase":true}]`                                                                                                                                                                                                                                                                                         | @eslint/js recommended               | E01         |
| `valid-typeof`                                           | `["error",{"requireStringLiterals":false}]`                                                                                                                                                                                                                                                                                                                 | @eslint/js recommended               | E01         |

Disabled inherited/compatibility rules (level off):

- `@babel/object-curly-spacing` — Prettier compatibility
- `@babel/semi` — Prettier compatibility
- `@stylistic/array-bracket-newline` — Prettier compatibility
- `@stylistic/array-bracket-spacing` — Prettier compatibility
- `@stylistic/array-element-newline` — Prettier compatibility
- `@stylistic/arrow-parens` — Prettier compatibility
- `@stylistic/arrow-spacing` — Prettier compatibility
- `@stylistic/block-spacing` — Prettier compatibility
- `@stylistic/brace-style` — Prettier compatibility
- `@stylistic/comma-dangle` — Prettier compatibility
- `@stylistic/comma-spacing` — Prettier compatibility
- `@stylistic/comma-style` — Prettier compatibility
- `@stylistic/computed-property-spacing` — Prettier compatibility
- `@stylistic/dot-location` — Prettier compatibility
- `@stylistic/eol-last` — Prettier compatibility
- `@stylistic/func-call-spacing` — Prettier compatibility
- `@stylistic/function-call-argument-newline` — Prettier compatibility
- `@stylistic/function-call-spacing` — Prettier compatibility
- `@stylistic/function-paren-newline` — Prettier compatibility
- `@stylistic/generator-star-spacing` — Prettier compatibility
- `@stylistic/implicit-arrow-linebreak` — Prettier compatibility
- `@stylistic/indent` — Prettier compatibility
- `@stylistic/indent-binary-ops` — Prettier compatibility
- `@stylistic/js/array-bracket-newline` — Prettier compatibility
- `@stylistic/js/array-bracket-spacing` — Prettier compatibility
- `@stylistic/js/array-element-newline` — Prettier compatibility
- `@stylistic/js/arrow-parens` — Prettier compatibility
- `@stylistic/js/arrow-spacing` — Prettier compatibility
- `@stylistic/js/block-spacing` — Prettier compatibility
- `@stylistic/js/brace-style` — Prettier compatibility
- `@stylistic/js/comma-dangle` — Prettier compatibility
- `@stylistic/js/comma-spacing` — Prettier compatibility
- `@stylistic/js/comma-style` — Prettier compatibility
- `@stylistic/js/computed-property-spacing` — Prettier compatibility
- `@stylistic/js/dot-location` — Prettier compatibility
- `@stylistic/js/eol-last` — Prettier compatibility
- `@stylistic/js/func-call-spacing` — Prettier compatibility
- `@stylistic/js/function-call-argument-newline` — Prettier compatibility
- `@stylistic/js/function-call-spacing` — Prettier compatibility
- `@stylistic/js/function-paren-newline` — Prettier compatibility
- `@stylistic/js/generator-star-spacing` — Prettier compatibility
- `@stylistic/js/implicit-arrow-linebreak` — Prettier compatibility
- `@stylistic/js/indent` — Prettier compatibility
- `@stylistic/js/jsx-quotes` — Prettier compatibility
- `@stylistic/js/key-spacing` — Prettier compatibility
- `@stylistic/js/keyword-spacing` — Prettier compatibility
- `@stylistic/js/linebreak-style` — Prettier compatibility
- `@stylistic/js/lines-around-comment` — Prettier compatibility
- `@stylistic/js/max-len` — Prettier compatibility
- `@stylistic/js/max-statements-per-line` — Prettier compatibility
- `@stylistic/js/multiline-ternary` — Prettier compatibility
- `@stylistic/js/new-parens` — Prettier compatibility
- `@stylistic/js/newline-per-chained-call` — Prettier compatibility
- `@stylistic/js/no-confusing-arrow` — Prettier compatibility
- `@stylistic/js/no-extra-parens` — Prettier compatibility
- `@stylistic/js/no-extra-semi` — Prettier compatibility
- `@stylistic/js/no-floating-decimal` — Prettier compatibility
- `@stylistic/js/no-mixed-operators` — Prettier compatibility
- `@stylistic/js/no-mixed-spaces-and-tabs` — Prettier compatibility
- `@stylistic/js/no-multi-spaces` — Prettier compatibility
- `@stylistic/js/no-multiple-empty-lines` — Prettier compatibility
- `@stylistic/js/no-tabs` — Prettier compatibility
- `@stylistic/js/no-trailing-spaces` — Prettier compatibility
- `@stylistic/js/no-whitespace-before-property` — Prettier compatibility
- `@stylistic/js/nonblock-statement-body-position` — Prettier compatibility
- `@stylistic/js/object-curly-newline` — Prettier compatibility
- `@stylistic/js/object-curly-spacing` — Prettier compatibility
- `@stylistic/js/object-property-newline` — Prettier compatibility
- `@stylistic/js/one-var-declaration-per-line` — Prettier compatibility
- `@stylistic/js/operator-linebreak` — Prettier compatibility
- `@stylistic/js/padded-blocks` — Prettier compatibility
- `@stylistic/js/quote-props` — Prettier compatibility
- `@stylistic/js/quotes` — Prettier compatibility
- `@stylistic/js/rest-spread-spacing` — Prettier compatibility
- `@stylistic/js/semi` — Prettier compatibility
- `@stylistic/js/semi-spacing` — Prettier compatibility
- `@stylistic/js/semi-style` — Prettier compatibility
- `@stylistic/js/space-before-blocks` — Prettier compatibility
- `@stylistic/js/space-before-function-paren` — Prettier compatibility
- `@stylistic/js/space-in-parens` — Prettier compatibility
- `@stylistic/js/space-infix-ops` — Prettier compatibility
- `@stylistic/js/space-unary-ops` — Prettier compatibility
- `@stylistic/js/switch-colon-spacing` — Prettier compatibility
- `@stylistic/js/template-curly-spacing` — Prettier compatibility
- `@stylistic/js/template-tag-spacing` — Prettier compatibility
- `@stylistic/js/wrap-iife` — Prettier compatibility
- `@stylistic/js/wrap-regex` — Prettier compatibility
- `@stylistic/js/yield-star-spacing` — Prettier compatibility
- `@stylistic/jsx-child-element-spacing` — Prettier compatibility
- `@stylistic/jsx-closing-bracket-location` — Prettier compatibility
- `@stylistic/jsx-closing-tag-location` — Prettier compatibility
- `@stylistic/jsx-curly-newline` — Prettier compatibility
- `@stylistic/jsx-curly-spacing` — Prettier compatibility
- `@stylistic/jsx-equals-spacing` — Prettier compatibility
- `@stylistic/jsx-first-prop-new-line` — Prettier compatibility
- `@stylistic/jsx-indent` — Prettier compatibility
- `@stylistic/jsx-indent-props` — Prettier compatibility
- `@stylistic/jsx-max-props-per-line` — Prettier compatibility
- `@stylistic/jsx-newline` — Prettier compatibility
- `@stylistic/jsx-one-expression-per-line` — Prettier compatibility
- `@stylistic/jsx-props-no-multi-spaces` — Prettier compatibility
- `@stylistic/jsx-quotes` — Prettier compatibility
- `@stylistic/jsx-tag-spacing` — Prettier compatibility
- `@stylistic/jsx-wrap-multilines` — Prettier compatibility
- `@stylistic/jsx/jsx-child-element-spacing` — Prettier compatibility
- `@stylistic/jsx/jsx-closing-bracket-location` — Prettier compatibility
- `@stylistic/jsx/jsx-closing-tag-location` — Prettier compatibility
- `@stylistic/jsx/jsx-curly-newline` — Prettier compatibility
- `@stylistic/jsx/jsx-curly-spacing` — Prettier compatibility
- `@stylistic/jsx/jsx-equals-spacing` — Prettier compatibility
- `@stylistic/jsx/jsx-first-prop-new-line` — Prettier compatibility
- `@stylistic/jsx/jsx-indent` — Prettier compatibility
- `@stylistic/jsx/jsx-indent-props` — Prettier compatibility
- `@stylistic/jsx/jsx-max-props-per-line` — Prettier compatibility
- `@stylistic/key-spacing` — Prettier compatibility
- `@stylistic/keyword-spacing` — Prettier compatibility
- `@stylistic/linebreak-style` — Prettier compatibility
- `@stylistic/lines-around-comment` — Prettier compatibility
- `@stylistic/max-len` — Prettier compatibility
- `@stylistic/max-statements-per-line` — Prettier compatibility
- `@stylistic/member-delimiter-style` — Prettier compatibility
- `@stylistic/multiline-ternary` — Prettier compatibility
- `@stylistic/new-parens` — Prettier compatibility
- `@stylistic/newline-per-chained-call` — Prettier compatibility
- `@stylistic/no-confusing-arrow` — Prettier compatibility
- `@stylistic/no-extra-parens` — Prettier compatibility
- `@stylistic/no-extra-semi` — Prettier compatibility
- `@stylistic/no-floating-decimal` — Prettier compatibility
- `@stylistic/no-mixed-operators` — Prettier compatibility
- `@stylistic/no-mixed-spaces-and-tabs` — Prettier compatibility
- `@stylistic/no-multi-spaces` — Prettier compatibility
- `@stylistic/no-multiple-empty-lines` — Prettier compatibility
- `@stylistic/no-tabs` — Prettier compatibility
- `@stylistic/no-trailing-spaces` — Prettier compatibility
- `@stylistic/no-whitespace-before-property` — Prettier compatibility
- `@stylistic/nonblock-statement-body-position` — Prettier compatibility
- `@stylistic/object-curly-newline` — Prettier compatibility
- `@stylistic/object-curly-spacing` — Prettier compatibility
- `@stylistic/object-property-newline` — Prettier compatibility
- `@stylistic/one-var-declaration-per-line` — Prettier compatibility
- `@stylistic/operator-linebreak` — Prettier compatibility
- `@stylistic/padded-blocks` — Prettier compatibility
- `@stylistic/quote-props` — Prettier compatibility
- `@stylistic/quotes` — Prettier compatibility
- `@stylistic/rest-spread-spacing` — Prettier compatibility
- `@stylistic/semi` — Prettier compatibility
- `@stylistic/semi-spacing` — Prettier compatibility
- `@stylistic/semi-style` — Prettier compatibility
- `@stylistic/space-before-blocks` — Prettier compatibility
- `@stylistic/space-before-function-paren` — Prettier compatibility
- `@stylistic/space-in-parens` — Prettier compatibility
- `@stylistic/space-infix-ops` — Prettier compatibility
- `@stylistic/space-unary-ops` — Prettier compatibility
- `@stylistic/switch-colon-spacing` — Prettier compatibility
- `@stylistic/template-curly-spacing` — Prettier compatibility
- `@stylistic/template-tag-spacing` — Prettier compatibility
- `@stylistic/ts/block-spacing` — Prettier compatibility
- `@stylistic/ts/brace-style` — Prettier compatibility
- `@stylistic/ts/comma-dangle` — Prettier compatibility
- `@stylistic/ts/comma-spacing` — Prettier compatibility
- `@stylistic/ts/func-call-spacing` — Prettier compatibility
- `@stylistic/ts/function-call-spacing` — Prettier compatibility
- `@stylistic/ts/indent` — Prettier compatibility
- `@stylistic/ts/key-spacing` — Prettier compatibility
- `@stylistic/ts/keyword-spacing` — Prettier compatibility
- `@stylistic/ts/lines-around-comment` — Prettier compatibility
- `@stylistic/ts/member-delimiter-style` — Prettier compatibility
- `@stylistic/ts/no-extra-parens` — Prettier compatibility
- `@stylistic/ts/no-extra-semi` — Prettier compatibility
- `@stylistic/ts/object-curly-spacing` — Prettier compatibility
- `@stylistic/ts/quotes` — Prettier compatibility
- `@stylistic/ts/semi` — Prettier compatibility
- `@stylistic/ts/space-before-blocks` — Prettier compatibility
- `@stylistic/ts/space-before-function-paren` — Prettier compatibility
- `@stylistic/ts/space-infix-ops` — Prettier compatibility
- `@stylistic/ts/type-annotation-spacing` — Prettier compatibility
- `@stylistic/type-annotation-spacing` — Prettier compatibility
- `@stylistic/type-generic-spacing` — Prettier compatibility
- `@stylistic/type-named-tuple-spacing` — Prettier compatibility
- `@stylistic/wrap-iife` — Prettier compatibility
- `@stylistic/wrap-regex` — Prettier compatibility
- `@stylistic/yield-star-spacing` — Prettier compatibility
- `@typescript-eslint/block-spacing` — Prettier compatibility
- `@typescript-eslint/brace-style` — Prettier compatibility
- `@typescript-eslint/comma-dangle` — Prettier compatibility
- `@typescript-eslint/comma-spacing` — Prettier compatibility
- `@typescript-eslint/func-call-spacing` — Prettier compatibility
- `@typescript-eslint/indent` — Prettier compatibility
- `@typescript-eslint/key-spacing` — Prettier compatibility
- `@typescript-eslint/keyword-spacing` — Prettier compatibility
- `@typescript-eslint/lines-around-comment` — Prettier compatibility
- `@typescript-eslint/member-delimiter-style` — Prettier compatibility
- `@typescript-eslint/no-extra-parens` — Prettier compatibility
- `@typescript-eslint/no-extra-semi` — Prettier compatibility
- `@typescript-eslint/object-curly-spacing` — Prettier compatibility
- `@typescript-eslint/quotes` — Prettier compatibility
- `@typescript-eslint/semi` — Prettier compatibility
- `@typescript-eslint/space-before-blocks` — Prettier compatibility
- `@typescript-eslint/space-before-function-paren` — Prettier compatibility
- `@typescript-eslint/space-infix-ops` — Prettier compatibility
- `@typescript-eslint/type-annotation-spacing` — Prettier compatibility
- `array-bracket-newline` — Prettier compatibility
- `array-bracket-spacing` — Prettier compatibility
- `array-element-newline` — Prettier compatibility
- `arrow-parens` — Prettier compatibility
- `arrow-spacing` — Prettier compatibility
- `babel/object-curly-spacing` — Prettier compatibility
- `babel/quotes` — Prettier compatibility
- `babel/semi` — Prettier compatibility
- `block-spacing` — Prettier compatibility
- `brace-style` — Prettier compatibility
- `comma-dangle` — Prettier compatibility
- `comma-spacing` — Prettier compatibility
- `comma-style` — Prettier compatibility
- `computed-property-spacing` — Prettier compatibility
- `constructor-super` — typescript-eslint/eslint-recommended
- `dot-location` — Prettier compatibility
- `eol-last` — Prettier compatibility
- `flowtype/boolean-style` — Prettier compatibility
- `flowtype/delimiter-dangle` — Prettier compatibility
- `flowtype/generic-spacing` — Prettier compatibility
- `flowtype/object-type-curly-spacing` — Prettier compatibility
- `flowtype/object-type-delimiter` — Prettier compatibility
- `flowtype/quotes` — Prettier compatibility
- `flowtype/semi` — Prettier compatibility
- `flowtype/space-after-type-colon` — Prettier compatibility
- `flowtype/space-before-generic-bracket` — Prettier compatibility
- `flowtype/space-before-type-colon` — Prettier compatibility
- `flowtype/union-intersection-spacing` — Prettier compatibility
- `func-call-spacing` — Prettier compatibility
- `function-call-argument-newline` — Prettier compatibility
- `function-paren-newline` — Prettier compatibility
- `generator-star` — Prettier compatibility
- `generator-star-spacing` — Prettier compatibility
- `getter-return` — typescript-eslint/eslint-recommended
- `implicit-arrow-linebreak` — Prettier compatibility
- `indent` — Prettier compatibility
- `indent-legacy` — Prettier compatibility
- `jsx-quotes` — Prettier compatibility
- `key-spacing` — Prettier compatibility
- `keyword-spacing` — Prettier compatibility
- `linebreak-style` — Prettier compatibility
- `lines-around-comment` — Prettier compatibility
- `max-len` — Prettier compatibility
- `max-statements-per-line` — Prettier compatibility
- `multiline-ternary` — Prettier compatibility
- `new-parens` — Prettier compatibility
- `newline-per-chained-call` — Prettier compatibility
- `no-array-constructor` — typescript-eslint/recommended
- `no-arrow-condition` — Prettier compatibility
- `no-class-assign` — typescript-eslint/eslint-recommended
- `no-comma-dangle` — Prettier compatibility
- `no-confusing-arrow` — Prettier compatibility
- `no-const-assign` — typescript-eslint/eslint-recommended
- `no-dupe-args` — typescript-eslint/eslint-recommended
- `no-dupe-class-members` — typescript-eslint/eslint-recommended
- `no-dupe-keys` — typescript-eslint/eslint-recommended
- `no-extra-parens` — Prettier compatibility
- `no-extra-semi` — Prettier compatibility
- `no-floating-decimal` — Prettier compatibility
- `no-func-assign` — typescript-eslint/eslint-recommended
- `no-import-assign` — typescript-eslint/eslint-recommended
- `no-mixed-operators` — Prettier compatibility
- `no-mixed-spaces-and-tabs` — Prettier compatibility
- `no-multi-spaces` — Prettier compatibility
- `no-multiple-empty-lines` — Prettier compatibility
- `no-new-native-nonconstructor` — typescript-eslint/eslint-recommended
- `no-new-symbol` — typescript-eslint/eslint-recommended
- `no-obj-calls` — typescript-eslint/eslint-recommended
- `no-redeclare` — typescript-eslint/eslint-recommended
- `no-reserved-keys` — Prettier compatibility
- `no-setter-return` — typescript-eslint/eslint-recommended
- `no-space-before-semi` — Prettier compatibility
- `no-spaced-func` — Prettier compatibility
- `no-tabs` — Prettier compatibility
- `no-this-before-super` — typescript-eslint/eslint-recommended
- `no-trailing-spaces` — Prettier compatibility
- `no-undef` — typescript-eslint/eslint-recommended
- `no-unexpected-multiline` — Prettier compatibility
- `no-unreachable` — typescript-eslint/eslint-recommended
- `no-unsafe-negation` — typescript-eslint/eslint-recommended
- `no-unused-expressions` — typescript-eslint/recommended
- `no-unused-vars` — Selected TS policy
- `no-whitespace-before-property` — Prettier compatibility
- `no-with` — typescript-eslint/eslint-recommended
- `no-wrap-func` — Prettier compatibility
- `nonblock-statement-body-position` — Prettier compatibility
- `object-curly-newline` — Prettier compatibility
- `object-curly-spacing` — Prettier compatibility
- `object-property-newline` — Prettier compatibility
- `one-var-declaration-per-line` — Prettier compatibility
- `operator-linebreak` — Prettier compatibility
- `padded-blocks` — Prettier compatibility
- `quote-props` — Prettier compatibility
- `quotes` — Prettier compatibility
- `react/jsx-child-element-spacing` — Prettier compatibility
- `react/jsx-closing-bracket-location` — Prettier compatibility
- `react/jsx-closing-tag-location` — Prettier compatibility
- `react/jsx-curly-newline` — Prettier compatibility
- `react/jsx-curly-spacing` — Prettier compatibility
- `react/jsx-equals-spacing` — Prettier compatibility
- `react/jsx-first-prop-new-line` — Prettier compatibility
- `react/jsx-indent` — Prettier compatibility
- `react/jsx-indent-props` — Prettier compatibility
- `react/jsx-max-props-per-line` — Prettier compatibility
- `react/jsx-newline` — Prettier compatibility
- `react/jsx-one-expression-per-line` — Prettier compatibility
- `react/jsx-props-no-multi-spaces` — Prettier compatibility
- `react/jsx-space-before-closing` — Prettier compatibility
- `react/jsx-tag-spacing` — Prettier compatibility
- `react/jsx-wrap-multilines` — Prettier compatibility
- `rest-spread-spacing` — Prettier compatibility
- `semi` — Prettier compatibility
- `semi-spacing` — Prettier compatibility
- `semi-style` — Prettier compatibility
- `space-after-function-name` — Prettier compatibility
- `space-after-keywords` — Prettier compatibility
- `space-before-blocks` — Prettier compatibility
- `space-before-function-paren` — Prettier compatibility
- `space-before-function-parentheses` — Prettier compatibility
- `space-before-keywords` — Prettier compatibility
- `space-in-brackets` — Prettier compatibility
- `space-in-parens` — Prettier compatibility
- `space-infix-ops` — Prettier compatibility
- `space-return-throw-case` — Prettier compatibility
- `space-unary-ops` — Prettier compatibility
- `space-unary-word-ops` — Prettier compatibility
- `standard/array-bracket-even-spacing` — Prettier compatibility
- `standard/computed-property-even-spacing` — Prettier compatibility
- `standard/object-curly-even-spacing` — Prettier compatibility
- `switch-colon-spacing` — Prettier compatibility
- `template-curly-spacing` — Prettier compatibility
- `template-tag-spacing` — Prettier compatibility
- `unicorn/empty-brace-spaces` — Prettier compatibility
- `unicorn/no-nested-ternary` — Prettier compatibility
- `unicorn/number-literal-case` — Prettier compatibility
- `unicorn/template-indent` — Prettier compatibility
- `vue/array-bracket-newline` — Prettier compatibility
- `vue/array-bracket-spacing` — Prettier compatibility
- `vue/array-element-newline` — Prettier compatibility
- `vue/arrow-spacing` — Prettier compatibility
- `vue/block-spacing` — Prettier compatibility
- `vue/block-tag-newline` — Prettier compatibility
- `vue/brace-style` — Prettier compatibility
- `vue/comma-dangle` — Prettier compatibility
- `vue/comma-spacing` — Prettier compatibility
- `vue/comma-style` — Prettier compatibility
- `vue/dot-location` — Prettier compatibility
- `vue/func-call-spacing` — Prettier compatibility
- `vue/html-closing-bracket-newline` — Prettier compatibility
- `vue/html-closing-bracket-spacing` — Prettier compatibility
- `vue/html-end-tags` — Prettier compatibility
- `vue/html-indent` — Prettier compatibility
- `vue/html-quotes` — Prettier compatibility
- `vue/html-self-closing` — Prettier compatibility
- `vue/key-spacing` — Prettier compatibility
- `vue/keyword-spacing` — Prettier compatibility
- `vue/max-attributes-per-line` — Prettier compatibility
- `vue/max-len` — Prettier compatibility
- `vue/multiline-html-element-content-newline` — Prettier compatibility
- `vue/multiline-ternary` — Prettier compatibility
- `vue/mustache-interpolation-spacing` — Prettier compatibility
- `vue/no-extra-parens` — Prettier compatibility
- `vue/no-multi-spaces` — Prettier compatibility
- `vue/no-spaces-around-equal-signs-in-attribute` — Prettier compatibility
- `vue/object-curly-newline` — Prettier compatibility
- `vue/object-curly-spacing` — Prettier compatibility
- `vue/object-property-newline` — Prettier compatibility
- `vue/operator-linebreak` — Prettier compatibility
- `vue/quote-props` — Prettier compatibility
- `vue/script-indent` — Prettier compatibility
- `vue/singleline-html-element-content-newline` — Prettier compatibility
- `vue/space-in-parens` — Prettier compatibility
- `vue/space-infix-ops` — Prettier compatibility
- `vue/space-unary-ops` — Prettier compatibility
- `vue/template-curly-spacing` — Prettier compatibility
- `wrap-iife` — Prettier compatibility
- `wrap-regex` — Prettier compatibility
- `yield-star-spacing` — Prettier compatibility

## Configuration exceptions

Only A02 (`import-x/no-default-export`) is disabled for
`**/{eslint,prettier,vite,vitest,playwright,rollup,webpack}.config.{js,mjs,cjs,ts,mts,cts}`.
No other rule changes severity there. The pattern does not exempt arbitrary config directories.

Disabled framework rule IDs above come from upstream Prettier compatibility.
They do not load or enable framework plugins or parsers.

Regenerate via ESLint.calculateConfigForFile for JS and TS after changing pinned
presets; review every rule/option delta before releasing a new config version.
