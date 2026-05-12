# Implementation Plan: Recordatorios WhatsApp deep-link + Edición completa

**Branch**: `002-whatsapp-notifications` | **Date**: 2026-05-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-whatsapp-notifications/spec.md`

## Summary

Extensión del MVP (spec 001) en dos frentes:

1. **Recordatorios WhatsApp reales sin API ni costos**: el backend genera un
   URL `https://wa.me/<E164>?text=<mensaje>` y el frontend lo abre en una
   pestaña nueva, lo que carga WhatsApp Web/app del propio dueño con el
   chat del cliente y el texto pre-cargado. El dueño confirma con un clic
   dentro de WhatsApp. Cero proveedores externos, cero credenciales, cero
   opt-in formal.

2. **CRUD completo en demo y producción**: `PATCH`/`DELETE` sobre clientes
   y citas, manteniendo la cascada DB existente. Sin gating por plan: el
   producto entero está disponible en la demo pública y en tenants reales
   por igual.

Se introduce además el mecanismo del **tenant fundador** (el propio
usuario operando el MVP como herramienta de venta): bootstrap del tenant
+ usuario `owner` por variables de entorno + login email/password
(rama `mode: credentials` del endpoint existente `POST /auth/login`).
Esto evita registro público y permite reproducibilidad por ambiente.

El frontend (`www-micro-saas`) consume los nuevos endpoints y dispara el
deep-link con `window.open`. El backend (`api-micro-saas`, este repo)
expone los endpoints en `contracts/openapi.yaml`. El plan vive sólo en el
backend y el frontend lo referencia.

## Technical Context

**Language/Version**: TypeScript 5.4+ en ambos repos. Node.js 20 LTS.

**Primary Dependencies (nuevas o ajustadas para esta feature)**:

- Backend (`api-micro-saas`):
  - **`libphonenumber-js`** (`^1.10.x`) — normalización E.164 (D2).
  - **`bcryptjs`** (`^2.4.x`) — hash de la contraseña del fundador (D6).
  - **`passport-local`** (`^1.0.x`) y **`@types/passport-local`** —
    estrategia de login email/password para el fundador (D5).
  - Existentes que se reutilizan: `@nestjs/typeorm`, `@nestjs/jwt`,
    `passport-jwt`, `class-validator`, `@nestjs/mapped-types`
    (`PartialType` para DTOs PATCH, D7).
- Frontend (`www-micro-saas`):
  - **`libphonenumber-js`** (opcional, sólo si la validación inline en
    forms lo justifica; el backend ya valida).
  - **TanStack Query 5** (existente) — mutaciones para PATCH/DELETE con
    invalidation de queries.

**Storage**: PostgreSQL 16 (sin cambios estructurales mayores). Una
migración nueva `0002-whatsapp-link-channel`:

- `ALTER TYPE notifications_channel_enum ADD VALUE 'whatsapp_link';`

Las columnas existentes en `notifications` no cambian.

**Testing**: OPCIONAL por Constitución §Restricciones del MVP — diferido.
Smoke manual vía `quickstart.md` extendido.

**Target Platform**: Backend en Railway (contenedor Linux). Frontend en
Vercel. Navegadores modernos en escritorio + WhatsApp Web instalado
(o WhatsApp móvil para el flujo táctil).

**Project Type**: Web — extensión del backend API + frontend SPA
existentes en repos separados.

**Performance Goals**: La acción "Enviar recordatorio" responde en
< 500 ms (preparación del URL en backend + `window.open` en frontend
es lo suficientemente rápido para que el dueño no perciba latencia).
Edición y eliminación responden en < 1 s (SC-006 del spec).

**Constraints**:

- **Costo USD $0** para SaaS y tenant (SC-003).
- **Optimistic state**: la app NO puede confirmar entrega real
  (Assumption "Sin webhooks ni confirmación de entrega"). El estado
  "Enviado" se marca al abrir el deep-link.
- **Cuenta del fundador no expuesta públicamente**: no hay UI de
  registro, sólo configuración por env.
- **País por defecto +57 (Colombia)** para normalización de teléfonos.
- **Sin opt-in formal** en la app (Assumption del spec).
- **CORS**: el origen del frontend debe permitir el popup del deep-link
  (atributo `target=_blank` con `noopener,noreferrer`).

**Scale/Scope**:

- Mismo orden que spec 001: ~50 tenants demo activos concurrentes,
  ~200 clientes y ~500 citas por tenant.
- 1 tenant fundador adicional (persistente). En el corto plazo (primeros
  10 clientes pagos), añadir tenants reales será también vía bootstrap
  por env o seed manual; flujo de registro público queda fuera del MVP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / Regla | Estado | Notas |
|-------------------|--------|-------|
| **I. Simplicidad sobre Complejidad** | ✅ | Sin Cloud API, BSP, webhooks, ni opt-in. Stack idéntico al 001; añade 2 deps pequeñas (`libphonenumber-js`, `bcryptjs`). |
| **II. Valor Inmediato** | ✅ | El dueño envía un recordatorio en 2 clics y recibe la respuesta en su WhatsApp habitual. Demo manipulable (CRUD completo) refuerza el "aha moment". |
| **III. Enfoque en Negocio Local** | ✅ | Diseñado para peluquerías de 1–5 empleados; cada uno usa su propio WhatsApp. Nada corporativo. |
| **IV. Automatización Útil** | ⚠ Justificada | Semi-automatización (1 clic del dueño dentro de WhatsApp). Ver Complexity Tracking. |
| **§Comunicación: WhatsApp** | ✅ | El canal está expuesto; el envío es real (no simulado) pero semi-asistido. La interfaz mantiene la misma promesa visual que en spec 001. |
| **§Restricciones: sin registro público** | ✅ | El fundador entra por bootstrap de env; no hay endpoint de registro UI-facing. |
| **§Restricciones: sin integración real con WhatsApp Business API** | ✅ | NO se integra Cloud API ni BSP. El deep-link `wa.me` NO es una integración con la API; es un enlace público que cualquier navegador puede abrir. |
| **§Restricciones: sin pasarela de pagos** | ✅ | Sin cobros en la app. |
| **§Restricciones: velocidad sobre cobertura de tests** | ✅ | Tests OPCIONALES y diferidos; smoke manual via quickstart. |
| **Regla de Oro: vender antes de escalar** | ✅ | El plan optimiza para una demo cerrable y para que el fundador pueda usar el producto en pitches; nada de pagado/automatizado a nivel de proveedor. |

## Project Structure

### Documentation (this feature)

```text
specs/002-whatsapp-notifications/
├── plan.md                # This file
├── research.md            # Phase 0 — decisiones técnicas D1–D10
├── data-model.md          # Phase 1 — extensión de Notification + auth
├── quickstart.md          # Phase 1 — cómo levantar feature en local + smoke
├── contracts/
│   └── openapi.yaml       # Phase 1 — contrato REST extendido (PATCH/DELETE + wa.me)
├── checklists/
│   └── requirements.md    # Generado por /speckit-specify
└── tasks.md               # Phase 2 — generado por /speckit-tasks (no aún)
```

### Source Code

Backend (`api-micro-saas`, este repo) — extensiones sobre la estructura
del spec 001:

```text
src/
├── main.ts                                    # (sin cambios)
├── app.module.ts                              # (sin cambios)
├── common/                                    # (sin cambios)
├── database/
│   └── migrations/
│       └── <timestamp>-AddWhatsappLinkChannel.ts   # NUEVO (D3)
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts                     # MODIFICADO (registra LocalStrategy)
│   │   ├── auth.controller.ts                 # MODIFICADO (rama mode=credentials)
│   │   ├── auth.service.ts                    # MODIFICADO (validateCredentials)
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts                # (sin cambios)
│   │   │   └── local.strategy.ts              # NUEVO (passport-local)
│   │   └── dto/
│   │       └── credentials-login.dto.ts       # NUEVO
│   ├── tenants/
│   │   ├── tenant.entity.ts                   # (sin cambios)
│   │   └── founder-bootstrap.service.ts       # NUEVO (D5; ejecuta OnModuleInit)
│   ├── users/
│   │   └── user.entity.ts                     # MODIFICADO (campo passwordHash NULLABLE)
│   ├── clients/
│   │   ├── client.entity.ts                   # (sin cambios)
│   │   ├── pet.entity.ts                      # (sin cambios)
│   │   ├── clients.controller.ts              # MODIFICADO (+ PATCH, DELETE)
│   │   ├── clients.service.ts                 # MODIFICADO (+ update, remove)
│   │   └── dto/
│   │       ├── update-client.dto.ts           # NUEVO (PartialType)
│   │       └── update-pet.dto.ts              # NUEVO
│   ├── appointments/
│   │   ├── appointment.entity.ts              # (sin cambios; ya tiene reminderStatus)
│   │   ├── appointments.controller.ts         # MODIFICADO (+ PATCH, DELETE)
│   │   ├── appointments.service.ts            # MODIFICADO (+ update, remove; D8: reset reminder)
│   │   └── dto/
│   │       └── update-appointment.dto.ts      # NUEVO (PartialType)
│   └── notifications/
│       ├── notification.entity.ts             # MODIFICADO (enum channel + whatsapp_link)
│       ├── notifications.controller.ts        # MODIFICADO (+ POST /whatsapp-link)
│       ├── notifications.service.ts           # MODIFICADO (createWhatsappLink)
│       ├── reminder-template.ts               # (sin cambios; se reutiliza, D10)
│       ├── phone.ts                           # NUEVO (normalize → E.164, D2)
│       └── dto/
│           └── send-whatsapp-link.dto.ts      # NUEVO
└── seed/
    └── demo-seed.ts                           # (sin cambios)
```

Frontend (`www-micro-saas`, repo separado) — extensiones:

```text
src/
├── app/
│   ├── login/page.tsx                         # MODIFICADO (form email/password + "Probar demo")
│   ├── clients/
│   │   ├── [id]/page.tsx                      # MODIFICADO (botón Editar + Eliminar)
│   │   └── [id]/edit/page.tsx                 # NUEVO (form de edición)
│   └── appointments/
│       └── [id]/page.tsx                      # NUEVO (detalle + editar + eliminar)
├── components/
│   ├── ReminderPreviewDialog.tsx              # MODIFICADO (dispara wa.me en lugar de simulado; soporta texto editable; fallback Copiar)
│   ├── ClientEditForm.tsx                     # NUEVO
│   └── AppointmentEditForm.tsx                # NUEVO
└── lib/
    └── api-client.ts                          # MODIFICADO (PATCH, DELETE; nuevo POST /notifications/whatsapp-link)
```

**Structure Decision**: Web app dividida en dos repositorios independientes
(`api-micro-saas` y `www-micro-saas`), continuando la decisión del spec
001. El contrato REST en
[`contracts/openapi.yaml`](./contracts/openapi.yaml) se actualiza con
`PATCH /clients/{id}`, `DELETE /clients/{id}`, `PATCH /appointments/{id}`,
`DELETE /appointments/{id}`, `POST /notifications/whatsapp-link`, y la
rama `mode: credentials` de `POST /auth/login`. Los módulos NestJS del
backend no se reorganizan: la edición/eliminación va al módulo del
recurso correspondiente (`clients`, `appointments`), y la nueva acción
WhatsApp va al módulo `notifications` ya existente.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| **Semi-automatización (Principio IV)** — el envío exige 1 clic del dueño dentro de WhatsApp en lugar de salir solo. | Cumplir Constitución §Restricciones del MVP ("sin integración real con WhatsApp Business API") combinada con valor real (no sólo simulación). Mantener costo USD $0 y onboarding sin Meta Business. | Cloud API (totalmente automatizada): rechazada porque (a) exige Meta Business + opt-in + plantillas + webhooks por cada peluquería cliente, lo que crea fricción de venta inaceptable en el MVP, y (b) introduce un costo por mensaje que complicaría la propuesta comercial. La semi-automatización conserva 95% del beneficio (el dueño no tipea ni busca números) con 0% del costo y 0% del onboarding externo. |
| **Login email/password coexistiendo con login demo (Restricción "sin registro público")** | El fundador necesita un tenant persistente para usar el MVP como herramienta de venta (decisión del 2026-05-11). | JWT pre-emitido o demo único: rechazado porque el fundador podría necesitar entrar desde un dispositivo nuevo en un pitch (laptop prestada, celular del cliente). El login email/password resuelve esto sin abrir registro al público. La cuenta se siembra vía env vars, no por UI. |
