---
title: Design Principles
description: The rules Mapper is built around
---

Mapper is built around a small number of rules.

## Explicit mapping over guessing

The user decides what each external column means.

## Source columns are positional

```text
source identity = column index
```

No unnecessary generated source identifiers.

## Target fields have stable identity

```text
target identity = generated field ID
```

Renaming display labels does not change runtime identity.

## Mapping is portable

The graph UI produces a small language-neutral specification.

```text
Frontend
→ MappingSpec
→ Go backend SDK (generated TypeScript models for the frontend)
```

## File transport is replaceable

```text
multipart
TUS
custom upload
```

all converge to a completed:

```text
FileID
```

## Business processing belongs to the application

Mapper transforms records.

Your application decides what to do with them.
