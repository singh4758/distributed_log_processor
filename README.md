# Distributed Log Processing System

This project is part of the my trainging to learn Node Js in deep.

## Project Overview

We're building a distributed system for processing log data at scale.
This repository contains all the code and configuration needed to run the system.

## Getting Started

### Prerequisite
- Docker and Docker composer
- Git
- VS Code


### Runinng the application
1. Clone this repository
2. Navigate to the project directory
3. Run `docker-compose up`


## Project Structure
- `src/services/`: Contains individual microservices
- `config/`: Configuratios files
- `data/`: Data Storage (gitignored)
- `tests/`: Test Suits

## Setup Explanation

This section explains how the repository is organized, how TypeScript projects are linked, how Docker/Compose builds and runs the logger service, and how the logger consumes the shared `libs/common` package.

### Monorepo layout (npm workspaces)

- The root `package.json` defines npm workspaces under:
	- `libs/*` (shared libraries)
	- `src/services/*` (microservices)
- Each workspace has its own `package.json` and TypeScript config.
- `npm install` (or `npm ci`) at the repository root installs dependencies for all workspaces and wires local packages together.

Workspaces used here:
- `libs/common`
	- Package name: `@myorg/common-utils`
	- Exports: `DateFormat` (wraps `dayjs`) and `FileHandler` (wraps Node `fs` for append/write, exists, size, rename)
- `src/services/logger`
	- Package name: `@myorg/logger`
	- Depends on `@myorg/common-utils` and uses adapters to conform to internal interfaces (ports)

### TypeScript configuration and linking

- Root `tsconfig.base.json` sets shared compiler options:
	- ESM (`module: nodenext`, `type: module` in package.jsons)
	- `composite: true` to enable project references
	- Declarations/maps enabled for good DX
	- `baseUrl` + `paths` to map `@myorg/common-utils` to `libs/common/src` for editor/compile-time resolution
- Root `tsconfig.json` declares project references:
	- `libs/common`
	- `src/services/logger`
	- Running `tsc -b` at the root builds in the correct order (common before logger)
- `libs/common/tsconfig.json` and `src/services/logger/tsconfig.json` set `rootDir` and `outDir` (to `dist`), and the logger references common.

How imports resolve:
- At compile-time, TS resolves `@myorg/common-utils` to `libs/common/src` because of `paths`.
- At runtime, Node resolves `@myorg/common-utils` via `node_modules` (npm workspaces symlink the local package). The package’s `main`/`module` point to `dist/index.js`.

### Logger architecture (ports/adapters/config)

- Ports (interfaces) in `src/services/logger/src/core/ports.ts` define dependencies:
	- `IClock`, `IDateFormatter`, `IFileSystem`, `ILogLevelHelper`
- Adapters implement these ports using the common library:
	- `CommonDateFormatterAdapter` wraps `DateFormat` from `@myorg/common-utils`
	- `CommonFileSystemAdapter` wraps `FileHandler` from `@myorg/common-utils`
	- `SystemClock` provides the current time
	- `LogLevelHelperAdapter` wraps the log level helper (defined in `config.ts`)
- Config in `src/services/logger/src/config.ts` reads environment variables with defaults (singleton `LoggerConfig`).
- Core `Logger` (`src/services/logger/src/Logger.ts`) handles:
	- Level filtering via `ILogLevelHelper`
	- Timestamp formatting via `IDateFormatter`
	- Console output and optional file append via `IFileSystem`
	- Simple rotation when file size reaches `log_max_size` MB

### Environment variables (read by LoggerConfig)

- `LOG_LEVEL` (default: `INFO`) — one of `DEBUG|INFO|WARNING|ERROR|CRITICAL` (enum keys)
	- Note: currently case-sensitive; e.g., `info` won’t match and will fall back to `INFO`.
- `LOG_FREQUENCY` (default: `5.0`) — seconds between periodic logs (if used)
- `LOG_TO_FILE` (default: `true`) — `true|false` to write to file
- `LOG_FILE_PATH` (default: `logs/logger.log`) — path to log file
- `LOG_MAX_SIZE_MB` (default: `1.0`) — max size before rotation (in MB)
- `WEB_HOST` (default: `0.0.0.0`) — reserved for future HTTP server
- `WEB_PORT` (default: `8080`) — reserved for future HTTP server
- `MAX_LOGS_TO_DISPLAY` (default: `100`) — in-memory buffer for recent logs

### Docker and Docker Compose flow

- `docker-compose.yml` defines the `logger` service:
	- Build context: repository root (`.`)
	- Dockerfile: `./src/services/logger/Dockerfile`
	- Volume: `./logs:/logs` to persist logs on the host
	- Ports: `8000:8000` (currently unused; there is no HTTP server yet)
	- Environment: sets `LOG_LEVEL` and `LOG_FILE_PATH`
- `src/services/logger/Dockerfile`:
	- Copies the repo into `/app`
	- Runs `npm ci && npm run build --workspaces` to install and build all workspaces
	- Sets working dir to `/app/src/services/logger` and runs `node dist/app.js`
- `.dockerignore` (at repo root) excludes common heavy or transient files from the build context (node_modules, dist, logs, VCS/editor files) to keep images lean.

What happens on `docker-compose up`:
1. The image builds using the Dockerfile above.
2. `npm ci` installs dependencies for all workspaces, linking `@myorg/common-utils` locally.
3. `npm run build --workspaces` compiles `libs/common` then `logger` (via TS project refs).
4. The container starts, running `node dist/app.js` of the logger service.
5. Logger reads envs, logs to console, and appends to `/logs/logger.log` (mounted to `./logs` on the host).

### Running locally (without Docker)

From the repository root:

```sh
# Install all workspaces
npm install

# Build all workspaces in correct order
npm run build

# Run the logger directly
node src/services/logger/dist/app.js

# Optionally set env vars for the run (zsh/macos):
LOG_LEVEL=INFO LOG_FILE_PATH=./logs/logger.log LOG_TO_FILE=true node src/services/logger/dist/app.js
```

Logs will be written to `./logs/logger.log` (create the `logs` directory if it doesn’t exist).

### Running with Docker Compose

```sh
# Build and start the logger service
docker-compose up --build

# Tear down
docker-compose down
```

- After it starts, check the host file `./logs/logger.log` to see file output.
- Console logs appear in the Compose output.

### Troubleshooting

- Nothing on port 8000:
	- The logger currently doesn’t expose an HTTP server. The port mapping in `docker-compose.yml` is a placeholder.
- `LOG_LEVEL` not respected:
	- Only uppercase enum keys are recognized (`INFO`, `DEBUG`, etc.). Lowercase values fall back to `INFO`.
- File not created:
	- Ensure the `logs` directory exists (host side) and the Compose volume is mounted (`./logs:/logs`).
- TypeScript import errors:
	- Make sure you run `npm install` at the repo root, not inside a workspace.
	- Use Node >= 18+ (image uses Node 24). ESM is enabled (`type: module` / `nodenext`).

### Clean up

```sh
# Remove all dist folders recursively
npm run clean

# Remove logs
rm -rf logs
```

### Notes and ideas for future improvements

- Make `LOG_LEVEL` case-insensitive in `LoggerConfig`.
- Remove or repurpose the `8000:8000` mapping (or add a small HTTP endpoint on 8000 to view recent logs).
- Consider multi-stage Docker builds to minimize final image size.
- Add `exports` field to `libs/common/package.json` for stricter ESM.