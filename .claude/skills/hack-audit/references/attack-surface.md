# Recetas de caza por dominio

Cómo cazar en **este** repo, no qué dice OWASP. Cada dominio trae recetas ejecutables y los controles que hay que descartar antes de afirmar un hallazgo.

Ajustar los comandos al stack real (`rg` si está disponible, `grep -rn` si no).

---

## §0 Orden de evidencia (reuse-first, regla `15`)

1. **Scanners del propio proyecto** — buscar antes de traer nada nuevo: scripts en `package.json` (`lint:security`, `audit`), configs de `semgrep`/`gitleaks`/`trivy`, hooks de pre-commit, tests de reglas en el emulador.
2. **`tools/security/scan-repo.sh`** — pasada determinista del DT (secretos, rules abiertas, sinks, CI, superficie de agentes). Con `--history` para el historial Git. Detecta **patrones**, no flujo.
3. **Taint analysis si hay semgrep instalado** — `semgrep --config tools/security/semgrep/ --error` (reglas locales, sin red). Es el único nivel que sigue el dato de origen a sink y reconoce sanitizadores. Si semgrep **no** está, decirlo en **Cobertura** y bajar la confianza de los hallazgos de XSS, injection, eval y SSRF: quedan sostenidos solo por patrón + lectura manual.
4. **Otros scanners externos ya instalados** — `npm audit` y equivalentes requieren red: pedir permiso antes.
5. **Greps ad-hoc** — para lo que las recetas de abajo no cubran.

Los comandos corridos y su resultado van a la sección **Evidencia determinista** del informe. Si no se pudo correr nada, decirlo: cambia la confianza de todo el informe.

**Reconocimiento inicial** (siempre): README, `docs/DEPLOY.md` o equivalente, `vitals/config/deploy.yaml`, `package.json`, `firebase.json`, `Dockerfile`, workflows de CI, y el mapa de rutas o funciones expuestas.

---

## §1 Autenticación

**Qué busca:** que la identidad se establezca de forma verificable y no se pueda saltear.

```bash
rg -n 'jwt\.(sign|verify)|signToken|createSession|setCookie' --glob '!node_modules'
rg -n 'expiresIn|maxAge|httpOnly|sameSite|secure:' --glob '!node_modules'
rg -n 'middleware|requireAuth|isAuthenticated|getServerSession'
```

- Rutas que deberían exigir sesión y no pasan por el middleware — comparar el listado de rutas contra el matcher del middleware.
- Tokens sin expiración, refresh eterno, secreto de firma débil o hardcodeado.
- Cookies sin `httpOnly`/`Secure`/`SameSite`.
- Reset de password o magic link predecible, sin expiración o reutilizable.
- Backdoors de debug o impersonación activos fuera de desarrollo (`rg -n 'IMPERSONATE|DEBUG_USER|SKIP_AUTH|bypass'`).

**Descartar antes de afirmar:** middleware global, guard del framework, verificación en el gateway.

---

## §2 Autorización y permisos

**Qué busca:** que estar autenticado no alcance para acceder a lo ajeno.

```bash
rg -n 'params\.(id|userId|orgId)|req\.(params|query)\.id' -A 6   # ¿hay ownership check después?
rg -n 'allow (read|write|create|update|delete)' --glob '*.rules'
rg -n 'role *===|isAdmin|hasPermission|can\('
```

- **IDOR:** identificador de recurso que viene del cliente y se usa sin filtrar por dueño o tenant.
- Escalada por claim manipulable (rol leído del token sin validar en el servidor, o del body).
- Mutaciones sin control aunque la lectura sí lo tenga.
- Roles verificados solo en la UI.
- `allow ...: if request.auth != null` — autentica pero no autoriza: el clásico.
- Multi-tenant: consultas sin filtro por organización.

**Descartar antes de afirmar:** middleware de ownership, filtro por tenant en la query, security rules, políticas de fila en la base.

---

## §3 API e input (incluye abuso de costo)

```bash
rg -n 'app\.(get|post|put|delete)|router\.|onRequest|onCall|export async function (GET|POST)'
rg -n 'query\(|execute\(|raw\(|\$where|createQueryBuilder'      # injection
rg -n 'zod|joi|yup|validateRequest|parse\(' --glob '!node_modules'
rg -n 'rateLimit|throttle|quota|limiter'
```

- Injection (SQL/NoSQL/comando/plantilla) por concatenación de input.
- Mass assignment: volcar el body entero al modelo, con campos privilegiados incluidos.
- SSRF: URL controlada por el usuario que el servidor visita.
- Path traversal en subida o descarga de archivos.
- Validación de esquema ausente, o presente pero saltéable.
- Errores que devuelven stack traces, paths o fragmentos de configuración.
- CORS abierto combinado con credenciales.
- Webhooks sin verificación de firma ni protección de replay.
- **Denial-of-wallet:** endpoint sin autenticar o sin cuota que dispara un modelo de IA, un envío de SMS/email o cualquier API paga. El ataque es a la factura, no a los datos — buscar llamadas a proveedores caros desde handlers públicos.

**Descartar antes de afirmar:** ORM con consultas parametrizadas, allowlist de destinos, límite en el gateway o WAF, cuota del proveedor.

---

## §4 Secretos y configuración

```bash
./tools/security/scan-repo.sh --history
git ls-files | grep -E '(^|/)\.env($|\.)'
rg -n '(NEXT_PUBLIC|VITE|REACT_APP)_[A-Z0-9_]*(KEY|SECRET|TOKEN)'
rg -n 'functions\.config\(\)'          # patrón legacy de Firebase
```

- Credenciales en el árbol de trabajo **y en el historial** — borrar sin rotar no cierra nada.
- Secretos de servidor expuestos al bundle de cliente por prefijo público.
- Credenciales en logs, capturas, docs o entradas de pulse.
- `.env.example` con valores reales; claves de service account versionadas.
- Mismos secretos en staging y producción.

**Clasificar por tipo × estado** con la tabla de `severity-rubric.md` §5: un placeholder no es un incidente.

---

## §5 Datos y almacenamiento

```bash
rg -n 'makePublic|publicRead|allUsers|acl\.'
rg -n 'export|download|backup|dump' --glob '!node_modules' -l
```

- Buckets o colecciones públicas con datos personales.
- Backups y exports accesibles sin autenticación.
- Campos sensibles sin cifrar cuando el modelo de amenaza lo exige.
- Borrado y retención incompletos (queda copia en otra colección o en un export).

---

## §6 Frontend y cliente

```bash
rg -n 'dangerouslySetInnerHTML|innerHTML *=|v-html|outerHTML'
rg -n 'addEventListener\(.message|postMessage\('
rg -n 'window\.location *=|redirect\(.*(req|params|query)'
```

- XSS almacenado, reflejado o de DOM: rastrear el origen del dato hasta el sink.
- `postMessage` sin verificar `origin`.
- Redirección abierta con destino controlado por el usuario.
- Lógica sensible resuelta solo en el cliente (precios, permisos, límites).
- Source maps publicados en producción.

**Descartar antes de afirmar:** autoescape del framework, sanitizador aplicado, CSP efectiva.

---

## §7 Infraestructura, CI y deploy

```bash
rg -n 'pull_request_target|permissions:|secrets\.' .github/workflows
rg -n '\$\{\{ *github\.event\.' .github/workflows
rg -n 'USER root|--privileged|latest' Dockerfile* docker-compose*
```

- Workflows con contexto privilegiado en PRs de forks.
- Interpolación de input de usuario dentro de `run:` (inyección de script en CI).
- Permisos de token amplios; secretos accesibles a jobs que no los necesitan.
- Contenedores como root, imágenes base sin actualizar.
- Service accounts o roles de ejecución con más permisos de los necesarios.
- Paneles de administración sin restricción de red ni segundo factor.
- Dependencias con vulnerabilidades conocidas: señalar el paquete y la versión, **sin inventar identificadores CVE**.

---

## §8 Arquitectura

Acá no se buscan patrones sino decisiones. Preguntas que producen hallazgos:

- ¿El cliente es fuente de verdad para algo que debería decidir el servidor?
- ¿Existe un único secreto o clave cuyo compromiso entrega todo el sistema?
- ¿La autorización está tan dispersa que no se puede auditar de una pasada?
- ¿Hay aislamiento real entre tenants, o solo un `where` bien intencionado?
- ¿Ante un error de auth el sistema falla abierto o cerrado?
- ¿Queda rastro suficiente para reconstruir un incidente?
- ¿Qué se rompe si cae o se compromete el proveedor del que todo depende?

---

## §9 Agentes e IA

Relevante en cualquier repo con agentes, MCP, reglas o skills auto-cargadas — es decir, en este.

```bash
ls .cursor/mcp.json .mcp.json .cursor/hooks.json 2>/dev/null
rg -n 'alwaysApply: *true' .cursor/rules
git log --oneline -20 -- .cursor/rules .cursor/skills .cursor/agents
```

- **Prompt injection:** contenido no confiable (issues, páginas, PDFs, respuestas de API, output de tools) que llega al contexto de un agente con permisos de escritura o de shell.
- **Envenenamiento de instrucciones:** una regla, skill o command modificado secuestra todas las corridas futuras de cualquier agente. ¿Quién puede editarlos? ¿Se revisan en PR como código?
- **Abuso de tools MCP:** qué puede hacer cada servidor conectado, con qué credenciales, y si un agente puede encadenar tools hacia una acción destructiva o de exfiltración.
- **Fuga hacia terceros:** qué contenido del repo se envía a servidores MCP o modelos externos.
- **Permisos de agente:** escritura de archivos, ejecución de comandos, hooks que corren automáticamente.
- **Secretos en contexto:** archivos con credenciales que un agente podría leer y reproducir en su salida.

**Descartar antes de afirmar:** allowlists de comandos, gates de aprobación humana, revisión obligatoria en PR de reglas y skills.

---

## Actores (abuse cases)

| Actor | Pregunta |
|-------|----------|
| Anónimo | ¿Qué alcanza sin cuenta? |
| Usuario autenticado | ¿Puede ver o mutar lo ajeno? |
| Admin | ¿Está sobredimensionado y sin rastro de auditoría? |
| Insider / CI | ¿Una filtración de CI compromete producción entera? |
| Supply-chain | ¿Una dependencia o workflow malicioso escala? |
| Agente / IA | ¿Input no confiable puede hacerlo actuar contra el proyecto? |

## Señales del stack web DT (Firebase por defecto)

Si aplica la regla `08`: revisar `firestore.rules` y `storage.rules` con tests del emulador, App Check activo, funciones callable con verificación de `auth` y validación de input, secretos en Secret Manager y no en `functions.config()`, y solo variables no sensibles con prefijo público en el cliente.
