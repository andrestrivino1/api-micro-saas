# Phase 0 Research — Recordatorios WhatsApp deep-link + Edición completa

**Date**: 2026-05-11
**Branch**: `002-whatsapp-notifications`

Resolución de decisiones técnicas para que `plan.md` no contenga
`NEEDS CLARIFICATION`. Formato por decisión: **Decision** / **Rationale** /
**Alternatives considered**. Esta feature **extiende** el stack ya
establecido en `001-grooming-saas-mvp/research.md` (NestJS + TypeORM +
PostgreSQL + Next.js 15); aquí sólo se documentan decisiones nuevas o
revisitadas.

---

## D1 — Generación del deep-link `wa.me`: backend o frontend

- **Decision**: **Backend genera el URL completo** (`https://wa.me/<E164>?text=<urlencoded>`)
  y lo devuelve junto con el registro de `Notification` en la respuesta de
  `POST /notifications/whatsapp-link`. El frontend recibe el URL listo y lo
  abre con `window.open(url, '_blank', 'noopener,noreferrer')`.
- **Rationale**:
  - El backend ya es la fuente de verdad del texto del mensaje (FR-002 de
    spec 001, mantenido en FR-007 de spec 002). Generar el URL ahí preserva
    consistencia entre canales (`whatsapp_simulated` histórico vs
    `whatsapp_link` nuevo).
  - Centraliza la normalización del teléfono (D2) en un solo lugar.
  - Aún si el frontend cambia (móvil nativo futuro), el contrato queda
    estable.
- **Alternatives considered**:
  - *Frontend genera el URL*: descartado porque duplicaría lógica de
    normalización y el frontend tendría que componer el mensaje a partir de
    los datos crudos de la cita, divergiendo del backend.

## D2 — Normalización de teléfono a E.164

- **Decision**: Usar **`libphonenumber-js`** (~150 KB minified) en el
  backend. Default country = `CO` configurable por env (`DEFAULT_COUNTRY`).
  Validación: si la función `parsePhoneNumberFromString` retorna `undefined`
  o `isValid()` es false, el backend responde `400 Bad Request` con
  `{ code: "INVALID_PHONE" }`.
- **Rationale**:
  - Librería pura JS, sin dependencias nativas (compatible con Railway
    serverless y Docker slim).
  - 10× más liviana que `google-libphonenumber` (~1.5 MB) que es overkill
    para el caso.
  - Soporta Colombia (+57) y el resto de LATAM por si en el futuro se
    expande el spec a multi-país.
- **Alternatives considered**:
  - *Regex casero (solo +57)*: rechazado por fragilidad ante números
    móviles vs fijos y por bloquear expansión multi-país.
  - *`google-libphonenumber`*: mismo resultado funcional, peso prohibitivo.

## D3 — Canal `whatsapp_link` en la entidad `Notification`

- **Decision**: **Ampliar el enum existente** `channel` de `whatsapp_simulated`
  a `('whatsapp_simulated', 'whatsapp_link')`. Las notificaciones nuevas
  usan `whatsapp_link`; las históricas conservan `whatsapp_simulated`. Se
  aplica vía migración TypeORM `0002-add-whatsapp-link-channel`.
- **Rationale**:
  - Preserva trazabilidad histórica (Assumption "Migración del canal
    existente" del spec).
  - PostgreSQL `ALTER TYPE … ADD VALUE` es la operación más sencilla; no
    requiere rewriting de tabla.
- **Alternatives considered**:
  - *Reemplazar el enum sin conservar el valor antiguo*: rompería datos de
    pruebas o smoke previos en local; sin beneficio real.
  - *Tabla auxiliar de canales*: sobreingeniería para 2 valores conocidos.

## D4 — Apertura del deep-link y protección contra doble-clic

- **Decision**: Frontend deshabilita el botón "Enviar recordatorio" durante
  **5 segundos** tras el primer clic (estado `isSending` en el componente).
  No hay lock en backend: el backend simplemente crea un nuevo registro de
  `Notification` por cada request (idempotencia natural por timestamp).
  Apertura: `window.open(url, '_blank', 'noopener,noreferrer')`.
- **Rationale**:
  - Edge case "doble clic" (FR-023 del spec 002 dice "≤ 30 s ventana"; bajo
    análisis, 5 s frontend cubre el 99% de casos).
  - Sin lock en DB → menos código, sin race conditions a debugger.
  - Si el usuario realmente quiere reenviar, el botón se rehabilita.
- **Alternatives considered**:
  - *Lock pesimista en backend (índice único)*: añadiría errores de
    conflicto a manejar en frontend; sobrecomplicación.
  - *Debounce vía middleware Redis*: requiere Redis. Rechazado.

## D5 — Cuenta del fundador (persistente, no demo)

- **Decision**: **Bootstrap por variables de entorno**. Al arrancar el
  backend, un servicio `FounderBootstrapService` lee `FOUNDER_EMAIL`,
  `FOUNDER_PASSWORD_HASH` (bcrypt) y `FOUNDER_TENANT_NAME` del env. Si el
  usuario no existe en DB, crea un `Tenant` con `kind = paid` (sin
  `expiresAt`) y un `User` con `role = owner`, `passwordHash` y email
  configurados.

  Login: nuevo endpoint `POST /auth/login` extendido para aceptar
  `{ mode: "credentials", email, password }`. La rama existente
  `{ mode: "demo" }` queda intacta. Implementación: `passport-local` +
  `bcryptjs`.
- **Rationale**:
  - Cumple "Sin registro público" de la Constitución: el fundador no se
    registra desde la UI; entra a la DB por configuración, igual que un
    superuser de sistema.
  - Reproducible: el mismo `.env` levanta el mismo fundador en cualquier
    ambiente sin manipulación manual de DB.
  - Sin necesidad de UI de admin en el MVP.
- **Alternatives considered**:
  - *Seed script CLI (`npm run seed:founder`)*: requiere recordar correr el
    script en cada ambiente nuevo. El env-bootstrap se ejecuta automático en
    cold-start.
  - *Magic-link por correo*: agrega dependencia de email transaccional —
    excluida por Constitución §Restricciones.
  - *Sin password, sólo JWT pre-emitido*: feo de operar; el fundador podría
    necesitar entrar desde un dispositivo nuevo durante una venta.

## D6 — Hash de contraseña

- **Decision**: **`bcryptjs`** (puro JS) con cost factor `10`. La
  contraseña hasheada vive en `FOUNDER_PASSWORD_HASH` (env), nunca en
  texto plano en repo ni en logs.
- **Rationale**:
  - `bcryptjs` evita compilación nativa (compatibilidad con Railway y
    Docker slim sin toolchain).
  - Cost 10 es el balance estándar para entornos web.
- **Alternatives considered**:
  - *`bcrypt` (nativo)*: requiere `node-gyp`; rompe builds en entornos
    minimalistas.
  - *`argon2`*: más fuerte pero requiere binarios nativos.

## D7 — PATCH y DELETE en endpoints REST

- **Decision**: Patrón **partial update** con DTOs marcados con
  `@IsOptional()` en cada campo. NestJS controlador expone:
  - `PATCH /clients/{id}` → editar dueño y mascota en la misma llamada
    (`{ name?, phone?, notes?, pet: { name?, breed?, notes? } }`).
  - `DELETE /clients/{id}` → cascada DB elimina `Pet`, `Appointment`,
    `Notification` asociadas.
  - `PATCH /appointments/{id}` → `{ clientId?, petId?, scheduledAt?, service? }`.
  - `DELETE /appointments/{id}` → cascada DB elimina `Notification`
    asociadas.
  Todos exigen scoping por `tenantId` extraído del JWT.
- **Rationale**: Estándar REST. `class-validator` + `PartialType` de
  `@nestjs/mapped-types` simplifica DTOs.
- **Alternatives considered**:
  - *PUT con representación completa*: rechazado; obliga al frontend a
    enviar todos los campos.
  - *Soft delete*: agrega complejidad de scoping global. Rechazado por
    Principio I; el spec exige eliminación real.

## D8 — Reinicio del estado del recordatorio al editar cita

- **Decision**: Cuando `PATCH /appointments/{id}` modifica `clientId`,
  `petId`, o `scheduledAt`, el servicio resetea `reminderStatus` a
  `not_sent` y `reminderSentAt` a `NULL`. Los registros previos de
  `Notification` se conservan en historial (no se borran). Cambios sólo en
  `service` no resetean el estado.
- **Rationale**: Cumple FR-018 del spec; mantiene auditoría de envíos
  pasados y refleja que el recordatorio "anterior" ya no aplica.
- **Alternatives considered**:
  - *Eliminar la `Notification` previa*: pierde historial. Rechazado por
    FR-025.
  - *Resetear sólo si cambia `scheduledAt`*: ignora cambio de cliente
    (escenario realista: reasignar la cita). Insuficiente.

## D9 — Fallback "Copiar enlace" / "Copiar mensaje"

- **Decision**: **Frontend** detecta si `window.open` retornó `null`
  (popup bloqueado). En ese caso muestra un dialog con dos botones:
  "Copiar enlace" (copia el URL `wa.me` al clipboard) y "Copiar mensaje"
  (copia sólo el texto). Usa `navigator.clipboard.writeText`.
- **Rationale**: Cumple FR-012 del spec. Operación 100% frontend; el
  backend no se entera.
- **Alternatives considered**:
  - *Redirección directa* (`location.href = url`): rompe el flujo del
    dashboard. Rechazado.

## D10 — Texto del mensaje: reutilizar `composeReminderText` existente

- **Decision**: Reutilizar `src/modules/notifications/reminder-template.ts`
  (heredado de spec 001) tanto para `whatsapp_simulated` como para
  `whatsapp_link`. La función ya devuelve el texto humanizado con `Intl`
  en `es-CO`. La personalización (US5/P3 del spec) se hace sobreescribiendo
  `messageText` desde el body del request.
- **Rationale**: Cero duplicación; consistencia visual exigida por FR-007
  del spec.
- **Alternatives considered**:
  - *Plantilla por canal*: prematuro; un solo template basta en MVP.

---

## Decisiones diferidas a `/speckit-tasks`

- Forma exacta de los DTOs de `PATCH` (derivable de `openapi.yaml` final).
- Implementación de la UI para editar cliente y cita en el frontend
  (`www-micro-saas`): componentes, validación inline.
- Estrategia para borrado en cascada visualmente desde el dashboard
  (¿confirmación modal con listado de afectados?).
- Si se quiere agregar `/whatsapp-link/preview` que devuelva sólo el texto
  y el URL sin persistir aún (para mostrar vista previa antes de
  confirmar) o si la vista previa es 100% frontend con el texto del
  template duplicado. Default tentativo: 100% frontend (Principio I).
