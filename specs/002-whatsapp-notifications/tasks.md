---
description: "Backend task list for WhatsApp deep-link + Edición completa (NestJS + TypeORM)"
---

# Tasks: Recordatorios WhatsApp deep-link + Edición completa (Backend `api-micro-saas`)

**Input**: Design documents from `/specs/002-whatsapp-notifications/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md),
[research.md](./research.md), [data-model.md](./data-model.md),
[contracts/openapi.yaml](./contracts/openapi.yaml),
[quickstart.md](./quickstart.md). Asume que las tareas del spec 001
(T001–T085 de [`001-grooming-saas-mvp/tasks.md`](../001-grooming-saas-mvp/tasks.md))
están completadas.

**Tests**: NO incluidos. La Constitución (§Restricciones del MVP)
defiere los tests para priorizar velocidad. La validación se realiza vía
smoke manual con [quickstart.md](./quickstart.md).

**Organization**: Tareas agrupadas por user story (US1–US5). Cada US es
independientemente entregable y testeable manualmente.

**Scope**: Sólo el repo backend (`api-micro-saas`). El frontend
(`www-micro-saas`) consume el contrato `contracts/openapi.yaml` y se
planifica en su propio `tasks.md` cuando corresponda.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias).
- **[Story]**: US1, US2, US3, US4, US5. Sólo en fases de user story.
- Las rutas son **relativas a la raíz del repo** `api-micro-saas`.

## Path Conventions

- **Backend root**: raíz del repo `api-micro-saas` (este repo).
- **Source**: `src/`.
- **Migrations**: `src/database/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar las dependencias nuevas y registrar las variables
de entorno requeridas por la feature 002.

- [X] T001 [P] Instalar dependencias de runtime: `npm install --save libphonenumber-js bcryptjs passport-local` (modifica `package.json`).
- [X] T002 [P] Instalar dependencias de desarrollo: `npm install --save-dev @types/bcryptjs @types/passport-local` (modifica `package.json`).
- [X] T003 [P] Añadir variables nuevas al archivo `.env.example` (committeado) y al `.env` local: `FOUNDER_EMAIL`, `FOUNDER_PASSWORD_HASH`, `FOUNDER_TENANT_NAME`, `DEFAULT_COUNTRY=CO`. El hash se genera con `node -e "console.log(require('bcryptjs').hashSync('PASSWORD', 10))"` (ver [quickstart.md §2](./quickstart.md#2-variables-de-entorno-nuevas)).
- [X] T004 Extender la validación de env vars en `src/config/env.validation.ts` para aceptar (todas opcionales en runtime, pero `FOUNDER_*` requeridas si alguna está presente): `FOUNDER_EMAIL` (email), `FOUNDER_PASSWORD_HASH` (string, longitud ~60), `FOUNDER_TENANT_NAME` (string), `DEFAULT_COUNTRY` (string ISO-3166 alpha-2, default `CO`).

**Checkpoint**: `npm run start:dev` arranca sin errores con las nuevas
variables (aunque aún no se usen).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migraciones, utilidad de teléfono, bootstrap del fundador y
estrategia local de autenticación. Estos cambios habilitan TODAS las
user stories.

**⚠️ CRITICAL**: Ninguna user story puede arrancar sin esta fase completa.

### Migraciones de schema

- [X] T005 Añadir el campo `passwordHash` (NULLABLE, `varchar(60)`) a la entidad `User` en `src/modules/users/user.entity.ts` con `@Column({ type: 'varchar', length: 60, nullable: true, select: false })`. La opción `select: false` excluye el campo por defecto en queries para evitar fugas en logs.
- [X] T006 Ampliar el enum del campo `channel` en la entidad `Notification` (`src/modules/notifications/notification.entity.ts`) de `enum: ['whatsapp_simulated']` a `enum: ['whatsapp_simulated', 'whatsapp_link']`. Mantener el `NotificationChannel` type union actualizado.
- [X] T007 Generar la migración del cambio de `User` con `npm run migration:generate -- src/database/migrations/AddUserPasswordHash` (depende de T005). Resultado: TypeORM combinó T007+T008 en `AddPasswordHashAndWhatsappLinkChannel`.
- [X] T008 (Combinado con T007 — TypeORM detectó ambos cambios en una sola pasada).
- [X] T009 Aplicar ambas migraciones con `npm run migration:run`.

### Utilidades compartidas

- [X] T010 [P] Crear `src/modules/notifications/phone.ts` que exporta `normalizeToE164(raw, defaultCountry): { e164 } | { error: 'INVALID_PHONE' | 'EMPTY' }`.

### Founder bootstrap

- [X] T011 [P] Crear `src/modules/tenants/founder-bootstrap.service.ts` con `OnModuleInit`.
- [X] T012 Ya estaba: el enum `role` de `User` ya incluía `('demo', 'owner')` desde spec 001.
- [X] T013 Registrar `FounderBootstrapService` en `tenants.module.ts` con `TypeOrmModule.forFeature([Tenant, User])`.

### Autenticación local (email/password)

- [X] T014 Login DTO unificado con `mode`, `email`, `password` opcionales en `src/modules/auth/dto/login.dto.ts` (en lugar de DTOs separados, simplifica el binding de NestJS).
- [X] T015 (Fusionado con T014).
- [X] T016 [P] Crear `src/modules/auth/strategies/local.strategy.ts` extendiendo `PassportStrategy(Strategy, 'local')`.
- [X] T017 Extender `AuthService` con `validateCredentials` (usa QueryBuilder con `addSelect('u.passwordHash')` para overridear el `select: false`) y `loginWithCredentials`.
- [X] T018 Modificar `AuthController` para rutear `mode === 'credentials'` → `loginWithCredentials`; default → `loginDemo`.
- [X] T019 Registrar `LocalStrategy` y `TypeOrmModule.forFeature([User])` en `AuthModule`.

**Checkpoint**: `npm run start:dev` arranca, `FounderBootstrap` loguea
la creación del tenant + usuario fundador, y `curl -X POST
http://localhost:3001/auth/login -H 'Content-Type: application/json' -d
'{"mode":"credentials","email":"<FOUNDER_EMAIL>","password":"<PWD>"}'`
devuelve `200 OK` con un `accessToken` válido. Las migraciones están
aplicadas y la columna `password_hash` existe.

---

## Phase 3: User Story 1 — Recordatorio WhatsApp deep-link (Priority: P1) 🎯 MVP

**Goal**: Permitir al dueño disparar un recordatorio que abre WhatsApp
con el chat del cliente y el mensaje pre-cargado, registrando el envío
optimísticamente como `whatsapp_link`.

**Independent Test**: Con un cliente que tenga teléfono colombiano
válido y una cita futura, invocar `POST /notifications/whatsapp-link
{ "appointmentId": "<uuid>" }`. Esperado: respuesta `201` con
`whatsappUrl` que abre WhatsApp Web al chat correcto. La cita queda
`reminderStatus = sent`.

### Implementation for User Story 1

- [X] T020 [P] [US1] Crear `src/modules/notifications/dto/send-whatsapp-link.dto.ts`.
- [X] T021 [US1] Extender `NotificationsService.createWhatsappLink` con el pipeline completo (carga cita, valida teléfono E.164, compone texto, persiste con canal `whatsapp_link`, marca cita, construye URL).
- [X] T022 [US1] Añadir endpoint `POST /notifications/whatsapp-link` en el controller.
- [X] T023 [US1] Marcar `POST /notifications/reminder` como `@deprecated` en el controller.

**Checkpoint**: Smoke completo de [quickstart.md §5.4](./quickstart.md#54-generar-el-url-wame)
pasa: el `whatsappUrl` devuelto abre WhatsApp Web con el chat y el
mensaje correctos. La cita queda `reminderStatus = 'sent'`. El registro
queda en `notifications` con `channel = 'whatsapp_link'`.

---

## Phase 4: User Story 2 — Edición de clientes y mascotas (Priority: P1)

**Goal**: Permitir editar `Client.name`, `phone`, `notes` y los campos
de `Pet` asociado en una sola llamada `PATCH /clients/{id}`.

**Independent Test**: Crear un cliente, modificar nombre y teléfono via
PATCH, y verificar que (a) la respuesta refleja los cambios, (b) un
`GET /clients/{id}` posterior devuelve los nuevos valores, (c) las
citas asociadas muestran el nuevo nombre.

### Implementation for User Story 2

- [X] T024 [P] [US2] Crear `update-client.dto.ts` y `update-pet.dto.ts` con validaciones partial manuales (sin agregar `@nestjs/mapped-types`).
- [X] T025 [US2] Extender `ClientsService.update` con transacción que actualiza Client + Pet anidada. Aprovecho para añadir `remove` también (cubre T031 de US4).
- [X] T026 [US2] Añadir endpoint `PATCH /clients/{id}` en el controller (con `DELETE` ya integrado para T033 de US4).

**Checkpoint**: `curl -X PATCH http://localhost:3001/clients/<id> -H
"Authorization: Bearer $TOKEN" -d '{"name":"Nuevo","pet":{"breed":"X"}}'`
devuelve `200` con los campos actualizados. Un `GET /clients/<id>`
posterior confirma persistencia.

---

## Phase 5: User Story 3 — Edición de citas con reset de recordatorio (Priority: P1)

**Goal**: Permitir editar `clientId`, `petId`, `scheduledAt`, `service`
de una cita. Cambios en `clientId`, `petId` o `scheduledAt` resetean el
estado del recordatorio a `not_sent`.

**Independent Test**: Crear una cita, enviar un recordatorio (US1),
luego PATCH para cambiar `scheduledAt`. Verificar que `reminderStatus`
vuelve a `not_sent` y `reminderSentAt` queda `null`, pero la
`Notification` previa sigue existiendo en `GET /clients/{id}`.

### Implementation for User Story 3

- [X] T027 [P] [US3] Crear `update-appointment.dto.ts` con validaciones partial manuales.
- [X] T028 [US3] Extender `AppointmentsService` con `update` (incluye reset D8 al cambiar `clientId`, `petId` o `scheduledAt`) y `remove`.
- [X] T029 [US3] Añadir endpoint `GET /appointments/{id}`.
- [X] T030 [US3] Añadir endpoint `PATCH /appointments/{id}`.

**Checkpoint**: Flujo manual: crear cita → `POST /notifications/whatsapp-link`
→ `PATCH /appointments/{id}` cambiando `scheduledAt` → `GET /appointments/{id}`
muestra `reminderStatus = 'not_sent'`, `reminderSentAt = null`. Otra
consulta `GET /clients/{id}` muestra que la `Notification` original
sigue en el historial.

---

## Phase 6: User Story 4 — Eliminación con cascada (Priority: P2)

**Goal**: Permitir eliminar un `Client` (con cascada DB sobre `Pet`,
`Appointment`, `Notification`) y un `Appointment` (con cascada DB sobre
`Notification`). El frontend gestiona la confirmación UI; el backend
sólo expone los DELETE.

**Independent Test**: Crear cliente con citas; `DELETE /clients/{id}`
→ esperado `204`. `GET /clients/{id}` siguiente → `404`. Una query
directa a `appointments` por ese `clientId` no devuelve filas.

### Implementation for User Story 4

- [X] T031 [P] [US4] `ClientsService.remove` añadido junto con T025.
- [X] T032 [P] [US4] `AppointmentsService.remove` añadido junto con T028.
- [X] T033 [US4] `DELETE /clients/{id}` añadido junto con T026.
- [X] T034 [US4] `DELETE /appointments/{id}` añadido junto con T030.

**Checkpoint**: `DELETE /clients/<id>` retorna `204`. Una query directa
en psql `SELECT count(*) FROM appointments WHERE client_id='<uuid>'`
devuelve `0`, y `SELECT count(*) FROM notifications WHERE client_id='<uuid>'`
también `0`.

---

## Phase 7: User Story 5 — Personalización del mensaje (Priority: P3)

**Goal**: Permitir al dueño enviar un texto personalizado en lugar del
template default al llamar a `POST /notifications/whatsapp-link`.

**Independent Test**: Invocar `POST /notifications/whatsapp-link` con
`{ "appointmentId": "<uuid>", "customMessage": "Hola Luna 🐶 trae correa" }`.
Verificar que la respuesta usa el texto custom y que `whatsappUrl`
contiene la versión URL-encoded.

### Implementation for User Story 5

- [X] T035 [US5] `createWhatsappLink` ya soporta `customMessage` con fallback al template default cuando viene vacío/ausente (smoke confirmado).

**Checkpoint**: Llamada con `customMessage` retorna ese texto exacto en
`messageText` y URL-encoded en `whatsappUrl`. Llamada sin
`customMessage` (o con string vacío) retorna el template default.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Limpieza, documentación y validación end-to-end.

- [X] T036 [P] Verificación de drift contract↔código: las respuestas del controller (`WhatsappLinkNotificationDto`, `AppointmentDto`, `ClientWithPetDto`) coinciden con `contracts/openapi.yaml v0.2.0`. No hay `src/types/api-types.ts` derivado para sincronizar; el contrato se mantiene como referencia.
- [X] T037 [P] Auditoría de logs: revisé `auth.service.ts`, `founder-bootstrap.service.ts`, `notifications.service.ts`. Ninguno imprime `password`, `passwordHash` ni `whatsappUrl`. Único log con datos: `tenantId` y `email` del fundador (no sensibles).
- [X] T038 Smoke completo ejecutado: login fundador (200) → crear cliente (201) → crear cita (201) → `POST /notifications/whatsapp-link` (201, URL `wa.me` válido) → `PATCH /clients/{id}` (200, mascota actualizada) → `PATCH /appointments/{id}` con `scheduledAt` (200, reset a `not_sent`) → `PATCH service` (200, NO reset) → `DELETE /appointments/{id}` (204) → `GET` posterior (404). Validación de teléfono inválido: 400.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias.
- **Foundational (Phase 2)**: Depende de Phase 1. Bloquea TODAS las user stories.
- **US1 (Phase 3, P1)**: Depende de Phase 2 (necesita el enum `whatsapp_link` y el utilitario `phone.ts`).
- **US2 (Phase 4, P1)**: Depende de Phase 2 (no de Phase 3).
- **US3 (Phase 5, P1)**: Depende de Phase 2. Si se quiere validar el reset del recordatorio end-to-end, depende también de US1 estar implementado (para poder generar un envío que luego se resetee).
- **US4 (Phase 6, P2)**: Depende de Phase 2.
- **US5 (Phase 7, P3)**: Depende de US1 (T021); el `customMessage` ya está en el DTO definido en T020.
- **Polish (Phase 8)**: Depende de todas las stories deseadas.

### Within Each User Story

- DTOs antes que services.
- Services antes que controllers.
- Migración aplicada antes de cualquier código que use la columna/enum nueva.

### Parallel Opportunities

- T001, T002, T003 (instalación de deps + `.env`) corren en paralelo.
- T005, T006 (cambios de entidades) corren en paralelo (archivos distintos).
- T010, T011, T014, T015, T016 (utilidad de teléfono + bootstrap + DTOs de auth) corren en paralelo entre sí.
- T020, T024, T027, T031, T032 (DTOs y services de stories distintas) corren en paralelo si hay capacidad.
- Las user stories US1, US2, US3, US4 pueden trabajarse en paralelo por desarrolladores distintos una vez Phase 2 está completa.

---

## Parallel Example: User Story 1 + User Story 2 simultáneas

Una vez Phase 2 lista:

```bash
# Dev A — User Story 1
Task: "T020 [P] [US1] DTO SendWhatsappLinkDto en src/modules/notifications/dto/"
Task: "T021 [US1] Method createWhatsappLink en NotificationsService"
Task: "T022 [US1] Endpoint POST /notifications/whatsapp-link"

# Dev B — User Story 2 (en paralelo)
Task: "T024 [P] [US2] DTO UpdateClientDto en src/modules/clients/dto/"
Task: "T025 [US2] Method update en ClientsService"
Task: "T026 [US2] Endpoint PATCH /clients/{id}"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only) — 🎯 ruta más corta a herramienta de venta

1. Completar Phase 1: Setup (T001–T004).
2. Completar Phase 2: Foundational completa (T005–T019), incluyendo el founder bootstrap.
3. Completar Phase 3: US1 (T020–T023).
4. **PARAR Y VALIDAR**: smoke de [quickstart.md §5.4](./quickstart.md#54-generar-el-url-wame). Con esto la app ya envía recordatorios reales por WhatsApp; el fundador puede usar el producto como herramienta de venta.

### Incremental Delivery (recomendado)

1. **MVP**: Setup → Foundational → US1. Deploy.
2. **MVP + edición**: añadir US2 (clientes editables) → deploy.
3. **MVP + edición completa**: añadir US3 (citas editables) → deploy.
4. **MVP + eliminación**: añadir US4 → deploy.
5. **Polish**: US5 + Phase 8 → deploy.

Cada incremento mantiene el producto operativo y aporta valor visible
al fundador-vendedor en el pitch.

### Founder-first dogfooding

Una vez la Phase 2 está lista y el founder bootstrap funciona, **el
usuario empieza a usar el MVP él mismo** con su propia cuenta. Cada
user story implementada después se prueba contra datos reales que el
fundador irá acumulando durante las primeras semanas de ventas, lo que
acelera la detección de roces UX antes de los primeros clientes pagos.

---

## Notes

- [P] = archivos distintos, sin dependencias entre tareas.
- [Story] mapea a una user story para trazabilidad.
- Cada user story debe poder marcarse "lista" sin tocar las otras.
- Migrations son tareas no paralelizables entre sí (orden fijo: T007 → T008 → T009 → T012).
- Commit después de cada task o grupo lógico (las commit hints del flujo speckit).
- Frontend (`www-micro-saas`) NO está incluido aquí: se planifica en su propio repo cuando corresponda.
