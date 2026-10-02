# Informe de auditoría legal

Para el canvas y para `vitals/work/audits/YYYY-MM-DD-auditoria-legal.md` (gitignoreado).

El chat, si el informe es largo, lleva el veredicto, el conteo y la sección **Qué el código no cubre** en prosa. Esa sección no se esconde detrás del archivo.

## Encabezado

```markdown
# Auditoría legal — {producto} — {fecha}

Esto no es un dictamen ni una opinión de abogado. Señala patrones en el repositorio y huecos que el código no puede cerrar. Las cifras son techos legales o un fallo concreto, con el año del catálogo. No son multas ya aplicadas.

- **Territorio:** {inferido | declarado | supuesto: ES+EU+US}
- **Evidencia del territorio:** {paths o la frase del usuario}
- **Disparadores vistos:** signup, pagos, email, ugc, …
```

## Cobertura

Tabla corta: control, estado, una línea. Incluye los No aplica. Un control callado no existe.

## Hallazgos

Orden: Crítico confirmado, Alto confirmado, Sospecha, Sin evidencia. Los No verificable van en la sección siguiente, no como si fueran bugs del código.

### Ejemplo calibrado

```markdown
### [Alto] Fuentes de Google en el primer HTML — Confirmado
- **Control:** THIRD-PARTY-IP
- **Territorio:** EU (inferido: política en español y precios en EUR)
- **Evidencia:** `app/layout.tsx` carga `fonts.googleapis.com` sin esperar consentimiento
- **Por qué importa:** la IP del visitante sale hacia Google antes de que elija
- **Cifra:** un fallo de Múnich de 2022 concedió 100 EUR a un demandante. No es una tarifa por visita (catálogo, as_of 2022-01)
- **Arreglo:** autoalojar la fuente y quitar el link al CDN de Google
- **Cómo comprobarlo:** el HTML publicado no pide fonts.googleapis.com
- **Estado:** Confirmado
```

## Qué el código no cubre

Obligatoria. Un párrafo por cada `standing_gap` cuyo `when` coincida con este alcance. Tres frases, en este orden: qué es, qué sí miramos en la app, qué queda fuera y por qué un "pasa" en el repo no lo cierra.

### Ejemplo calibrado

```markdown
### El SDK no es el contrato con quien trata los datos

Firebase y Stripe están en `package.json`, así que hay encargados. El contrato del artículo 28 del RGPD es un documento que alguien acepta en el panel del proveedor o firma aparte. Este repositorio no lo contiene. Que la app arranque no demuestra que ese contrato exista. Queda en no verificable hasta que lo ubiques.
```

## Arreglos primero

Como máximo siete, de P0 a P3, solo sobre lo que el repo sí puede cambiar. Lo que es un registro o un contrato va en una lista aparte, "fuera del código", con el nombre del hueco.

## Cierre

- Contexto consultado (archivos y búsquedas)
- Puntos ciegos: qué superficie no se pudo abrir (panel de Stripe, producción, app store)
- HANDOFF_TO si el usuario pide implementar
