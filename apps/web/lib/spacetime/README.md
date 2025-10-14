# Spacetime Setup

## Setup

### Generate schema

```bash
curl -s \
  'https://bitcraft-early-access.spacetimedb.com/v1/database/bitcraft-global/schema?version=9' | \
  jq '{ V9: . }' \
  > spacetime_bindings\schema.json
```

### Generate bindings

```bash
spacetime generate --lang typescript --out-dir spacetime_bindings --module-def spacetime_bindings/schema.json
```

## Usage

```typescript

```
