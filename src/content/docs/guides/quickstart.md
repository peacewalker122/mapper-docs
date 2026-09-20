---
title: Quickstart
description: From YAML schema to imported records in minutes
---

## 1. Define the schema

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

## 2. Generate the model

```bash
go build -o mapper-gen ./cmd/mapper-gen
./mapper-gen validate schema/subscriber.yaml
./mapper-gen generate \
  --input schema/subscriber.yaml \
  --output generated/subscriber.gen.go \
  --package generated
```

This writes `subscriber.gen.go` (native struct + `SubscriberSchema`
descriptor) and `subscriber.lock.yaml` (stable numeric IDs). Commit the lock
file — IDs are generated once and never recycled.

## 3. Run the backend

```go
svc := mapper.New(
    mapper.WithFileStore(store),
    mapper.WithSourceAdapter(csv.New()),
    mapper.WithImporter(executor.NewImportExecutor(registry, store, csv.New(), processor)),
)
_ = svc.RegisterSchema(generated.SubscriberSchema)
```

## 4. Map in the UI

```tsx
const client = createMapperClient({ baseUrl: "/mapper" });

<MapperImporter client={client} schemaId={SUBSCRIBER_SCHEMA} />
```

Upload a CSV, draw column → field connections, submit. The backend streams
rows into typed `Record`s and calls your `ImportProcessor` per row.
