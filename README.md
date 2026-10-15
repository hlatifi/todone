# ToDone

A cross-platform, offline-first Todo application built with Uncle Bob's Clean Architecture, targeting Android, iOS, and Progressive Web App (PWA).

## Architecture

- **Clean Architecture Monorepo**: Pure TypeScript domain entities and use cases decoupled from frameworks and storage.
- **Agent Coordination**: Uncle Bob's SwarmForge (`swarm-forge`) squad topology.
- **Acceptance Testing**: Portable Acceptance Pipeline Specification (APS) & FitNesse Slim harness executing against pure Clean Architecture use cases.
- **Client**: Expo Router (React Native & Expo Web PWA).

```
todone/
├── packages/
│   ├── core/                  # Pure TypeScript (Zero Framework / Zero DB dependencies)
│   │   ├── src/entities/      # Task, Invariants, Value Objects
│   │   ├── src/gateways/      # TaskGateway boundary interface
│   │   └── src/use-cases/     # Interactors, Input/Output Ports, DTOs
│   │
│   ├── adapters/              # Interface Adapters
│   │   ├── src/repositories/  # InMemoryTaskGateway (for test & local execution)
│   │   └── src/presenters/    # Presenter output port implementations
│   │
│   └── acceptance/            # Acceptance Pipeline Specification (APS) Harness
│       ├── features/          # Gherkin feature files (.feature)
│       ├── src/parser/        # Gherkin to JSON IR parser (parser-spec.md)
│       ├── src/runtime/       # Acceptance runner & StepRegistry
│       └── src/fixtures/      # TaskFixture driving Clean Architecture use cases
│
└── apps/
    └── todone/                # Expo Router App (iOS, Android, Web PWA)
        ├── app/               # File-based routes (_layout.tsx, index.tsx)
        ├── assets/            # Native & PWA icon assets
        └── metro.config.js    # Monorepo workspace resolver
```

## Quick Start

### Prerequisites
- Node.js >= 22
- pnpm >= 11

### Installation
```bash
pnpm install
```

### Development
```bash
# Start Expo development server (all platforms)
pnpm dev

# Run directly on Web (PWA preview)
pnpm web

# Run on Android emulator / device
pnpm android

# Run on iOS simulator / device (macOS only)
pnpm ios
```

### Typecheck & Acceptance Testing
```bash
# Typecheck across all packages and apps
pnpm typecheck

# Run all unit and Gherkin acceptance test suites
pnpm test
```

### Production Build & PWA Export
```bash
# Compile packages and export static Web PWA
pnpm build
```
