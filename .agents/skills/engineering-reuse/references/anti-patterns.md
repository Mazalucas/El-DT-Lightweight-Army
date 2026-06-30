# Anti-patterns de ingeniería (reuse)

Señalar estos patrones **antes** de implementar o en Puntos ciegos.

## Código duplicado

| Anti-pattern | Señal | Corrección |
|--------------|-------|------------|
| `utils2.ts`, `helpers-new/` | Sufijos paralelos | Fusionar o extender original |
| Copy-paste service | Misma lógica en 2 handlers | Extraer función compartida |
| `Button` + `ExportButton` idénticos | Solo cambia label | Prop `variant` o `children` |
| Hook duplicado `useX` / `useX2` | Misma responsabilidad | Unificar hook |

## Frontend

| Anti-pattern | Corrección |
|--------------|------------|
| God component (>300 líneas sin split) | Extraer subcomponentes existentes o nuevos con una responsabilidad |
| Inline styles duplicados | Tokens / clases del design system |
| Ignorar handoff Atelier | Implementar `component-specs` |

## Backend

| Anti-pattern | Corrección |
|--------------|------------|
| Nuevo endpoint sin revisar rutas | Extender router/handler existente |
| Validación duplicada en cada handler | Validator compartido en boundary |
| Bypass de capas (SQL en controller) | Repository/Service existente |

## DevOps

| Anti-pattern | Corrección |
|--------------|------------|
| Workflow casi igual al existente | Matrix, reusable workflow, composite action |
| Secrets en YAML | Firebase Secrets / env del runner |
| Script deploy duplicado | Un script en `package.json` referenciado |

## QA

| Anti-pattern | Corrección |
|--------------|------------|
| Setup duplicado por archivo | `beforeAll` + fixtures compartidos |
| Mock inline repetido | Factory en `tests/factories/` |

## Remotion

| Anti-pattern | Corrección |
|--------------|------------|
| Escena clonada con otro título | `defaultProps.title` |
| FadeIn reimplementado | Primitiva en `src/components/remotion/` |
| Asset duplicado en repo | `public/` + `staticFile()` |
