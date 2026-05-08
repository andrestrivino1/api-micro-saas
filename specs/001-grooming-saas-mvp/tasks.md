---
description: "Backend task list for Grooming SaaS MVP (NestJS + TypeORM)"
---

# Tasks: SaaS Peluquería Canina — MVP Demo (Backend `api-micro-saas`)

**Input**: Design documents from `/specs/001-grooming-saas-mvp/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/openapi.yaml](./contracts/openapi.yaml),
[quickstart.md](./quickstart.md)

**Tests**: NO incluidos. La Constitución (§Restricciones del MVP) defiere los
tests para priorizar velocidad. La validación se realiza vía smoke manual con
[quickstart.md](./quickstart.md).

**Organization**: Tareas agrupadas por user story (US1–US4). Cada US es
independientemente entregable y testeable manualmente.

**Scope**: Sólo el repo backend (`api-micro-saas`). El frontend
(`www-micro-saas`) consume el contrato `contracts/openapi.yaml` y se planifica
en su propio `tasks.md` cuando corresponda.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias).
- **[Story]**: US1, US2, US3, US4. Sólo en fases de user story.
- Las rutas son **relativas a la raíz del repo** `api-micro-saas`.

## Path Conventions

- **Backend root**: raíz del repo `api-micro-saas` (este repo).
- **Source**: `src/` (creado por `nest new .`).
- **Migrations**: `src/database/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el proyecto NestJS en sitio y configurar el toolchain
base.

- [X] T001 Inicializar NestJS en el repo actual ejecutando `npx @nestjs/cli new . --package-manager npm --skip-git` desde la raíz del repo (no crear subcarpeta).
- [X] T002 [P] Instalar dependencias de runtime: `npm install --save @nestjs/typeorm typeorm pg @nestjs/config @nestjs/jwt passport passport-jwt class-validator class-transformer @nestjs/schedule` (modificar `package.json`).
- [X] T003 [P] Instalar dependencias de desarrollo: `npm install --save-dev @types/passport-jwt` (modificar `package.json`).
- [X] T004 [P] Crear `.env.example` y `.env` en la raíz con `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `DEMO_TENANT_TTL_HOURS`, `PORT`, `CORS_ORIGIN` (valores por defecto en `quickstart.md`).
- [X] T005 [P] Añadir `.env` y `dist/` a `.gitignore` (modificar `.gitignore` generado por `nest new`).
- [X] T006 [P] Añadir scripts de migración a `package.json`: `"typeorm": "typeorm-ts-node-commonjs"`, `"migration:generate": "npm run typeorm -- migration:generate -d src/database/data-source.ts"`, `"migration:run": "npm run typeorm -- migration:run -d src/database/data-source.ts"`, `"migration:revert": "npm run typeorm -- migration:revert -d src/database/data-source.ts"`.
- [X] T007 Configurar `ConfigModule.forRoot({ isGlobal: true })` con validación de variables en `src/config/env.validation.ts` (Joi schema o `class-validator`) y registrarlo en `src/app.module.ts`.
- [X] T008 Habilitar `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true, transform: true` en `src/main.ts`.
- [X] T009 Habilitar CORS en `src/main.ts` leyendo `CORS_ORIGIN` desde `ConfigService` (default `http://localhost:3000`).

**Checkpoint**: `npm run start:dev` arranca el server en `http://localhost:3001` aunque no haya endpoints aún.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Datasource, entidades, migración inicial, guards y decorators que
todas las user stories consumen.

**⚠️ CRITICAL**: Ninguna user story puede arrancar sin esta fase completa.

- [X] T010 Crear `src/database/data-source.ts` exportando `AppDataSource = new DataSource({...})` con `type: 'postgres'`, `entities: ['src/**/*.entity.ts']`, `migrations: ['src/database/migrations/*.ts']`, leyendo credenciales de `process.env` (uso CLI + runtime).
- [X] T011 Registrar `TypeOrmModule.forRootAsync({ useFactory: ... })` en `src/app.module.ts`, reusando la configuración de `data-source.ts` vía un helper compartido.
- [X] T012 [P] Crear entidad `Tenant` en `src/modules/tenants/tenant.entity.ts` con campos `id`, `name`, `kind` (`enum demo|paid`), `expiresAt`, `createdAt` según [data-model.md](./data-model.md#tenant).
- [X] T013 [P] Crear entidad `User` en `src/modules/users/user.entity.ts` con FK `tenantId` (`onDelete: 'CASCADE'`), `email`, `displayName`, `role`, `createdAt`; añadir índice único `@Unique(['tenantId', 'email'])`.
- [X] T014 [P] Crear entidad `Client` en `src/modules/clients/client.entity.ts` con FK `tenantId` (`onDelete: 'CASCADE'`), `name`, `phone`, `notes`, `createdAt`.
- [X] T015 [P] Crear entidad `Pet` en `src/modules/clients/pet.entity.ts` con FKs `tenantId` y `clientId` (ambas `onDelete: 'CASCADE'`), `name`, `breed`, `notes`, `createdAt`.
- [X] T016 [P] Crear entidad `Appointment` en `src/modules/appointments/appointment.entity.ts` con FKs `tenantId`, `clientId`, `petId` (todas `onDelete: 'CASCADE'`), `scheduledAt` (`timestamptz`), `service`, `reminderStatus` (`enum not_sent|sent` default `not_sent`), `reminderSentAt` (nullable), `createdAt`.
- [X] T017 [P] Crear entidad `Notification` en `src/modules/notifications/notification.entity.ts` con FKs `tenantId`, `appointmentId`, `clientId` (todas `onDelete: 'CASCADE'`), `channel` (`enum whatsapp_simulated`), `messageText` (`text`), `sentAt`, `createdAt`.
- [X] T018 Generar la migración inicial con `npm run migration:generate -- src/database/migrations/Init` y aplicarla con `npm run migration:run` (depende de T012–T017 completas).
- [X] T019 [P] Crear decorator `CurrentTenant` en `src/common/decorators/current-tenant.decorator.ts` que extrae `tenantId` desde `request.user` poblado por el guard JWT.
- [X] T020 [P] Crear `JwtStrategy` (passport-jwt) en `src/modules/auth/strategies/jwt.strategy.ts` que valida el JWT con `JWT_SECRET` y devuelve `{ userId, tenantId, role }` desde el payload.
- [X] T021 [P] Crear `JwtAuthGuard` en `src/common/guards/jwt-auth.guard.ts` extendiendo `AuthGuard('jwt')`.
- [X] T022 [P] Crear `app.controller.ts` con un endpoint `GET /health` que retorna `{ status: 'ok' }` (smoke test).
- [X] T023 Registrar `JwtModule.registerAsync({ useFactory: ... })` en `src/modules/auth/auth.module.ts` leyendo `JWT_SECRET` y `JWT_EXPIRES_IN`; exportar `JwtModule` para que otros módulos lo consuman.

**Checkpoint**: `curl -s http://localhost:3001/health` responde `{"status":"ok"}`. Las 6 tablas existen en Postgres y el JWT puede emitirse aunque ningún endpoint lo expone aún.

---

## Phase 3: User Story 1 — Dashboard demo con valor inmediato (Priority: P1) 🎯 MVP

**Goal**: Visitante pulsa "Probar demo" → recibe JWT de tenant ephemeral con
datos seedeados → `GET /appointments` devuelve las citas del día.

**Independent Test**: `POST /auth/login` (sin body) devuelve `accessToken`. Con
ese token, `GET /appointments` devuelve ≥3 citas para el día actual con datos
verosímiles.

**Maps to**: spec FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-018,
FR-019; SC-001, SC-002.

- [X] T024 [P] [US1] Crear `src/seed/data/demo.json` con dataset realista en español: 8 clientes (con teléfono), 8 mascotas, ≥3 citas para hoy + citas pasadas y futuras suficientes para historial; servicios entre "Baño", "Corte", "Completo".
- [X] T025 [P] [US1] Crear `src/seed/demo-seed.ts` exportando `seedDemoTenant(dataSource: DataSource, tenantId: string): Promise<void>` que lee `demo.json` y persiste todos los registros bajo el `tenantId` recibido (citas con `scheduledAt` calculadas relativas a `new Date()`).
- [X] T026 [US1] Implementar `TenantsService.createDemoTenant()` en `src/modules/tenants/tenants.service.ts`: crea `Tenant` con `kind=demo`, `expiresAt = now + DEMO_TENANT_TTL_HOURS`, llama a `seedDemoTenant`, retorna el `Tenant` creado.
- [X] T027 [US1] Crear `src/modules/users/users.service.ts` con `createDemoUserForTenant(tenantId): Promise<User>` que persiste un usuario `role='demo'` con email `demo+{tenantId}@grooming.local`.
- [X] T028 [US1] Implementar `AuthService.loginDemo()` en `src/modules/auth/auth.service.ts`: invoca `TenantsService.createDemoTenant()` y `UsersService.createDemoUserForTenant()`, firma JWT con `{ sub: user.id, tenantId, role: 'demo' }`, retorna `{ accessToken, expiresIn, tenantId, userId }`.
- [X] T029 [US1] Implementar `AuthController` en `src/modules/auth/auth.controller.ts` con `POST /auth/login` (body opcional `{ mode: 'demo' }`); en MVP siempre delega a `loginDemo()`. Sin guard.
- [X] T030 [US1] Crear `src/modules/tenants/tenants.module.ts` (provee `TenantsService`, importa `TypeOrmModule.forFeature([Tenant])`) y registrarlo en `app.module.ts`.
- [X] T031 [US1] Crear `src/modules/users/users.module.ts` (provee `UsersService`, importa `TypeOrmModule.forFeature([User])`) y registrarlo en `app.module.ts`.
- [X] T032 [US1] Cablear `AuthModule` en `src/modules/auth/auth.module.ts` importando `JwtModule`, `UsersModule`, `TenantsModule`, registrando `AuthController`, `AuthService` y `JwtStrategy`; importarlo en `app.module.ts`.
- [X] T033 [US1] Implementar `AppointmentsService.findForDate(tenantId: string, date?: Date)` en `src/modules/appointments/appointments.service.ts`: filtra por `tenantId` y rango `[startOfDay, endOfDay]` de la fecha (default `new Date()`), ordena por `scheduledAt ASC`, hace `relations: ['client', 'pet']` para devolver `clientName` y `petName`.
- [X] T034 [US1] Implementar `AppointmentsController` en `src/modules/appointments/appointments.controller.ts` con `GET /appointments?date=YYYY-MM-DD` protegido por `JwtAuthGuard`, usando `@CurrentTenant()` para inyectar `tenantId`; devolver el shape de `Appointment` definido en `contracts/openapi.yaml`.
- [X] T035 [US1] Crear `src/modules/appointments/appointments.module.ts` (provee `AppointmentsService`, importa `TypeOrmModule.forFeature([Appointment, Client, Pet])`) y registrarlo en `app.module.ts`.
- [X] T036 [US1] Smoke manual: ejecutar la sección "5) Smoke directo contra la API" de [quickstart.md](./quickstart.md) — `POST /auth/login` retorna JWT y `GET /appointments` lista las citas seedeadas del día.

**Checkpoint**: User Story 1 funcional. La demo es vendible aunque no haya nada más implementado.

---

## Phase 4: User Story 2 — Recordatorio simulado tipo WhatsApp (Priority: P2)

**Goal**: Desde una cita, disparar `POST /notifications/reminder` para
registrar una `Notification` y actualizar `Appointment.reminderStatus = 'sent'`.

**Independent Test**: Con un token demo y un `appointmentId` existente,
`POST /notifications/reminder { appointmentId }` retorna 201 con la
`Notification` creada (texto compuesto del template). El `GET /appointments` de
ese día muestra `reminderStatus = 'sent'` y `reminderSentAt` con la marca.

**Maps to**: spec FR-014, FR-015, FR-016, FR-017; SC-004.

- [X] T037 [US2] Crear DTO `SendReminderDto` en `src/modules/notifications/dto/send-reminder.dto.ts` con `@IsUUID() appointmentId: string`.
- [X] T038 [P] [US2] Crear helper `composeReminderText(appointment, pet, client): string` en `src/modules/notifications/reminder-template.ts` que produce el texto `"Hola, {petName} tiene {service} {humanizedDateTime} 🐶"` (humanización en `es-CO`: "hoy a las 3pm", "mañana a las 9am", o `Intl.DateTimeFormat` para fechas más distantes).
- [X] T039 [US2] Implementar `NotificationsService.sendReminder(tenantId, appointmentId): Promise<Notification>` en `src/modules/notifications/notifications.service.ts`: cargar `Appointment` con `relations: ['client', 'pet']` validando `tenantId`, componer texto, persistir `Notification` con `channel='whatsapp_simulated'` y `sentAt = now()`, actualizar `appointment.reminderStatus='sent'` y `reminderSentAt = now()`, retornar la `Notification`. Si la cita no existe en el tenant, lanzar `NotFoundException`.
- [X] T040 [US2] Implementar `NotificationsController` en `src/modules/notifications/notifications.controller.ts` con `POST /notifications/reminder` protegido por `JwtAuthGuard`, recibe `SendReminderDto`, usa `@CurrentTenant()` y delega al service.
- [X] T041 [US2] Crear `src/modules/notifications/notifications.module.ts` (provee `NotificationsService`, importa `TypeOrmModule.forFeature([Notification, Appointment, Client, Pet])`) y registrarlo en `app.module.ts`.
- [X] T042 [US2] Smoke manual: con un token demo, `POST /notifications/reminder` con `appointmentId` válido devuelve 201; `GET /appointments` siguiente muestra el cambio de estado y `reminderSentAt`.

**Checkpoint**: User Stories 1 y 2 funcionan independientemente.

---

## Phase 5: User Story 3 — Crear cita asociada a cliente y mascota (Priority: P2)

**Goal**: `POST /appointments` permite crear una cita validando que
cliente+mascota pertenezcan al mismo tenant y que `pet.clientId === clientId`.

**Independent Test**: Con un token demo, listar `GET /clients`, tomar uno con
su `pet.id`, hacer `POST /appointments { clientId, petId, scheduledAt, service }`
y verificar que aparece en `GET /appointments?date=...`.

**Maps to**: spec FR-010, FR-011, FR-012, FR-013; SC-003.

- [X] T043 [US3] Crear DTO `CreateAppointmentDto` en `src/modules/appointments/dto/create-appointment.dto.ts` con `@IsUUID() clientId`, `@IsUUID() petId`, `@IsISO8601() scheduledAt: string`, `@IsString() @MinLength(1) service: string`.
- [X] T044 [US3] Implementar `AppointmentsService.create(tenantId, dto): Promise<Appointment>`: cargar `Client` y `Pet` filtrando por `tenantId`; validar que `pet.clientId === dto.clientId`; persistir `Appointment` con `reminderStatus='not_sent'`; retornar con `relations: ['client', 'pet']` para incluir nombres en la respuesta. Lanzar `BadRequestException` si la validación cross-entity falla.
- [X] T045 [US3] Añadir `POST /appointments` en `src/modules/appointments/appointments.controller.ts` protegido por `JwtAuthGuard`, recibe `CreateAppointmentDto`, usa `@CurrentTenant()`. Nota: el aviso de fecha pasada (FR-012) lo maneja el frontend; backend acepta sin restricción.
- [X] T046 [US3] Smoke manual: crear cita y comprobar que aparece en el listado del día y que se puede disparar el recordatorio sobre ella (US2).

**Checkpoint**: User Stories 1, 2 y 3 funcionan independientemente.

---

## Phase 6: User Story 4 — Gestionar clientes y mascotas (Priority: P3)

**Goal**: Listar clientes (con su mascota), ver detalle (con historial de
citas), crear nuevo cliente con mascota en una sola request.

**Independent Test**: Con un token demo, `GET /clients` lista 8 clientes
seedeados; `GET /clients/{id}` muestra `pet` + `appointments`; `POST /clients`
crea un cliente nuevo y aparece en el listado.

**Maps to**: spec FR-007, FR-008, FR-009.

- [X] T047 [US4] Crear DTO `CreateClientDto` en `src/modules/clients/dto/create-client.dto.ts` con `@IsString() name`, `@IsString() phone`, `@IsOptional() @IsString() notes`, y campo anidado `@ValidateNested() @Type(() => CreatePetDto) pet`.
- [X] T048 [P] [US4] Crear DTO `CreatePetDto` en `src/modules/clients/dto/create-pet.dto.ts` con `@IsString() name`, `@IsOptional() @IsString() breed`, `@IsOptional() @IsString() notes`.
- [X] T049 [US4] Implementar `ClientsService.findAll(tenantId)` en `src/modules/clients/clients.service.ts`: devuelve clientes con `relations: ['pet']` ordenados por `name ASC`.
- [X] T050 [US4] Implementar `ClientsService.findOne(tenantId, id)`: carga `Client` con `relations: ['pet']`; en una query separada, carga `Appointment` filtrado por `tenantId, clientId` ordenado `scheduledAt DESC` y compone la respuesta `ClientDetail` del contrato. `NotFoundException` si no existe en el tenant.
- [X] T051 [US4] Implementar `ClientsService.create(tenantId, dto)`: dentro de una transacción (`dataSource.transaction`), crear `Client` y luego `Pet` con su `clientId`; retornar `ClientWithPet`.
- [X] T052 [US4] Implementar `ClientsController` en `src/modules/clients/clients.controller.ts` con `GET /clients`, `GET /clients/:id`, `POST /clients`, todos protegidos por `JwtAuthGuard` y usando `@CurrentTenant()`.
- [X] T053 [US4] Crear `src/modules/clients/clients.module.ts` (provee `ClientsService`, importa `TypeOrmModule.forFeature([Client, Pet, Appointment])`) y registrarlo en `app.module.ts`.
- [X] T054 [US4] Smoke manual: `GET /clients` lista 8; `POST /clients` con dueño + mascota crea ambos en transacción; `GET /clients/:id` muestra historial de citas.

**Checkpoint**: Las cuatro user stories funcionan independientemente. El backend cubre el contrato de `openapi.yaml` completo.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup automatizado, observabilidad mínima y validación end-to-end.

- [X] T055 [P] Implementar `TenantsCleanupService` en `src/modules/tenants/tenants-cleanup.service.ts` con `@Cron(CronExpression.EVERY_6_HOURS)` que borra `Tenant` con `expiresAt < now()` (la cascada elimina todo lo demás); registrar en `TenantsModule` e importar `ScheduleModule.forRoot()` en `app.module.ts`.
- [X] T056 [P] Añadir logging estructurado mínimo: usar `Logger` de Nest en cada controller para registrar entrada y salida de cada handler con `tenantId` y duración (`src/common/interceptors/logging.interceptor.ts` global).
- [X] T057 [P] Documentar los endpoints expuestos generando un README breve en `README.md` que apunte a `specs/001-grooming-saas-mvp/quickstart.md` y `specs/001-grooming-saas-mvp/contracts/openapi.yaml`.
- [X] T058 Ejecutar el smoke completo de [quickstart.md](./quickstart.md) sección 4 contra el backend (sin frontend, vía curl) y registrar cualquier desviación en una nota dentro del propio archivo.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Phase 1 completa. **BLOQUEA** todas las user stories.
- **US1 (Phase 3)**: depende sólo de Phase 2. Es el MVP demostrable.
- **US2 (Phase 4)**: depende de Phase 2 (entidad `Notification`, `Appointment`). En la práctica se valida con datos seedeados de US1, pero no requiere que US1 esté implementada.
- **US3 (Phase 5)**: depende de Phase 2. Independiente de US1 y US2.
- **US4 (Phase 6)**: depende de Phase 2. Independiente de US1, US2, US3.
- **Polish (Phase 7)**: depende de las user stories que se quieran pulir; T058 depende de US1+US2+US3+US4.

### User Story Dependencies (lógicas, no técnicas)

Aunque las user stories son técnicamente independientes tras Phase 2, en la
práctica el flujo de demo se construye así: US1 (auth + agenda) entrega el
"aha". US2/US3/US4 enriquecen la demo y se pueden trabajar en paralelo por
distintos contribuyentes una vez que Phase 2 esté lista.

### Within Each Phase

- Migración (T018) requiere todas las entidades (T012–T017) creadas.
- Cada `*.module.ts` debe estar registrado en `app.module.ts` antes de probar sus rutas.
- Servicios antes de controllers; controllers antes del smoke test del checkpoint.

### Parallel Opportunities

- Phase 1: T002, T003, T004, T005, T006 son `[P]`.
- Phase 2: T012–T017 (las 6 entidades) son `[P]` entre sí; T019, T020, T021, T022 son `[P]` entre sí.
- Phase 3: T024 y T025 son `[P]`.
- Phase 4: T038 (`[P]`) puede prepararse mientras T037 está en revisión.
- Phase 6: T047 y T048 son `[P]`.
- Phase 7: T055, T056, T057 son `[P]`.

---

## Parallel Example: Phase 2 (Foundational entities)

```bash
# Una vez completada la fase 1, lanzar las 6 entidades en paralelo:
Task: "Crear entidad Tenant en src/modules/tenants/tenant.entity.ts"
Task: "Crear entidad User en src/modules/users/user.entity.ts"
Task: "Crear entidad Client en src/modules/clients/client.entity.ts"
Task: "Crear entidad Pet en src/modules/clients/pet.entity.ts"
Task: "Crear entidad Appointment en src/modules/appointments/appointment.entity.ts"
Task: "Crear entidad Notification en src/modules/notifications/notification.entity.ts"

# Y en paralelo a las entidades, los componentes transversales:
Task: "Crear CurrentTenant decorator en src/common/decorators/current-tenant.decorator.ts"
Task: "Crear JwtStrategy en src/modules/auth/strategies/jwt.strategy.ts"
Task: "Crear JwtAuthGuard en src/common/guards/jwt-auth.guard.ts"
Task: "Crear health endpoint en src/app.controller.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T009).
2. Phase 2: Foundational (T010–T023). **CRITICAL** — bloquea todo lo demás.
3. Phase 3: User Story 1 (T024–T036).
4. **STOP & VALIDATE**: smoke manual de US1 → la demo ya es vendible (Regla de Oro: vender antes de escalar).
5. Decidir si seguir antes de gastar más tiempo: si el comercial logra cerrar con esto, la prioridad real puede pasar a otras features.

### Incremental Delivery

1. Setup + Foundational → infraestructura lista.
2. US1 → demo vendible (MVP).
3. US2 → "wow factor" del recordatorio simulado.
4. US3 → utilidad de creación de citas.
5. US4 → completitud de la gestión de clientes.
6. Polish (T055–T058) → robustez para sostener una jornada de demos.

### Parallel Team Strategy

Con dos contribuyentes después de Phase 2:

- Persona A: US1 (auth + dashboard, T024–T036).
- Persona B: US4 (gestión de clientes, T047–T054) — independiente y útil para los datos seed.

US2 y US3 se atacan en una segunda ronda una vez que US1 está demostrable.

---

## Notes

- `[P]` = archivos distintos, sin dependencias bloqueantes.
- `[Story]` = etiqueta de trazabilidad a `spec.md`.
- Sin tasks de tests por decisión constitucional explícita (§Restricciones del MVP). Si más adelante se levanta esa restricción, se añadirán a una nueva phase con sus propios `[Story]`.
- Cada user story termina en un smoke manual que valida su independent test; si falla, **detenerse** y arreglar antes de avanzar — no acumular deuda entre fases.
