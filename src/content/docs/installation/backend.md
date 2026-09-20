---
title: Install the backend SDK
description: Add the Mapper Go backend SDK to your module
---

Requires Go 1.26.1+. The module path is `github.com/peacewalker122/mapper`
(consumed directly from the `mapper-be` repository via the Go module proxy —
no separate registry upload needed):

```bash
go get github.com/peacewalker122/mapper@v0.1.0
```

Replace `v0.1.0` with the latest `mapper-be` release tag. Then import the
packages you need:

```go
import (
	"github.com/peacewalker122/mapper/mapper"
	"github.com/peacewalker122/mapper/mapperhttp"
)
```

Verify the setup with:

```bash
go vet ./...
go test ./...
```

Next: wire the service and HTTP adapter as shown in the
[Backend SDK guide](/mapper-docs/guides/backend/).
