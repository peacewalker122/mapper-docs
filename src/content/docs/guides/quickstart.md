---
title: Quickstart
description: From YAML schema to imported records in minutes
---

Using Mapper consists of four steps: define the schema, register it with a
processor, add the frontend, and let the user map and import.

## Step 1: Define your target schema

Create a YAML schema:

```yaml
version: 1

model:
  name: subscriber

  fields:
    - name: msisdn
      type: string
      required: true

    - name: status
      type: string
      required: true
```

Supported types: `string`, `integer`, `decimal`, `boolean`, `datetime`.
Names must match `^[a-z][a-z0-9_]*$`.

Generate the backend model:

```bash
mapper-gen generate \
  --input schema/subscriber.yaml \
  --output generated/subscriber.gen.go \
  --package generated
```

Mapper creates:

```text
subscriber.gen.go
subscriber.lock.yaml
```

The lock file preserves stable schema and field identities — commit it.

## Step 2: Register the schema and processor

In the backend:

```go
svc := mapper.New(
	mapper.WithFileStore(store),
)

svc.RegisterSchema(
	generated.SubscriberSchema,
)

svc.RegisterImportProcessor(
	generated.SubscriberSchema.ID,
	processor,
)
```

Expose the HTTP adapter:

```go
handler := mapperhttp.New(svc)

mux.Handle(
	"/mapper/",
	http.StripPrefix("/mapper", handler),
)
```

The backend now provides the core Mapper APIs:

```text
GET  /schemas/{id}
POST /files/analyze
POST /imports
```

## Step 3: Add the Frontend SDK

Create the API client:

```ts
const mapper = createMapperClient({
  baseUrl: "/mapper"
});
```

Then render the importer:

```tsx
<MapperImporter
  client={mapper}
  schemaId={SUBSCRIBER_SCHEMA_ID}
/>
```

The component handles:

```text
schema loading
file analysis
mapping UI
mapping validation
import submission
result state
```

For more control, applications can use the lower-level `MappingEditor` or the headless API client directly.

## Step 4: Let the user map and import

The final user flow is:

```text
Select file
    ↓
Analyze source
    ↓
View columns
    ↓
Connect source fields to target fields
    ↓
Validate mapping
    ↓
Import
    ↓
Application ImportProcessor
```

For example:

```text
PhoneNumber ──────> msisdn
State       ──────> status
```

Once submitted, Mapper executes the mapping deterministically for every row.

## End-to-End Flow

```text
                     BUILD TIME

                   schema.yaml
                        │
                        ▼
                 Mapper Compiler
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
       Backend Model       Runtime Schema


                      RUNTIME

User
 │
 │ upload file
 ▼
Frontend SDK
 │
 │ analyze
 ▼
Backend SDK
 │
 ├── read source headers
 └── return SourceAnalysis
 │
 ▼
Frontend SDK
 │
 ├── load TargetSchema
 └── render Mapping Editor
 │
 ▼
User
 │
 │ connect source → target
 ▼
MappingSpec
 │
 │ POST /imports
 ▼
Backend SDK
 │
 ├── validate mapping
 ├── compile execution plan
 ├── stream source rows
 ├── convert values
 └── create typed Records
 │
 ▼
ImportProcessor
 │
 ▼
Your Application
```
