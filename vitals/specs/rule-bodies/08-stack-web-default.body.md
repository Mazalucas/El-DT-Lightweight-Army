# Stack web canónico (Firebase + Node)

Fuente de datos: `vitals/data/engineering/web-stack.yaml`. Override local opcional: `.agents/engineering-stack.md`.

## Cuándo aplica

Activar esta regla cuando el pedido implique **desarrollo web** o arquitectura de producto web:

- App web, SPA, dashboard, admin panel
- Landing con backend o autenticación
- API REST/HTTP para cliente web o mobile
- MVP, PRD o SRD con componente técnico web
- Deploy, auth, base de datos o hosting para producto web

**No aplica** como stack DB/backend cuando: solo diseño Atelier sin implementación; video Remotion; tareas puramente de docs/marketing sin código.

## Precedencia (soft default)

Resolver en este orden (mayor prioridad primero):

1. **Opt-out explícito del usuario** — respeta la elección; documenta trade-offs si difiere del default.
2. **Stack del repo existente** — inspeccionar señales antes de proponer migración:
   - `firebase.json`, `firestore.rules`, `firestore.indexes.json`
   - `package.json` (dependencias `firebase`, `vite`, `react`)
   - `requirements.txt`, `go.mod`, `Cargo.toml`, `docker-compose` con Postgres/MySQL
   - README o docs de arquitectura del proyecto
3. **`.agents/engineering-stack.md`** — si existe, usar como stack confirmado del proyecto.
4. **Default DT** — `web-stack.yaml`: Node + Firebase completo; frontend Vite + React.

Si el repo ya tiene stack claro distinto (p. ej. Python/Django + Postgres), **respetarlo**. Mencionar el default DT solo como nota, no empujar migración.

## Stack default (proyecto nuevo o ambiguo)

| Capa | Default |
|------|---------|
| Runtime | Node.js LTS |
| Auth | Firebase Auth |
| Base de datos | Firestore |
| Backend/API | Cloud Functions for Firebase (Node) |
| Hosting | Firebase Hosting / App Hosting |
| Archivos | Cloud Storage |
| Secrets | Firebase Secrets |
| Frontend | Vite + React (Firebase JS SDK modular v9+) |

**Alternativas** (Supabase, Postgres, Python, etc.): solo proponer con trade-offs explícitos y **después** de opt-out del usuario o cuando el repo ya las usa.

## Escalation path

- **Cloud Run + Firestore**: workers pesados o APIs de larga duración — sigue siendo Firebase-friendly.
- **SQL relacional**: solo con opt-out explícito; documentar por qué Firestore no alcanza.

## Excepciones

- **Atelier ecosystem lock** (Shopify, Atlassian, Microsoft): lock-in de UI prevalece; backend sigue default salvo contra-indicación.
- **Remotion**: React programático para video; no exige backend Firebase.

## Al planificar

Antes de delegar desarrollo web:

1. Leer `web-stack.yaml` y detectar stack del repo.
2. Decidir stack objetivo según precedencia.
3. Mencionar stack en el plan al usuario (1–2 líneas).

## Al delegar subagentes

Incluir **obligatoriamente** en el prompt a `arquitecto`, `frontend`, `devops`, `srd-creator`, `development-planner` y roles afines:

```text
Bloque stack web:
- Modo: soft_default
- Stack objetivo: [Node + Firebase / stack detectado en repo]
- Firebase: Auth, Firestore, Functions, Hosting, Storage (según aplique)
- Frontend: Vite + React (default) o [detectado]
- Fuente: vitals/data/engineering/web-stack.yaml
- Respetar stack existente del repo si difiere
```

Usar el `delegation_snippet` del YAML como base.

## Referencia humana

`docs/03_reference/web-stack-default.md` (`DOC-REF-005`).
