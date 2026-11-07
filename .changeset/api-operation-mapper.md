---
'@gost-kit/common': minor
---

Add defineApiOperation and createApiEffect for reusable schema-typed API operations
with DTO-to-domain mapping. Extend the shared handler to dispatch mapped results
and route mapper failures through onError, preserving legacy effect contracts.
