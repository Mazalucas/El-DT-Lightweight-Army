---
id: DOC-GUIDE-017
title: Revisar antes de instalar algo externo
type: guide
status: canonical
owner: dt-platform
created: 2026-11-13
updated: 2026-11-13
tags:
  - security
  - plugins
  - mcp
summary: Antes de instalar un plugin, MCP, repo o paquete nuevo, el DT para y da un veredicto.
related:
  - DOC-GUIDE-009
  - DOC-META-001
keywords:
  - plugin
  - mcp
  - install
priority: high
intended_audience:
  - engineers
  - ai-agents
source_of_truth: true
domain:
  - meta
review_cycle_days: 90
---

# Revisar antes de instalar algo externo

Cuando alguien pide traer un plugin, un MCP, un repo, un paquete que el proyecto no tenía, o un submodule, el DT no lo instala en el acto.

1. Mira qué es, quién lo publica y qué puede hacer.
2. Dice un solo veredicto: **Instalar**, **Instalar con límite** o **No instalar**.
3. Instala recién en el paso siguiente, y solo si el veredicto fue **Instalar** y ya se lo habían pedido.

Reinstalar lo que el lockfile ya fija no pasa por este freno. Drive, Gmail y Calendar, cuando los pide el propio DT, se resumen en una línea.

El detalle para la IA está en la skill `dt-revisar-instalacion`. Una revisión a fondo del código es `/hack`, y no reemplaza este paso.
