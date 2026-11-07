---
'@gost-kit/common': minor
---

Add defineApiOperation and createApiEffect for reusable schema-typed API operations
with DTO-to-domain mapping. The shared handler dispatches mapped results and
routes mapper failures through onError.

Breaking API changes: remove the raw ApiEffect<Paths, Action> format and the
unused ApiRequest<Paths> type. To migrate, describe method/url/mapResponse with
defineApiOperation<Paths>() and construct effects using
createApiEffect(operation, options). Declare the effect type as
ApiEffect<Operation, SuccessAction, ErrorAction>; type success/error actions
separately. An omitted mapResponse uses identity. Direct api.request calls keep
their method/path/options signature and schema-derived DTO result.

Rename the effect table factory from createApiHandler to
createApiEffector. Pass its returned table to effecting to build the
executable effector.

Export SingleApiOperation for typed wrappers that require one narrowed operation.
