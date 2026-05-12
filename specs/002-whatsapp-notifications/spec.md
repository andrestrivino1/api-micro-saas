# Feature Specification: Recordatorios WhatsApp por deep-link + Edición completa

**Feature Branch**: `002-whatsapp-notifications`
**Created**: 2026-05-11
**Status**: Draft
**Input**: User description: "ayudame a implementar whatsapp para el envio de notificaciones. ayudame con el paso a paso" + decisiones posteriores: usar deep-link `wa.me` (no Cloud API), ampliar demo a edición/eliminación completa, mantener todas las funciones disponibles en el MVP para uso del fundador como herramienta de venta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Recordatorio WhatsApp con un clic vía enlace directo (Priority: P1)

El dueño de una peluquería abre una cita del dashboard, pulsa "Enviar
recordatorio", revisa la vista previa del mensaje y confirma. Una nueva
ventana abre **su propio WhatsApp** (Web o móvil) con el chat del cliente ya
seleccionado y el mensaje pre-escrito. Pulsa Enviar en WhatsApp y el cliente
recibe el recordatorio desde el número personal/comercial habitual del
negocio. El sistema marca la cita como "Recordatorio enviado" con marca de
tiempo. Si el cliente responde, la respuesta llega directamente al WhatsApp
del dueño (no a la app).

**Why this priority**: Es la funcionalidad central que cierra el MVP comercial
y permite vender. Sin envío real, el producto sólo es agenda. Con esta
historia el fundador puede demostrar el flujo completo en una sesión de
venta — un clic, abre WhatsApp, mensaje listo — sin necesidad de pagar API,
configurar plantillas ni gestionar opt-in. Coste cero, fricción mínima, valor
inmediatamente perceptible.

**Independent Test**: Con cualquier cita del dashboard que tenga cliente con
teléfono válido, pulsar "Enviar recordatorio", verificar que (a) se muestra
una vista previa coherente con la cita, (b) al confirmar se abre WhatsApp con
el chat correcto y el texto correcto, (c) la cita queda marcada como enviada
con marca de tiempo, y (d) el historial del cliente registra el evento.

**Acceptance Scenarios**:

1. **Given** una cita con cliente con teléfono válido, **When** el usuario
   pulsa "Enviar recordatorio" y confirma, **Then** se abre una nueva pestaña
   con WhatsApp Web/app del usuario, con el chat del cliente seleccionado y el
   mensaje pre-cargado.
2. **Given** que se abrió WhatsApp con el mensaje cargado, **When** el sistema
   regresa al dashboard, **Then** la cita aparece marcada como "Recordatorio
   enviado" con la marca de tiempo del momento en que se abrió WhatsApp.
3. **Given** un cliente sin número de teléfono o con número en formato
   inválido, **When** el usuario intenta enviar el recordatorio, **Then** la
   acción se bloquea con un mensaje claro que enlaza a editar el cliente.
4. **Given** una cita con recordatorio ya enviado, **When** el usuario pulsa
   nuevamente "Enviar recordatorio", **Then** el sistema pide confirmación
   adicional ("ya fue enviado, ¿reenviar?") antes de reabrir WhatsApp.

---

### User Story 2 — Edición completa de clientes y mascotas (Priority: P1)

Desde el detalle de un cliente, el dueño puede editar el nombre del dueño, el
teléfono, el nombre de la mascota y sus notas (raza, observaciones). Los
cambios se reflejan inmediatamente en el dashboard, en futuras citas y en la
vista previa del recordatorio.

**Why this priority**: La demo se vuelve **mucho más vendible** cuando el
prospecto puede modificar los datos a su gusto durante el pitch — "ponle el
nombre de tu peluquería, el de tu cliente real, el nombre de mi perro" — y
ver que todo se actualiza incluido el texto del recordatorio. Sin edición, la
demo se siente rígida y "de demo". Igual de crítico para tenants reales que
necesitan corregir datos.

**Independent Test**: Abrir el detalle de cualquier cliente, modificar uno de
los campos (nombre, teléfono, mascota, notas), guardar, y verificar que (a)
los cambios se reflejan en la lista de clientes, (b) las citas asociadas
muestran los datos nuevos, (c) la vista previa del recordatorio usa los
nuevos datos.

**Acceptance Scenarios**:

1. **Given** un cliente en pantalla de detalle, **When** el usuario modifica
   nombre, teléfono o datos de la mascota y guarda, **Then** los cambios
   persisten en la sesión y se reflejan en el dashboard, listas y vistas
   previas de recordatorios.
2. **Given** un cliente abierto en edición, **When** el usuario deja vacío un
   campo obligatorio (nombre del dueño, nombre de la mascota), **Then** el
   sistema impide guardar y señala el campo.
3. **Given** un cliente con citas futuras, **When** el usuario cambia su
   teléfono, **Then** las citas futuras del cliente, al disparar el
   recordatorio, usan el teléfono actualizado.

---

### User Story 3 — Edición completa de citas (Priority: P1)

Desde una cita del dashboard, el dueño puede modificar fecha, hora, servicio
y/o cliente asociado. La cita se reordena en el dashboard automáticamente y
el estado del recordatorio se reinicia si la cita cambia de día o de cliente.

**Why this priority**: Cancelaciones, reagendamientos y cambios de servicio
son lo más frecuente en una peluquería. Sin edición la herramienta se
descarta tras la primera semana de uso. También indispensable en la demo
para que el prospecto pueda "mover una cita a mañana" y ver el texto del
recordatorio actualizarse.

**Independent Test**: Abrir una cita en edición, cambiar la hora a +2 horas,
guardar, y verificar que (a) la cita aparece reordenada en el dashboard, (b)
la vista previa del recordatorio refleja la nueva hora, (c) si la cita estaba
marcada como "recordatorio enviado", el estado se reinicia o se notifica.

**Acceptance Scenarios**:

1. **Given** una cita en el dashboard, **When** el usuario la abre en edición,
   cambia fecha/hora/servicio/cliente y guarda, **Then** la cita aparece con
   los nuevos datos en el dashboard del día correspondiente.
2. **Given** una cita con "Recordatorio enviado", **When** el usuario cambia
   la fecha o el cliente, **Then** el sistema advierte que el recordatorio
   previo ya no aplica y reinicia el estado a "pendiente".
3. **Given** una cita en edición, **When** el usuario elige una fecha pasada,
   **Then** el sistema pide confirmación explícita igual que al crear (FR-012
   de spec 001).

---

### User Story 4 — Eliminación de clientes y citas con confirmación (Priority: P2)

El dueño puede eliminar una cita o un cliente desde su pantalla de detalle,
siempre con una confirmación explícita que describe el efecto (incluyendo
mascotas y citas asociadas en el caso del cliente).

**Why this priority**: Es necesario para mantener la lista limpia y para que
la demo sea "manipulable de verdad". Es P2 porque la inconveniencia de no
poder borrar es menor que la de no poder editar (crear → editar > crear →
borrar en uso real).

**Independent Test**: Eliminar una cita desde su detalle, confirmar, y
verificar que ya no aparece en el dashboard. Eliminar un cliente sin citas,
confirmar, y verificar que desaparece de la lista. Intentar eliminar un
cliente con citas pendientes, confirmar, y verificar que el sistema avisa
del efecto sobre las citas y permite proceder.

**Acceptance Scenarios**:

1. **Given** una cita en el dashboard, **When** el usuario pulsa "Eliminar" y
   confirma, **Then** la cita desaparece del dashboard y del historial de la
   cita activa (queda registrada como eliminada para auditoría interna).
2. **Given** un cliente sin citas futuras, **When** el usuario pulsa
   "Eliminar" y confirma, **Then** el cliente y su(s) mascota(s) desaparecen
   de las listas.
3. **Given** un cliente con citas futuras, **When** el usuario pulsa
   "Eliminar", **Then** el sistema muestra una advertencia que enumera las
   citas afectadas y exige confirmación explícita antes de borrar todo.

---

### User Story 5 — Personalización del mensaje antes de enviar (Priority: P3)

Antes de abrir WhatsApp, el dueño puede ajustar el texto del recordatorio (p.
ej. agregar "tráeme su correa", cambiar "Luna" por un apodo, etc.) en la
misma vista previa. El sistema usa el texto editado al construir el deep-link.

**Why this priority**: El mensaje por defecto cubre el 90% de los casos, pero
permitir personalización rápida quita fricción y refuerza la sensación de
control. Es P3 porque puede diferirse: el texto por defecto ya es válido.

**Independent Test**: Abrir la vista previa de un recordatorio, editar el
texto, confirmar y verificar que WhatsApp se abre con el texto editado (no el
por defecto).

**Acceptance Scenarios**:

1. **Given** una vista previa de recordatorio abierta, **When** el usuario
   edita el texto y confirma, **Then** el deep-link de WhatsApp usa el texto
   editado.
2. **Given** una vista previa editada, **When** el usuario pulsa "Restaurar
   por defecto", **Then** el texto vuelve a la plantilla original con los
   datos de la cita.

---

### Edge Cases

- **Teléfono sin código de país**: El sistema normaliza al formato
  internacional (E.164) asumiendo el país por defecto del tenant (Colombia
  +57 por defecto en MVP); si no puede normalizar, bloquea con mensaje
  accionable.
- **Cliente sin teléfono**: El botón "Enviar recordatorio" se muestra
  deshabilitado con tooltip explicativo y enlace a editar el cliente.
- **WhatsApp no instalado en el dispositivo**: El deep-link `wa.me` siempre
  redirige a la versión Web; si el navegador no permite popups, el sistema
  muestra una alternativa "Copiar enlace" o "Copiar mensaje" para el dueño.
- **Cliente bloqueó al dueño en WhatsApp**: WhatsApp muestra error al enviar;
  el sistema NO lo sabe (no hay webhook). El estado en la app queda como
  "Enviado" optimista; el dueño debe corregir manualmente si detecta el
  bloqueo.
- **Sesión demo y datos persistentes**: En la demo, todas las ediciones,
  creaciones y eliminaciones persisten durante la sesión y se reinicializan
  al cerrar sesión o expirar (consistente con FR-002/Assumptions de spec
  001).
- **Doble clic en "Enviar recordatorio"**: El sistema deshabilita el botón
  durante 5 segundos tras el primer clic para evitar abrir WhatsApp dos veces.
- **Cliente eliminado tras envío de recordatorio**: La notificación conserva
  la marca de tiempo y el texto enviado; la referencia al cliente queda como
  "[Cliente eliminado]" en el historial.
- **Cita movida después de enviar recordatorio**: Si el dueño cambia la hora
  tras haber abierto WhatsApp, el sistema reinicia el estado a "pendiente" y
  pide nuevo envío.

## Requirements *(mandatory)*

### Functional Requirements

**Generación del deep-link de WhatsApp**

- **FR-001**: El sistema MUST exponer una acción "Enviar recordatorio" en
  cada cita del dashboard y del detalle de cita.
- **FR-002**: Al disparar la acción, el sistema MUST mostrar una vista previa
  del mensaje generado a partir de la cita (nombre de mascota, día, hora,
  servicio), igual a la del MVP simulado (consistencia visual con spec 001).
- **FR-003**: Al confirmar la vista previa, el sistema MUST construir un URL
  con el formato estándar `https://wa.me/<telefono_e164>?text=<mensaje_url_encoded>`
  y abrirlo en una pestaña/ventana nueva.
- **FR-004**: El sistema MUST normalizar el teléfono del cliente a formato
  internacional E.164 antes de incluirlo en el URL, asumiendo el país por
  defecto del tenant (Colombia/+57 en MVP) cuando falte el código.
- **FR-005**: Si el teléfono no puede normalizarse a un formato válido, el
  sistema MUST bloquear la acción y mostrar un mensaje accionable con enlace
  a editar el cliente.

**Estado del envío (envío optimista)**

- **FR-006**: Tras abrir el deep-link, el sistema MUST marcar la cita
  inmediatamente como "Recordatorio enviado" con marca de tiempo, sin
  esperar confirmación externa (no es posible obtenerla con deep-link).
- **FR-007**: El sistema MUST registrar la notificación en el historial del
  cliente con: canal `whatsapp_link`, texto enviado, marca de tiempo, usuario
  que disparó la acción.
- **FR-008**: El sistema MUST permitir reenviar un recordatorio (reabrir el
  deep-link y crear un nuevo registro), exigiendo confirmación adicional si
  ya existe un envío previo para la misma cita.
- **FR-009**: Si la cita se modifica (fecha, hora, cliente) después de un
  envío, el sistema MUST reiniciar el estado del recordatorio a "pendiente" y
  conservar el envío previo en el historial.

**Personalización del mensaje (P3)**

- **FR-010**: El sistema MUST permitir al usuario editar el texto del mensaje
  en la vista previa antes de abrir WhatsApp.
- **FR-011**: El sistema MUST ofrecer una opción "Restaurar texto por
  defecto" que regenera el texto desde la plantilla del sistema.

**Alternativas si no se puede abrir WhatsApp**

- **FR-012**: Si el navegador bloquea la apertura del deep-link, el sistema
  MUST ofrecer un fallback "Copiar mensaje" y "Copiar enlace" en la misma
  vista previa, con un toast confirmando la copia.

**Edición de clientes y mascotas**

- **FR-013**: El sistema MUST permitir editar, desde el detalle de un
  cliente, los campos: nombre del dueño, teléfono, nombre de la mascota,
  notas/raza.
- **FR-014**: La edición de cliente MUST validar que nombre del dueño y
  nombre de la mascota no queden vacíos.
- **FR-015**: Los cambios en cliente o mascota MUST reflejarse inmediatamente
  en el dashboard, en las citas asociadas y en la vista previa de los
  recordatorios.

**Edición de citas**

- **FR-016**: El sistema MUST permitir editar, desde el detalle de una cita,
  los campos: fecha, hora, servicio, cliente asociado (incluida su mascota).
- **FR-017**: La edición de cita MUST aplicar las mismas validaciones que la
  creación (FR-011 y FR-012 de spec 001).
- **FR-018**: Si se edita una cita con recordatorio ya enviado y se cambia
  fecha o cliente, el sistema MUST reiniciar el estado del recordatorio a
  "pendiente" y notificarlo al usuario.

**Eliminación con confirmación**

- **FR-019**: El sistema MUST permitir eliminar una cita desde su detalle,
  con confirmación explícita ("¿Seguro?").
- **FR-020**: El sistema MUST permitir eliminar un cliente desde su detalle,
  con confirmación explícita que enumere las citas afectadas si existen.
- **FR-021**: La eliminación MUST eliminar también las mascotas asociadas al
  cliente (cascada explícita anunciada al usuario).

**Disponibilidad universal (demo + producción)**

- **FR-022**: TODAS las funcionalidades de esta feature (envío, edición,
  eliminación, personalización) MUST estar disponibles tanto en la sesión
  demo como en la producción real, sin distinción de modo.
- **FR-023**: En la demo, las ediciones y eliminaciones MUST persistir
  durante la sesión y reinicializarse al cerrar sesión o expirar (consistente
  con Assumptions de spec 001).

### Key Entities *(include if feature involves data)*

- **Notificación (extensión de la entidad existente)**: Se amplía con: canal
  `whatsapp_link` (además del `whatsapp_simulated` histórico), texto
  efectivamente enviado (post-personalización), usuario disparador, marca de
  tiempo de apertura del deep-link. NO almacena id externo ni estado de
  entrega (no son obtenibles vía deep-link).
- **Cliente (extensión)**: Se le agregan operaciones de edición y eliminación
  (PATCH/DELETE). Atributos existentes sin cambio.
- **Cita (extensión)**: Se le agregan operaciones de edición y eliminación.
  Estado del recordatorio puede ahora reiniciarse a "pendiente" cuando los
  datos cambian.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde el dashboard, el dueño puede preparar y disparar un
  recordatorio WhatsApp en **2 clics** (botón → confirmar vista previa).
- **SC-002**: Una vez WhatsApp Web está abierto, el envío real del mensaje al
  cliente toma **un único clic adicional** dentro de WhatsApp.
- **SC-003**: El coste por mensaje enviado para el SaaS y para el tenant es
  **USD $0** (sin proveedor pago intermedio).
- **SC-004**: En una demo de 5 minutos, un prospecto puede crear su propia
  cita con su nombre y su teléfono, editarla, dispararle un recordatorio y
  ver el mensaje en su propio WhatsApp.
- **SC-005**: El fundador, usando el MVP como herramienta de venta, puede
  ejecutar el flujo completo (login → ver agenda → crear/editar cita →
  recordatorio WhatsApp abierto) en menos de **2 minutos** sin guía escrita.
- **SC-006**: El 100% de las modificaciones (crear, editar, eliminar)
  realizadas durante una sesión demo se reflejan en pantalla en **menos de 1
  segundo**.
- **SC-007**: Tras desplegar esta feature, el flujo de demo de spec 001
  sigue funcionando sin regresiones visuales perceptibles (medida
  cualitativa con 3 testers).

## Assumptions

- **Canal único: WhatsApp deep-link**. No se integra Cloud API, BSP, ni
  ningún otro proveedor pago en el MVP. La automatización es semi-manual
  (un clic del dueño en WhatsApp para confirmar el envío real).
- **El dueño usa su WhatsApp habitual**. El número de WhatsApp no se
  registra en la app: cada usuario pulsa el botón desde un dispositivo donde
  ya está logueado en WhatsApp Web o WhatsApp móvil. Las respuestas del
  cliente llegan a su WhatsApp habitual sin ningún ruteo intermedio.
- **País por defecto Colombia (+57)**. Para normalizar teléfonos sin código
  de país, se asume +57 en el MVP. El soporte multi-país es post-MVP.
- **Sin opt-in formal**. El "consentimiento" se considera implícito porque es
  el dueño quien pulsa el botón final dentro de su propio WhatsApp; no hay
  envío masivo automático ni mensajes salientes desde la infraestructura del
  SaaS. Esto difiere de un canal API (que sí requeriría opt-in formal).
- **Sin webhooks ni confirmación de entrega**. El estado "Recordatorio
  enviado" se marca optimísticamente al abrir WhatsApp. La app no puede saber
  si el dueño efectivamente pulsó Enviar dentro de WhatsApp ni si el cliente
  recibió/leyó el mensaje. Esto es aceptable porque (a) el coste de un envío
  fallido es bajo (el dueño lo nota y reintenta), y (b) un canal API queda
  como upgrade futuro.
- **Universalidad de funciones**. Todas las funcionalidades del MVP están
  disponibles para todos los usuarios — demo y tenants reales — sin gating
  por plan. El fundador usa el mismo producto que el cliente final, lo que
  le permite demostrar el valor real en vivo durante el pitch comercial.
- **Plantilla de mensaje único en MVP**. El texto por defecto del
  recordatorio se mantiene de spec 001 ("Hola, {mascota} tiene {servicio}
  {cuándo}"). La personalización es a nivel de cita (P3), no a nivel de
  plantilla configurable por tenant.
- **Migración de notificaciones existentes**. Las notificaciones registradas
  con `whatsapp_simulated` durante spec 001 se conservan tal cual; las nuevas
  se etiquetan como `whatsapp_link`.
- **Cuenta del fundador como tenant real**. Se asume que el fundador usa la
  app como un tenant real (no demo) para que sus datos persistan entre
  sesiones de venta. El mecanismo concreto de creación de su tenant (seed
  script, env var, magic-link) se resuelve en `plan.md`; queda fuera del
  alcance del spec.
