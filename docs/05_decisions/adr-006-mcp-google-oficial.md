---
id: DOC-DEC-006
title: "ADR-006: Descontinuar google-drive-dt — MCP oficiales de Google por IDE"
type: decision
status: canonical
owner: dt-platform
created: 2026-10-02
updated: 2026-10-02
tags:
  - adr
  - google
  - mcp
  - drive
  - gmail
  - calendar
domain:
  - meta
summary: El DT deja de mantener @ibarcarty/mcp-server-google-drive. /drive /gmail /calendar instalan el MCP oficial del IDE (marketplace Cursor o remoto Google).
related:
  - DOC-GUIDE-009
  - DOC-OPS-002
  - DOC-DEC-001
keywords:
  - mcp
  - google-drive-dt
  - marketplace
  - gmail
  - drive
  - calendar
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
review_cycle_days: 180
---

# ADR-006: Descontinuar google-drive-dt — MCP oficiales de Google por IDE

## Summary

El cerebro Google del DT usa los MCP **oficiales** de cada IDE. El paquete propio `@ibarcarty/mcp-server-google-drive` (`google-drive-dt`) queda fuera de mantenimiento.

## Contexto

`google-drive-dt` unificaba Drive, Gmail y Calendar con un Desktop OAuth interno. Gmail ahí solo creaba un borrador suelto (sin hilo ni etiquetas). Ampliar ese paquete competía con:

- Plugins de marketplace de Cursor (`google-drive`, `gmail`, `google-calendar`).
- MCP remotos de Google Workspace (`gmailmcp`, `drivemcp`, `calendarmcp`), ya documentados para Antigravity y Claude.

Mantener un servidor propio era costo continuo contra un producto que Google y Cursor ya publican.

## Decisión

1. **No instalar ni extender** `@ibarcarty/mcp-server-google-drive` desde el DT.
2. **`/drive`, `/gmail`, `/calendar`** instalan y autentican el MCP oficial **según el IDE** (`vitals/specs/google-apps-mcp.md`).
3. La **postura DT** sigue en reglas y skills: Drive solo lectura; Gmail no envía (sí borrador en cadena y etiquetas); Calendar borra solo con confirmación — aunque el oficial tenga tools de más.
4. `./scripts/setup-drive.sh` pasa a guía + `--remove-legacy`. Ya no copia credenciales ni corre `npx … auth`.
5. Selectores locales (`*-context.yaml`, `google-apps.yaml`) se mantienen.

## Alternativas consideradas

- **Seguir afinando `google-drive-dt`:** más tools (threadId, labels, `gmail.modify`). Descartada — duplica el oficial y no vive en el marketplace.
- **Solo Cursor marketplace, sin Antigravity/Claude:** insuficiente para el DT multi-IDE.
- **Segundo MCP (p. ej. Gmail community) sobre la cuenta laboral:** más rápido, pero envía y borra; no es el default del framework.

## Consecuencias

- Cursor: un clic de plugin + auth. Sin JSON Desktop de la empresa.
- Antigravity/Claude: MCP remoto de Google (Developer Preview + client OAuth web). IT deja de distribuir `dt-drive-credentials.json` para el flujo nuevo; puede tener que permitir las apps oficiales en Workspace.
- Quien aún tenga `google-drive-dt` en `mcp.json` lo saca con `--remove-legacy` después de autenticar el oficial.
- El agente **puede** enviar mail o escribir Drive si el oficial lo expone: el freno es la skill, no el servidor.

## Related docs

- Spec: `vitals/specs/google-apps-mcp.md`
- Guía: [drive-cerebro-setup.md](../02_guides/drive-cerebro-setup.md) (`DOC-GUIDE-009`)
- Admin: [drive-google-cloud-admin.md](../06_operations/drive-google-cloud-admin.md) (`DOC-OPS-002`)
