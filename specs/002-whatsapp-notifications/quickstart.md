# Quickstart — Recordatorios WhatsApp deep-link + Edición completa

**Audiencia**: Desarrollador trabajando en `api-micro-saas` (backend) o
`www-micro-saas` (frontend) sobre la feature 002.
**Objetivo**: Aplicar las migraciones, sembrar el tenant del fundador,
y reproducir el flujo "login fundador → editar cliente → recordatorio
WhatsApp abierto" en menos de 10 minutos.

Asume que el quickstart de spec 001 ya fue completado al menos una vez
(stack levantado, migraciones iniciales corridas, demo funcional).

---

## 1) Instalar dependencias nuevas

```bash
# Desde la raíz de api-micro-saas
npm install --save libphonenumber-js bcryptjs passport-local
npm install --save-dev @types/bcryptjs @types/passport-local
```

---

## 2) Variables de entorno nuevas

Añadir al `.env` del backend:

```bash
# Tenant fundador (persistente, no demo)
FOUNDER_EMAIL=andres@grooming.local
FOUNDER_TENANT_NAME=Peluquería Demo Fundador
# Generar con: node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD', 10))"
FOUNDER_PASSWORD_HASH=$2a$10$REEMPLAZAR_POR_HASH_REAL

# País por defecto para normalizar teléfonos a E.164
DEFAULT_COUNTRY=CO
```

**Generar el hash de tu contraseña local** (no commitear la contraseña ni
el hash en git):

```bash
node -e "console.log(require('bcryptjs').hashSync('MiPasswordSegura123', 10))"
# Pega la salida en FOUNDER_PASSWORD_HASH
```

---

## 3) Generar y aplicar migraciones nuevas

```bash
# Genera dos migraciones (orden importa)
npm run migration:generate -- src/database/migrations/AddUserPasswordHash
npm run migration:generate -- src/database/migrations/AddWhatsappLinkChannel

# Aplicar
npm run migration:run
```

Si la generación de la segunda migración no detecta el cambio del enum
(TypeORM 0.3 a veces no propaga `ALTER TYPE`), crea el archivo
manualmente:

```ts
// src/database/migrations/<timestamp>-AddWhatsappLinkChannel.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWhatsappLinkChannel1715000000000 implements MigrationInterface {
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TYPE notifications_channel_enum ADD VALUE IF NOT EXISTS 'whatsapp_link'`);
  }
  public async down(_q: QueryRunner): Promise<void> {
    // Postgres no permite DROP VALUE de un enum; revertir requiere recrear el tipo.
    // Se omite para MVP; ver Operaciones útiles más abajo si se necesita.
  }
}
```

---

## 4) Arranque del backend con el tenant del fundador

```bash
npm run start:dev
```

En el arranque, `FounderBootstrapService.onModuleInit()` verifica que
`FOUNDER_EMAIL` existe en la tabla `users`. Si no existe:

1. Crea un `Tenant` con `name = FOUNDER_TENANT_NAME`, `kind = paid`,
   `expiresAt = NULL`.
2. Crea un `User` con `email = FOUNDER_EMAIL`,
   `passwordHash = FOUNDER_PASSWORD_HASH`, `role = owner`.

Logs esperados:

```text
[FounderBootstrap] Founder tenant bootstrapped: <uuid>
[FounderBootstrap] Founder user bootstrapped: andres@grooming.local
```

(En arranques posteriores: `[FounderBootstrap] Founder already exists; skipping.`)

---

## 5) Smoke directo contra la API

### 5.1 Login del fundador

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"mode":"credentials","email":"andres@grooming.local","password":"MiPasswordSegura123"}' \
  | jq -r .accessToken)

echo "$TOKEN" | head -c 30
```

### 5.2 Crear un cliente con teléfono colombiano

```bash
curl -s -X POST http://localhost:3001/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"María Gómez",
    "phone":"3001234567",
    "pet":{"name":"Luna","breed":"Poodle"}
  }' | jq
```

Nota: el teléfono `3001234567` se acepta sin código de país; el backend
lo normaliza a `+573001234567` al construir el `wa.me`.

### 5.3 Crear una cita para mañana

```bash
TOMORROW=$(date -u -d '+1 day' +'%Y-%m-%dT15:00:00.000Z')
CLIENT_ID=$(curl -s http://localhost:3001/clients -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
PET_ID=$(curl -s http://localhost:3001/clients/$CLIENT_ID -H "Authorization: Bearer $TOKEN" | jq -r '.pet.id')

curl -s -X POST http://localhost:3001/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
    \"clientId\":\"$CLIENT_ID\",
    \"petId\":\"$PET_ID\",
    \"scheduledAt\":\"$TOMORROW\",
    \"service\":\"Baño\"
  }" | jq
```

### 5.4 Generar el URL `wa.me`

```bash
APPT_ID=$(curl -s "http://localhost:3001/appointments?date=$(date -u -d '+1 day' +'%Y-%m-%d')" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')

curl -s -X POST http://localhost:3001/notifications/whatsapp-link \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"appointmentId\":\"$APPT_ID\"}" | jq
```

Respuesta esperada (extracto):

```json
{
  "id": "...",
  "channel": "whatsapp_link",
  "messageText": "Hola, Luna tiene Baño mañana a las 3pm 🐶",
  "sentAt": "2026-05-11T...",
  "whatsappUrl": "https://wa.me/573001234567?text=Hola%2C%20Luna%20tiene%20Ba%C3%B1o%20ma%C3%B1ana%20a%20las%203pm%20%F0%9F%90%B6"
}
```

Pega el `whatsappUrl` en el navegador → debe abrir WhatsApp Web con el
chat al número `+57 300 123 4567` y el mensaje pre-cargado.

### 5.5 Editar el cliente

```bash
curl -s -X PATCH http://localhost:3001/clients/$CLIENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name":"María Gómez Ríos",
    "pet":{"breed":"Poodle Toy"}
  }' | jq
```

### 5.6 Editar la cita (resetea el recordatorio)

```bash
DAY_AFTER=$(date -u -d '+2 days' +'%Y-%m-%dT15:00:00.000Z')
curl -s -X PATCH http://localhost:3001/appointments/$APPT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"scheduledAt\":\"$DAY_AFTER\"}" | jq
```

Esperado: el campo `reminderStatus` vuelve a `not_sent`, `reminderSentAt`
queda `null`. El registro de `Notification` previo se conserva en el
historial del cliente (`GET /clients/{id}`).

### 5.7 Eliminar la cita

```bash
curl -i -X DELETE http://localhost:3001/appointments/$APPT_ID \
  -H "Authorization: Bearer $TOKEN"
# Esperado: HTTP/1.1 204 No Content
```

---

## 6) Smoke desde el frontend

1. `http://localhost:3000/login` — formulario con dos opciones:
   "Probar demo" (sin credenciales) y "Iniciar sesión" (email + password
   del fundador).
2. Iniciar sesión con las credenciales del fundador.
3. Dashboard del día (FR-004 spec 001) con tus datos persistentes.
4. Crear / editar / eliminar clientes y citas desde la UI.
5. En una cita: pulsar "Enviar recordatorio" → vista previa con el
   texto editable → "Confirmar" → se abre **una pestaña con WhatsApp Web
   cargado al chat del cliente con el mensaje listo**.
6. La cita queda marcada como "Recordatorio enviado".

### Smoke del flujo demo (sigue funcionando)

1. Cerrar sesión.
2. Pulsar "Probar demo" → tenant ephemeral con datos precargados.
3. Probar editar / eliminar dentro del demo. Los cambios persisten
   durante la sesión y se reinicializan al cerrar sesión.
4. Probar "Enviar recordatorio" desde el demo: también abre WhatsApp
   Web (es el mismo flujo; no hay distinción demo / real, FR-022 del
   spec 002).

---

## 7) Operaciones útiles

| Necesidad | Comando |
|-----------|---------|
| Rehashear la contraseña del fundador | `node -e "console.log(require('bcryptjs').hashSync('NuevaPassword', 10))"` → reemplazar `FOUNDER_PASSWORD_HASH` y reiniciar |
| Recrear el enum `notifications_channel_enum` (rollback completo) | DROP/CREATE TYPE con recreación de la tabla — ver script en `docs/operations.md` (futuro) |
| Listar todas las notificaciones de un cliente | `SELECT * FROM notifications WHERE client_id = '<uuid>' ORDER BY sent_at DESC;` |
| Validar manualmente un teléfono | `node -e "const p=require('libphonenumber-js'); console.log(p.parsePhoneNumberFromString('3001234567','CO').format('E.164'))"` |

---

## Troubleshooting

- **`401 Unauthorized` al login del fundador**: verificar que
  `FOUNDER_EMAIL` y `FOUNDER_PASSWORD_HASH` están en `.env`, que el
  backend se reinició y que el log de bootstrap apareció. El hash debe
  haberse generado con la **misma** contraseña que estás enviando en
  `password`.
- **`400 INVALID_PHONE`**: el teléfono del cliente no tiene formato
  reconocible. En Colombia, los móviles tienen 10 dígitos y empiezan
  por `3`. Acepta también con `+57` prefijo o `57` sin `+`.
- **WhatsApp Web abre el chat pero el mensaje aparece vacío**: revisar
  que `text=` quedó URL-encoded. Si pegas el URL desde shell, los
  emojis pueden romperse en sistemas Windows; probar desde el frontend.
- **El popup se bloquea en el navegador**: el frontend debe disparar
  `window.open` dentro del handler del clic del usuario (no en un
  callback asíncrono tipo `then`); si Chrome lo bloquea, aparece el
  fallback "Copiar enlace" / "Copiar mensaje" (FR-012).
- **`Bootstrap: Founder user exists with different password`**: el
  `FOUNDER_PASSWORD_HASH` cambió en el `.env` pero el usuario en DB
  conserva el hash anterior. El bootstrap NO actualiza credenciales
  existentes (por seguridad). Para rotarlas en local: borrar el usuario
  manualmente y reiniciar el backend, o actualizar el campo con
  `UPDATE users SET password_hash='...' WHERE email='...';`.
