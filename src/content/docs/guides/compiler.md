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

Requires both binaries on `PATH`: `mapper-gen` (orchestrator) and
`mapper-gen-go` (Go generator plugin). The host resolves plugins via the
`mapper-gen-<name>` executable convention.

**Option A — Prebuilt binaries (recommended):**

1. Open `mapper-compiler` GitHub Releases and download the archive for your
   platform (`mapper-compiler_<version>_<Os>_<Arch>.tar.gz`, `.zip` on
   Windows). Releases cover Linux, macOS, and Windows on amd64 and arm64.
2. Verify against the published `mapper-compiler_<version>_checksums.txt`
   (SHA-256).
3. Extract both binaries and put them on `PATH`:

```bash
tar -xzf mapper-compiler_v0.1.0_Linux_x86_64.tar.gz
chmod +x mapper-gen mapper-gen-go
sudo mv mapper-gen mapper-gen-go /usr/local/bin/
mapper-gen validate mapper.yaml
```

Replace `v0.1.0` with the latest release tag.

**Option B — Build from source (requires Go 1.26.1+):**

```bash
git clone https://github.com/peacewalker122/mapper-compiler.git
cd mapper-compiler
go build -o mapper-gen ./cmd/mapper-gen
go build -o mapper-gen-go ./generator/go/cmd/mapper-gen-go
# Move both binaries somewhere on PATH
```

Compiler releases are binary-only; there is no installable Go module for
`mapper-gen` itself.

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
