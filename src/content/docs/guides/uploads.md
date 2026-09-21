---
title: Uploads
description: Multipart convenience and TUS resumable uploads
---

Every upload protocol converges on one invariant: it yields a completed
`FileID`. Analysis and import only ever see that ID.

## Multipart (default)

`POST /files/analyze` with a `file` part stores the upload and analyzes it
in one round trip. No separate adapter needed.

## TUS resumable uploads

Mounted at `/uploads/tus/*` via `mapperhttp.WithUploadExtension`:

```go
tusHandler := tus.New(tus.WithFileWriter(store))
handler := mapperhttp.New(svc, store, tusHandler)
```

TUS 1.0.0 core over plain `net/http`, no extra dependencies:

- `POST` creation with `Upload-Length` and `Upload-Metadata`
  (`filename`, `filetype`), optional first chunk
- `HEAD` offset discovery for resume
- `PATCH` chunk appends guarded by `Upload-Offset` (`409` on mismatch)
- `DELETE` termination, `OPTIONS` capability negotiation

Chunks stream to disk; on completion the file lands in the `FileStore` and
the response carries `X-Mapper-File-Id`. Resume with that header flow:

```text
POST → 201 + Location
PATCH → 204 + Upload-Offset   (repeat, resuming from HEAD after drops)
PATCH → 204 + X-Mapper-File-Id (complete)
POST /files/analyze {"file_id": …}
```
