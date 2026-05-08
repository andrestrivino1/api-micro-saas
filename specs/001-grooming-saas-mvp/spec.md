# Feature Specification: SaaS Peluquería Canina — MVP Demo

**Feature Branch**: `001-grooming-saas-mvp`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "SaaS Peluquería Canina — aplicación web para que peluquerías caninas gestionen clientes, mascotas, citas y envíen recordatorios (simulados en MVP), con una demo funcional que demuestre el valor en menos de 2 minutos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dashboard demo con valor inmediato (Priority: P1)

Un dueño de peluquería canina llega al sitio, hace clic en "Probar demo", entra
con un usuario demo precargado y ve de inmediato la agenda del día con citas
realistas (clientes, mascotas, horarios, servicios). Sin configuración previa
entiende: "esto es lo que vería cada mañana en mi negocio".

**Why this priority**: Es el "aha moment" central de la constitución (Principio
II — Valor Inmediato) y la base de la estrategia comercial (Modelo de Negocio:
demo → conversión). Por sí solo constituye un MVP demostrable: si todo lo demás
fallara, esta historia ya permite vender.

**Independent Test**: Un visitante anónimo abre la URL, hace clic en "Probar
demo" y, sin pasos intermedios, ve la pantalla de citas del día con datos
ficticios coherentes. La historia se valida si un usuario sin contexto puede
explicar el propósito del producto en menos de 2 minutos tras llegar.

**Acceptance Scenarios**:

1. **Given** un visitante en la página de inicio, **When** hace clic en el
   botón de demo, **Then** queda autenticado como usuario demo y aterriza en el
   dashboard de citas del día sin pasos adicionales.
2. **Given** una sesión demo recién iniciada, **When** el visitante observa el
   dashboard, **Then** ve al menos 3 citas del día con cliente, mascota, hora y
   servicio, formateadas de forma legible y ordenadas cronológicamente.
3. **Given** un visitante en el dashboard, **When** la fecha del día no tiene
   citas precargadas, **Then** ve un estado vacío amistoso que indica
   explícitamente que no hay citas para hoy y ofrece una acción clara (crear
   cita / ver clientes).

---

### User Story 2 — Recordatorio simulado tipo WhatsApp (Priority: P2)

Desde una cita del dashboard, el dueño de la peluquería pulsa "Enviar
recordatorio", ve una vista previa del mensaje (ej. "Hola, Luna tiene grooming
mañana a las 3pm 🐶"), confirma el envío y observa que el estado de la cita
cambia a "Recordatorio enviado" con marca de tiempo. El sistema simula el envío
sin integración real con WhatsApp.

**Why this priority**: Es el momento "wow" que diferencia el producto y refuerza
el Principio IV (Automatización Útil). No es bloqueante para US1, pero
multiplica el impacto de la demo en ventas.

**Independent Test**: Estando en el dashboard, seleccionar cualquier cita,
disparar el recordatorio, y verificar que (a) se muestra una vista previa
realista del mensaje, (b) tras confirmar, el estado de envío se actualiza
visiblemente, y (c) el historial del cliente registra el mensaje.

**Acceptance Scenarios**:

1. **Given** una cita visible en el dashboard, **When** el usuario pulsa
   "Enviar recordatorio", **Then** ve una vista previa del texto del mensaje con
   nombre de mascota, día y hora de la cita.
2. **Given** una vista previa de recordatorio abierta, **When** el usuario
   confirma el envío, **Then** el estado de la cita cambia a "Recordatorio
   enviado" con marca de tiempo, y el cliente queda asociado al mensaje en su
   historial.
3. **Given** una cita con recordatorio ya enviado, **When** el usuario intenta
   enviar de nuevo, **Then** el sistema indica que ya fue enviado y permite
   reenviarlo de forma explícita (no por accidente).

---

### User Story 3 — Crear cita asociada a cliente y mascota (Priority: P2)

El dueño de la peluquería crea una nueva cita seleccionando un cliente
existente y una mascota, definiendo fecha, hora y servicio. La cita aparece
inmediatamente en el dashboard.

**Why this priority**: Demuestra utilidad real más allá de visualización; sin
esta historia el producto se percibiría como "sólo una vista". Es independiente
de US1 y US2 pero las complementa.

**Independent Test**: Acceder al formulario de creación de cita, seleccionar un
cliente y mascota precargados, elegir fecha/hora/servicio, guardar, y verificar
que la cita aparece en el dashboard del día correspondiente.

**Acceptance Scenarios**:

1. **Given** un usuario demo autenticado, **When** abre el formulario de nueva
   cita y selecciona cliente, mascota, fecha, hora y servicio válidos, **Then**
   la cita se guarda y aparece en el listado de citas del día correspondiente.
2. **Given** un formulario de cita en blanco, **When** el usuario intenta
   guardar sin seleccionar cliente o mascota, **Then** el sistema impide guardar
   y señala los campos faltantes.
3. **Given** un usuario creando una cita, **When** elige una fecha/hora pasada,
   **Then** el sistema muestra una advertencia y pide confirmación explícita
   antes de guardar.

---

### User Story 4 — Gestionar clientes y mascotas (Priority: P3)

El dueño consulta la lista de clientes, abre el detalle de uno y/o crea un
nuevo cliente con su mascota (nombre del dueño, contacto, nombre de la mascota,
raza/observaciones).

**Why this priority**: Necesario para que el producto se sienta completo y para
soportar US3 (crear cita requiere clientes). En el MVP los clientes están
precargados, por lo que la creación es un complemento, no un bloqueo.

**Independent Test**: Acceder a la sección de clientes, ver la lista con datos
realistas, abrir el detalle de un cliente, crear un nuevo cliente con mascota
asociada, y verificar que aparece en el listado.

**Acceptance Scenarios**:

1. **Given** un usuario demo autenticado, **When** abre la sección de clientes,
   **Then** ve la lista completa con nombre del dueño, nombre de la mascota y
   datos de contacto resumidos.
2. **Given** la lista de clientes, **When** el usuario abre el detalle de un
   cliente, **Then** ve su información básica y el historial de citas asociadas.
3. **Given** un usuario en la sección de clientes, **When** crea un nuevo
   cliente con dueño + mascota válidos, **Then** el cliente queda disponible
   inmediatamente para asociarlo a una cita en US3.

---

### Edge Cases

- **Sin citas hoy**: El dashboard muestra un estado vacío con copy positivo y
  acciones claras (no error, no pantalla en blanco).
- **Recordatorio reenviado por accidente**: La acción de reenvío exige
  confirmación adicional cuando el estado ya es "Enviado".
- **Cita en el pasado**: El formulario permite el caso (útil para registrar
  citas históricas) pero pide confirmación.
- **Sesión demo expirada o reset**: Si la sesión expira durante la demo, el
  sistema reautentica automáticamente al usuario demo y conserva la pantalla
  actual cuando es posible.
- **Conflicto de horario**: Si dos citas coinciden en el mismo horario para el
  mismo día, ambas se muestran apiladas en el dashboard sin pérdida de datos
  (no se bloquea la creación; sólo se señala visualmente).
- **Cliente sin mascota o mascota sin dueño**: No se permite. La creación de
  cliente exige nombre de mascota; la creación de cita exige ambos.

## Requirements *(mandatory)*

### Functional Requirements

**Autenticación y sesión demo**

- **FR-001**: El sistema MUST exponer un acceso público "Probar demo" que
  autentica al visitante como un usuario demo precargado sin requerir registro
  ni captura de datos personales.
- **FR-002**: El sistema MUST mantener una sesión demo aislada por visitante,
  de modo que las acciones de un visitante no afecten la experiencia de otro.
- **FR-003**: El sistema MUST permitir cerrar sesión y reiniciar la demo a su
  estado precargado mediante una acción explícita del usuario.

**Dashboard**

- **FR-004**: El sistema MUST mostrar, como pantalla principal tras el login
  demo, las citas del día actual ordenadas cronológicamente.
- **FR-005**: Cada cita en el dashboard MUST mostrar al menos: hora, nombre del
  dueño, nombre de la mascota, servicio y estado del recordatorio.
- **FR-006**: El dashboard MUST presentar un estado vacío amistoso cuando no
  haya citas para el día, con al menos una acción guiada (crear cita o ver
  clientes).

**Gestión de clientes**

- **FR-007**: El sistema MUST permitir listar todos los clientes precargados y
  los creados durante la sesión demo.
- **FR-008**: El sistema MUST permitir crear un cliente que incluya, en una
  única acción, los datos del dueño (nombre, contacto) y de su mascota (nombre,
  raza/observaciones).
- **FR-009**: El sistema MUST permitir abrir el detalle de un cliente y ver su
  información básica junto con el historial de citas asociadas.

**Gestión de citas**

- **FR-010**: El sistema MUST permitir crear una cita seleccionando un cliente
  existente, su mascota, fecha, hora y servicio.
- **FR-011**: El sistema MUST validar que cliente, mascota, fecha, hora y
  servicio estén presentes antes de guardar una cita.
- **FR-012**: El sistema MUST advertir al usuario antes de guardar una cita con
  fecha/hora pasada y exigir confirmación explícita.
- **FR-013**: Una cita recién creada MUST aparecer en el dashboard del día
  correspondiente sin recargas manuales adicionales.

**Recordatorios simulados**

- **FR-014**: El sistema MUST permitir, desde cualquier cita, disparar la
  acción "Enviar recordatorio".
- **FR-015**: Antes de enviar, el sistema MUST mostrar una vista previa del
  mensaje que incluya nombre de la mascota, día y hora de la cita, en formato
  conversacional tipo WhatsApp.
- **FR-016**: Tras la confirmación, el sistema MUST simular el envío (sin
  integración real con WhatsApp) y actualizar el estado de la cita a
  "Recordatorio enviado" con marca de tiempo, dejando registro del mensaje en
  el historial del cliente.
- **FR-017**: El sistema MUST exigir una confirmación adicional al reenviar un
  recordatorio que ya fue marcado como enviado.

**Datos demo**

- **FR-018**: El sistema MUST contener datos ficticios precargados, realistas
  y consistentes (al menos: 8 clientes con sus mascotas, 3+ citas para el día
  actual, citas pasadas y futuras suficientes para poblar el historial).
- **FR-019**: Los datos demo MUST presentarse en español neutro y con nombres,
  razas y servicios verosímiles para el contexto de peluquería canina.

**Comportamiento general**

- **FR-020**: Toda acción crítica del flujo principal (login demo, ver agenda,
  crear cita, enviar recordatorio) MUST completarse en un máximo de 3 pasos
  visibles para el usuario.
- **FR-021**: El sistema MUST ofrecer una percepción de respuesta inmediata en
  cada acción (transiciones rápidas, sin pantallas de carga prolongadas).

### Key Entities *(include if feature involves data)*

- **Cliente**: Representa al dueño de la mascota. Atributos esenciales: nombre,
  datos de contacto (teléfono/WhatsApp). Relacionado con una o más mascotas (en
  MVP: típicamente una) y con un historial de citas.
- **Mascota**: Representa al perro atendido. Atributos: nombre, raza/notas.
  Pertenece a un Cliente.
- **Cita**: Representa el evento programado. Atributos: fecha, hora, servicio,
  estado de recordatorio (no enviado / enviado), marca de tiempo del envío.
  Relaciona Cliente + Mascota.
- **Recordatorio**: Mensaje simulado generado a partir de una Cita. Atributos:
  texto del mensaje, fecha y hora de envío simulado, cita asociada.
- **Usuario Demo**: Identidad precargada que abre la sesión sin registro. Aísla
  la experiencia por visitante para evitar interferencias.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante sin contexto previo puede explicar el propósito del
  producto y mostrar la agenda del día en menos de 2 minutos desde que abre la
  URL.
- **SC-002**: Tras pulsar "Probar demo", el dashboard con citas del día queda
  visible en menos de 2 segundos en condiciones normales.
- **SC-003**: Un usuario demo puede crear una cita completa desde el dashboard
  en 3 pasos o menos.
- **SC-004**: Un usuario demo puede disparar y completar un recordatorio
  simulado en 2 pasos o menos, viendo confirmación visible en menos de 2
  segundos.
- **SC-005**: Al menos el 80% de los visitantes que entran a la demo completan,
  en una primera sesión, los cuatro hitos del flujo principal (ver agenda, ver
  clientes, crear cita, enviar recordatorio) sin abandonar.
- **SC-006**: La demo es utilizable como herramienta de venta: un comercial
  puede recorrer una sesión completa (login demo → agenda → cliente → cita →
  recordatorio) en menos de 5 minutos sin instrucciones escritas.

## Assumptions

- **Una mascota por cliente en MVP**: La creación de cliente captura un único
  par dueño+mascota. El modelo de datos contempla 1:N a futuro, pero el flujo
  de UI asume 1:1 para mantener la simplicidad (Principio I — Simplicidad sobre
  Complejidad).
- **Servicios con sugerencias predefinidas**: El campo "servicio" admite texto
  libre con sugerencias rápidas ("Baño", "Corte", "Completo"); no hay catálogo
  configurable en el MVP.
- **Datos demo por sesión**: Cada visitante recibe una copia ephemeral del
  dataset precargado; los cambios persisten durante la sesión y se
  reinicializan al cerrar sesión o expirar la sesión.
- **Sin integración real con WhatsApp**: Conforme a la constitución
  (§Comunicación), el envío es simulado pero indistinguible de un envío real
  desde la perspectiva del usuario.
- **Sin pasarela de pagos en el MVP**: La conversión a cuenta paga se gestiona
  fuera del producto (formulario de contacto, llamada comercial); el sistema
  no integra cobros.
- **Plataforma**: Aplicación web responsive priorizando navegadores modernos en
  escritorio para la demo comercial; el soporte móvil completo es deseable pero
  no bloqueante para el MVP.
- **Idioma**: Español neutro en toda la interfaz y datos precargados.
