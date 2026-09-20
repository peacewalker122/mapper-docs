---
title: Schema compiler
description: YAML models to stable-identity schemas and language generators
---

`mapper-compiler` is a build-time tool. It reads a model, validates it,
resolves stable numeric IDs through a lock file, then passes one resolved
intermediate representation to configured language generators.

```text
mapper.yaml
  → parse → validate → resolve IDs
  → ir.Schema
  → versioned generator protocol
  → generator subprocesses
  → validated artifacts → atomic writes
```

Compiler core does not belong to `mapper-be`. The backend is a runtime SDK
that consumes generated schema descriptors.

## Installation

See [Install the compiler](/mapper-docs/installation/compiler/) for the
install script, release archives, and source build. Both `mapper-gen` and
`mapper-gen-go` must be on `PATH`.

## ID model

- IDs are positive integers within `2^53 - 1`, so JavaScript clients hold
  them without precision loss.
- IDs are generated once from `crypto/rand`, then persisted in `*.lock.yaml`.
- Removed fields stay `removed` and are never reassigned.
- Re-adding a field restores its original ID.
- A rename is remove + create.

## Configuration

```yaml
version: 1

model:
  name: subscriber
  fields:
    - name: msisdn
      type: string
      required: true

generators:
  - plugin: go
    out: ./internal/mapper
    options:
      package: mapping

  - plugin: typescript
    out: ./src/mapper
```

`mapper-gen` resolves plugin names through its registry and executable
convention. Generator options are opaque to compiler core and validated by
each plugin.

## Generator protocol

Each plugin is a subprocess:

```text
resolved IR + options
        ── JSON stdin ──▶ plugin
        ◀─ JSON stdout ──
```

Plugin stdout contains relative generated files:

```json
{
  "files": [
    {
      "path": "subscriber.gen.go",
      "content": "..."
    }
  ]
}
```

Stdout is protocol-only. Plugins write diagnostics to stderr. The host owns
output directories, rejects unsafe paths and collisions, and writes artifacts
only after every generator succeeds.

## CLI

```bash
mapper-gen validate mapper.yaml
mapper-gen generate --input mapper.yaml --lock mapper.lock.yaml
```

Exit codes: `0` success, `1` schema/config/plugin error, `2` internal error.
Generation is idempotent and atomic.

## Library API

`compiler.Compiler.Compile` parses, validates, resolves IDs, and returns:

```go
type CompileResult struct {
    Schema   ir.Schema
    LockFile []byte
}
```

Language generation happens separately through `mapper-compiler/generator`.
