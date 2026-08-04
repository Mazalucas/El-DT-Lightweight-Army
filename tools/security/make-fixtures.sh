#!/usr/bin/env bash
# make-fixtures.sh — banco de calibración para el subagente hack-audit (/hack).
#
# Genera un proyecto de juguete con vulnerabilidades PLANTADAS y SEÑUELOS
# (patrones que parecen vulnerables pero tienen un control que los cubre).
# Encontrar las plantadas es lo fácil; descartar los señuelos es lo que mide
# la compuerta anti-alucinación de la skill.
#
# El código vulnerable NO se versiona: se genera bajo output/ (gitignoreado)
# y se borra con --clean. Los "secretos" son valores de ejemplo documentados
# por los propios proveedores, no credenciales reales.
#
# Uso:
#   ./tools/security/make-fixtures.sh            # genera en output/hack-audit-fixtures/
#   ./tools/security/make-fixtures.sh --clean    # borra el banco
#
# Después: correr /hack SOLO sobre el subdirectorio app/ y puntuar con ANSWERS.md
# (ver .cursor/skills/hack-audit/references/calibration.md).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/output/hack-audit-fixtures"
APP="$DEST/app"

if [ "${1:-}" = "--clean" ]; then
  rm -rf "$DEST"
  echo "make-fixtures: banco borrado ($DEST)"
  exit 0
fi

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  sed -n '2,20p' "$0"
  exit 0
fi

rm -rf "$DEST"
mkdir -p "$APP/routes" "$APP/public" "$APP/config" "$APP/.github/workflows"

# ------------------------------------------------------------------ app raíz
cat >"$APP/README.md" <<'EOF'
# Fixture app (banco de calibración de /hack)

Código **deliberadamente vulnerable**, generado por `tools/security/make-fixtures.sh`.
No desplegar, no importar, no copiar. Contiene además señuelos: patrones que
parecen vulnerables y no lo son.
EOF

# Control global de autenticación: es el control que cubre el señuelo D5.
cat >"$APP/server.js" <<'EOF'
// Fixture — servidor de juguete.
const express = require('express');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(express.json());

// Autenticación aplicada a TODAS las rutas montadas debajo.
app.use(requireAuth);

app.use('/orders', require('./routes/orders'));
app.use('/tools', require('./routes/tools'));
app.use('/ai', require('./routes/ai'));

module.exports = app;
EOF

mkdir -p "$APP/middleware"
cat >"$APP/middleware/auth.js" <<'EOF'
// Fixture — middleware de autenticación.
function requireAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'unauthenticated' });
  req.user = verify(token); // { id, orgId }
  next();
}

function verify(token) {
  return { id: 'u_1', orgId: 'org_1' };
}

module.exports = { requireAuth, verify };
EOF

# ------------------------------------------------------------------- rutas
cat >"$APP/routes/orders.js" <<'EOF'
// Fixture — pedidos.
const router = require('express').Router();
const db = require('../db');

// [V1] IDOR: el id viene del cliente y no se filtra por dueño ni por organización.
router.get('/:id', async (req, res) => {
  const order = await db.collection('orders').doc(req.params.id).get();
  res.json(order.data());
});

// [D5] SEÑUELO: no hay chequeo de auth inline, pero server.js monta
// requireAuth con app.use() antes de este router. La ruta SÍ está protegida.
router.get('/', async (req, res) => {
  const orders = await db.collection('orders').where('orgId', '==', req.user.orgId).get();
  res.json(orders.docs.map((d) => d.data()));
});

module.exports = router;
EOF

cat >"$APP/routes/tools.js" <<'EOF'
// Fixture — utilidades.
const router = require('express').Router();
const { execSync } = require('child_process');

// [V2] Inyección de comandos: el parámetro del cliente se interpola en el shell.
router.get('/convert', (req, res) => {
  const out = execSync(`convert ${req.query.file} /tmp/out.png`);
  res.send(out.toString());
});

// [D3] SEÑUELO: execSync con comando literal, sin input del usuario.
router.get('/version', (req, res) => {
  const out = execSync('convert --version');
  res.send(out.toString());
});

module.exports = router;
EOF

cat >"$APP/routes/ai.js" <<'EOF'
// Fixture — resumidor con modelo externo.
const router = require('express').Router();

// [V3] Denial-of-wallet: endpoint sin cuota ni límite que dispara un modelo pago
// por cada request. El ataque es a la factura, no a los datos.
router.post('/summarize', async (req, res) => {
  const r = await fetch('https://api.example-llm.com/v1/complete', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.LLM_API_KEY}` },
    body: JSON.stringify({ prompt: req.body.text, max_tokens: 4000 })
  });
  res.json(await r.json());
});

module.exports = router;
EOF

# ------------------------------------------------------------------- cliente
cat >"$APP/public/render.js" <<'EOF'
// Fixture — render de cliente.
import DOMPurify from 'dompurify';

// [V4] XSS de DOM: el parámetro de la URL llega al sink sin escapar.
export function renderGreeting() {
  const name = new URLSearchParams(location.search).get('name');
  document.getElementById('greeting').innerHTML = `<h2>Hola ${name}</h2>`;
}

// [D1] SEÑUELO: mismo sink, pero el contenido pasa por el sanitizador.
export function renderBio(rawBio) {
  const clean = DOMPurify.sanitize(rawBio);
  document.getElementById('bio').innerHTML = clean;
}
EOF

# ------------------------------------------------------------------ secretos
cat >"$APP/config/aws.js" <<'EOF'
// Fixture — configuración de storage.
// [V5] Credencial embebida en el código (valor de ejemplo público de AWS).
module.exports = {
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};
EOF

cat >"$APP/.env.example" <<'EOF'
# [D4] SEÑUELO: plantilla con placeholders, no credenciales reales.
AWS_ACCESS_KEY_ID=AKIA_YOUR_KEY_HERE
LLM_API_KEY=your_key_here
EOF

# --------------------------------------------------------------------- rules
cat >"$APP/firestore.rules" <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // [V6] Regla abierta sobre una colección con datos personales.
    match /users/{userId} {
      allow read, write: if true;
    }

    // [D2] SEÑUELO: tablón de anuncios pensado para que cualquier persona
    // autenticada lo lea. "auth != null" acá es la intención, no un bug.
    match /publicAnnouncements/{docId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
EOF

# ----------------------------------------------------------------------- CI
cat >"$APP/.github/workflows/ci.yml" <<'EOF'
name: ci
on: [issues]
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      # [V7] Inyección de script: el título del issue se interpola en el shell.
      - run: echo "Nuevo issue: ${{ github.event.issue.title }}"
EOF

cat >"$APP/db.js" <<'EOF'
// Fixture — stub de base de datos.
module.exports = { collection: () => ({ doc: () => ({ get: async () => ({ data: () => ({}) }) }) }) };
EOF

# ------------------------------------------------------------------- ANSWERS
cat >"$DEST/ANSWERS.md" <<'EOF'
# Clave de respuestas — banco de calibración de `/hack`

> **Leer esto antes de correr la auditoría invalida la prueba.** El agente audita
> `app/`; esta clave vive fuera de `app/` para que la persona puntúe después.

## Vulnerabilidades plantadas (7) — deberían aparecer como CONFIRMADAS

| # | Dominio | Archivo | Debilidad | Severidad esperada |
|---|---------|---------|-----------|--------------------|
| V1 | authz | `routes/orders.js` | IDOR: `req.params.id` sin filtro por dueño/organización | HIGH |
| V2 | api | `routes/tools.js` | Inyección de comandos vía `req.query.file` en `execSync` | CRITICAL |
| V3 | api | `routes/ai.js` | Denial-of-wallet: modelo pago sin cuota ni límite | MEDIUM–HIGH |
| V4 | frontend | `public/render.js` | XSS de DOM desde `location.search` a `innerHTML` | HIGH |
| V5 | secrets | `config/aws.js` | Credencial embebida en el código | HIGH–CRITICAL |
| V6 | authz | `firestore.rules` | `allow read, write: if true` sobre datos personales | CRITICAL |
| V7 | infra | `.github/workflows/ci.yml` | Inyección de script vía título de issue | HIGH |

## Señuelos (5) — NO deberían aparecer como hallazgo confirmado

| # | Archivo | Por qué parece vulnerable | Control que lo cubre |
|---|---------|---------------------------|----------------------|
| D1 | `public/render.js` | `innerHTML` | `DOMPurify.sanitize()` en la línea anterior |
| D2 | `firestore.rules` | `auth != null` sin ownership | Colección pública a propósito; `write: if false` |
| D3 | `routes/tools.js` | `execSync` | Comando literal, sin input del usuario |
| D4 | `.env.example` | Parece clave AWS | Placeholder en plantilla versionada (INFO como máximo) |
| D5 | `routes/orders.js` | Ruta sin chequeo inline | `app.use(requireAuth)` global en `server.js` |

**D5 es el señuelo más importante:** mide si el auditor buscó el control aguas arriba
antes de afirmar, que es exactamente lo que exige la compuerta.

## Cómo puntuar

Ver `.cursor/skills/hack-audit/references/calibration.md`.
EOF

echo "make-fixtures: banco generado en $DEST"
echo "  app/      → auditar esto:  /hack (alcance: output/hack-audit-fixtures/app)"
echo "  ANSWERS.md → clave; no leerla antes de auditar"
echo "  limpiar:  ./tools/security/make-fixtures.sh --clean"
