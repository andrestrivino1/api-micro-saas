# Data Model — Recordatorios WhatsApp deep-link + Edición

**Branch**: `002-whatsapp-notifications` · **Date**: 2026-05-11
**Source of truth for**: backend (`api-micro-saas`) entidades TypeORM y
frontend (`www-micro-saas`) tipos derivados (de `contracts/openapi.yaml`).

Esta feature **extiende** el modelo del spec 001
([data-model.md](../001-grooming-saas-mvp/data-model.md)). Aquí sólo se
documentan los cambios y adiciones. Las entidades `Tenant`, `Client`,
`Pet` y `Appointment` mantienen su esquema; sólo se añaden operaciones.

---

## Cambios sobre entidades existentes

### `User` — campo `passwordHash` (NUEVO, NULLABLE)

Para soportar el login email/password del fundador (D5 de research).

| Campo | Tipo | Notas |
|-------|------|-------|
| `passwordHash` | `varchar(60)` (nullable) | bcryptjs hash; `NULL` para usuarios demo (no autentican por password) |

Reglas:

- Usuarios `role = 'demo'` tienen `passwordHash = NULL` y NO pueden
  autenticarse por `mode = credentials`. Sólo por `mode = demo`.
- Usuarios `role = 'owner'` (creados por `FounderBootstrapService`)
  tienen `passwordHash` poblado.
- El campo nunca se expone en respuestas (excluido a nivel de service /
  serializer).

Migración: `<timestamp>-AddUserPasswordHash` — `ALTER TABLE users ADD
COLUMN password_hash VARCHAR(60) NULL;`

---

### `Notification` — enum `channel` ampliado

Antes (spec 001):

```sql
CREATE TYPE notifications_channel_enum AS ENUM ('whatsapp_simulated');
```

Después (spec 002):

```sql
ALTER TYPE notifications_channel_enum ADD VALUE 'whatsapp_link';
```

Migración: `<timestamp>-AddWhatsappLinkChannel`.

| Campo (sin cambios estructurales) | Tipo | Notas |
|-------|------|-------|
| `channel` | `enum('whatsapp_simulated', 'whatsapp_link')` | Nuevas notificaciones usan `whatsapp_link`. Las históricas (de pruebas spec 001) conservan `whatsapp_simulated`. |

**No se añaden columnas**: la URL `wa.me` se calcula on-the-fly a partir
del teléfono del cliente y `messageText`; no se persiste (es derivable y
podría quedar obsoleto si el cliente cambia teléfono). El `messageText`
guardado es lo que el dueño confirmó enviar (puede ser personalizado, FR-010).

Reglas operativas (sin cambios al esquema, sí al comportamiento):

- Una `Appointment` puede tener N `Notification` (por reenvíos).
- Cuando `Appointment.scheduledAt`, `clientId` o `petId` cambian vía
  `PATCH /appointments/{id}` (D8 de research), el servicio:
  1. Resetea `Appointment.reminderStatus = 'not_sent'` y
     `reminderSentAt = NULL`.
  2. **NO** borra las `Notification` previas (se conservan para
     auditoría histórica del cliente).

---

## Entidades sin cambios estructurales pero con operaciones nuevas

### `Client` (+ `Pet`)

Operaciones nuevas:

- **`PATCH /clients/{id}`** — actualiza `Client.name`, `phone`, `notes`
  y/o `Pet.name`, `breed`, `notes` en una sola llamada.
- **`DELETE /clients/{id}`** — elimina el cliente y, por cascada de FK
  (`onDelete: 'CASCADE'`), sus `Pet`(s), `Appointment`(s) y
  `Notification`(s) asociadas.

Reglas:

- `Client.tenantId` se valida contra `JWT.tenantId` en cada operación
  (sigue el patrón de spec 001).
- Validaciones de no-vacío sobre `name` y `phone` se aplican igual que en
  `POST /clients` (FR-014 del spec).
- Cuando `phone` cambia, futuras notificaciones usarán el nuevo número
  para generar el `wa.me`. Notificaciones previas conservan el texto
  enviado pero no el URL (no se persiste).

### `Appointment`

Operaciones nuevas:

- **`PATCH /appointments/{id}`** — actualiza `clientId`, `petId`,
  `scheduledAt`, `service`.
- **`DELETE /appointments/{id}`** — elimina la cita y, por cascada,
  sus `Notification`(s).

Reglas (extienden las del spec 001):

- Cuando cambian `clientId`, `petId` o `scheduledAt` → reset de
  `reminderStatus` y `reminderSentAt` (D8).
- Cambio sólo de `service` NO resetea el estado.
- Si se proporciona `clientId` y/o `petId` nuevo, se aplican las mismas
  validaciones cross-entity de spec 001 (`petId.clientId == clientId`,
  `tenantId` consistente).

---

## Nueva operación: `POST /notifications/whatsapp-link`

Crea una `Notification` con `channel = 'whatsapp_link'`, marca la cita
asociada como `reminderStatus = 'sent'` con `reminderSentAt = now()`, y
**devuelve además el URL `wa.me` listo para abrir**.

Body de entrada:

```ts
{
  appointmentId: string;       // UUID
  customMessage?: string;      // opcional (FR-010 del spec)
}
```

Body de respuesta:

```ts
{
  id: string;                  // UUID de la Notification
  appointmentId: string;
  clientId: string;
  channel: 'whatsapp_link';
  messageText: string;         // texto efectivo (custom o template)
  sentAt: string;              // ISO timestamp
  whatsappUrl: string;         // https://wa.me/<E164>?text=<urlencoded>
}
```

Pipeline (`NotificationsService.createWhatsappLink`):

1. Cargar `Appointment` por `appointmentId` scoped a `tenantId`. Si
   no existe → `404`.
2. Cargar `Client` asociado. Si `client.phone` está vacío → `400
   { code: 'CLIENT_HAS_NO_PHONE' }`.
3. Normalizar `client.phone` con `libphonenumber-js` y
   `DEFAULT_COUNTRY = 'CO'`. Si no es válido → `400 { code:
   'INVALID_PHONE' }`.
4. Construir `messageText`:
   - Si `customMessage` viene y no está vacío → usar tal cual.
   - Si no → llamar `composeReminderText({ petName, service,
     scheduledAt })` (reutilización D10).
5. Construir `whatsappUrl = 'https://wa.me/' + e164.replace('+','') +
   '?text=' + encodeURIComponent(messageText)`.
6. Crear la `Notification` con `channel = 'whatsapp_link'`,
   `messageText`, `sentAt = now()`.
7. Actualizar la `Appointment`: `reminderStatus = 'sent'`,
   `reminderSentAt = now()` (sólo si no estaba ya marcada; si ya estaba,
   se sobrescribe — comportamiento de reenvío explícito).
8. Devolver el DTO con el `whatsappUrl` calculado.

---

## Validaciones cross-entity (resumen actualizado)

- **PATCH/DELETE Client/Appointment**: el recurso debe pertenecer al
  `tenantId` del JWT, o `404`.
- **PATCH Appointment con `clientId`/`petId` nuevos**: validar
  `petId.clientId == clientId` y ambos del mismo `tenantId`.
- **POST /notifications/whatsapp-link**: validar
  `appointmentId.tenantId == JWT.tenantId` y existencia de `client.phone`
  válido para E.164.
- **POST /auth/login con `mode=credentials`**: validar `email` existe,
  `user.passwordHash` no es NULL, `bcryptjs.compare(password,
  passwordHash)` retorna `true`. Si falla en cualquier paso → `401`
  genérico (no diferenciar "email no existe" vs "password incorrecto"
  para evitar enumeración).

---

## Migraciones (TypeORM)

Esta feature añade **dos** migraciones secuenciales sobre la base de
spec 001:

1. `<ts1>-AddUserPasswordHash`
   - `ALTER TABLE users ADD COLUMN password_hash VARCHAR(60) NULL;`

2. `<ts2>-AddWhatsappLinkChannel`
   - `ALTER TYPE notifications_channel_enum ADD VALUE 'whatsapp_link';`

Ambas son aditivas y compatibles con datos existentes. Se aplican con
`npm run migration:run` (sin downtime).

---

## Diagrama de relaciones (sin cambios estructurales)

```text
Tenant 1──N User           (User ahora puede tener passwordHash)
Tenant 1──N Client 1──N Pet
Tenant 1──N Appointment ──N─1 Client
                       ──N─1 Pet
Tenant 1──N Notification ──N─1 Appointment
                          ──N─1 Client
                          ─ channel ∈ {whatsapp_simulated, whatsapp_link}
```

Cascade `ON DELETE CASCADE` se conserva en todas las FKs (decisión D5 de
spec 001), por lo que `DELETE /clients/{id}` elimina mascotas, citas y
notificaciones de ese cliente atómicamente sin código adicional.
