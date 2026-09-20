---
title: Schema compiler
description: YAML models to stable-identity Go code
---

The compiler (`mapper-gen`) is a build-time tool. It reads YAML, validates
it, resolves stable numeric IDs through a lock file, and emits an idiomatic
Go model plus a runtime schema descriptor — both from the same resolved
intermediate representation, so they can never drift.

```text
schema.yaml → parse → validate → resolve IDs → text/template → gofmt
```

## ID model

- IDs are positive integers within `2^53 - 1`, so JavaScript clients hold
  them without precision loss.
- Generated once from `crypto/rand`, then persisted in `*.lock.yaml`.
- Removed fields stay `removed` and are never reassigned; re-adding a name
  restores its original ID. A rename is remove + create.

## CLI

```bash
mapper-gen validate schema/subscriber.yaml
mapper-gen generate --input schema/subscriber.yaml \
  --output generated/subscriber.gen.go --package generated
```

Exit codes: `0` success, `1` schema/validation error, `2` internal error.
The command is idempotent and writes atomically — a failed run never
corrupts the previous valid output.

## Library API

The CLI is a thin layer over `compiler.Compiler.Compile`, which parses,
validates, resolves IDs (via the injectable `idgen.IDGenerator`), and
generates formatted Go entirely in memory.
