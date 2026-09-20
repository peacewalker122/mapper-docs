---
title: Install the frontend SDK
description: Install the Mapper npm packages for client, core, upload, and React
---

Published to npm as versioned packages (`@mapper-fe/client`,
`@mapper-fe/core`, `@mapper-fe/upload`, `@mapper-fe/react`). The four
packages use fixed versioning — install the same version together. Requires
Node 18+ (or Bun) and, for `@mapper-fe/react`, React ^19.

```bash
npm install @mapper-fe/client @mapper-fe/core @mapper-fe/upload @mapper-fe/react
```

```bash
# pnpm / yarn / bun equivalents
pnpm add @mapper-fe/client @mapper-fe/core @mapper-fe/upload @mapper-fe/react
yarn add @mapper-fe/client @mapper-fe/core @mapper-fe/upload @mapper-fe/react
bun add @mapper-fe/client @mapper-fe/core @mapper-fe/upload @mapper-fe/react
```

Install only what you need: `@mapper-fe/client` alone for the headless API
client, add `@mapper-fe/core` for mapping ops and workflow state,
`@mapper-fe/upload` for the multipart upload adapter, and
`@mapper-fe/react` for the editor/importer components. For React, also import
the stylesheet (CSS variables only, no Tailwind required):

```ts
import "@mapper-fe/react/styles.css";
```

Next: create the client and render the importer as shown in the
[Frontend SDK guide](/mapper-docs/guides/frontend/).
