# First-Timer Guide — Repository, TypeScript, and Docker Overview

Welcome! This guide explains how the pieces in this monorepo connect: npm workspaces, TypeScript configs, the shared `libs/common` package, the `logger` service, and how Docker/Compose builds and runs everything.

## What you’ll learn
- How the repo is organized and how packages relate
- How TypeScript paths and project references link packages
- How the `logger` service uses the shared `@myorg/common-utils` package
- How Docker builds and runs the `logger` with docker-compose
- The runtime flow from `docker-compose up` to logs written on your machine

## Big picture
- This is a monorepo with multiple workspaces managed by npm.
- `libs/common` contains reusable utilities.
- `src/services/logger` is a microservice that depends on `libs/common`.
- TypeScript project references ensure `common` builds before `logger`.
- Docker builds the entire repo and runs the `logger` service.

## Repository layout (key parts)
- `package.json` (root)
  - Declares npm workspaces: `src/services/*`, `libs/*`.
  - Central TypeScript dev deps and scripts (`tsc -b`).
- `tsconfig.base.json` (root)
  - Global TS settings, ESM (`module: nodenext`), strict mode.
  - `paths` to map `@myorg/common-utils` to `libs/common/src` for editor/build-time resolution.
- `tsconfig.json` (root)
  - Project references for incremental builds: `libs/common` then `src/services/logger`.
- `libs/common`
  - Package `@myorg/common-utils`: exports `DateFormat` (uses `dayjs`) and `FileHandler` (Node `fs`).
  - Builds to `dist/` with TypeScript.
- `src/services/logger`
  - Package `@myorg/logger`: depends on `@myorg/common-utils`.
  - Ports (interfaces) in `core/ports.ts`; adapters in `adapters/` wrap the common lib.
  - Builds to `dist/` with TypeScript; entrypoint `src/app.ts`.
- `docker-compose.yml`
  - Defines the `logger` service build/run, env vars, ports, volumes.
- `.dockerignore`
  - Keeps images lean by excluding `node_modules`, `dist`, `logs`, Git/editor files, etc.

## How npm workspaces connect packages
- Root `package.json` lists workspaces: `libs/*` and `src/services/*`.
- When you run `npm ci` (in Docker) or `npm i` (locally), npm links the local workspace packages into `node_modules`.
- At runtime, `@myorg/logger` imports `@myorg/common-utils` as a normal dependency from `node_modules`, but it’s actually your local `libs/common` package.

## TypeScript config and linking
- `tsconfig.base.json` sets shared options and defines path aliases:
  - `@myorg/common-utils` → `./libs/common/src/index.ts`
- `tsconfig.json` (root) defines project references:
  - `libs/common` and `src/services/logger`.
- Each package has its own `tsconfig.json` with `rootDir` and `outDir` set (to `src` and `dist`).
- Build behavior:
  - `tsc -b` compiles referenced projects in order: common first, then logger.
  - TS uses path aliases for editor and type resolution; runtime still uses `node_modules`.
- ESM details:
  - Both packages use `"type": "module"` and `"module": "nodenext"`.
  - Source imports include `.js` extensions (e.g., `import "./config.js"`) for Node ESM compatibility after transpilation.

## How `logger` uses `libs/common`
- Adapter pattern: `src/services/logger/src/adapters/common.adapters.ts` wraps common utilities behind interfaces (`IDateFormatter`, `IFileSystem`, `IClock`).
  - `CommonDateFormatterAdapter` → wraps `DateFormat` (dayjs under the hood).
  - `CommonFileSystemAdapter` → wraps `FileHandler` (append, exists, size, rename via `fs`).
  - `SystemClock` → provides current time.
- Log level helper: `level_helper.adapter.ts` wraps `LogLevelHelper` from `config.ts` and implements `ILogLevelHelper`.
- Core logger: `src/services/logger/src/Logger.ts` orchestrates everything:
  - Checks if a message level is enabled, formats timestamps, prints to console.
  - Writes to file if enabled; rotates when file exceeds configured size.
- Entry point: `src/services/logger/src/app.ts` wires up config + adapters and logs a sample message.

## Docker and Compose flow
- `docker-compose.yml` sets up one service: `logger`.
  - build:
    - `context: .` (the repo root)
    - `dockerfile: ./src/services/logger/Dockerfile`
  - volumes:
    - `./logs:/logs` (host logs directory mounted inside container)
  - ports:
    - `8000:8000` (not used by the current logger; you can remove it or add an HTTP server later)
  - environment:
    - `LOG_LEVEL=info`
    - `LOG_FILE_PATH=/logs/logger.log`
- `src/services/logger/Dockerfile` builds and runs the entire workspace:
  1. Copies the repo into `/app` (`.dockerignore` keeps it lean).
  2. `npm ci` installs workspace dependencies and links `@myorg/common-utils`.
  3. `npm run build --workspaces` compiles all packages (common then logger) to `dist/`.
  4. Changes working dir to the logger package.
  5. Runs `node dist/app.js`.

## What happens when you run it
1. `docker-compose up` builds the image and starts the `logger` container.
2. The logger reads environment variables (see below) to configure itself.
3. It logs to the console and, if enabled, appends to `/logs/logger.log` (mounted to your host `./logs` directory).
4. If the log file reaches `LOG_MAX_SIZE_MB`, it rotates the file with a timestamp suffix.

## Environment variables (used by the logger)
- `LOG_LEVEL` (default: `INFO`)
  - Enum keys are uppercase (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`).
  - With `LOG_LEVEL=info` (lowercase), the code falls back to `INFO` (current implementation is case-sensitive when checking keys).
- `LOG_FREQUENCY` (default: `5.0`)
- `LOG_TO_FILE` (default: `true`)
- `LOG_FILE_PATH` (default: `logs/logger.log`) — in Docker we set `/logs/logger.log` so logs persist to host.
- `LOG_MAX_SIZE_MB` (default: `1.0`)
- `WEB_HOST` (default: `0.0.0.0`) — reserved for a future HTTP interface.
- `WEB_PORT` (default: `8080`) — reserved for a future HTTP interface.
- `MAX_LOGS_TO_DISPLAY` (default: `100`) — in-memory recent logs buffer.

## Common gotchas
- LOG_LEVEL case sensitivity
  - Only uppercase enum keys match exactly. Consider using uppercase values or update the code to normalize case.
- Exposed port 8000
  - The logger doesn’t start an HTTP server yet, so port 8000 isn’t used. Safe to remove or add a server later.
- File permissions
  - The volume `./logs:/logs` writes to your host; ensure the `logs` folder exists and is writable.

## Optional: try it locally (no Docker)
- From the repo root:
  1. Install deps: `npm i`
  2. Build all workspaces: `npm run build`
  3. Run the logger: `node src/services/logger/dist/app.js`

## Optional: try it with Docker
- From the repo root:
  1. Ensure you have a `logs` folder: `mkdir -p logs`
  2. Start: `docker-compose up --build`
  3. Check host logs: `tail -f logs/logger.log`

## Next steps (nice enhancements)
- Normalize `LOG_LEVEL` to be case-insensitive (convert env to uppercase before checking).
- Remove unused port mapping from `docker-compose.yml` or add an HTTP endpoint on port 8000.
- Add `exports` field to `libs/common/package.json` for cleaner ESM consumption.
- Consider a multi-stage Docker build to reduce final image size.

---
If anything is unclear, open this doc side-by-side with the files mentioned and follow along. It’s a great way to learn the flow end-to-end.
