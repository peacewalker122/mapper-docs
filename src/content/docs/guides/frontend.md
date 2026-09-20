---
title: Frontend SDK
description: Client, mapping core, upload adapters, React editor
---

Framework-neutral API client and mapping core, plus a React mapping editor
and importer screen. The mapping UI edits a portable `MappingSpec`
(`source` index → stable target ID); the backend stays authoritative for
validation and execution.

```tsx
const client = createMapperClient({ baseUrl: "/mapper" });

<MapperImporter client={client} schemaId={SUBSCRIBER_SCHEMA_ID} />
```

```bash
bun install
bun run test      # vitest
bun run typecheck # tsc --noEmit
```

## Packages

Dependency order, enforced by workspace dependencies:

```text
@mapper/client ─────────────────────────────┐
  HTTP + protocol types. No workspace deps.  │
@mapper/core                                 │ depends on client
  Mapping ops, validation, workflow state.   │
  No workspace deps.                         │
@mapper/upload ─────────────────────────────┘
  UploadAdapter + multipart default.
  Depends on @mapper/client.
@mapper/react
  Editor, importer, React Flow adapter.
  Depends on client, core, upload. React ^19.
  Ships styles.css (CSS variables only).
```

## `@mapper/client`

Protocol types mirroring the backend wire format: `Schema`,
`SchemaField`, `FieldType`, `FileMetadata`, `SourceRow`, `SheetAnalysis`,
`SourceAnalysis`, `FieldMapping`, `ImportRequest`, `RowError`,
`ImportResult`, and the `ErrorEnvelope` (`{ error: { code, message } }`).

Client construction accepts either a base URL plus an optional fetch, or an
options object — pass a custom `fetch` to inject auth, retries, or tracing:

```ts
createMapperClient(baseUrl: string, fetcher?: MapperFetch): MapperClient;
createMapperClient(options: MapperClientOptions): MapperClient;
```

`MapperClient` methods and their routes:

- `getSchema(schemaId)` → `GET /schemas/{id}`
- `analyzeFile(file: Blob, filename?)` → multipart `POST /files/analyze`
- `analyzeFileId(fileId)` → JSON `POST /files/analyze` with `{ file_id }`
- `import(request)` → `POST /imports/sync`

Failures throw `MapperError` carrying `code`, `status`, and the raw `body`,
parsed from the error envelope via `MapperError.fromResponse`. No React, no
DOM.

## `@mapper/core`

Pure mapping logic with no framework code.

**Spec.** `MappingSpec` (`file_id`, `schema_id`, `sheet`, `mappings`) is the
source of truth. `connect(spec, source, target)` replaces any existing
mapping on that target; `disconnect(spec, source, target?)` and
`disconnectTarget(spec, target)` remove mappings. Specs are treated
immutably — every op returns a new object.

**Validation.** `validateMappings` accepts either a `MappingSchema` or
`(sourceColumns, targetFields)` and reports duplicate targets, unknown target
IDs, out-of-range source indexes, and unmapped required targets:

```text
invalid_mapping
invalid_source_index
unknown_target
duplicate_target
required_target_missing
```

It returns `{ valid, codes, issues, errors }`; `validate` is an alias for the
schema form.

**Workflow state.** `ImporterStatus` models the lifecycle explicitly:

```text
idle → uploading → analyzing → ready → importing → success
  ↘______________↗_____________↗________________↗
                    error (retry via upload/analyze)
```

Drive it with `createMapperState`, `transitionMapperState(state, event)`,
and `canTransition(status, event)`. `mapping_changed` and `reset` events
apply from any status; state and events are generic over
`MapperState<Schema, Analysis, Result>` so hosts keep their own types.

## `@mapper/upload`

```ts
interface UploadAdapter {
  upload(file: Blob, filename?: string): Promise<SourceAnalysis>;
}
```

`MultipartUploadAdapter` (or `createMultipartUploadAdapter`) implements it
over `client.analyzeFile`. TUS resumable uploads arrive as a separate
`@mapper/upload-tus` package behind the same interface.

## `@mapper/react`

**`ReactFlowAdapter(spec, sourceColumns, targetFields)`** derives a
React Flow graph from the spec: `source-{index}` / `target-{index}` nodes
plus one edge per mapping. Node IDs never leak into the spec, where identity
stays `source` index → stable target ID.

**`MappingEditor`** is a controlled component — `value`/`onChange` plus
`sourceColumns`, `targetFields`, optional `disabled`, `validation`, and
`className`. It renders one row per target field with a source `<select>`,
a derived connection list, and validation errors.

**`MapperImporter`** runs the full flow and owns its state internally:

```tsx
interface MapperImporterProps {
  client: MapperClient;
  schemaId: number;
  uploadAdapter?: UploadAdapter;
  initialMapping?: Partial<MappingSpec>;
  onImported?: (result: ImportResult) => void;
  className?: string;
}
```

On mount it loads the schema; on file selection it uploads, analyzes, and
resets the mapping to the new `file_id`; `MappingEditor` edits the spec;
submit posts the validated mapping and reports `{ processed, succeeded,
failed }` with bounded row errors. Multi-sheet files get a sheet selector
that clears mappings on change. Styling is CSS variables only — import
`@mapper/react/styles.css`, no Tailwind requirement.

The SDK stays thin: no CSV parsing, no mapping execution, no automatic
matching. The backend revalidates everything and remains authoritative.
