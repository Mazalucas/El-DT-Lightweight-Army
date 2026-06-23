---
id: DOC-MOD-FACTURAS-001
title: Requisitos mínimos — factura autónomo (España)
type: reference
status: draft
owner: lucas-prime
created: 2026-06-02
updated: 2026-06-02
tags:
  - facturas
  - autonomo
  - españa
  - fiscal
domain:
  - modules
summary: Checklist de campos habituales en facturas de autónomos en España; validar con gestoría antes de producción.
related:
  - DOC-OV-001
priority: medium
intended_audience:
  - lucas
  - ai-agents
source_of_truth: true
module_id: facturas-autonomo-es
---

# Requisitos mínimos — factura autónomo (España)

> **No es asesoramiento fiscal.** Usá esto como checklist de implementación; confirmá con tu gestoría lo que aplique a tu actividad.

Referencia orientativa: [Real Decreto 1619/2012](https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696) (registro de facturas expedidas).

## Datos del emisor (autónomo)

- [ ] Nombre y apellidos (o razón social)
- [ ] NIF
- [ ] Domicilio fiscal completo
- [ ] Datos de contacto (opcional pero recomendable)

## Datos del destinatario (cliente)

- [ ] Nombre / razón social
- [ ] NIF / CIF (obligatorio salvo excepciones legales)
- [ ] Domicilio (recomendado)

## Datos de la factura

- [ ] **Número** de factura (correlativo en la serie; sin huecos indebidos)
- [ ] **Fecha** de expedición
- [ ] **Descripción** de operaciones / conceptos (clara y desglosada)
- [ ] **Tipo impositivo** de IVA (21 %, 10 %, 4 %, exento…) por línea si difiere
- [ ] **Base imponible** por tipo / total
- [ ] **Cuota de IVA**
- [ ] **Importe total** a pagar

## Retención IRPF (si aplica)

Muchos autónomos en servicios profesionales llevan retención del cliente:

- [ ] Porcentaje IRPF (p. ej. 15 % o 7 % en ciertos casos)
- [ ] Importe retenido
- [ ] **Líquido a percibir** (total − retención)

Marcá en tus plantillas si **siempre** facturás con retención o depende del cliente.

## Otros campos útiles

- [ ] Forma de pago / vencimiento
- [ ] IBAN (si cobrás por transferencia)
- [ ] Referencia a pedido o contrato
- [ ] Nota legal o pie de factura acordado con gestoría

## Mapeo con tus plantillas

Cuando subas archivos a [../assets/templates/](../assets/templates/), completá esta tabla:

| Campo requerido | ¿En plantilla? | Nombre del campo / celda | Notas |
|-----------------|----------------|--------------------------|-------|
| Número factura | | | |
| Fecha | | | |
| Emisor NIF | | | |
| Cliente NIF | | | |
| Concepto | | | |
| Base / IVA / Total | | | |
| IRPF | | | |

## Próximo paso técnico

1. Inventariar plantillas en `assets/templates/`.
2. Definir `schema` JSON/YAML del emisor, cliente y líneas de factura.
3. Elegir motor de generación (p. ej. docx template fill, PDF, o HTML → print).
