# Gold Standard Kit (GoST Kit)

Reusable application libraries, developed incrementally from real use cases.
Engineering principles and specifications live in
[GoST Spec](https://github.com/antonsmolko/gost-spec).

## Status

This repository contains the initial npm workspace structure. No runtime
libraries have been implemented or published yet.

The first candidate areas are feature state and effect orchestration, frontend
validation and form integration, and API response/error handling. Each library
will define its own public contract and package; the workspace can grow as new
needs arise. Consumers install only the packages they need.

## Development

Use Node 26; `.node-version` pins 26.11.1. Runtime packages will live under
`packages/`. The repository root is private and cannot be published.

No build, test or release tooling is configured yet. Choose supported upstream
tooling when implementing the first concrete package.
