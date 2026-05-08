# api-micro-saas — Grooming SaaS Backend

Backend del MVP de SaaS Peluquería Canina. Stack: **NestJS 11 + TypeORM + PostgreSQL + JWT** con aislamiento multi-tenant por tenant ephemeral.

## Documentos de referencia

- [Constitución del producto](.specify/memory/constitution.md)
- [Spec funcional](specs/001-grooming-saas-mvp/spec.md)
- [Plan de implementación](specs/001-grooming-saas-mvp/plan.md)
- [Modelo de datos](specs/001-grooming-saas-mvp/data-model.md)
- [Contrato REST (OpenAPI)](specs/001-grooming-saas-mvp/contracts/openapi.yaml)
- [Quickstart end-to-end](specs/001-grooming-saas-mvp/quickstart.md)
- [Tareas de implementación](specs/001-grooming-saas-mvp/tasks.md)

## Levantar en local

Resumen — para detalles ver [quickstart](specs/001-grooming-saas-mvp/quickstart.md).

```bash
# 1. Postgres local con DB y usuario configurados en .env
# 2. Variables de entorno (copiar .env.example a .env y ajustar)
cp .env.example .env

# 3. Instalar deps
npm install

# 4. Arrancar en dev (TypeORM sincroniza el schema automáticamente)
npm run start:dev
```

Healthcheck: `GET http://localhost:3001/health`.

## Endpoints expuestos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | — | Status del servicio. |
| `POST` | `/auth/login` | — | Crea un tenant demo ephemeral con datos seedeados y devuelve JWT. |
| `GET` | `/appointments?date=YYYY-MM-DD` | JWT | Cita del día (default hoy) ordenadas cronológicamente. |
| `POST` | `/appointments` | JWT | Crea cita (valida que `pet.clientId == clientId` y mismo tenant). |
| `POST` | `/notifications/reminder` | JWT | Simula envío WhatsApp; persiste `Notification` y marca `Appointment.reminderStatus = sent`. |
| `GET` | `/clients` | JWT | Lista clientes con su mascota. |
| `GET` | `/clients/:id` | JWT | Detalle de cliente con historial de citas. |
| `POST` | `/clients` | JWT | Crea cliente + mascota en una transacción. |

Ver [contracts/openapi.yaml](specs/001-grooming-saas-mvp/contracts/openapi.yaml) para el schema completo de cada respuesta.

## Frontend

El frontend Next.js vive en un **repo separado** (`www-micro-saas`) y consume este backend a través del contrato OpenAPI anterior.

## Configuración relevante

| Variable | Default sugerido | Función |
|----------|------------------|---------|
| `DB_HOST/PORT/USER/PASS/NAME` | `localhost:5432/grooming_db` | PostgreSQL |
| `JWT_SECRET` | (cambiar en prod) | HS256 secret |
| `JWT_EXPIRES_IN` | `24h` | Vida del token (debe alinearse con `DEMO_TENANT_TTL_HOURS`) |
| `DEMO_TENANT_TTL_HOURS` | `24` | TTL de tenants demo; el cron purga los expirados cada 6 h |
| `PORT` | `3001` | Puerto HTTP |
| `CORS_ORIGIN` | `http://localhost:3000` | Origen del frontend permitido |

## Notas operativas

- **TypeORM `synchronize: true`** está habilitado para velocidad de MVP — no usar en producción tal cual; antes de prod migrar a TypeORM CLI migrations (ver scripts npm en `package.json`).
- **Cleanup de tenants demo**: `TenantsCleanupService` corre cada 6 h y borra `Tenant` con `expiresAt < now()`; los datos asociados caen por cascada FK.
- **Sin tests automatizados** en el MVP (decisión constitucional, ver `§Restricciones del MVP` en la constitución). El smoke se hace manual con curl según `quickstart.md §4–5`.
