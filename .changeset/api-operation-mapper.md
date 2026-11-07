---
'@gost-kit/common': minor
---

Add defineApiOperation and createApiEffect for reusable schema-typed API operations
with DTO-to-domain mapping. Extend the shared handler to dispatch mapped results
and route mapper failures through onError. API effects require an operation;
use ApiEffect<Operations, Action> and createApiEffect(operation, options).
