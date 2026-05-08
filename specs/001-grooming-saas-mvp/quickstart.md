# Quickstart — Grooming SaaS MVP

**Audiencia**: Desarrollador trabajando en `api-micro-saas` (backend) o
`www-micro-saas` (frontend) durante el MVP.
**Objetivo**: Levantar el sistema completo en local y reproducir el flujo
"Probar demo → ver agenda → crear cita → enviar recordatorio" en menos de 10
minutos.

---

## Prerrequisitos

- Node.js 20 LTS (`node --version` ≥ 20.x)
- pnpm 9 o npm 10 (los comandos de abajo usan `npm`; sustituir si se prefiere
  pnpm)
- Docker Desktop (opcional pero recomendado para PostgreSQL local)

---

## 1) PostgreSQL local

Opción A — Docker (recomendado):

```bash
docker run --name grooming-pg \
  -e POSTGRES_USER=grooming \
  -e POSTGRES_PASSWORD=grooming \
  -e POSTGRES_DB=grooming \
  -p 5432:5432 -d postgres:16
```

Opción B — Postgres local instalado: crear DB `grooming` y usuario equivalente.

---

## 2) Backend (`api-micro-saas`, este repo)

> **Nota**: el repo está vacío al inicio. La primera tarea de `tasks.md`
> ejecuta `nest new .` para inicializar NestJS en sitio (sin crear
> subcarpeta).

```bash
# Una sola vez, desde la raíz de api-micro-saas (repo vacío):
npx @nestjs/cli new . --package-manager npm --skip-git

# Instalar deps adicionales del MVP
npm install --save \
  @nestjs/typeorm typeorm pg \
  @nestjs/config @nestjs/jwt passport passport-jwt \
  class-validator class-transformer \
  @nestjs/schedule
npm install --save-dev @types/passport-jwt

# Variables de entorno (crea .env si no existe)
cat > .env <<'EOF'
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=grooming
DATABASE_PASSWORD=grooming
DATABASE_NAME=grooming
JWT_SECRET=dev-only-do-not-use-in-prod
JWT_EXPIRES_IN=24h
DEMO_TENANT_TTL_HOURS=24
PORT=3001
CORS_ORIGIN=http://localhost:3000
EOF

# Generar y aplicar migración inicial (después de definir entidades)
npm run migration:generate -- src/database/migrations/Init
npm run migration:run

# Levantar el backend en modo desarrollo
npm run start:dev
```

Backend escuchando en `http://localhost:3001`. Healthcheck:

```bash
curl -s http://localhost:3001/health
```

---

## 3) Frontend (`www-micro-saas`, repo separado)

En otro clon:

```bash
git clone <url-www-micro-saas> www-micro-saas
cd www-micro-saas
npm install

cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
EOF

npm run dev
```

Frontend en `http://localhost:3000`.

---

## 4) Smoke test del flujo de demo

1. **Probar demo**: abrir [http://localhost:3000](http://localhost:3000) y
   pulsar "Probar demo".
   - Esperado: redirección a `/dashboard` con la agenda del día y al menos 3
     citas precargadas con clientes y mascotas verosímiles.
   - Valida: SC-002 (dashboard < 2 s), FR-004, FR-005.

2. **Ver clientes**: navegar a "Clientes".
   - Esperado: lista con nombres de dueños, mascotas y contactos.
   - Valida: FR-007.

3. **Crear cita**: pulsar "Nueva cita", seleccionar cliente, mascota, fecha y
   hora futuras, servicio "Baño", guardar.
   - Esperado: la cita aparece en el dashboard si la fecha es hoy.
   - Valida: FR-010, FR-013, US3.

4. **Enviar recordatorio**: en una cita del dashboard, pulsar "Enviar
   recordatorio".
   - Esperado: vista previa del mensaje con texto tipo
     `"Hola, Luna tiene Baño hoy a las 3pm 🐶"`. Confirmar envío. La cita pasa
     a estado "Recordatorio enviado".
   - Valida: FR-014–FR-016, US2, SC-004.

5. **Reset demo**: cerrar sesión.
   - Esperado: al volver a "Probar demo", se genera un tenant nuevo con datos
     limpios (los cambios anteriores no son visibles).
   - Valida: FR-002, FR-003, Assumption "datos demo por sesión".

---

## 5) Smoke directo contra la API (sin frontend)

```bash
# Login demo (sin credenciales)
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' -d '{"mode":"demo"}' \
  | jq -r .accessToken)

# Listar citas del día
curl -s http://localhost:3001/appointments \
  -H "Authorization: Bearer $TOKEN" | jq

# Enviar recordatorio simulado
APPT_ID=$(curl -s http://localhost:3001/appointments \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[0].id')
curl -s -X POST http://localhost:3001/notifications/reminder \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"appointmentId\":\"$APPT_ID\"}" | jq
```

---

## 6) Operaciones útiles

| Necesidad | Comando |
|-----------|---------|
| Resetear DB local | `docker exec -i grooming-pg psql -U grooming -d grooming -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'` y volver a correr `npm run migration:run` |
| Generar nueva migración a partir de cambios en entidades | `npm run migration:generate -- src/database/migrations/<NombreCambio>` |
| Aplicar migraciones pendientes | `npm run migration:run` |
| Revertir la última migración | `npm run migration:revert` |
| Inspeccionar la DB visualmente | `pgcli postgres://grooming:grooming@localhost:5432/grooming` o pgAdmin |
| Ejecutar el cleanup de tenants demo manualmente | (TBD en `/speckit-tasks`; endpoint de admin o script) |

---

## Troubleshooting

- **"Cannot connect to database"**: verifica que el contenedor Docker esté
  corriendo (`docker ps`) y que `DATABASE_URL` apunte al puerto correcto.
- **JWT inválido tras "Probar demo"**: el frontend probablemente está
  cacheando un JWT de un tenant ya borrado por el cron de cleanup. Cerrar
  sesión y reintentar.
- **CORS bloquea el frontend**: el backend debe permitir el origen
  `CORS_ORIGIN` (por defecto `http://localhost:3000`); ver `main.ts`.
- **`migration:generate` no detecta cambios**: TypeORM sólo genera
  diferencias contra la DB conectada. Asegúrate de que las migraciones
  previas estén corridas (`npm run migration:run`) antes de generar otra.
