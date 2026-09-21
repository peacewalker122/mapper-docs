---
title: Backend SDK
description: Registry, adapters, import runtime
---

The SDK owns schema exposure, file references, source analysis, mapping
validation, type conversion, and import orchestration. It never owns
databases, queues, or external calls — your `ImportProcessor` does that.

## Installation

See [Install the backend SDK](/mapper-docs/installation/backend/) for the
`go get` command and setup check (requires Go 1.26.1+).

## Service

```go
svc := mapper.New(mapper.WithFileStore(store))
_ = svc.RegisterSchema(generated.SubscriberSchema)
```

Schemas register explicitly at startup into a `MemorySchemaRegistry`, which
defensively rejects zero IDs, duplicate field IDs, and conflicting schemas.

## Source adapters

Format logic sits behind `SourceAdapter`. The CSV adapter treats the first
non-empty row as the header; the XLSX adapter adds sheet lists and selection.
Both stream rows — memory never scales with row count. Column identity is
always the array position; no synthetic source IDs exist.

## Mapping and import

The portable wire format maps source indexes to stable target IDs:

```json
{ "file_id": "...", "schema_id": 732918273981273, "sheet": 0,
  "mappings": [{ "source": 0, "target": 8374629102847361 }] }
```

Validation runs before any row is read: known file/schema/sheet, valid
indexes and IDs, at most one source per target, every required target
mapped. The spec then compiles once into an `ExecutionPlan` (`source[i] →
slot[j]`), so stable IDs are never re-resolved in the hot loop.

Conversions: `string` unchanged, `integer → int64`, `decimal → float64`,
`boolean → bool`, `datetime → time.Time` (RFC 3339). Empty + required is a
row error; empty + optional is `nil`. Row errors are bounded at 1000 details
while counters cover every row; policy is `fail_fast` or `continue`.

## ImportProcessor

```go
processor := mapper.ImportProcessorFunc(
	func(ctx context.Context, info mapper.RowContext, record mapper.Record) error {
		return repository.Save(ctx, record)
	},
)

svc := mapper.New(
	mapper.WithFileStore(store),
	mapper.WithSourceAdapter(csv.New()),
	mapper.WithImporter(executor.New(
		executor.WithImportProcessor(processor),
	)),
)
```

`Record.Values` follows target schema field order. Optional `BeginImport` /
`EndImport` hooks exist for lifecycle-aware processors.
