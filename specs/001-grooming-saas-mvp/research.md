# Phase 0 Research — Grooming SaaS MVP

**Date**: 2026-05-08
**Branch**: `001-grooming-saas-mvp`

Este documento resuelve las decisiones técnicas necesarias para que el plan no
contenga `NEEDS CLARIFICATION`. Cada decisión sigue el formato:

- **Decision** — qué se eligió
- **Rationale** — por qué
- **Alternatives considered** — qué se evaluó y descartó

---

## D1 — ORM para NestJS + PostgreSQL

- **Decision**: **TypeORM 0.3** (decisión del owner, ratificada el
  2026-05-08, sustituye a una elección previa de Prisma).
- **Rationale**: Es el ORM idiomático con NestJS vía `@nestjs/typeorm`
  (`TypeOrmModule.forRootAsync`, `TypeOrmModule.forFeature([...])`). La
  comunidad y la documentación oficial de NestJS asumen TypeORM, lo que
  reduce fricción de búsqueda de recetas estándar y respeta el Principio I
  (Simplicidad sobre Complejidad) al no desviarse del default.
- **Alternatives considered**:
  - *Prisma 5*: mejor DX y migraciones más limpias; rechazado por decisión
    explícita del owner que prefiere mantenerse en el ecosistema "puro" de
    NestJS.
  - *Drizzle*: ecosistema más joven y menos integrado con NestJS.
  - *Knex/SQL crudo*: pérdida de tipado, sin valor para un MVP CRUD.

## D2 — Autenticación demo con JWT

- **Decision**: JWT firmado HS256 emitido por backend en `POST /auth/login`,
  con payload `{ sub: userId, tenantId, role: "demo" }` y `exp` de 24 h.
  Cliente almacena en `httpOnly cookie` (recomendado) o `localStorage`
  (fallback simple para MVP).
- **Rationale**: JWT es estándar para SPAs sin estado en backend; HS256 con
  secret en env var es trivial de operar (Principio I). 24 h cubre el flujo de
  demo más cualquier sesión razonable y se alinea con el TTL de tenants
  ephemerals (D5).
- **Alternatives considered**:
  - *Session cookies con server store*: más seguro para producción real, pero
    requiere store de sesiones (Redis); complejidad innecesaria para el MVP.
  - *RS256*: añadiría rotación de claves; sin valor para un MVP demo.

## D3 — Estrategia multi-tenant

- **Decision**: **Tenant scoping por `tenant_id` en cada tabla**, inyectado
  desde el JWT mediante un guard global y un interceptor que adjunta
  `tenant_id` a todas las queries Prisma. El backend NUNCA acepta `tenant_id`
  en el body del request.
- **Rationale**: Cumple Principio III sin caer en multi-tenant federado
  (rechazado por la Constitución). Implementación concreta: shared schema /
  shared database / shared tables. Coste de RLS de Postgres no se asume aún
  (Principio I); puede añadirse en v2 si la base de datos lo amerita.
- **Alternatives considered**:
  - *Schema-per-tenant*: aísla mejor pero exige migraciones replicadas y un
    mecanismo de creación de schema en runtime — incompatible con la
    necesidad de generar tenants demo a alta velocidad.
  - *Database-per-tenant*: descartado por costo operativo desproporcionado
    para un MVP.

## D4 — Persistencia de datos demo (sesión ephemeral)

- **Decision**: Cada clic en "Probar demo" llama a `POST /auth/login` (sin
  credenciales; modo demo) que: (1) genera un nuevo `tenant_id` UUID, (2)
  ejecuta `seed/demo-seed.ts` para poblar clientes, mascotas y citas
  realistas dentro de ese tenant, (3) crea un usuario demo dentro del tenant,
  (4) emite un JWT scope-limited a ese tenant. TTL del tenant: 24 h, cleanup
  vía job cron `prisma`-driven.
- **Rationale**: Cumple FR-002 (aislamiento por visitante) y la Assumption
  "Datos demo por sesión". Cada visitante tiene su propio tenant ephemeral;
  los cambios persisten dentro de la sesión y se eliminan en el cleanup.
- **Alternatives considered**:
  - *Tenant demo único compartido*: viola FR-002.
  - *Datos demo en localStorage del frontend*: rompe la simulación de
    persistencia y haría que recordatorios "enviados" no quedaran registrados
    en el backend (Principio II — Valor Inmediato perdería credibilidad).

## D5 — Cleanup de tenants demo expirados

- **Decision**: Cron job en backend (NestJS `@nestjs/schedule`) cada 6 h:
  borra `Tenant` con `expiresAt < now()` y todas sus filas relacionadas
  mediante `onDelete: 'CASCADE'` en las relaciones TypeORM.
- **Rationale**: Aceptable para MVP a 50 tenants concurrentes; sin
  infraestructura externa.
- **Alternatives considered**:
  - *PostgreSQL `pg_cron`*: añade dependencia de extensión; no necesaria.
  - *Worker externo (BullMQ)*: añade Redis al stack. Innecesario en MVP.

## D6 — Simulación de recordatorios WhatsApp

- **Decision**: `POST /notifications/reminder` recibe `appointmentId`,
  compone el texto del mensaje en backend a partir del template
  `"Hola, {petName} tiene {service} {humanizedDateTime} 🐶"`, persiste un
  registro en la tabla `Notification` con estado `sent` y `sentAt = now()`,
  y devuelve la representación al frontend. **NO** se hace ninguna llamada
  externa.
- **Rationale**: Cumple §Comunicación de la Constitución (envío simulado
  indistinguible de un envío real desde la perspectiva del usuario). El
  backend registra el evento, el frontend lo muestra.
- **Alternatives considered**:
  - *Cliente compone el mensaje*: rechazado porque rompe el principio de
    "fuente de verdad" — el mensaje persiste en backend y debe ser idéntico
    al que ven todos los actores (FR-016).
  - *Integración real con WhatsApp Business API*: explícitamente excluida por
    Constitución §Restricciones del MVP.

## D7 — Validación de input en backend

- **Decision**: `class-validator` + `class-transformer` con
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` global.
- **Rationale**: Estándar idiomático en NestJS, cero código manual de
  validación, rechaza payloads con campos no permitidos (defensa contra
  inyección de `tenant_id`).
- **Alternatives considered**:
  - *Zod*: más moderno, pero exige glue code para integrarlo con NestJS DTOs.
    No aporta sobre `class-validator` para este alcance.

## D8 — Cliente HTTP y estado en frontend

- **Decision**: `fetch` nativo encapsulado en `src/lib/api-client.ts` que
  inyecta el JWT desde `httpOnly cookie` o `localStorage`. Estado servidor
  con **TanStack Query 5** para caching y revalidación; sin Redux ni Zustand
  global en MVP.
- **Rationale**: TanStack Query elimina ~80% del código de loading/error
  manual (mencionado en input del usuario §3.4). Compatible con Next.js
  Server Components mediante prefetch en server actions. Principio I.
- **Alternatives considered**:
  - *axios + Redux Toolkit*: sobreingeniería para un MVP de 4 páginas.
  - *SWR*: equivalente a TanStack Query, menor adopción reciente.

## D9 — Manejo de fechas y zonas horarias

- **Decision**: Backend persiste `DateTime` en UTC (Prisma default).
  Frontend formatea en zona local del navegador con `Intl.DateTimeFormat`
  en español (`es-CO` por defecto, configurable más adelante).
- **Rationale**: Estándar industrial; sin librerías externas (date-fns,
  dayjs) hasta que sean necesarias. Principio I.
- **Alternatives considered**:
  - *date-fns + es locale*: válido si los formatos requeridos exceden lo que
    ofrece `Intl`. Diferido a tareas concretas.

## D10 — Secrets y configuración

- **Decision**: `.env` (no commiteado) con `DATABASE_URL`, `JWT_SECRET`,
  `JWT_EXPIRES_IN`, `DEMO_TENANT_TTL_HOURS`. NestJS `ConfigModule`
  (`@nestjs/config`) con validación schema (Joi o `class-validator`).
- **Rationale**: Estándar; sin Secret Managers externos hasta producción.
- **Alternatives considered**:
  - *Doppler / Vault*: innecesarios para MVP.

---

## Decisiones diferidas a `/speckit-tasks`

- Estructura concreta de DTOs por endpoint (derivable de `openapi.yaml`).
- Estilo del seed (factories vs JSON estático): se decidirá al codificar
  `seed/demo-seed.ts`. Default tentativo: JSON estático en
  `seed/data/demo.json` cargado desde `seed/demo-seed.ts`.
- Layout visual concreto del frontend (componentes, tokens de diseño): no es
  parte de la planificación técnica.
