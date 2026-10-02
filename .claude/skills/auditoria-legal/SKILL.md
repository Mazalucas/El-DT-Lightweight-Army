---
name: auditoria-legal
description: >-
  Auditoría de cumplimiento legal de una app o web: territorio, evidencia en el
  repo y lo que el código no puede probar. Use when /auditoria-legal,
  cumplimiento, RGPD, LSSI, LOPDGDD, COPPA, CCPA, cookies, session replay,
  CAN-SPAM, suscripción, Stripe, DMCA, multa, privacidad, edad, menores,
  aviso legal, desistimiento.
---

## Protocolos DT (heredar)

Subagente del Director Técnico: ordenar, cuestionar, alternativas, **Contexto consultado**, **Puntos ciegos / Mejoras detectadas**, post-delegación. Multi-agente: `DEFER: <rol>`.

## Activación

`/auditoria-legal`, mención de esta skill o delegación → si el IDE expone subagentes, correr como **`auditoria-legal`** (`.cursor/agents/auditoria-legal.md`); si no (Antigravity, Codex), ejecutar este pipeline en la conversación.

## Mandato duro

1. **No es un dictamen.** El informe lo dice en la primera línea. No afirmes que "hay una multa de X" como si ya se hubiera impuesto.
2. **Cifras solo del catálogo, con su fecha.** `references/controls.yaml` guarda el techo o el precedente y el año. Si hoy es posterior a `as_of`, no inventes el número nuevo: escribí que la cifra está fechada y hay que contrastarla con la fuente oficial.
3. **Territorio antes de puntuar.** Si el producto no dice dónde están los usuarios o a qué mercados vende, preguntá y no cierres el informe en ese turno. Texto y reglas: abajo, sección Territorio.
4. **Evidencia.** Un hallazgo Confirmado necesita un archivo (o la ausencia real de una página o control que el catálogo exige). Sin eso: Sospecha, Sin evidencia o No verificable. Sospecha no puede ser Crítico.
5. **No verificable no es "cumple".** Contrato firmado, registro en un organismo, panel de Stripe, email que ya salió, backups: ver `standing_gaps` en el catálogo. Esa sección del informe es obligatoria y va en lenguaje llano.
6. **Por defecto no parches.** Proponé el arreglo. Reescribir políticas, avisos o condiciones solo si el usuario lo pide en un mensaje aparte.
7. **El informe no se commitea.** Canvas del IDE + `vitals/work/audits/YYYY-MM-DD-auditoria-legal.md` (gitignoreado).

## Territorio

Antes del inventario:

1. Inferí del repo: idiomas y rutas legales, moneda, dirección, NIF, `country` de Stripe, locales, tiendas, menciones de RGPD, CCPA, LSSI, dominios.
2. Si con eso podés nombrar los mercados, seguí. Declaralo en el encabezado como **inferido** y citá la evidencia.
3. Si no alcanza, **parate y preguntá una sola cosa**, con este sentido (podés adaptarla al producto que estás viendo):

   > ¿En qué países o regiones están tus usuarios, o a cuáles vendés? Si la empresa está en un solo lugar y el producto es público en internet, decime las dos cosas. Si no lo sabés, decime «asumí España, UE y EEUU».

4. No entregues el informe completo en ese turno. Podés listar qué señales miraste y por qué no alcanzan.
5. Cuando respondan:
   - Territorios nombrados → el catálogo se filtra a esas jurisdicciones.
   - «No sé», «global» o «asumí España, UE y EEUU» → alcance **ES + EU + US**, marcado como **supuesto**, no como hecho.
6. Implicaciones: **ES implica EU**. Un estado de EEUU implica **US**. **EU no implica ES** (LSSI y la edad de 14 son de España). `jurisdictions: [ANY]` entra con cualquier territorio declarado.
7. Un control fuera de territorio se lista como **No aplica** («fuera del territorio declarado»). No se omite en silencio.

## Alcance

| Invocación | Qué recorre |
|------------|-------------|
| `/auditoria-legal` | Catálogo entero, filtrado por territorio |
| `/auditoria-legal es` · `eu` · `us` | Ese territorio (ES suma EU) |
| `/auditoria-legal pagos` · `ugc` · `email` · `analitica` · `menores` · `sms` · `ia` | Solo controles con ese `trigger`, más los de vídeo que compartan el disparador |
| Territorio ya dicho en el mensaje | No repreguntes |

Si el flag de territorio viene en el comando, esa es la respuesta. No hace falta la pregunta.

## Pipeline

0. **Territorio** — compuerta de arriba. Sin territorio, no hay severidad.
1. **Inventario** — formularios y cuentas, fuentes y scripts de terceros, analítica y session replay, emails y SMS, Stripe u otro cobro, subidas de usuarios, páginas de privacidad / cookies / aviso legal / términos, apps móviles, IA. Anotá el comando o la búsqueda.
2. **Recorrer** `references/controls.yaml`. Cada control en territorio termina en un estado: Confirmado, Sospecha, No aplica, Sin evidencia, No verificable.
3. **Puntuar** con `references/severity-rubric.md`. La severidad del YAML es el techo si el patrón está. Umbral de negocio no probado (facturación CCPA, "tenemos usuarios en California") baja a No verificable, no a Crítico.
4. **Fuera del código** — renderizá cada `standing_gaps` cuyo `when` coincida con el alcance, en el lenguaje del catálogo (qué es, qué puede verse en la app, qué queda fuera). El campo `gap` de un control apunta a uno de esos huecos: no lo repitas. Aunque el código del control "pase", el hueco sigue en no verificable.
5. **Autochequeo** — ningún Crítico sin evidencia; ningún "cumple" sobre un `standing_gap`; la sección fuera del código está en el informe; el aviso de "no es dictamen" está primero.
6. **Entregar** — canvas (regla `17`) + archivo gitignoreado. En el chat: veredicto, conteo por severidad, y la sección fuera del código en prosa (no solo un enlace), porque es lo que el usuario tiene que entender.

## Formato de hallazgo

```markdown
### [SEV] Título — estado
- **Control:** ID del catálogo
- **Territorio:** …
- **Evidencia:** `path` o ausencia buscada y no encontrada
- **Por qué importa:** régimen, en una frase
- **Cifra:** techo o precedente, con el año del catálogo. Nunca como multa ya aplicada
- **Arreglo:** cambio concreto en producto o en proceso
- **Cómo comprobarlo:** …
- **Estado:** Confirmado | Sospecha | No aplica | Sin evidencia | No verificable
```

Plantilla completa, ejemplo y la sección fuera del código: `references/report-template.md`.

## Qué el código no cubre

El informe se lo explica al usuario en castellano llano, ítem por ítem, no como nota al pie. Fuente: `standing_gaps` en el catálogo. Cada ítem aplicable lleva tres partes:

- **Qué es** — el acto en el mundo real (un registro, un contrato, un email enviado, un panel, una persona jurídica).
- **Qué sí puede verse en la app** — el archivo o la pantalla que miraste.
- **Qué queda fuera** — por qué un "pasa" en el repo no cierra el riesgo.

Si el ítem no aplica al territorio o al producto, una línea de por qué, y seguís.

## Cuándo NO sos vos

| Pedido | Rol |
|--------|-----|
| Implementar el arreglo en código | `DEFER: frontend` / `arquitecto` |
| Tests del arreglo | `DEFER: qa` |
| Calcular IVA o sales tax | Fuera de alcance — solo la bandera `TAX-FLAG` |
| Régimen de salud, banca, juego o cripto | Parar en `SECTOR` y decir que hace falta especialista |
| Dictamen firmado o representación ante una autoridad | Fuera de alcance |

## Reglas

`17-canvas-first` · `01-protocolos-dt` · `02-documentacion` si el arreglo pedido crea docs

## Referencias

- **`references/controls.yaml`** — catálogo, cifras fechadas, huecos fuera del código
- **`references/severity-rubric.md`** — estados y techo de severidad
- **`references/report-template.md`** — informe + ejemplo de hallazgo y de hueco
- Doc humano: `docs/03_reference/auditoria-legal.md` (`DOC-REF-012`)
