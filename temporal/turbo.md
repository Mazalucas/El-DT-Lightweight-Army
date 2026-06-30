# Turbo — Guía completa de arquitectura (standalone)

Documento autocontenido para entender, operar y recrear el sistema de agentes **Turbo** de NitroFlow: orquestación, function calling, tools, streaming, persistencia y rollout seguro.

**Última revisión:** junio 2026 · **Stack:** Node.js/Express + Google Gemini + Firestore + React (SSE)

---

## Tabla de contenidos

1. [Qué es Turbo](#1-qué-es-turbo)
2. [Modelo mental: agente único vs multiagente](#2-modelo-mental-agente-único-vs-multiagente)
3. [Vocabulario](#3-vocabulario)
4. [Arquitectura en capas](#4-arquitectura-en-capas)
5. [Flujo de extremo a extremo](#5-flujo-de-extremo-a-extremo)
6. [El agent loop (núcleo del sistema)](#6-el-agent-loop-núcleo-del-sistema)
7. [Integración con Gemini (function calling)](#7-integración-con-gemini-function-calling)
8. [Sistema de tools](#8-sistema-de-tools)
9. [Inventario completo de tools](#9-inventario-completo-de-tools)
10. [Orquestador (routing por dominio)](#10-orquestador-routing-por-dominio)
11. [Especialistas lógicos y mapa tool → dominio](#11-especialistas-lógicos-y-mapa-tool--dominio)
12. [System prompt en capas](#12-system-prompt-en-capas)
13. [Session artifacts (memoria entre turnos)](#13-session-artifacts-memoria-entre-turnos)
14. [Streaming SSE y protocolo cliente](#14-streaming-sse-y-protocolo-cliente)
15. [Persistencia de conversaciones](#15-persistencia-de-conversaciones)
16. [Gestión de contexto y compactación](#16-gestión-de-contexto-y-compactación)
17. [Guardrails y políticas de ejecución](#17-guardrails-y-políticas-de-ejecución)
18. [Telemetría y analítica](#18-telemetría-y-analítica)
19. [Variables de entorno](#19-variables-de-entorno)
20. [API HTTP expuesta](#20-api-http-expuesta)
21. [Cómo recrear Turbo en otra aplicación](#21-cómo-recrear-turbo-en-otra-aplicación)
22. [Pseudocódigo portable del runtime completo](#22-pseudocódigo-portable-del-runtime-completo)
23. [Evolución futura: multiagente real](#23-evolución-futura-multiagente-real)
24. [Checklist de implementación por fases](#24-checklist-de-implementación-por-fases)

---

## 1. Qué es Turbo

**Turbo** es el asistente conversacional de NitroFlow. Permite a usuarios autenticados diseñar workflows, formularios, reportes y operar ejecuciones mediante lenguaje natural.

Características centrales:

- **LLM:** Google Gemini (API Google AI Studio), con **function calling** nativo.
- **Backend:** Node.js + Express; las tools ejecutan lógica de negocio real (proyectos, formularios, runs, reportes).
- **Frontend:** React; consume respuestas en tiempo real vía **Server-Sent Events (SSE)**.
- **Persistencia:** Firestore (`assistant_conversations`) + analítica de eventos.
- **Orquestador opcional:** una llamada LLM previa clasifica intención y dominio, filtra herramientas e inyecta conocimiento especializado.

Turbo **no es un agente autónomo sin límites**. El alcance está acotado por:

- Railguards en el system prompt.
- Políticas en el router de tools (bloqueos de creación en modo modificación).
- Filtrado de tools según intent (`support` → solo lectura).
- Umbrales de confianza del orquestador.

---

## 2. Modelo mental: agente único vs multiagente

### Lo que Turbo es hoy

Un **agente único** con un loop ReAct/tool-use:

```
Usuario → [Orquestador opcional] → Gemini + tools (loop) → Respuesta
```

Los **especialistas** (`workflows`, `forms`, `reports`, etc.) son **roles lógicos**, no procesos LLM separados. Comparten el mismo runtime (`handleChat`), pero reciben:

- Un **subconjunto filtrado de tools**.
- Un **append de system prompt** con recordatorios del dominio (skills).

### Lo que Turbo no es (todavía)

No hay workers LLM independientes corriendo en paralelo por dominio. No hay handoff entre procesos distintos; los handoffs ocurren **entre turnos** cuando el orquestador re-clasifica dominios e intent.

### Por qué este diseño

| Ventaja | Explicación |
|---------|-------------|
| Simplicidad operativa | Un loop, un historial, un modelo principal. |
| Costo predecible | Una llamada orquestador + N turnos agente. |
| Rollout seguro | Shadow/canary sobre el filtrado sin duplicar agentes. |
| Extensibilidad | Agregar dominio = agregar tools + mapa + skill text. |

---

## 3. Vocabulario

| Término | Significado |
|---------|-------------|
| **Turno (usuario)** | Un mensaje del usuario; puede disparar múltiples llamadas internas al LLM. |
| **Turno (agente)** | Una iteración del loop: llamada Gemini → tools opcionales → repetir. |
| **Tool / function calling** | Función declarada al modelo; Gemini devuelve `functionCall`; el servidor ejecuta y reinyecta `functionResponse`. |
| **SSE** | Server-Sent Events: stream HTTP unidireccional servidor → cliente. |
| **Conversación** | Documento persistido con mensajes, metadata, artefactos de sesión. |
| **Playbook / skill** | Bloque de texto inyectado en el system prompt (conocimiento de producto, reglas por dominio). |
| **Dominio** | Categoría lógica: `discovery`, `support`, `workflows`, `forms`, `runs`, `planner`, `reports`. |
| **Intent** | Clasificación del orquestador: `support`, `build`, `operate`, `mixed`. |
| **task_spec** | JSON con objetivo, entidades detectadas, restricciones; lo produce el orquestador. |
| **Session artifacts** | Datos persistidos entre turnos (ej. catálogo de campos de un reporte ya analizado). |
| **Orquestador** | Capa que clasifica y opcionalmente reduce tools visibles + enriquece el prompt. |
| **Shadow routing** | Orquestador corre y loguea telemetría, pero **no** filtra tools. |
| **Canary** | Porcentaje de usuarios (hash estable de `userId`) que reciben filtrado real. |

---

## 4. Arquitectura en capas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1 — Cliente (React)                                   │
│  TurboChatPage, useAssistant, parser SSE, UI de tools       │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/assistant/chat (SSE)
┌──────────────────────────▼──────────────────────────────────┐
│  CAPA 2 — API HTTP (Express)                                  │
│  Auth + acceso Turbo, headers SSE, upload de archivos         │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  CAPA 3 — Assistant Service (handleChat)                      │
│  Orquestador → composición prompt → agent loop → SSE          │
└───────┬──────────────────────────────┬──────────────────────┘
        │                              │
┌───────▼──────────┐          ┌────────▼────────────────────────┐
│ CAPA 4 — Orquest.│          │ CAPA 5 — Tool Router            │
│ Clasifica intent │          │ Registry + execute + políticas  │
│ Filtra tools     │          │ Declaraciones Gemini            │
└──────────────────┘          └────────┬────────────────────────┘
                                       │
                              ┌────────▼────────────────────────┐
                              │ CAPA 6 — Servicios de dominio   │
                              │ Projects, Forms, Runs, Reports  │
                              └─────────────────────────────────┘
        ┌──────────────────────────────────────────────────────┐
        │ CAPA 7 — Persistencia + Analytics                    │
        │ Firestore conversations, eventos, session artifacts  │
        └──────────────────────────────────────────────────────┘
```

### Responsabilidades por módulo (servidor)

| Módulo | Rol |
|--------|-----|
| `assistant.routes.ts` | Rutas HTTP, SSE headers, upload de archivos adjuntos. |
| `assistant.service.ts` | Orquestación del turno completo: orquestador, prompt, loop, SSE, persistencia del mensaje assistant. |
| `orchestrator.service.ts` | Llamada LLM JSON, filtrado de tools, append al system prompt. |
| `orchestrator-config.ts` | Flags env: shadow, routing, canary, umbral de confianza. |
| `orchestrator-types.ts` | Enums cerrados: dominios, intents, `OrchestratorPlan`, `TaskSpecV1`. |
| `tool-domain-map.ts` | Mapa tool → dominio(s); conjunto READ_ONLY. |
| `tool-router.ts` | Registro singleton, `getGeminiTools()`, `execute()`. |
| `tools/*.ts` | Declaraciones + implementaciones por dominio de negocio. |
| `context-builder.ts` | System prompt base (knowledge + behavior + railguards). |
| `knowledge/*` | Playbooks, skills, anti-patrones, session artifacts append. |
| `conversation.service.ts` | CRUD Firestore, merge de session artifacts, recursos creados. |
| `analytics.service.ts` | Eventos de sesión, orquestador, ejecución de tools. |
| `ai/service.ts` | Wrapper Gemini: texto, JSON, function calling. |

---

## 5. Flujo de extremo a extremo

```
Usuario escribe en UI
    │
    ▼
POST /api/assistant/chat  (message, conversationId?, attachments?)
    │
    ├─► Cargar o crear conversación en Firestore
    ├─► Persistir mensaje user + sincronizar array en memoria
    ├─► Emitir analytics SESSION_STARTED
    │
    ├─► [Si shadow/routing activo para este userId]
    │       runOrchestrator() → OrchestratorPlan
    │       buildAllowedToolNames() → Set<string>
    │       filterGeminiToolsByNames() → tools reducidas
    │       buildOrchestratorSystemAppend() → texto extra
    │       SSE turbo_phase + analytics ORCHESTRATOR_DECISION
    │
    ├─► Componer systemInstruction:
    │       base + orquestador + reports playbook + domain skills + session artifacts
    │
    ├─► Construir geminiContents desde historial (user/model + functionCalls previos)
    │
    └─► AGENT LOOP (hasta MAX_AGENT_TURNS = 22):
            callGoogleWithTools(system, contents, tools)
            │
            ├─ functionCalls? → ToolRouter.execute × N
            │                   SSE tool_call + tool_result
            │                   compactToolResultForGemini()
            │                   append model turn + user turn (functionResponses)
            │                   continue loop
            │
            └─ text? → SSE message + execution_state
                       persistir mensaje assistant
                       break

    SSE done { conversationId, correlationId }
    res.end()
```

---

## 6. El agent loop (núcleo del sistema)

El loop implementa el patrón **ReAct / tool-use** estándar de la industria:

```typescript
const MAX_AGENT_TURNS = 22;

for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
  const response = await llm.callWithTools({
    systemInstruction,
    contents,      // historial en formato del proveedor
    tools,         // function_declarations filtradas o completas
    temperature: 0.4,
    maxTokens: 8192, // configurable
  });

  if (response.functionCalls?.length) {
    const modelParts = [];
    const responseParts = [];

    for (const fc of response.functionCalls) {
      // 1. Notificar cliente
      sendSSE({ type: 'tool_call', data: { name: fc.name, args: fc.args } });

      // 2. Ejecutar en servidor (con permisos)
      const result = await toolRouter.execute(fc.name, fc.args, {
        userId,
        conversationId,
        enforceModifyExisting, // política de sesión
      });

      // 3. Notificar resultado
      sendSSE({ type: 'tool_result', data: { name: fc.name, result, success } });

      // 4. Preparar reinyección al modelo (compactada)
      modelParts.push({ functionCall: { name: fc.name, args: fc.args } });
      responseParts.push({
        functionResponse: {
          name: fc.name,
          response: compactToolResult(result),
        },
      });
    }

    // 5. Extender historial y continuar
    contents.push({ role: 'model', parts: modelParts });
    contents.push({ role: 'user', parts: responseParts });
    continue;
  }

  if (response.text) {
    sendSSE({ type: 'message', data: { content: response.text } });
    await saveAssistantMessage(conversationId, response.text, toolCalls);
    break;
  }
}
```

### Reglas del loop

- **Máximo 22 turnos internos** por mensaje de usuario (evita loops infinitos y costos descontrolados).
- **Temperatura 0.4** en el agente principal (balance determinismo / creatividad).
- **Temperatura 0.2** en el orquestador (clasificación estable).
- Tras cada batch de tools, el historial Gemini debe incluir **ambos** turns: el `model` con `functionCall` y el `user` con `functionResponse` (formato exigido por Gemini).

---

## 7. Integración con Gemini (function calling)

### Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{modelId}:generateContent?key={API_KEY}
```

Modelo por defecto del chat principal: `gemini-2.5-flash`.  
Modelo del orquestador: `ASSISTANT_ORCHESTRATOR_MODEL` o el mismo default.

### Body de una llamada con tools

```json
{
  "systemInstruction": { "parts": [{ "text": "..." }] },
  "contents": [
    { "role": "user", "parts": [{ "text": "mensaje del usuario" }] },
    { "role": "model", "parts": [{ "functionCall": { "name": "list_user_projects", "args": {} } }] },
    { "role": "user", "parts": [{ "functionResponse": { "name": "list_user_projects", "response": { "projects": [] } } }] }
  ],
  "tools": [{
    "function_declarations": [
      {
        "name": "list_user_projects",
        "description": "List all workflows/projects...",
        "parameters": { "type": "object", "properties": {} }
      }
    ]
  }],
  "generationConfig": {
    "temperature": 0.4,
    "maxOutputTokens": 8192
  }
}
```

### Parseo de respuesta

La respuesta trae `candidates[0].content.parts[]`. Cada part puede ser:

- `{ "text": "..." }` → respuesta final al usuario.
- `{ "functionCall": { "name": "...", "args": { ... } } }` → invocar tool(s).

El servicio AI extrae ambos tipos y devuelve `{ text?, functionCalls?, usage? }`.

### Llamada JSON del orquestador

Igual que texto, pero con:

```json
"generationConfig": {
  "responseMimeType": "application/json",
  "temperature": 0.2,
  "maxOutputTokens": 1024
}
```

El esquema esperado se incluye en el mensaje user del orquestador (no como JSON Schema nativo de Gemini en esta implementación).

---

## 8. Sistema de tools

### Contrato de una tool

```typescript
interface AssistantToolDef {
  declaration: GeminiFunctionDeclaration;  // expuesta al LLM
  execute: (
    args: Record<string, unknown>,
    ctx: ToolExecutionContext
  ) => Promise<Record<string, unknown>>;
}

interface ToolExecutionContext {
  userId: string;
  conversationId: string;
  enforceModifyExisting?: boolean;  // bloquea create_* si true
}
```

### Ejemplo completo

```typescript
{
  declaration: {
    name: 'list_user_projects',
    description: 'List all workflows/projects the user has access to. Returns { projects, count }.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  async execute(_args, ctx) {
    const projects = await ProjectService.getUserProjects(ctx.userId);
    const list = projects.map(p => ({ id: p.id, name: p.name, status: p.status }));
    return { projects: list, count: list.length };
  },
}
```

### Tool Router

Singleton con tres responsabilidades:

1. **Registro** al arrancar el primer chat (`registerAll(allTools)`).
2. **Exportación** de declaraciones a formato Gemini (`getGeminiTools()`).
3. **Dispatch** con normalización de nombres y manejo de errores.

#### Normalización de nombres

El modelo a veces devuelve nombres en CamelCase o con aliases. El router:

- Convierte a `snake_case`.
- Aplica aliases conocidos (`UpdateFormFields` → `update_form`).

#### Respuestas de error estructuradas

```typescript
{
  error: string,
  errorCode: 'TOOL_NOT_REGISTERED' | 'POLICY_MODIFY_EXISTING' | 'TOOL_EXECUTION_FAILED',
  errorKind: 'routing' | 'policy_block' | 'execution',
  userMessage: string,  // mensaje amigable para re-inyectar al LLM
}
```

### Principio de diseño

**El LLM nunca accede directamente a la base de datos.** Cada tool:

- Valida permisos con `userId`.
- Llama servicios de dominio existentes.
- Devuelve JSON acotado y útil para el modelo.

---

## 9. Inventario completo de tools

### Lectura / discovery

| Tool | Descripción breve |
|------|-------------------|
| `list_user_projects` | Lista workflows/proyectos del usuario. |
| `list_user_forms` | Lista formularios del usuario. |
| `get_project_detail` | Grafo completo del workflow (nodos, edges, draft vs published). |
| `check_google_connection` | Estado de conexión Google del usuario. |
| `list_reports` | Lista reportes accesibles. |
| `get_report` | Detalle de un reporte. |
| `get_dashboard_project_resources` | Recursos del tablero vinculados a un proyecto. |
| `validate_or_suggest_sources` | Valida fuentes `ds:/wf:/form:` del reporte. |
| `preview_report_data` | Muestra filas de preview de datos. |
| `analyze_report_data_source` | Punto de entrada reportes: esquema, columnas, catálogo de preguntas, instrucciones al modelo. |

### Workflows (mutación)

| Tool | Descripción breve |
|------|-------------------|
| `create_project` | Crea proyecto/workflow vacío. |
| `update_template` | Actualiza grafo (nodos + edges). |
| `publish_workflow` | Publica borrador a producción. |

### Formularios (mutación)

| Tool | Descripción breve |
|------|-------------------|
| `create_form` | Crea formulario. |
| `update_form` | Actualiza campos y secciones. |

### Runs / ejecuciones

| Tool | Descripción breve |
|------|-------------------|
| `list_executions` | Lista ejecuciones de un proyecto. |
| `get_execution_detail` | Detalle de una ejecución. |
| `retry_node` | Reintenta un nodo fallido. |
| `update_execution_title` | Cambia título de ejecución. |
| `update_execution_campaign_status` | Actualiza estado de campaña. |

### Planner (planes visibles antes de mutar)

| Tool | Descripción breve |
|------|-------------------|
| `propose_creation_plan` | Emite plan de creación multi-recurso (SSE `plan`). |
| `propose_modification_plan` | Emite plan de modificación (SSE `modification_plan`). |

### Reportes (mutación)

| Tool | Descripción breve |
|------|-------------------|
| `create_report` | Crea reporte. |
| `update_report` | Actualiza layout y widgets. |
| `delete_report` | Elimina reporte. |
| `apply_suggested_report_layout` | Layout determinístico inicial desde esquema/columnas. |
| `refresh_report_snapshot` | Refresca snapshot de datos. |

---

## 10. Orquestador (routing por dominio)

### Propósito

Antes del agent loop, una llamada LLM adicional produce un **plan estructurado** que:

1. Reduce el conjunto de tools expuestas (menos confusión del modelo, menor costo de tokens en declaraciones).
2. Enriquece el system prompt con objetivo e IDs detectados.
3. Activa playbooks de dominio (reportes, skills).

### Contrato `OrchestratorPlan`

```typescript
interface OrchestratorPlan {
  intent: 'support' | 'build' | 'operate' | 'mixed';
  domains: Array<
    'discovery' | 'support' | 'workflows' | 'forms' |
    'runs' | 'planner' | 'reports'
  >;
  confidence: number;  // 0.0 – 1.0
  task_spec: {
    version: 1;
    goal: string;
    entities: Array<{
      type: 'project' | 'form' | 'execution' | 'report' |
            'dashboard_project' | 'unknown';
      id?: string;
      nameHint?: string;
    }>;
    constraints: string[];
    parallel_safe: boolean;
  };
  needs_clarification: string[];
}
```

### System prompt del orquestador (resumen)

El orquestador recibe instrucciones para:

- Devolver **solo JSON** (sin markdown).
- Usar dominios e intents **cerrados** (no inventar valores).
- Detectar IDs estables (`rpt_*`, `form_*`) y meterlos en `task_spec.entities`.
- Clasificar intención:
  - **support:** ayuda de producto, sin cambios destructivos.
  - **build:** crear/editar plantillas, formularios, reportes.
  - **operate:** runs, reintentos, títulos.
  - **mixed:** combinación explícita.

### Input al orquestador

```
Recursos ya creados en conversación (si hay)
IDs detectados por regex en mensajes recientes
Últimos N mensajes del usuario (default 8, max 32)
Mensaje actual a clasificar
Esquema JSON esperado
```

### Reglas de filtrado de tools

```typescript
function buildAllowedToolNames(plan: OrchestratorPlan): Set<string> {
  const threshold = 0.7; // ASSISTANT_ORCHESTRATOR_CONFIDENCE_THRESHOLD

  // Baja confianza → solo tools READ_ONLY del dominio discovery
  if (plan.confidence < threshold) {
    return readOnlyToolsForDiscovery();
  }

  // Intent support → solo READ_ONLY aunque dominios incluyan workflows/forms
  if (plan.intent === 'support') {
    return readOnlyToolsForSupport();
  }

  // Normal → unión de tools de todos los dominios del plan
  return toolNamesForDomains(plan.domains);
}
```

**Fallback:** si el filtrado produce conjunto vacío, se usan **todas** las tools (con log de advertencia).

### Append al system prompt del agente principal

Cuando el routing está activo, se añade un bloque como:

```markdown
## Prioridad del turno (orquestador)
- Objetivo: {task_spec.goal}
- Intencion: {intent}
- Dominios: {domains.join}
- Confianza de enrutamiento: {confidence}
- IDs en task_spec: project:xxx, report:rpt_xxx
- Si falta informacion, pregunta de forma breve: ...
- Restricciones: ...
```

### Rollout: shadow + canary

| Modo | Comportamiento |
|------|----------------|
| **Sin flags** | No corre orquestador; todas las tools; prompt base only. |
| **SHADOW=1** | Corre orquestador, telemetría, SSE `turbo_phase`; **no** filtra tools. |
| **ROUTING=1 + CANARY_PERCENT=N** | Usuarios en cohorte (hash estable de `userId`) reciben filtrado real. |

Función de cohorte canary:

```typescript
function userInCanaryCohort(userId: string, percent: number): boolean {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100 < percent;
}
```

Esto garantiza que el mismo usuario siempre cae en el mismo bucket (estable entre sesiones).

---

## 11. Especialistas lógicos y mapa tool → dominio

Los dominios son enums cerrados. Cada tool mapea a uno o más dominios.

### Matriz intent → comportamiento

| Intent | Dominios típicos | Restricción de tools |
|--------|------------------|----------------------|
| `support` | support + discovery | Solo READ_ONLY |
| `build` | workflows, forms, planner, reports | Mutación permitida según dominio |
| `operate` | runs | Tools de ejecución |
| `mixed` | Combinación en `task_spec` | Unión de conjuntos |

### Tabla de especialistas

| Dominio | Cubre | Tools de mutación | Procedimiento |
|---------|-------|-------------------|---------------|
| **discovery** | Listados, IDs, detalle sin editar | Ninguna | Listar → pedir un criterio si falta ID → no mutar |
| **support** | Ayuda de producto, UI | Ninguna (READ_ONLY) | Responder con pasos → si piden cambio, re-clasificar en siguiente turno |
| **workflows** | Crear/editar/publicar grafos | create/update/publish | get_project_detail → update_template → publish_workflow |
| **forms** | Formularios y campos | create_form, update_form | Definir campos → update_form completo |
| **runs** | Ejecuciones | retry, títulos, campaña | get_execution_detail antes de retry_node |
| **planner** | Planes multi-recurso | propose_*_plan | Plan visible → esperar confirmación explícita |
| **reports** | Tableros, widgets, fuentes | create/update/delete report, layout | analyze_report_data_source primero → update_report |

### Tools READ_ONLY (conjunto de seguridad)

```
list_user_projects, list_user_forms, get_project_detail,
check_google_connection, list_reports, get_report,
get_dashboard_project_resources, validate_or_suggest_sources,
preview_report_data, analyze_report_data_source
```

### Handoffs entre dominios (entre turnos)

- **support → build:** usuario pasa de "¿dónde está?" a "cambialo" → orquestador añade dominios de mutación.
- **discovery → reports:** usuario elige reporte → tools de analyze/get_report.
- **planner → workflows/forms:** tras confirmación del usuario, ejecutar mutaciones en orden del behavior.
- **reports:** iteración interna dentro del dominio hasta snapshot o cierre.

### Skills por dominio (texto inyectado)

Ejemplos de hints que se inyectan cuando el dominio está activo:

- **workflows:** usar get_project_detail / update_template con JSON válido; no inventar node ids.
- **forms:** get_form, update_form_schema; respetar tipos de campo.
- **runs:** prefijos get_execution, list_executions; no inventar datos sensibles.
- **planner:** propose_creation_plan antes de crear recursos.
- **reports:** analyze_report_data_source antes de pedir campos; apply_suggested_report_layout para layout inicial.

El dominio **reports** además recibe un playbook extenso separado (fuentes `ds:/wf:/form:`, flujo analyze → update, anti-patrones).

---

## 12. System prompt en capas

El system instruction final se compone en este orden:

| # | Capa | Contenido |
|---|------|-----------|
| 1 | **Base** | Conocimiento Nitro, principios builder-first, referencia de nodos, formularios/variables, patrones de workflow, behavior global, railguards. |
| 2 | **Contexto usuario** | Nombre, userId, recursos ya creados en la conversación, restricciones explícitas de sesión. |
| 3 | **Orquestador** | Objetivo, intent, dominios, IDs, clarificaciones pendientes (solo si routing activo). |
| 4 | **Playbook reportes** | Conocimiento de fuentes, pasos obligatorios, anti-patrones (si dominio reports o fallback por keywords). |
| 5 | **Skills dominio** | Hints cortos por dominio activo del plan. |
| 6 | **Session artifacts** | Catálogo de preguntas, reportId, resolvedSourceId de análisis previo. |

### Contenido del behavior global (conceptos clave)

- Turbo responde en español salvo excepciones documentadas.
- Fases conversacionales: discovery → planning → execution → done.
- **Veracidad:** no inventar IDs, URLs ni features; usar tools para datos reales.
- **Reportes:** excepción de tono más técnico; seguir flujo analyze antes de pedir campos al usuario.
- **Planes:** no ejecutar mutaciones destructivas hasta confirmación explícita tras `propose_*_plan`.
- **Modificación:** si ya hay recursos creados y el usuario pide modificar, usar update_* no create_*.

### Railguards (límites de alcance)

Bloques que definen qué Turbo **no** debe hacer: operaciones fuera del producto, consejos peligrosos, bypass de permisos, etc.

---

## 13. Session artifacts (memoria entre turnos)

### Problema que resuelve

Tools como `analyze_report_data_source` devuelven JSON grande (catálogo de campos, instrucciones al modelo). Sin persistencia, el modelo olvidaría el contexto o pediría al usuario repetir información.

### Estructura persistida

```typescript
interface SessionArtifacts {
  lastReportAnalyze?: {
    reportId: string;
    resolvedSourceId: string;
    formId?: string;
    formName?: string;
    questionsCatalog: Array<{ fieldId: string; label: string; type: string }>;
    totalRows?: number;
    updatedAt: string;
  };
}
```

Se guarda en `conversation.metadata.sessionArtifacts` en Firestore.

### Flujo

1. Tool `analyze_report_data_source` ejecuta con éxito.
2. Servidor extrae patch desde el result.
3. `mergeSessionArtifacts(conversationId, patch)`.
4. Se recarga conversación y se **recompone** el system prompt con `buildSessionArtifactsAppend()`.
5. Turnos siguientes incluyen el catálogo resumido sin re-ejecutar analyze.

### Texto inyectado (ejemplo conceptual)

```markdown
## Contexto de sesion (reporte analizado)
- reportId: rpt_abc123
- resolvedSourceId: form:xyz
- Campos disponibles (questionsCatalog): [fieldId, label, type] × N
- No vuelvas a pedir al usuario la lista completa de campos si ya esta aqui.
```

---

## 14. Streaming SSE y protocolo cliente

### Headers HTTP del servidor

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

### Formato de evento

```
data: {"type":"tool_call","data":{"name":"list_user_projects","args":{}}}

data: {"type":"tool_result","data":{"name":"list_user_projects","result":{...},"success":true}}

data: {"type":"message","data":{"content":"Encontré 3 proyectos..."}}

data: {"type":"done","data":{"conversationId":"conv_xxx","correlationId":"uuid"}}
```

### Tipos de evento

| type | Cuándo | data |
|------|--------|------|
| `turbo_phase` | Tras orquestador | phase, intent, domains, confidence, routingApplied, tool counts |
| `tool_call` | Antes de ejecutar tool | name, args |
| `tool_result` | Después de ejecutar | name, result, success |
| `plan` | propose_creation_plan | plan (objeto visualizable) |
| `modification_plan` | propose_modification_plan | plan |
| `message` | Texto del asistente | content (puede llegar en un solo chunk) |
| `execution_state` | Fin del turno | status: none/draft/published/failed, summary, URLs |
| `error` | Fallo | message (sanitizado para usuario) |
| `done` | Cierre | conversationId, correlationId |

### Cliente React (patrón)

1. `fetch POST /assistant/chat` con Bearer token Firebase.
2. `response.body.getReader()` → parser SSE línea a línea.
3. Mensaje optimista del user + placeholder assistant con `isStreaming: true`.
4. Por cada evento, actualizar estado del mensaje assistant (content, toolCalls, plan, phase).
5. Al `done`, guardar `conversationId` para turnos siguientes.

### Upload de archivos

Ruta separada `POST /api/assistant/upload-file`:

- Extrae texto del archivo (PDF, docx, etc.) hasta 50k chars.
- Sube a Firebase Storage.
- Devuelve `{ fileId, filename, mimeType, extractedText }`.
- El chat recibe attachments; el texto extraído se concatena al mensaje user.

---

## 15. Persistencia de conversaciones

### Colección Firestore

`assistant_conversations`

### Documento conversación

```typescript
interface Conversation {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed' | 'abandoned';
  messages: ConversationMessage[];
  metadata: {
    totalMessages: number;
    toolsExecuted: string[];
    resourcesCreated: Array<{
      type: 'workflow' | 'form';
      id: string;
      name: string;
      url: string;
    }>;
    hasAttachments: boolean;
    lastActivityAt: string;
    sessionArtifacts?: SessionArtifacts;
  };
  analysis: ConversationAnalysis | null;  // post-hoc opcional
  createdAt: string;
  updatedAt: string;
}
```

### Mensaje

```typescript
interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Array<{ fileId, filename, mimeType, extractedText? }>;
  toolCalls?: Array<{ name, args, result }>;
  executionState?: ToolExecutionState;
  phase: 'discovery' | 'planning' | 'execution' | 'done';
  timestamp: string;
}
```

### Sincronización en memoria

Tras `addMessage` en Firestore, el servicio **también** hace `conversation.messages.push(userMsg)` en memoria. Esto evita que el primer turno construya historial Gemini vacío.

### Recursos creados

Cuando `create_project` o `create_form` tienen éxito, se registra en `metadata.resourcesCreated`. El system prompt base lista estos recursos y instruye al modelo a **modificar** en lugar de crear duplicados.

---

## 16. Gestión de contexto y compactación

### Presupuesto por capa (valores operativos)

| Capa | Variable / default | Política |
|------|-------------------|----------|
| System base | Estable | No duplicar bloques entre skills activos |
| Orquestador append | Fijo (~10 líneas) | Solo metadatos del plan |
| Historial chat | `ASSISTANT_MAX_CHAT_MESSAGES` | Últimos N contents si definido |
| Resultados tools | `ASSISTANT_TOOL_RESULT_MAX_CHARS` (default 12000) | Compactar JSON grande |
| Preview reportes | `ASSISTANT_REPORT_PREVIEW_MAX_ROWS`, etc. | Limitar filas en analyze/preview |
| Output modelo | `ASSISTANT_MAX_OUTPUT_TOKENS` (default 8192) | Techo producto, no máximo teórico |

### Función `compactToolResultForGemini`

Cuando el JSON de una tool supera el máximo:

1. Intenta slim con campos prioritarios: `modelInstructions`, `questionsCatalog`, IDs, `error`, `success`.
2. Trunca `questionsCatalog` a 80 → 25 entradas si sigue grande.
3. Marca `_truncated: true` y `_note` explicando al modelo qué hacer.

Campos prioritarios para reportes: el catálogo y las instrucciones al modelo pesan más que filas de preview.

### Recorte de historial

```typescript
function trimGeminiContentsIfConfigured(contents) {
  const max = parseInt(process.env.ASSISTANT_MAX_CHAT_MESSAGES);
  if (!max || contents.length <= max) return contents;
  return contents.slice(-max);
}
```

---

## 17. Guardrails y políticas de ejecución

### En el system prompt

- Railguards globales de alcance.
- Behavior: no inventar, confirmar planes, respetar fases.
- Anti-patrones de reportes: no pedir lista manual de campos si analyze ya corrió.

### En ToolRouter (código, no prompt)

**Modo modificación (`enforceModifyExisting`):**

Si el usuario ya tiene recursos creados en la sesión y el mensaje contiene verbos de modificación (modifica, actualiza, edita, cambia, agrega, quita…), se bloquea:

```typescript
if (ctx.enforceModifyExisting && (name === 'create_project' || name === 'create_form')) {
  return {
    error: 'En modo modificacion no se permiten creaciones nuevas.',
    errorCode: 'POLICY_MODIFY_EXISTING',
    errorKind: 'policy_block',
    userMessage: 'No voy a crear un recurso nuevo. Voy a modificar el existente.',
  };
}
```

### Constraints de sesión detectadas por regex

Ejemplo: si el usuario dijo "ignora la carpeta de Drive", se añade restricción persistente al system prompt para no volver a pedir folder ID.

### Sanitización de errores al usuario

| Patrón en error API | Mensaje amigable |
|---------------------|------------------|
| 429 / quota | "Muchas consultas, intenta en un minuto" |
| 401 / 403 / api key | "Error de configuración (Ref: AUTH)" |
| timeout | "Respuesta tardó demasiado, simplifica el mensaje" |
| 500 / 503 | "Servicio temporalmente no disponible (Ref: SVC)" |
| safety block | "Mensaje bloqueado por políticas de seguridad" |

### Estado de ejecución (`execution_state`)

Al final del turno, se calcula a partir de tool calls:

- **none:** sin mutaciones.
- **draft:** se creó/actualizó pero no se publicó.
- **published:** publish_workflow exitoso.
- **failed:** errores en tools de ejecución.

Incluye workflows incompletos (creados sin `update_template`).

---

## 18. Telemetría y analítica

### Eventos emitidos

| Evento | Cuándo |
|--------|--------|
| `SESSION_STARTED` | Inicio de handleChat |
| `ORCHESTRATOR_DECISION` | Tras runOrchestrator |
| `EXECUTION_STARTED` | Antes de cada tool |
| `EXECUTION_COMPLETED` / `EXECUTION_FAILED` | Después de cada tool |
| `PLAN_GENERATED`, `PLAN_CONFIRMED`, etc. | Flujos de planner |

### Payload ORCHESTRATOR_DECISION

```typescript
{
  correlationId: string,
  shadow: boolean,
  routingApplied: boolean,
  shadowRoutingEligible: boolean | null,
  intent: string | null,
  domains: string[] | null,
  confidence: number | null,
  planNull: boolean,
  filteredToolCount: number | null,
  totalToolCount: number,
}
```

### Métricas agregadas (admin)

- Funnel: planes generados → confirmados → ejecutados.
- Stats por nombre de tool (éxito/fallo).
- Bloque `turbo`: decisiones con dominio reports, shadow routing, etc.

---

## 19. Variables de entorno

### Obligatorias

| Variable | Uso |
|----------|-----|
| `ASSISTANT_GEMINI_KEY` | API key Google AI Studio para Turbo |

### Modelos

| Variable | Default | Uso |
|----------|---------|-----|
| `ASSISTANT_MAIN_MODEL` | `gemini-2.5-flash` | Chat principal con tools |
| `ASSISTANT_ORCHESTRATOR_MODEL` | `gemini-2.5-flash` | Clasificación JSON orquestador |

### Límites de contexto

| Variable | Default | Uso |
|----------|---------|-----|
| `ASSISTANT_MAX_OUTPUT_TOKENS` | 8192 | Tope salida por llamada |
| `ASSISTANT_MAX_CHAT_MESSAGES` | (sin límite) | Recorte historial Gemini |
| `ASSISTANT_TOOL_RESULT_MAX_CHARS` | 12000 | Compactación resultados tools |
| `ASSISTANT_REPORT_PREVIEW_MAX_ROWS` | — | Preview reportes |
| `ASSISTANT_REPORT_PREVIEW_MAX_JSON_CHARS` | — | Tamaño JSON preview |
| `ASSISTANT_ANALYZE_REPORT_DATA_PREVIEW_LIMIT` | min(25, preview max) | Filas en analyze |

### Orquestador / rollout

| Variable | Efecto |
|----------|--------|
| `ASSISTANT_ORCHESTRATOR_SHADOW=1` | Corre orquestador; **no** filtra tools |
| `ASSISTANT_ORCHESTRATOR_ROUTING=1` | Filtra tools en cohorte canary |
| `ASSISTANT_ORCHESTRATOR_CANARY_PERCENT` | 0–100, fracción de usuarios |
| `ASSISTANT_ORCHESTRATOR_CONFIDENCE_THRESHOLD` | Default 0.7; bajo → solo lectura |
| `ASSISTANT_ORCHESTRATOR_RECENT_USER_MESSAGES` | Default 8, max 32 |

---

## 20. API HTTP expuesta

Base: `/api/assistant` (requiere auth Firebase + acceso Turbo habilitado para el usuario).

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/chat` | Chat streaming SSE. Body: `{ message, conversationId?, attachments? }` |
| POST | `/upload-file` | Sube archivo, extrae texto. Multipart, max 10MB. |
| GET | `/conversations` | Lista conversaciones del usuario. |
| GET | `/conversations/:id` | Detalle de conversación. |
| DELETE | `/conversations/:id` | Elimina conversación. |

---

## 21. Cómo recrear Turbo en otra aplicación

### Fase 1 — MVP (1–2 semanas)

1. Endpoint POST con SSE.
2. Wrapper LLM con function calling (Gemini, OpenAI o Anthropic — mismo patrón).
3. ToolRouter con 3–5 tools de lectura de tu dominio.
4. Agent loop con MAX_TURNS.
5. Conversación en DB (Postgres, Mongo, Firestore).

### Fase 2 — Producto usable

6. System prompt en capas (base + behavior + límites).
7. Compactación de tool results.
8. Permisos por userId en cada tool.
9. UI con estados tool_call / tool_result / error / done.
10. Sanitización de errores API.

### Fase 3 — Orquestación estilo Turbo

11. Enums cerrados: dominios + intents.
12. Mapa tool → dominio.
13. Orquestador JSON (plan con confidence + task_spec).
14. Filtrado de tools + append al prompt.
15. Shadow mode + canary + telemetría ORCHESTRATOR_DECISION.

### Fase 4 — Confiabilidad

16. Session artifacts entre turnos.
17. Playbooks por dominio + anti-patrones conversacionales.
18. Golden eval tests del mapa orquestador.
19. Presupuesto de contexto documentado y parametrizable.
20. Analytics funnel (plan → confirm → execute).

### Decisiones de diseño clave al portar

| Decisión | Recomendación Turbo |
|----------|---------------------|
| ¿Un LLM o muchos? | Uno principal + uno clasificador opcional |
| ¿Tools o RAG puro? | Tools para acciones; RAG/playbooks para conocimiento |
| ¿Streaming? | SSE suficiente para chat unidireccional |
| ¿Dónde ejecutar tools? | Siempre servidor; nunca confiar en el cliente |
| ¿Cómo rollout routing? | Shadow → canary → 100% |

---

## 22. Pseudocódigo portable del runtime completo

```typescript
// ─── Tipos ───────────────────────────────────────────────
type SSEEvent = { type: string; data: Record<string, unknown> };

interface OrchestratorPlan {
  intent: 'support' | 'build' | 'operate' | 'mixed';
  domains: string[];
  confidence: number;
  task_spec: {
    goal: string;
    entities: Array<{ type: string; id?: string }>;
    constraints: string[];
    parallel_safe: boolean;
  };
  needs_clarification: string[];
}

// ─── Config ──────────────────────────────────────────────
const MAX_AGENT_TURNS = 22;
const ORCH_CONFIDENCE_THRESHOLD = 0.7;

// ─── Entry point ─────────────────────────────────────────
async function handleChat(
  userId: string,
  message: string,
  conversationId: string | undefined,
  res: Response,
) {
  toolRouter.registerAll(allToolDefinitions);

  const apiKey = process.env.ASSISTANT_GEMINI_KEY;
  if (!apiKey) {
    sendSSE(res, { type: 'error', data: { message: 'Assistant unavailable' } });
    sendSSE(res, { type: 'done', data: { conversationId: '' } });
    return res.end();
  }

  // 1. Conversación
  let conv = conversationId
    ? await conversationStore.get(conversationId)
    : await conversationStore.create(userId, message);

  const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
  await conversationStore.addMessage(conv.id, userMsg);
  conv.messages.push(userMsg);

  analytics.emit('SESSION_STARTED', { conversationId: conv.id, userId });

  // 2. System prompt base
  let systemPrompt = buildBaseSystemPrompt({
    userId,
    resourcesCreated: conv.metadata.resourcesCreated,
    sessionConstraints: detectSessionConstraints(conv.messages, message),
  });

  let tools = toolRouter.getLlmToolDeclarations();
  const totalTools = tools.length;
  let orchestratorAppend = '';

  // 3. Orquestador (opcional)
  let plan: OrchestratorPlan | null = null;
  if (shouldRunOrchestrator(userId)) {
    plan = await runOrchestrator(apiKey, message, {
      recentUserMessages: conv.messages.filter(m => m.role === 'user').map(m => m.content),
      resourcesSummary: formatResources(conv.metadata.resourcesCreated),
    });

    const applyFilter = shouldApplyToolFiltering(userId) && plan !== null;
    let filteredCount: number | undefined;

    if (applyFilter && plan) {
      const allowed = buildAllowedToolNames(plan, ORCH_CONFIDENCE_THRESHOLD);
      const filtered = toolRouter.filterByNames(allowed);
      if (filtered.length > 0) {
        tools = filtered;
        filteredCount = filtered.length;
        orchestratorAppend = buildOrchestratorAppend(plan);
      }
    }

    analytics.emit('ORCHESTRATOR_DECISION', {
      intent: plan?.intent,
      domains: plan?.domains,
      confidence: plan?.confidence,
      routingApplied: applyFilter && (filteredCount ?? 0) > 0,
      filteredToolCount: filteredCount,
      totalToolCount: totalTools,
    });

    sendSSE(res, {
      type: 'turbo_phase',
      data: { phase: 'orchestrator', intent: plan?.intent, domains: plan?.domains },
    });
  }

  // 4. Capas adicionales del prompt
  systemPrompt += orchestratorAppend;
  systemPrompt += buildDomainPlaybooks(plan);
  systemPrompt += buildSessionArtifactsAppend(conv.metadata.sessionArtifacts);

  // 5. Historial LLM
  let contents = buildLlmContents(conv.messages, message);
  contents = trimHistoryIfConfigured(contents);

  const allToolCalls: Array<{ name: string; args: unknown; result: unknown }> = [];
  const enforceModifyExisting = shouldEnforceModifyExisting(message, conv.metadata.resourcesCreated);

  // 6. Agent loop
  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    let response;
    try {
      response = await llm.callWithTools({
        apiKey,
        systemInstruction: systemPrompt,
        contents,
        tools,
        temperature: 0.4,
        maxTokens: 8192,
      });
    } catch (err) {
      sendSSE(res, { type: 'error', data: { message: sanitizeError(err) } });
      break;
    }

    if (response.functionCalls?.length) {
      const modelParts = [];
      const responseParts = [];

      for (const fc of response.functionCalls) {
        sendSSE(res, { type: 'tool_call', data: { name: fc.name, args: fc.args } });
        analytics.emit('EXECUTION_STARTED', { toolName: fc.name });

        const result = await toolRouter.execute(fc.name, fc.args, {
          userId,
          conversationId: conv.id,
          enforceModifyExisting,
        });

        const success = !result.error;
        sendSSE(res, { type: 'tool_result', data: { name: fc.name, result, success } });
        analytics.emit(success ? 'EXECUTION_COMPLETED' : 'EXECUTION_FAILED', { toolName: fc.name });

        modelParts.push({ functionCall: { name: fc.name, args: fc.args } });
        responseParts.push({
          functionResponse: { name: fc.name, response: compactResult(result) },
        });
        allToolCalls.push({ name: fc.name, args: fc.args, result });

        // Session artifacts side effects
        if (success && fc.name === 'analyze_report_data_source') {
          const patch = extractSessionArtifactPatch(result);
          if (patch) {
            await conversationStore.mergeSessionArtifacts(conv.id, patch);
            conv = await conversationStore.get(conv.id);
            systemPrompt = rebuildSystemPrompt(conv, plan, message);
          }
        }

        // Plan SSE events
        if (fc.name === 'propose_creation_plan' && result.plan) {
          sendSSE(res, { type: 'plan', data: { plan: result.plan } });
        }
      }

      contents.push({ role: 'model', parts: modelParts });
      contents.push({ role: 'user', parts: responseParts });
      contents = trimHistoryIfConfigured(contents);
      continue;
    }

    if (response.text) {
      sendSSE(res, { type: 'message', data: { content: response.text } });
      const executionState = computeExecutionState(allToolCalls);
      sendSSE(res, { type: 'execution_state', data: executionState });

      await conversationStore.addMessage(conv.id, {
        role: 'assistant',
        content: response.text,
        toolCalls: allToolCalls,
        executionState,
        timestamp: new Date().toISOString(),
      });
    }
    break;
  }

  sendSSE(res, { type: 'done', data: { conversationId: conv.id } });
  res.end();
}

// ─── Helpers esenciales ────────────────────────────────────
function sendSSE(res: Response, event: SSEEvent) {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function buildAllowedToolNames(plan: OrchestratorPlan, threshold: number): Set<string> {
  if (plan.confidence < threshold) return readOnlyDiscoveryTools();
  if (plan.intent === 'support') return readOnlySupportTools();
  return unionToolsForDomains(plan.domains);
}
```

---

## 23. Evolución futura: multiagente real

Turbo ya tiene contratos preparados para evolucionar:

| Pieza existente | Uso futuro |
|-----------------|------------|
| `task_spec.parallel_safe` | Disparar sub-tareas independientes en paralelo |
| `task_spec.entities[]` | Handoff con contexto estructurado entre agentes |
| Dominios cerrados | Un worker LLM por dominio con tools propias |
| Orquestador | Se convierte en **dispatcher** que elige qué worker invocar |
| Session artifacts | Memoria compartida entre workers |

Patrón de evolución recomendado:

```
Fase actual:  Orquestador → 1 agente → tools
Fase intermedia: Orquestador → secuencia de agentes especializados (mismo historial)
Fase avanzada: Orquestador → grafo de agentes con cola de mensajes + artifacts
```

No implementar multiagente real hasta tener métricas sólidas del routing single-agent (golden eval, tasa de tool errors, funnel de planes).

---

## 24. Checklist de implementación por fases

### Fase 1 — MVP
- [ ] POST /chat con SSE
- [ ] ToolRouter + 3 tools lectura
- [ ] Agent loop MAX_TURNS
- [ ] Persistencia mensajes

### Fase 2 — Producto
- [ ] System prompt capas base + behavior
- [ ] compactToolResult
- [ ] Permisos userId por tool
- [ ] UI streaming tools + errores sanitizados

### Fase 3 — Orquestador
- [ ] Enums dominios + intents
- [ ] TOOL_DOMAIN_MAP
- [ ] runOrchestrator JSON
- [ ] Filtrado + append prompt
- [ ] Shadow + canary + ORCHESTRATOR_DECISION

### Fase 4 — Confiabilidad
- [ ] Session artifacts
- [ ] Playbooks + anti-patrones por dominio
- [ ] Golden eval orquestador
- [ ] ASSISTANT_MAX_* env vars
- [ ] Analytics funnel admin

---

## Apéndice A — Diagrama de secuencia (turno completo)

```
Usuario          Cliente           API              Orquestador       Gemini          ToolRouter       Firestore
  |                |                |                    |               |                |               |
  |-- mensaje ---->|                |                    |               |                |               |
  |                |-- POST /chat ->|                    |               |                |               |
  |                |                |-- load/create ----------------------------------------------->|
  |                |                |-- save user msg ---------------------------------------------->|
  |                |                |-- classify ------->|               |                |               |
  |                |                |                    |-- JSON call ->|                |               |
  |                |                |<-- plan -----------|               |                |               |
  |                |<- turbo_phase -|                    |               |                |               |
  |                |                |-- compose prompt   |               |                |               |
  |                |                |-- agent loop ---------------------->|                |               |
  |                |                |                    |               |-- functionCall |               |
  |                |<- tool_call ---|                    |               |                |               |
  |                |                |-- execute ------------------------|--------------->|               |
  |                |<- tool_result -|                    |               |                |               |
  |                |                |-- functionResponse ------------->|                |               |
  |                |                |     (repeat loop)  |               |                |               |
  |                |                |                    |               |-- text ------->|               |
  |                |<- message -----|                    |               |                |               |
  |                |                |-- save assistant msg ------------------------------------------>|
  |                |<- done --------|                    |               |                |               |
```

---

## Apéndice B — Tests de regresión incluidos en el proyecto

Comandos útiles para validar el orquestador y el mapa de dominios:

```bash
# Evaluación offline del mapa de tools del orquestador (golden JSON)
npm run test:orchestrator-eval --prefix server

# Layout sugerido de reportes
npm run test:report-widget-layout --prefix server

# Mapa tool → dominio
npm run test --prefix server -- tool-domain-map
```

---

## Apéndice C — Acceso y seguridad

- Rutas `/api/assistant/*` requieren **Firebase Auth** (`requireAuth`).
- Además, el usuario debe tener **acceso Turbo** habilitado (`requireTurboAssistantAccess`) — flag administrable por usuario.
- La API key Gemini vive **solo en servidor** (`ASSISTANT_GEMINI_KEY` / Firebase Secret); nunca en el cliente.
- Cada tool valida permisos de vista/edición contra el `userId` del contexto.

---

*Fin del documento. Autocontenido para ingeniería, operación y portabilidad del sistema Turbo.*
