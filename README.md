# Crossword Mind 🧩

<p align="center">
  <img src="apps/web/public/icon-192x192.png" width="96" height="96" alt="Crossword Mind Logo" style="border-radius: 20px;" />
</p>

<p align="center">
  <strong>A modern, offline-first Portuguese crossword puzzle progressive web application (PWA) powered by procedural grid generation and clean architecture.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Fastify-4.28-000000?logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/Turborepo-2.0-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" />
  <img src="https://img.shields.io/badge/PWA-100%25%20Offline-10B981?logo=pwa&logoColor=white" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/License-MIT-purple" alt="License" />
</p>

---

## 📖 Overview

**Crossword Mind** is a high-performance, full-stack crossword game built in a Turborepo monorepo. It features an autonomous client-side procedural generation engine bundled with an offline dictionary of over **6,800+ Portuguese words and definitions**.

Designed with a **mobile-first approach**, the application runs seamlessly on mobile devices (iOS Safari, Android Chrome) and desktops, offering responsive single-screen layouts, native software keyboard integration, real-time validation, and continuous background auto-updates.

---

## ✨ Key Features

- **⚡ 100% Offline Gameplay (Zero-Latency)**:
  - Bundled with a rich offline dictionary categorized into thematic topics.
  - Client-side crossword generation algorithm creates fresh, solvable crosswords on the fly without network latency.
- **📱 True Mobile-First & Single-Screen Experience**:
  - Dynamically calculates cell dimensions (`cellSize`) based on screen width and column density, guaranteeing zero horizontal scroll on phones.
  - Transparent integration with native iOS/Android software keyboards, including auto-zoom suppression (`fontSize: 16px`) and reliable virtual backspace handling.
  - Touch action controls (`⇄ Direction`, `⌫ Backspace`, `➔ Next Word`, `Clear Board`).
- **🔄 Silent Background Auto-Update**:
  - Progressive Web App (PWA) with Workbox service worker caching.
  - Continuous update polling every 60s and on app visibility change (`visibilitychange`).
  - Automatic cache replacement (`skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`) ensuring users always receive the latest release seamlessly without disruptive popups.
- **🎯 Thematic Word Categories**:
  - Filter puzzles by themes: _Todos (All)_, _Tecnologia (Technology)_, _Ciência (Science)_, _Natureza (Nature)_, _Geografia (Geography)_, _História (History)_, and _Geral (General)_.
  - Customizable board density (6, 8, 10, or 12 words per puzzle).
- **🧠 Real-Time Visual Assistance & Feedback**:
  - Dynamic cell highlighting: active word focus, completed words, and mistake indicators.
  - Interactive verification mode highlighting correct and erroneous letters in real-time.
  - "Gabarito" (complete solution) toggle and word reveal helpers.
- **💎 Dark Glassmorphic Aesthetic**:
  - Clean UI with HSL dark palette, smooth glow accents, and responsive typography (`Plus Jakarta Sans` and `JetBrains Mono`).

---

## 🏗️ Architecture & Monorepo Structure

The project is structured as a modular monorepo managed with **Turborepo** and **npm workspaces**:

```
crossword-monorepo/
├── apps/
│   ├── api/                     # Backend REST API service
│   │   ├── src/
│   │   │   ├── application/     # Use cases (GeneratePuzzleUseCase)
│   │   │   ├── domain/          # Entities & CrosswordEngine logic
│   │   │   ├── infrastructure/  # Repositories & Dictionary providers
│   │   │   └── server.ts        # Fastify HTTP server entrypoint
│   │   └── test/                # Unit & integration tests (Vitest)
│   │
│   └── web/                     # Frontend client application
│       ├── public/              # High-res PWA icons & manifest
│       ├── src/
│       │   ├── App.tsx          # Main interactive game view
│       │   ├── index.css        # Responsive design system & glassmorphism
│       │   ├── main.tsx         # App bootstrapping & SW auto-updater
│       │   └── vite-env.d.ts    # TypeScript definitions for Vite & PWA
│       ├── index.html           # HTML template with Apple PWA meta tags
│       └── vite.config.ts       # Vite + VitePWA build configuration
│
├── packages/
│   └── shared-types/            # Shared cross-cutting package
│       └── src/
│           ├── types.ts         # Domain interfaces (WordNode, CrosswordGrid, etc.)
│           ├── CrosswordEngine.ts # Shared generation algorithm
│           ├── OfflineWordProvider.ts # Thematic word filter & selector
│           └── data/words.json  # 6,800+ curated Portuguese words & clues
│
├── scripts/
│   └── build-dataset.ts         # Dataset extraction & sanitation script
├── package.json                 # Monorepo root definition
├── turbo.json                   # Pipeline task runner configuration
└── tsconfig.json                # Base TypeScript configuration
```

---

## ⚙️ Procedural Crossword Engine

The generator uses an optimized heuristic placement algorithm:

1. **Seed Placement**: The longest seed word is placed horizontally across the center of the grid.
2. **Intersection Matching**: For each subsequent word candidate, the algorithm scans active board coordinates to find matching letters.
3. **Collision & Rule Checking**:
   - Words must maintain parallel spacing (no parallel words placed directly on adjacent tracks).
   - Leading and trailing boundaries of newly placed words must remain empty.
   - Cross-intersections must match character-by-character.
4. **Scoring & Compaction**: Each valid candidate position is scored based on intersection count, compactness, and proximity to grid bounds.
5. **Dynamic Bounding**: Normalizes coordinates and computes tight bounding boxes (`minRow`, `maxRow`, `minCol`, `maxCol`) for the board.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or later
- **npm**: `v9.0.0` or later

### Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:taillis/crossword-monorepo.git
cd crossword-monorepo
npm install
```

### Development

Run all packages (frontend and backend) concurrently:

```bash
npm run dev
```

Or run individual workspaces:

```bash
# Start Vite frontend (accessible on local network at port 5173)
npm run dev --workspace=apps/web

# Start Fastify backend (listening at port 3333)
npm run dev --workspace=apps/api
```

- **Frontend Application**: `http://localhost:5173` (or `http://<your-lan-ip>:5173`)
- **Backend API**: `http://localhost:3333`

---

## 🧪 Testing

The repository uses **Vitest** for fast unit testing of the domain engine and generation algorithms:

```bash
# Run test suite across the monorepo
npm test

# Run tests with watch mode in the API workspace
npm run test --workspace=apps/api
```

---

## 🧹 Linting & Code Formatting

The codebase enforces consistent style and quality using **ESLint 9** and **Prettier**:

```bash
# Check code formatting with Prettier
npm run format:check

# Automatically fix code formatting across the repository
npm run format

# Run ESLint static analysis across all packages
npm run lint

# Automatically fix lintable ESLint issues
npm run lint:fix
```

---

## 📦 Production Build

Build all packages and production bundles:

```bash
npm run build
```

This compiles shared packages, executes type checking (`tsc`), and bundles static assets with Vite and Workbox into `apps/web/dist`.

---

## 🐳 Docker & Container Deployment

Crossword Mind is packaged as a **single lightweight production container** that serves both the static PWA frontend and the Fastify REST API under a single unified port with zero external web server dependencies (like Nginx).

### Running with Docker

Run the latest image directly from the GitHub Container Registry (GHCR):

```bash
docker run -d \
  --name crossword-app \
  -p 3000:3000 \
  --restart unless-stopped \
  ghcr.io/taillis/crossword-monorepo:latest
```

Access the app at `http://localhost:3000`.

### Running with Docker Compose

A pre-configured `docker-compose.yml` is included in the root directory:

```bash
# Start the container
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

### Building the Image Locally

```bash
docker build -t crossword-app .
docker run -d -p 3000:3000 crossword-app
```

### Environment Variables

| Variable      | Default              | Description                                   |
| :------------ | :------------------- | :-------------------------------------------- |
| `PORT`        | `3000`               | HTTP port for the combined web and API server |
| `NODE_ENV`    | `production`         | Node.js runtime environment                   |
| `STATIC_ROOT` | `/app/apps/web/dist` | Directory path for frontend static assets     |

### Automated CI/CD (GitHub Actions + GHCR)

The CI/CD pipeline ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) automates testing and container publishing for both Pull Requests and production releases:

#### 🧪 On Pull Requests (`pull_request` -> `main`)

1. **Quality Gate**: Verifies Prettier code formatting (`npm run format:check`), executes ESLint static analysis (`npm run lint`), runs Vitest unit tests (`npm test`), and verifies the full TypeScript/Vite production build (`npm run build`).
2. **Preview Docker Image**: Builds and pushes preview images to GHCR:
   - **Floating PR Tag:** `ghcr.io/taillis/crossword-monorepo:pr-<number>-dev` (e.g. `pr-1-dev`)
   - **Immutable Run Tag:** `ghcr.io/taillis/crossword-monorepo:pr-<number>-<run_number>-dev` (e.g. `pr-1-3-dev`)
3. **Automated PR Comment**: Posts a ready-to-use `docker run` command directly onto the Pull Request for instant team/reviewer testing.

#### 🚀 On Main Branch (`push` -> `main`)

1. Runs all automated unit tests and build checks.
2. Builds the final production Docker image.
3. Automatically publishes the production release to **GitHub Container Registry**:
   - `ghcr.io/taillis/crossword-monorepo:latest`
   - `ghcr.io/taillis/crossword-monorepo:sha-<commit>`
   - `ghcr.io/taillis/crossword-monorepo:<version>` (for tagged releases like `v1.0.0`)

---

## 📲 Installing as a PWA on Mobile

### iOS (Safari)

1. Open Safari and navigate to `http://<your-host-ip>:5173` (or your production URL).
2. Tap the **Share** button (the square icon with an upward arrow at the bottom).
3. Scroll down and select **Add to Home Screen** (icon with `+`).
4. Tap **Add** in the top right.
5. Launch the app from your home screen. It will open in standalone fullscreen mode without Safari browser toolbars and function 100% offline.

### Android (Google Chrome)

1. Open Google Chrome and navigate to the app URL.
2. Tap the three-dot menu in the upper-right corner.
3. Tap **Install app** or **Add to Home screen**.
4. Confirm installation.

---

## 📝 Commit Conventions

This repository enforces **[Conventional Commits](https://www.conventionalcommits.org/)** in English:

- `feat:` Adds a new feature or functionality
- `fix:` Patches a bug or fixes layout/rendering issues
- `docs:` Documentation additions or updates
- `style:` Formatting or style adjustments without code logic changes
- `refactor:` Code restructuring without changing functional behavior
- `test:` Adding or updating unit tests
- `chore:` Maintenance, dependency updates, and build tool adjustments

_Example:_

```bash
git commit -m "feat(web): add silent auto-update service worker lifecycle"
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Crafted with ❤️ by <strong>Taillis Mariquito</strong>
</p>
