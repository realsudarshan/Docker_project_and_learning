# Project 4 — Compose Watch + Hot Reload Dev Environment

## Motive

Every project before this required rebuilding the image to see code changes:

```powershell
docker compose up --build  # 30-60 seconds every change
```

That's fine for production. In development it's unusable.

This project sets up a proper dev workflow where saving a file in your editor
reflects inside the running container in ~1 second — no rebuild, no restart command.
It also covers the older bind mount approach so you understand what `compose watch`
replaced and why.

---

## What Was Built

A single Express/TypeScript API with two Dockerfiles — one for development
(live reload via `ts-node-dev`), one for production (compiled multistage build).
The `develop.watch` block in `docker-compose.yml` defines exactly what happens
when each type of file changes.

```
watch-demo/
├── api/
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile.dev     ← runs ts-node-dev, no build step
│   ├── Dockerfile.prod    ← multistage, compiles to dist/
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── .dockerignore
```

---

## How It Works

### The core idea

In development, you don't want to compile TypeScript or rebuild Docker images
on every change. `ts-node-dev` runs inside the container and watches for file
changes — when it detects one, it recompiles in memory and restarts the process.
`compose watch` is what gets the changed file from your machine into the container.

```
You save index.ts
      │
      ▼
compose watch detects change (action: sync)
      │
      ▼
Changed file copied into /app/src/ inside container
      │
      ▼
ts-node-dev detects the new file, restarts process
      │
      ▼
curl http://localhost:3000/ returns updated response
```

Total time: ~1 second. No docker commands needed.

### The three watch actions

`compose watch` defines rules per file path. Each rule has an `action` that
determines what Docker does when that path changes:

| Action | What happens | Time | When to use |
|---|---|---|---|
| `sync` | File copied into running container | ~1s | Source code — `.ts` files |
| `rebuild` | Full image rebuild triggered | 30-60s | `package.json` — new dep added |
| `sync+restart` | File synced then container restarted | ~3s | Config files — `tsconfig.json` |

### Dev Dockerfile vs Prod Dockerfile

| | Dockerfile.dev | Dockerfile.prod |
|---|---|---|
| Base | `node:20-alpine` | `node:20-alpine` (multistage) |
| deps | All including devDeps | Prod only |
| Source | Copied in for initial boot, then synced by watch | Compiled to `dist/` |
| Startup | `ts-node-dev src/index.ts` | `node dist/index.js` |
| Rebuild needed? | No — watch syncs changes after first build | Yes — on any change |

### Bind mounts vs compose watch

The old approach used volumes to mount source into the container:

```yaml
# Old way
volumes:
  - ./api/src:/app/src
  - /app/node_modules
```

Problems with bind mounts:
- The anonymous volume trick (`/app/node_modules`) is confusing and fragile
- No automatic rebuild when `package.json` changes
- Performance issues on Docker Desktop for Windows and Mac (filesystem translation overhead)
- Mounts the entire directory — can't trigger different actions per file type

`compose watch` is the modern replacement. It watches specific paths, triggers
the right action per file type, and handles `node_modules` correctly without tricks.

---

## Commands

### Start dev environment

```powershell
# Build the image first — always required before first watch run
# or after changing Dockerfile.dev
docker compose build

# Then start watch mode
docker compose watch
```

`watch` does not have a `--build` flag. Build and watch are separate commands.
Keep the watch terminal open — it shows sync events and rebuild output as they happen.

### Test hot reload

```powershell
# In a second terminal
curl http://localhost:3000/

# Edit api/src/index.ts and save
# Watch the first terminal for the restart message
# Then hit the endpoint again — response is updated
curl http://localhost:3000/
```

### Trigger a rebuild

```powershell
# Install a new package — compose detects package.json change and rebuilds
cd api
npm install lodash
npm install -D @types/lodash
cd ..
# Watch the first terminal — full rebuild starts automatically
```

### Other useful commands

```powershell
# Logs only (if running watch in background)
docker compose logs -f api

# Force manual rebuild while watch is running
docker compose up -d --build api

# Run production build to verify it still works
docker compose -f docker-compose.prod.yml up --build

# Stop everything
# Ctrl+C in watch terminal, then:
docker compose down
```

---

## docker-compose.yml explained

```yaml
develop:
  watch:
    - action: sync          # just copy the file, no restart
      path: ./api/src       # watch this folder on your machine
      target: /app/src      # paste it here inside the container

    - action: rebuild       # full image rebuild
      path: ./api/package.json

    - action: rebuild
      path: ./api/package-lock.json

    - action: sync+restart  # copy file then restart container
      path: ./api/tsconfig.json
      target: /app/tsconfig.json
```

The `path` is on your machine. The `target` is inside the container.
Only `sync` and `sync+restart` need a `target` — `rebuild` discards
the old container entirely so there's nowhere to sync to.

---

## Key Concepts Learned

**Source must exist in the image for first boot**
`compose watch` syncs file changes after the container is running — it does not
populate the container on first start. `Dockerfile.dev` must `COPY src/ ./src/`
so `ts-node-dev` has something to start with. Watch takes over from there,
syncing any subsequent changes without a rebuild.

**ts-node-dev runs inside the container**
The live reload has two parts working together: `compose watch` gets the file
into the container, `ts-node-dev` detects the new file and restarts the Node
process. Neither one alone is enough.

**Dev and prod images should be different**
`Dockerfile.dev` has devDependencies, no compilation step, and starts with
`ts-node-dev`. `Dockerfile.prod` is multistage, prod deps only, runs compiled
`dist/`. Same source code, completely different runtime setup. Never use
a dev image in production.

**rebuild is expensive, use it only when necessary**
Syncing a file takes ~1 second. Rebuilding an image takes 30–60 seconds.
Only trigger rebuild when the image filesystem actually needs to change —
i.e. when dependencies change. Source code changes should always be `sync`.

**The anonymous volume trick is a smell**
If you see `- /app/node_modules` in a Compose volumes section, it's a workaround
for bind mount limitations. It tells Docker to keep the container's `node_modules`
and not overwrite it with the (likely empty) host directory. `compose watch`
doesn't need this because it syncs specific files, not entire directories.

![composewatchflow](composewatchflow.png)
![devvsprodpipeline](devvsprodpipeline.png)