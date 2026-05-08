<!--
SYNC IMPACT REPORT
==================
Version change: TEMPLATE (placeholders) → 1.0.0 (initial ratification)

Modified principles: N/A (initial creation; replacing template placeholders
with four product principles defined by the project owner).

Added sections:
  - Core Principles (4 principles: Simplicidad sobre Complejidad, Valor
    Inmediato, Enfoque en Negocio Local, Automatización Útil)
  - Experiencia del Usuario (flujo principal + demo como herramienta de venta)
  - Comunicación (WhatsApp) (capacidad y reglas para el MVP)
  - Modelo de Negocio (suscripción mensual, demo → conversión)
  - Restricciones del MVP (alcance explícito y exclusiones)
  - Governance (procedimiento de enmienda, versionado, cumplimiento, Regla de Oro)

Removed sections: N/A (initial creation).

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md — "Constitution Check" placeholder is
    generic and resolved at /speckit-plan time against this file. No structural
    edits required for this initial ratification.
  - ✅ .specify/templates/spec-template.md — does not embed constitutional
    rules; no edits required.
  - ✅ .specify/templates/tasks-template.md — sample tasks already mark tests
    as OPTIONAL, which aligns with Restricción de velocidad de implementación.
    No edits required.
  - ⚠ README.md — not present at repository root; no propagation needed. If a
    README is added later, it MUST link to this constitution.

Follow-up TODOs: None. RATIFICATION_DATE = today (2026-05-08) per project owner
authoring this constitution as the initial governing document.
-->

# SaaS Peluquería Canina Constitution

## Core Principles

### I. Simplicidad sobre Complejidad
El sistema MUST poder ser usado por personas sin conocimiento técnico, sin
manuales ni capacitación previa. Toda funcionalidad nueva MUST justificar su
existencia frente al riesgo de añadir fricción al usuario final; cuando hay
duda entre simple y completo, gana simple.

**Rationale**: Las peluquerías caninas operan con personal no técnico;
cualquier complejidad innecesaria reduce la adopción y aumenta el costo de
soporte.

### II. Valor Inmediato
El usuario MUST entender el valor del sistema en menos de 2 minutos desde el
primer contacto. La pantalla inicial MUST exponer la propuesta de valor
principal (agenda, clientes, citas, recordatorios) sin pasos intermedios,
asistentes ni configuración previa obligatoria.

**Rationale**: La conversión de demo a cuenta paga depende de un "aha moment"
rápido; la fricción inicial mata la conversión.

### III. Enfoque en Negocio Local
El producto MUST priorizar las necesidades de pequeños negocios (1–5
empleados, volumen bajo a medio de citas). Características pensadas para
corporaciones (SSO empresarial, multi-tenant federado, RBAC granular,
auditoría avanzada, etc.) MUST ser rechazadas durante el MVP, salvo
justificación explícita registrada en `Complexity Tracking` del plan.

**Rationale**: Atender a corporaciones desvía el diseño y aumenta el costo
operativo sin aportar al perfil de cliente ideal (ICP) actual.

### IV. Automatización Útil
Cada feature MUST reducir tiempo manual del usuario o MUST ser eliminada del
alcance. La gestión de citas y la comunicación con clientes son los focos
prioritarios de automatización; otras automatizaciones SHOULD diferirse hasta
demostrar demanda real.

**Rationale**: La razón por la que un negocio paga una suscripción mensual es
recuperar tiempo; una feature que no automatice debe demostrar otro retorno
claro o no entra al producto.

## Experiencia del Usuario

El flujo principal MUST estar disponible en un máximo de tres niveles de
navegación e incluye, como mínimo:

- Ver agenda
- Gestionar clientes
- Crear citas
- Enviar recordatorios

La demo pública del sistema MUST cumplir:

- Acceso sin registro previo
- Datos ficticios realistas precargados (clientes, mascotas, citas, historial)
- Comportamiento idéntico al producto real desde la perspectiva del usuario
  (las acciones simuladas, cuando aplique, MUST ser indistinguibles de las
  reales)

## Comunicación (WhatsApp)

El sistema MUST exponer la capacidad de enviar recordatorios a clientes vía
WhatsApp. En el MVP:

- El envío real PUEDE ser simulado; no se requiere integración con la
  WhatsApp Business API.
- La interfaz MUST presentar la funcionalidad como si la automatización fuese
  real (composición de mensajes, programación, estados de envío).
- Cada mensaje "enviado" MUST quedar registrado en el historial del cliente
  para preservar la continuidad percibida y soportar la demo.

## Modelo de Negocio

El sistema está diseñado para comercializarse como suscripción mensual. Las
decisiones de producto MUST favorecer, en orden:

1. La conversión de visitantes de la demo a cuentas reales
2. La retención mediante valor demostrable durante el primer mes de uso
3. La velocidad de venta sobre la perfección técnica

Toda métrica de éxito definida en una `spec.md` MUST conectarse explícitamente
con al menos uno de estos objetivos.

## Restricciones del MVP

Las siguientes restricciones aplican al MVP y NO pueden ser violadas sin una
enmienda formal a esta constitución:

- El registro público NO es requerido en el MVP.
- La integración real con servicios externos (WhatsApp, pasarelas de pago,
  email transaccional) NO es requerida en el MVP; las simulaciones son
  aceptables siempre que cumplan §Comunicación.
- La velocidad de implementación MUST primar sobre la generalidad del código y
  sobre la cobertura de tests exhaustiva. Las pruebas son OPCIONALES por
  defecto y se incluyen sólo cuando la spec las solicita explícitamente.

## Governance

Esta constitución supersede cualquier otra práctica del proyecto. Toda
discrepancia entre código, plan o tasks y los principios aquí establecidos
MUST resolverse a favor de la constitución, o documentarse y justificarse en
la sección `Complexity Tracking` del plan correspondiente.

**Procedimiento de enmienda**:

1. Las enmiendas se realizan exclusivamente mediante el comando
   `/speckit-constitution`, que reescribe este archivo.
2. Cada enmienda MUST incluir un Sync Impact Report (comentario HTML al inicio
   del archivo) y propagar los cambios a plantillas dependientes
   (`plan-template.md`, `spec-template.md`, `tasks-template.md`).
3. La fecha `Last Amended` MUST actualizarse al día de la enmienda en formato
   ISO `YYYY-MM-DD`.

**Política de versionado** (Semantic Versioning):

- **MAJOR**: Eliminación o redefinición incompatible de principios o reglas de
  gobernanza.
- **MINOR**: Adición de un principio nuevo o ampliación material de una
  sección existente.
- **PATCH**: Aclaraciones, correcciones de redacción, refinamientos no
  semánticos.

**Revisión de cumplimiento**: Cada ejecución de `/speckit-plan` y
`/speckit-tasks` MUST verificar que las features propuestas cumplan los
Principios I–IV y las Restricciones del MVP. Las violaciones MUST listarse en
`Complexity Tracking` del plan con justificación explícita; sin justificación,
la feature NO procede.

**Regla de Oro**: El sistema MUST ayudar a vender antes de escalar. Frente a
cualquier disyuntiva entre escalar (performance, robustez, generalidad) y
vender (demo más convincente, conversión más rápida, valor visible más
inmediato), las decisiones MUST favorecer vender, salvo cuando exista riesgo
explícito de seguridad o pérdida de datos del usuario.

**Version**: 1.0.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-08
