<!-- SPECKIT START -->
Active feature: `002-whatsapp-notifications` (extiende `001-grooming-saas-mvp`).

Read the current implementation plan for technologies, project structure,
shell commands and architectural decisions:

- Plan: [specs/002-whatsapp-notifications/plan.md](specs/002-whatsapp-notifications/plan.md)
- Spec: [specs/002-whatsapp-notifications/spec.md](specs/002-whatsapp-notifications/spec.md)
- Research: [specs/002-whatsapp-notifications/research.md](specs/002-whatsapp-notifications/research.md)
- Data model: [specs/002-whatsapp-notifications/data-model.md](specs/002-whatsapp-notifications/data-model.md)
- API contract (v0.2, fuente de verdad actual): [specs/002-whatsapp-notifications/contracts/openapi.yaml](specs/002-whatsapp-notifications/contracts/openapi.yaml)
- Quickstart: [specs/002-whatsapp-notifications/quickstart.md](specs/002-whatsapp-notifications/quickstart.md)
- Constitution: [.specify/memory/constitution.md](.specify/memory/constitution.md)

Base previo (no obsoleto; lo que esta feature no toca sigue valiendo):

- Plan 001: [specs/001-grooming-saas-mvp/plan.md](specs/001-grooming-saas-mvp/plan.md)
- Spec 001: [specs/001-grooming-saas-mvp/spec.md](specs/001-grooming-saas-mvp/spec.md)
- Data model 001: [specs/001-grooming-saas-mvp/data-model.md](specs/001-grooming-saas-mvp/data-model.md)
- Quickstart 001: [specs/001-grooming-saas-mvp/quickstart.md](specs/001-grooming-saas-mvp/quickstart.md)

This repo (`api-micro-saas`) is the **backend** (NestJS + TypeORM + PostgreSQL).
The frontend (Next.js) lives in a separate repo `www-micro-saas` and consumes
the contract above.
<!-- SPECKIT END -->
