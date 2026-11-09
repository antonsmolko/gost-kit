# Package Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans inline. Steps use checkbox syntax for tracking.

**Goal:** Rewrite six package descriptions and README files for npm consumers.
**Architecture:** Short quick starts followed by contract reference in the same
README; lint rule details link to shipped RULES.md. No runtime/API/policy changes.
**Tech Stack:** Node 26, TypeScript 5.9.3, Svelte 5.57.2, ESLint 10.14.0, Prettier 3.9.10.
**Spec:** [Approved design](../specs/2026-11-09-package-descriptions-design.md).

## Global Constraints

- English; purpose → installation → complete example → reference.
- Node 26.x and peer requirements beside installation in all six README files.
- Remove monorepo source/build/history prose throughout; preserve consumer paths.
- Preserve dispatch/reset/API/guard and opt-in lint limitations.
- Relative links resolve in tarballs; example sources use explicit GitHub URLs.
- Descriptions only in manifests; no API/runtime/rule/version changes.
- Patch changeset for all six; description table in PR; commits [gost-kit-31].
- Owner accepted the clarified design and authorized execution; preserve inline workflow.

## Review Focus

- Minimal examples contain their types/values and compile against public exports.
- First-time installs explicitly include parser/peer requirements and tsconfig.
- Browser runtime requirements are distinguished from installation Node engines.
- Condensed prose retains error/cancellation/reset/identity and lint opt-in limits.
- Links and examples remain usable from actual package tarballs, outside monorepo.

### Task 1: Edit and verify all six package pages

**Files:** packages/{common,svelte,eslint-config,eslint-config-svelte,eslint-plugin,prettier-config}/{README.md,package.json};
.changeset/package-descriptions.md; approved design/plan status.

**Interfaces:** Consume current public exports/manifests and shipped RULES.
Produce six installable quick starts, accurate descriptions and patch changeset.

- [ ] Record current broken links/internal prose; inspect current source contracts.
  Expected: common example links and unshipped spec links fail package containment.
- [ ] Rewrite six descriptions and README files, keeping reference details below
  installation/example. Replace repository source links with GitHub URLs.
- [ ] Add patch changeset for all six packages. Expected: no runtime diff.
- [ ] Build packages, pack actual tarballs and extract outside the repository.
  Check all README relative links/anchors and package contents. Expected: no broken links.
- [ ] Verify common TypeScript examples, config loading for ESLint/Prettier,
  Svelte compilation and reactive rendering/dispatch/reset for the quick start.
  Use disposable consumers/fixtures; do not add implementation-mirroring tests.
- [ ] Run format check and npm run check. Expected: existing 823 tests pass,
  no policy or implementation changes.
- [ ] Commit [gost-kit-31] Rewrite package descriptions and npm quick starts.
- [ ] One independent whole-branch review; fix important findings with relevant
  snippet/link verification. Prepare draft PR with six-description table and evidence.
