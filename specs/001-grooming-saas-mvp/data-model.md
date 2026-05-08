# Data Model — Grooming SaaS MVP

**Branch**: `001-grooming-saas-mvp` · **Date**: 2026-05-08
**Source of truth for**: backend (`api-micro-saas`) entidades TypeORM y
frontend (`www-micro-saas`) tipos derivados (de `contracts/openapi.yaml`).

Toda entidad operativa del dominio incluye `tenantId` y se filtra por él en
cada query (ver `research.md` D3). Las claves foráneas usan
`onDelete: 'CASCADE'` en TypeORM para permitir el cleanup atómico de tenants
demo expirados (`research.md` D5).

---

## Entities

### `Tenant`

Aislamiento de datos por suscriptor (real o demo). TypeORM:
`@Entity('tenants')`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` (PK, generado) | `@PrimaryGeneratedColumn('uuid')` |
| `name` | `varchar` | "Demo — {timestamp}" para tenants ephemerals |
| `kind` | `enum('demo', 'paid')` | MVP genera sólo `demo` |
| `expiresAt` | `timestamptz` (nullable) | Sólo `demo`. NULL para `paid`. |
| `createdAt` | `timestamptz` (default `now()`) | `@CreateDateColumn` |

Reglas:

- `kind = demo` ⇒ `expiresAt` debe estar presente (validación en servicio).
- Cleanup job borra `Tenant` con `expiresAt < now()`; cascada elimina
  todas las entidades hijas.

---

### `User`

Identidad autenticable; en MVP sólo se crean usuarios demo asociados a su
tenant ephemeral. TypeORM: `@Entity('users')`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` (PK, generado) | |
| `tenantId` | `uuid` (FK → `tenants.id`, `onDelete: 'CASCADE'`) | |
| `email` | `varchar` | Generado: `demo+{tenantId}@grooming.local` |
| `displayName` | `varchar` | "Usuario Demo" por defecto |
| `role` | `enum('demo', 'owner')` | MVP sólo `demo` |
| `createdAt` | `timestamptz` (default `now()`) | |

Reglas:

- `@Unique(['tenantId', 'email'])` — un email único por tenant.
- En MVP no hay password (login demo no la requiere); se reserva el campo
  para v2 sin impactar el contrato actual.

---

### `Client`

Dueño de mascota. TypeORM: `@Entity('clients')`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` (PK, generado) | |
| `tenantId` | `uuid` (FK → `tenants.id`, `onDelete: 'CASCADE'`) | |
| `name` | `varchar` | Nombre completo del dueño |
| `phone` | `varchar` | Teléfono / WhatsApp (formato E.164 recomendado) |
| `notes` | `varchar` (nullable) | Observaciones libres |
| `createdAt` | `timestamptz` (default `now()`) | |

Reglas:

- `name` y `phone` son obligatorios.
- Listas se ordenan por `name ASC` por defecto.

---

### `Pet`

Mascota; en MVP **uno-a-uno** con `Client` (Assumption del spec). El modelo
admite 1:N a futuro sin migración destructiva. TypeORM: `@Entity('pets')`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` (PK, generado) | |
| `tenantId` | `uuid` (FK → `tenants.id`, `onDelete: 'CASCADE'`) | |
| `clientId` | `uuid` (FK → `clients.id`, `onDelete: 'CASCADE'`) | |
| `name` | `varchar` | Nombre de la mascota |
| `breed` | `varchar` (nullable) | Raza |
| `notes` | `varchar` (nullable) | Observaciones |
| `createdAt` | `timestamptz` (default `now()`) | |

Reglas:

- `name` obligatorio.
- En la UI de creación de cliente se crea `Client + Pet` en una sola
  transacción (FR-008).

---

### `Appointment`

Cita programada. TypeORM: `@Entity('appointments')`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` (PK, generado) | |
| `tenantId` | `uuid` (FK → `tenants.id`, `onDelete: 'CASCADE'`) | |
| `clientId` | `uuid` (FK → `clients.id`, `onDelete: 'CASCADE'`) | |
| `petId` | `uuid` (FK → `pets.id`, `onDelete: 'CASCADE'`) | |
| `scheduledAt` | `timestamptz` | Fecha y hora programada (UTC) |
| `service` | `varchar` | Texto libre con sugerencias UI ("Baño", "Corte", "Completo") |
| `reminderStatus` | `enum('not_sent', 'sent')` (default `not_sent`) | |
| `reminderSentAt` | `timestamptz` (nullable) | Set cuando `reminderStatus = sent` |
| `createdAt` | `timestamptz` (default `now()`) | |

Reglas:

- `clientId` y `petId` deben pertenecer al mismo `tenantId` y `petId.clientId`
  debe coincidir con `clientId` (validación de servicio).
- `scheduledAt` en el pasado: permitido pero el frontend debe pedir
  confirmación explícita (FR-012). El backend acepta sin restricción.
- Transición de `reminderStatus`: `not_sent → sent` (vía
  `POST /notifications/reminder`); reenvío explícito permitido (sobrescribe
  `reminderSentAt`).

---

### `Notification`

Registro de un recordatorio simulado enviado para una cita. TypeORM:
`@Entity('notifications')`.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | `uuid` (PK, generado) | |
| `tenantId` | `uuid` (FK → `tenants.id`, `onDelete: 'CASCADE'`) | |
| `appointmentId` | `uuid` (FK → `appointments.id`, `onDelete: 'CASCADE'`) | |
| `clientId` | `uuid` (FK → `clients.id`, `onDelete: 'CASCADE'`) | Denormalizado para historial por cliente |
| `channel` | `enum('whatsapp_simulated')` | Único valor en MVP |
| `messageText` | `text` | Texto compuesto en backend (FR-015) |
| `sentAt` | `timestamptz` | UTC |
| `createdAt` | `timestamptz` (default `now()`) | |

Reglas:

- Una `Appointment` puede tener N `Notification` (por reenvíos).
- El historial de cliente (FR-009) se obtiene via
  `notificationsRepository.find({ where: { tenantId, clientId } })`.

---

## Relaciones

```text
Tenant 1──N User
Tenant 1──N Client 1──N Pet           (en MVP: 1──1, modelo lo permite N)
Tenant 1──N Appointment ──N─1 Client
                       ──N─1 Pet
Tenant 1──N Notification ──N─1 Appointment
                          ──N─1 Client
```

Todas las FKs cuelgan de `Tenant.id` con `onDelete: Cascade`, por lo que el
cleanup de un tenant demo elimina automáticamente sus clientes, mascotas,
citas y notificaciones (decisión D5).

---

## Validaciones cross-entity

- En `POST /appointments`, el backend MUST verificar que `clientId.tenantId
  == JWT.tenantId`, `petId.tenantId == JWT.tenantId` y `petId.clientId ==
  clientId`. Si falla, responder `400 BAD_REQUEST` o `403 FORBIDDEN`.
- En `POST /notifications/reminder`, el backend MUST verificar que
  `appointmentId.tenantId == JWT.tenantId`. Si la cita ya tiene
  `reminderStatus = sent`, sigue aceptando el reenvío y crea otra
  `Notification` (FR-017 valida el patrón en frontend; backend permite N
  envíos).

---

## Migración inicial (TypeORM)

Una sola migración `0001-init` crea las 6 tablas (`tenants`, `users`,
`clients`, `pets`, `appointments`, `notifications`) con sus tipos enum y
relaciones FK con `ON DELETE CASCADE`. Se genera con
`npm run migration:generate -- src/database/migrations/Init` y se aplica con
`npm run migration:run` (ver `quickstart.md`).
