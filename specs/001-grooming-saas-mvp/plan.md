# Implementation Plan: SaaS Peluquería Canina — MVP Demo

**Branch**: `001-grooming-saas-mvp` | **Date**: 2026-05-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-grooming-saas-mvp/spec.md`

## Summary

MVP de un SaaS para peluquerías caninas con foco en una **demo de venta**: un
visitante pulsa "Probar demo", entra como usuario demo en un tenant ephemeral
con datos precargados, ve la agenda del día, gestiona clientes, crea citas y
dispara recordatorios simulados tipo WhatsApp.

Arquitectura **dos repositorios**:

- **`api-micro-saas`** (este repo) — Backend REST en **NestJS** sobre
  **PostgreSQL** vía **Prisma**, con autenticación **JWT** y aislamiento
  multi-tenant por `tenant_id`. Expone los endpoints definidos en
  `contracts/openapi.yaml` y la simulación de recordatorios.
- **`www-micro-saas`** (repo separado) — Frontend en **Next.js 15** que
  consume la API, gestiona la sesión JWT y reproduce visualmente la
  experiencia (dashboard, formularios, vista previa del recordatorio).

Este `plan.md` es la **fuente de verdad compartida** por ambos repos. El
contrato de API (`contracts/openapi.yaml`) y el modelo de datos
(`data-model.md`) son referencia obligatoria para frontend y backend.

## Technical Context

**Language/Version**: TypeScript 5.4+ en ambos repos. Node.js 20 LTS.
**Primary Dependencies**:

- Backend: NestJS 10, **TypeORM 0.3** (`@nestjs/typeorm`, `pg`),
  `@nestjs/jwt`, `passport-jwt`, `class-validator`, `class-transformer`,
  `@nestjs/config`, `@nestjs/schedule`.
- Frontend: Next.js 15 (App Router), React 19, TanStack Query 5 para fetching,
  Zod para validación, `jose` o decodificación JWT del lado cliente.

**Storage**: PostgreSQL 16. TypeORM maneja migraciones vía CLI
(`typeorm migration:generate` / `migration:run`) contra `data-source.ts`.
**Testing**: OPCIONAL por Constitución §Restricciones del MVP. Se difiere a
post-MVP; el plan prioriza velocidad. Smoke manual mediante `quickstart.md`.
**Target Platform**: Backend en contenedor Linux (Railway/Render). Frontend en
Vercel. Navegadores modernos en escritorio (Chrome/Safari/Firefox últimas dos
versiones); móvil responsive deseable, no bloqueante.
**Project Type**: Web — backend API service + frontend SPA en repos separados.
**Performance Goals**: Dashboard renderizado en < 2 s tras login demo (SC-002).
Acción de recordatorio simulado con feedback visible en < 2 s (SC-004).
**Constraints**:

- UI y datos demo en español neutro.
- Sin registro público; sólo el flujo de "Probar demo" crea sesiones.
- Sin integración real con WhatsApp; el envío es simulado pero indistinguible.
- Sin pasarela de pagos en el MVP.

**Scale/Scope**: Escala objetivo en MVP: ~50 tenants demo activos
concurrentemente, ~200 clientes y ~500 citas por tenant. Cleanup de tenants
demo expirados via job cron diario.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Regla | Estado | Notas |
|-------------------|--------|-------|
| **I. Simplicidad sobre Complejidad** | ✅ | Stack mainstream (NestJS + Next.js + TypeORM). CRUD directo, sin abstracciones especulativas. |
| **II. Valor Inmediato** | ✅ | Login demo en 1 clic; dashboard como pantalla por defecto post-login (FR-001, FR-004). |
| **III. Enfoque en Negocio Local** | ⚠ Justificada | Multi-tenant `tenant_id` se incluye desde el día 1; ver Complexity Tracking. |
| **IV. Automatización Útil** | ✅ | Recordatorios simulados como feature central (FR-014–FR-017). |
| **§Comunicación: WhatsApp simulado** | ✅ | `POST /notifications/reminder` registra envío sin integración externa. |
| **§Restricciones: sin registro público** | ✅ | El único flujo de creación de sesión es "Probar demo" (genera tenant ephemeral). |
| **§Restricciones: sin integraciones externas** | ✅ | Prisma + Postgres son internos; no hay llamadas a APIs externas en el MVP. |
| **§Restricciones: velocidad sobre cobertura de tests** | ✅ | Tests OPCIONALES y diferidos; smoke manual via quickstart. |
| **Regla de Oro: vender antes de escalar** | ✅ | El plan optimiza para una demo cerrable, no para escalado masivo. |

## Project Structure

### Documentation (this feature)

```text
specs/001-grooming-saas-mvp/
├── plan.md                # This file
├── research.md            # Phase 0 — decisiones técnicas resueltas
├── data-model.md          # Phase 1 — entidades, atributos, relaciones
├── quickstart.md          # Phase 1 — cómo levantar backend + frontend en local
├── contracts/
│   └── openapi.yaml       # Phase 1 — contrato REST compartido por ambos repos
├── checklists/
│   └── requirements.md    # Generado por /speckit-specify
└── tasks.md               # Phase 2 — generado por /speckit-tasks (no aún)
```

### Source Code

Este plan abarca **dos repositorios**. Las rutas que siguen son la disposición
objetivo dentro de cada repo, no rutas dentro del directorio actual.

**Repo `api-micro-saas` (backend, este repo):**

```text
src/
├── main.ts                       # Bootstrap NestJS
├── app.module.ts                 # Módulo raíz (importa TypeOrmModule.forRootAsync)
├── app.controller.ts             # Health endpoint /health
├── common/
│   ├── decorators/
│   │   └── current-tenant.decorator.ts   # Extrae tenantId del JWT
│   ├── guards/
│   │   └── jwt-auth.guard.ts             # Valida JWT y carga tenantId
│   └── interceptors/
│       └── tenant-scope.interceptor.ts   # Inyecta tenantId en queries
├── database/
│   ├── data-source.ts            # DataSource TypeORM (CLI + runtime)
│   └── migrations/               # Archivos de migración generados
├── modules/
│   ├── auth/                     # AuthModule — login demo, emisión JWT, JwtStrategy
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/jwt.strategy.ts
│   │   └── dto/
│   ├── tenants/                  # TenantsModule + Tenant entity
│   │   ├── tenant.entity.ts
│   │   ├── tenants.module.ts
│   │   ├── tenants.service.ts
│   │   └── tenants-cleanup.service.ts    # Cron de purga
│   ├── users/                    # UsersModule + User entity
│   │   └── user.entity.ts
│   ├── clients/                  # ClientsModule + Client/Pet entities
│   │   ├── client.entity.ts
│   │   ├── pet.entity.ts
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   └── dto/
│   ├── appointments/             # AppointmentsModule + Appointment entity
│   │   ├── appointment.entity.ts
│   │   ├── appointments.module.ts
│   │   ├── appointments.controller.ts
│   │   ├── appointments.service.ts
│   │   └── dto/
│   └── notifications/            # NotificationsModule + Notification entity
│       ├── notification.entity.ts
│       ├── notifications.module.ts
│       ├── notifications.controller.ts
│       ├── notifications.service.ts
│       └── dto/
└── seed/
    ├── demo-seed.ts              # Carga datos ficticios para un tenantId
    └── data/demo.json            # JSON estático con clientes, mascotas, citas

# Tests deferidos por Constitución (§Restricciones).
```

**Repo `www-micro-saas` (frontend, repo separado):**

```text
src/
├── app/
│   ├── page.tsx                  # Landing con botón "Probar demo"
│   ├── login/page.tsx            # Login (sólo demo en MVP)
│   ├── dashboard/page.tsx        # Citas del día
│   ├── clients/
│   │   ├── page.tsx              # Lista de clientes
│   │   ├── new/page.tsx          # Crear cliente + mascota
│   │   └── [id]/page.tsx         # Detalle de cliente
│   └── appointments/
│       ├── page.tsx              # Lista/calendario de citas
│       └── new/page.tsx          # Crear cita
├── lib/
│   ├── api-client.ts             # Wrapper fetch con JWT en headers
│   ├── auth.ts                   # Sesión JWT (almacenamiento + refresh)
│   └── types.ts                  # Tipos derivados de openapi.yaml
└── components/
    ├── AppointmentCard.tsx
    ├── ReminderPreviewDialog.tsx
    ├── ClientForm.tsx
    └── AppointmentForm.tsx

# Tests deferidos por Constitución (§Restricciones).
```

**Structure Decision**: Web app dividida en dos repositorios independientes
(`api-micro-saas` y `www-micro-saas`). El contrato REST en
[`contracts/openapi.yaml`](./contracts/openapi.yaml) es la frontera explícita
entre ambos. El plan vive sólo en el repo del backend (`api-micro-saas`); el
frontend lo referencia como fuente de verdad.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Multi-tenant con `tenant_id` desde el día 1 | El modelo de negocio (suscripción mensual a múltiples peluquerías) y el flujo de demo (tenant ephemeral por visitante) requieren aislamiento por tenant. Sin `tenant_id` desde el inicio, retrofitearlo después implica migrar todas las tablas y todos los endpoints, contradiciendo "no half-finished implementations". | Mono-tenant con un único contexto: rechazado porque obligaría a borrar y recargar datos demo entre visitantes (visibles entre sí), lo cual rompe FR-002 (sesión aislada por visitante) y degrada la demo de venta. |
| Frontend y backend en repos separados | El usuario lo definió explícitamente en su input (§8) y permite despliegues independientes (Vercel para frontend, Railway/Render para backend) sin un monorepo intermedio. | Monorepo único: rechazado porque añadiría tooling (Nx/Turborepo) sin beneficio claro para un MVP de dos paquetes con ciclos de release distintos. |
