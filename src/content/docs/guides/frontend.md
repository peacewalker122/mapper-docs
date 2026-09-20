---
title: Frontend SDK
description: Client, mapping core, React editor
---

```tsx
const client = createMapperClient({ baseUrl: "/mapper" });

<MapperImporter client={client} schemaId={SUBSCRIBER_SCHEMA} />
```

## Layers

- **`@mapper/client`** — HTTP, protocol types, error envelope. Accepts a
  custom `fetch` so hosts inject auth, retries, or tracing. No React, no DOM.
- **`@mapper/core`** — pure mapping ops (`connect`/`disconnect`), validation
  (`duplicate_target`, `required_target_unmapped`, …), and an explicit
  `ImporterStatus` state machine. No framework code may leak in.
- **`@mapper/react`** — `MappingEditor` (controlled: `value`/`onChange`) and
  `MapperImporter` (schema → upload → mapping → import → result). The
  React Flow graph is derived from `MappingSpec` through an adapter; graph
  node IDs must never leak into the spec, where identity stays
  `source` index → stable target ID.
- **`@mapper/upload`** — `UploadAdapter` abstraction plus the multipart
  default; TUS arrives as `@mapper/upload-tus`.

The SDK stays thin: no CSV parsing, no mapping execution, no automatic
matching. The backend revalidates everything and remains authoritative.
Styling is CSS variables only — no Tailwind requirement.
