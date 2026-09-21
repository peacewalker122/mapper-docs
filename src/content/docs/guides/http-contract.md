---
title: HTTP contract
description: The three core endpoints plus errors
---

Plain `net/http`, no framework. Mount with `http.StripPrefix("/mapper", handler)`.

## `GET /schemas/{id}`

Returns the target shape for the mapping UI. Schema and field IDs are
numeric (≤ 2⁵³−1).

```json
{
  "ID": 732918273981273,
  "Name": "subscriber",
  "Fields": [
    { "ID": 8374629102847361, "Name": "msisdn", "Type": "string", "Required": true }
  ]
}
```

:::note
Schema descriptors serialize with Go field names (`ID`, `Name`, `Fields`);
every other payload in this API uses `snake_case`. Normalizing this is
tracked work — clients should read both cases defensively for now.
:::

## `POST /files/analyze`

JSON `{ "file_id": "..." }` (a bare string ID is also accepted), or
`multipart/form-data` with a `file` part as a store-then-analyze shorthand.

```json
{
  "file": { "id": "...", "name": "contacts.csv", "size": 412 },
  "sheets": [{ "name": "default", "columns": ["PhoneNumber", "Status"] }]
}
```

## `POST /imports/sync`

```json
{
  "file_id": "...",
  "schema_id": 732918273981273,
  "sheet": 0,
  "mappings": [{ "source": 0, "target": 8374629102847361 }]
}
```

Synchronous response:

```json
{ "processed": 10000, "succeeded": 9987, "failed": 13, "errors": [] }
```

Row error codes: `invalid_integer`, `invalid_decimal`, `invalid_boolean`,
`invalid_datetime`, `required_value_missing`, `processor_error`,
`invalid_mapping`, `duplicate_target`, `unknown_target`,
`required_target_missing`, `invalid_source_index`.

## Errors

```json
{ "error": { "code": "invalid_mapping", "message": "..." } }
```

`200` success · `400` malformed/validation · `404` schema/file missing ·
`405` wrong method · `415` wrong content-type ·
`500` internal · `503` store/adapter/importer unavailable.
`413` (`upload_too_large`) is TUS-extension-only, returned when a declared
`Upload-Length` or chunk exceeds the configured maximum — not by the three
core endpoints above.
Rejected rows never fail the HTTP request itself. Every operation honors
`context.Context` cancellation end to end.
