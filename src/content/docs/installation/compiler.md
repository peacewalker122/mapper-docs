---
title: Install the compiler
description: Install mapper-gen and mapper-gen-go via install script, release archive, or source build
---

One binary is not enough: you need both `mapper-gen` (orchestrator) and
`mapper-gen-go` (Go generator plugin) on `PATH`. The host resolves plugins
via the `mapper-gen-<name>` executable convention.

## Install script (recommended)

Linux, macOS, and Windows via Git Bash:

```bash
curl -fsSL https://raw.githubusercontent.com/peacewalker122/mapper-compiler/main/install.sh | bash
```

The script detects your OS/architecture, downloads the matching archive and
checksums from GitHub Releases, verifies the SHA-256 checksum, and installs
both binaries (defaults to `/usr/local/bin` when writable, otherwise
`~/.local/bin`).

Pin the version and/or install directory:

```bash
curl -fsSL https://raw.githubusercontent.com/peacewalker122/mapper-compiler/main/install.sh \
  | MAPPER_VERSION=v0.1.0 MAPPER_INSTALL_DIR="$HOME/.local/bin" bash
```

Prefer to inspect before running? Download first, then run:

```bash
curl -fsSL -o install.sh https://raw.githubusercontent.com/peacewalker122/mapper-compiler/main/install.sh
sh install.sh --version v0.1.0 --dir ~/.local/bin
```

## Release archive (manual)

1. Open `mapper-compiler` GitHub Releases and download the archive for your
   platform (`mapper-compiler_<version>_<os>_<arch>.tar.gz`, `.zip` on
   Windows) — for example `mapper-compiler_0.1.0_linux_amd64.tar.gz`.
   Releases cover Linux, macOS, and Windows on amd64 and arm64. Note the
   filename carries the version *without* the leading `v`.
2. Verify against the published `mapper-compiler_<version>_checksums.txt`
   (SHA-256).
3. Extract both binaries and put them on `PATH`:

```bash
tar -xzf mapper-compiler_0.1.0_linux_amd64.tar.gz
chmod +x mapper-gen mapper-gen-go
sudo mv mapper-gen mapper-gen-go /usr/local/bin/
```

Replace `0.1.0` with the latest release version.

## Build from source

Requires Go 1.26.1+:

```bash
git clone https://github.com/peacewalker122/mapper-compiler.git
cd mapper-compiler
go build -o mapper-gen ./cmd/mapper-gen
go build -o mapper-gen-go ./generator/go/cmd/mapper-gen-go
# Move both binaries somewhere on PATH
```

Compiler releases are binary-only; there is no installable Go module for
`mapper-gen` itself.

## Verify

```bash
mapper-gen validate mapper.yaml
```
