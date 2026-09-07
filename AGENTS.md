# AGENTS.md — Agent & Contributor Guidelines

This document provides context, architectural rules, coding standards, and operational guidelines for AI coding agents (and human contributors) working in the **Crossword Mind** monorepo.

---

## 🏛️ Repository Overview & Architecture

Crossword Mind is an offline-first Portuguese crossword puzzle PWA built as a Turborepo monorepo with npm workspaces.

```
Crossword/
├── apps/
│   ├── api/             # Fastify 4.x backend & single-container static file server
│   │   ├── src/
│   │   │   ├── domain/         # Core crossword generation engine & interfaces
│   │   │   ├── application/    # Clean architecture use cases (GeneratePuzzleUseCase)
│   │   │   ├── infrastructure/ # In-memory repositories & word providers
│   │   │   └── server.ts       # Fastify server: REST API + SPA static server (@fastify/static)
│   │   └── test/               # Vitest unit tests
│   └── web/             # React 18 + Vite Progressive Web App (PWA)
│       ├── src/
│       │   ├── App.tsx         # Central game UI, grid render, and interaction
│       │   ├── services/       # LocalStorage game state persistence (gameStorage.ts)
│       │   ├── index.css       # Premium Dark-Glassmorphic Vanilla CSS
│       │   └── main.tsx        # React entrypoint + PWA service worker registration
│       └── test/               # Vitest unit tests for frontend services
├── packages/
│   └── shared-types/    # Shared TypeScript contracts, engine, and word dictionary
│       └── src/
│           ├── types.ts              # WordPlacement, PuzzleGrid, Direction, etc.
│           ├── CrosswordEngine.ts    # Deterministic board placement algorithm
│           ├── OfflineWordProvider.ts# Thematic word pool sampler
│           └── data/words.ts         # Embedded 6,800+ Portuguese dictionary dataset
├── .github/
│   └── workflows/
│       └── deploy.yml   # CI/CD: Quality gate + GHCR Docker deployment
├── Dockerfile           # Multi-stage production container (Single-port Fullstack)
├── docker-compose.yml   # Ready-to-run container compose configuration
├── eslint.config.js     # ESLint 9 Flat Config (TypeScript, React Hooks, Node)
├── .prettierrc          # Prettier styling configuration
└── turbo.json           # Turborepo task pipeline
```

---

## 🛠️ Essential Commands

Always run commands from the repository root:

| Command                            | Purpose                                                                         |
| :--------------------------------- | :------------------------------------------------------------------------------ |
| `npm run dev`                      | Starts all workspaces (Vite on `:5173`, Fastify on `:3333`)                     |
| `npm run dev --workspace=apps/web` | Starts only the Vite frontend dev server                                        |
| `npm run dev --workspace=apps/api` | Starts only the Fastify backend dev server                                      |
| `npm run build`                    | Compiles `shared-types` (`tsc`), `api` (`tsc`), and `web` (`tsc && vite build`) |
| `npm test`                         | Runs all Vitest suites across `apps/api` and `apps/web`                         |
| `npm run lint`                     | Runs ESLint 9 across the monorepo                                               |
| `npm run lint:fix`                 | Automatically fixes ESLint auto-fixable issues                                  |
| `npm run format`                   | Formats all files using Prettier                                                |
| `npm run format:check`             | Checks formatting without modifying files (used in CI)                          |
| `docker build -t crossword .`      | Builds the unified fullstack Docker image locally                               |
| `docker compose up -d`             | Runs the containerized application on `http://localhost:3000`                   |

---

## 📋 Strict Rules for AI Agents

### 1. Git & Commit Guidelines

- **Commit Messages**: MUST follow **Conventional Commits in English**:
  - `feat(scope): description`
  - `fix(scope): description`
  - `chore(scope): description`
  - `ci(scope): description`
  - `refactor(scope): description`
  - `docs(scope): description`
- **Branching Policy**:
  - **NEVER push directly to `main`** (branch protection rules are enforced).
  - Always work in descriptive branches: `feat/<name>`, `fix/<name>`, `chore/<name>`.
  - Provide a GitHub Pull Request link for the user to merge.
- **Git Identity & Secrets**:
  - Use the personal profile (`Taillis Mariquito <tailliskleisson@gmail.com>`).
  - NEVER alter or expose work/corporate Git configurations (`~/Workspace/Consensus/`).

---

### 2. Code Quality & Linter Compliance

- **Prettier & ESLint 9**:
  - The repository enforces strict formatting via Prettier (`.prettierrc`) and static analysis via ESLint 9 (`eslint.config.js`).
  - **Always run `npm run format` and `npm run lint` before committing.**
- **Clean React Patterns**:
  - Do NOT mutate `ref.current` during render. Update refs inside `useEffect` or event handlers.
  - Prefix intentionally unused variables/parameters with an underscore (`_varName`).
  - Avoid unused imports or dependencies.

---

### 3. Mobile-First Responsiveness (CRITICAL)

- The crossword grid is designed to work flawlessly on small screens (iPhone SE, iPhone 12/13/14/15/16, Android) with **ZERO horizontal scrolling**.
- **Cell Sizing Formula**:
  - Do NOT use rigid CSS `calc((100vw - X) / cols)` that can break or cause layout shifts on Safari.
  - Cell sizing is calculated dynamically in React:
    `const computed = Math.floor((availableWidth - gaps) / cols);`
    `return Math.max(18, Math.min(computed, 40));`
  - The cell size, font size, and clue numbers scale proportionally.
- **Layout Safeguards**:
  - `.theme-selector` MUST have `flex-wrap: wrap; width: 100%;`.
  - Clue list items and active word cards MUST have `min-width: 0`, `overflow-wrap: anywhere`, and `word-break: break-word` to prevent text truncation on iOS Safari.

---

### 4. Offline-First PWA & Game State Persistence

- The game is 100% offline-capable:
  - Dictionary and generation engine are bundled directly into the client.
  - Service worker operates silently with `autoUpdate`, `skipWaiting: true`, and `clientsClaim: true`.
- **Local Storage Persistence**:
  - Active game state (puzzle grid, placed words, user typed letters, revealed clues, active cell/direction, elapsed timer) is managed by [`apps/web/src/services/gameStorage.ts`](file:///Users/taillis/Workspace/Personal/Crossword/apps/web/src/services/gameStorage.ts).
  - Any modifications to state management must preserve or properly migrate `SavedGameState` without breaking user progress.
  - Always ask for confirmation before clearing or replacing a puzzle if user input exists.

---

### 5. Unified Single-Container Architecture

- The production Docker image ([`Dockerfile`](file:///Users/taillis/Workspace/Personal/Crossword/Dockerfile)) packages both the Fastify API and the static PWA into a **single container** on port **3000**:
  - Fastify serves `/puzzles/*` and `/health` as API endpoints.
  - Fastify serves `/` and all frontend static assets via `@fastify/static`, with SPA fallback to `index.html`.
  - Do NOT re-introduce Nginx or multi-container proxies unless explicitly instructed.
  - Keep `@fastify/static` compatible with Fastify 4.x (`@fastify/static@^7.0.4`).
  - Ensure any new runtime dependencies in sub-packages are properly copied in Dockerfile's runner stage.

---

### 6. GitHub Actions CI/CD Pipeline

- `.github/workflows/deploy.yml` runs on every Pull Request and push to `main`:
  1. `npm run format:check` (Prettier)
  2. `npm run lint` (ESLint 9)
  3. `npm test` (Vitest)
  4. `npm run build` (TypeScript + Vite)
  5. Docker build & publish to GHCR:
     - PRs: `ghcr.io/taillis/crossword-monorepo:pr-<number>-dev`
     - Main: `ghcr.io/taillis/crossword-monorepo:latest` and `sha-<commit>`
     - Auto-comments `docker run` command on the PR.
