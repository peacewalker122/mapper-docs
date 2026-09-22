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

## `POST /mappings/suggest`

Suggests source-to-target field mappings for a stored schema without
changing schemas or import state. Request and response payloads use
`snake_case` (unlike legacy `GET /schemas/{id}`, which returns Go field
names in PascalCase: `ID`, `Name`, `Fields`).

Request:

```json
{
  "schema_id": 732918273981273,
  "columns": ["PhoneNumber", "Status"],
  "options": { "min_confidence": 0.5, "limit": 10 }
}
```

`schema_id` (positive integer) and `columns` (at least one non-empty
name) are required. Optional `samples` carries sampled source values and
optional `options` filters by `min_confidence` / `limit`.

Success response (`200`):

```json
{
  "suggestions": [
    { "source": 0, "target": 8374629102847361, "confidence": 0.92, "reason": "fuzzy name match" }
  ],
  "model": "fuzzy"
}
```

Status codes: `200` suggestions produced · `400` invalid `schema_id` /
`columns` / malformed JSON · `404` schema missing · `503` suggester or
service unavailable · `502` upstream suggestion service failed.
`405` (`method_not_allowed`, only `POST` accepted) and `415`
(`unsupported_media_type`, `application/json` required) also apply.

Error codes: `invalid_schema_id`, `schema_not_found`, `invalid_columns`,
`suggester_unavailable`, `upstream_error`, plus handler-emitted generics
`invalid_request`, `method_not_allowed`, `unsupported_media_type`,
`not_found`, `service_unavailable`.

## Jev-backed suggestions

Use the server-side Jev provider when fuzzy name matching is not enough. Keep
the API key on the backend; the frontend only calls `/mappings/suggest`.

```go
handler, err := mapperhttp.NewWithConfig(
    svc,
    mapperhttp.Config{
        Suggester: mapperhttp.SuggesterConfig{
            Provider: "jev",
            APIKey:   os.Getenv("JEV_API_KEY"),
        },
    },
)
if err != nil {
    log.Fatal(err)
}
```

`Provider: "jev"` requires a non-empty `APIKey`. The adapter sends that key as
`Authorization: Bearer ...` to Jev; it never puts the key in the request body.

Optional `SuggesterConfig` fields:

- `Endpoint`: custom Jev endpoint. Default:
  `https://www.jevai.org/api/v1/decisions`.
- `Timeout`: upstream request timeout. Default: 5 seconds.
- `Model`: model name forwarded in the Jev request.

If Jev times out, fails, or returns an unusable response, Mapper falls back to
fuzzy matching for that suggestion request. The response `model` is `"jev"` on
success and `"fuzzy"` after fallback.

Set the key before starting the backend:

```bash
export JEV_API_KEY=your-jev-api-key
```

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
