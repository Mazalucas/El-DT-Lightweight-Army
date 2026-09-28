# Novedades

Historial de releases de **El DT**. La versión actual está en [`VERSION`](VERSION).

Cada `/guardar` que bumpéa agrega una entrada acá y publica la misma nota en [GitHub Releases](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases).

Las notas salen del tag y del commit de esa versión. No hay releases inventados para números que no se taguearon.

## [1.9.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.9.0) - 2026-09-28

Minor. Quien ya usa el DT sigue con los mismos comandos.

- **Gmail y Calendar.** `/gmail` y `/calendar` comparten el login de `/drive`. El DT pregunta si autorizás una app o las tres. Gmail prepara borradores y no envía mail. Calendar lista y crea eventos.
- **Versión del producto.** En un repo que adopta el DT, `/guardar` conserva el semver de la app. No copia el número del framework.
- **Esta página.** El historial queda acá, enlazado desde el README. El mismo texto sale en GitHub Releases.

## [1.8.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.8.0) - 2026-09-23

Minor. Publicación oficial, contexto local y carriles de video.

- **`/oficial`.** Esta carpeta puede pushear al remoto oficial. `/guardar` corre el gate antes del bump. Sesión, inbox y perfil de `/dt-config` quedan en la máquina. En ese remoto, `roster.yaml` viaja con `team: []`.
- **`/dt-config`.** Elige qué reglas extra entran en cada mensaje. El perfil no pide `/yo`.
- **Video.** [`tools/video/ROUTING.md`](tools/video/ROUTING.md): `/recordly`, `/brag`, Hyperframes o `/remotion`.
- **`/analisis-propuesta`.** Panel de modelos distintos al autor, en dos rondas, solo diagnóstico.
- **Postura.** `/yo` deja el trabajo en `personal` o `team`. En el checkout oficial vive en `vitals/ops/collaboration.local.yaml`.
- **Atelier.** El router carga el context adapter de Impeccable y su playbook.

## [1.7.11](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.11) - 2026-08-04

`/ordenar` y `/hack`: skills, subagente hack-audit, docs y README.

## [1.7.10](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.10) - 2026-07-30

`/drive` documentado en el README: para qué sirve y el flujo `/yo` → `/drive` → consulta.

## [1.7.9](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.9) - 2026-07-30

Cada `/guardar` con cambios bumpéa, sincroniza y tagea.

## [1.7.8](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.8) - 2026-07-21

Sync de semver unificado y corrección de `dt-tag-version.sh` en el release.

## [1.7.7](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.7) - 2026-07-21

Tag obligatorio en `/guardar` cuando cambia `VERSION`.

## [1.7.6](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.6) - 2026-07-21

Menos contexto fijo: reglas condicionales, Esencia DT y `GUIDE.md`.

## [1.7.3](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.7.3) - 2026-06-30

Template DT v1.7.3, junto con el tag de Cerebro App v1.54.

## [1.6.3](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.6.3) - 2026-05-29

Catálogo de 20 subagentes.

## [1.6.2](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.6.2) - 2026-05-29

Pack de skills de marketing.

## [1.6.1](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.6.1) - 2026-05-28

Template v1.6.1.

## [1.6.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.6.0) - 2026-05-27

Cerebro colaborativo, sesión local y rutina Git.

- Ritual `/actualizar` → `/yo` → `/guardar`.
- La sesión local la crea solo `/yo`.
- `DOC-OV-004`, `DOC-REF-001`, `DOC-OPS-001`.

## [1.4.1](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.4.1) - 2026-04-20

Banner del README y asset en el repo.

## [1.4.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.4.0) - 2026-04-19

README en inglés, quick setup y comandos de IDE explícitos.

## [1.3.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.3.0) - 2026-04-19

README de adopción, protocolos DT, Vitals y créditos.

## [1.2.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.2.0) - 2026-04-19

Vitals, pipeline macro/micro, `/fast-lane` y docs de adopción.

## [1.1.0](https://github.com/Mazalucas/El-DT-Lightweight-Army/releases/tag/v1.1.0) - 2026-02-05

Soporte multi-IDE: Cursor y Antigravity.

---

Tags que no son el semver del DT: `pitch-media`, `cerebro-app-v1.54`.
