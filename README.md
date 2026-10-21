# Gold Standard Kit (GOST Kit)

Reusable application libraries, developed incrementally from real use cases.
Engineering principles and specifications live in
[GOST Spec](https://github.com/antonsmolko/gost-spec).

## Status

This repository contains the initial npm workspace structure. No runtime
libraries have been implemented or published yet.

## Development

Use Node 26; `.node-version` pins 26.11.1. Runtime packages will live under
`packages/`. The repository root is private and cannot be published.

No shared build, test or release tooling is configured yet. Choose supported
upstream tooling when implementing the first concrete package.

## Examples

[Functional core with a Svelte 5 root store](examples/functional-core/README.md)
shows a component dispatching typed actions, pure state transitions, API effects
and global notifications. It is an independent private example, run with its own
npm commands; it does not add a runtime package to the workspace.
