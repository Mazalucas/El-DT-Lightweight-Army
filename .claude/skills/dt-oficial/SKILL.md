---
name: dt-oficial
description: "[Framework] Marcar este checkout como el único que puede publicar al remoto oficial del DT. Use when the user invokes /oficial."
---

# dt-oficial

Spec: [`vitals/specs/canonical-publish.md`](../../../vitals/specs/canonical-publish.md).

Por defecto **ninguna** carpeta publica al DT. Este comando escribe una marca local, gitignored, en la carpeta que el dueño confirma.

Lo que se publica es el framework. No viaja la sesión, el roster con personas, la postura de esta máquina ni el cuaderno `vitals/work/inbox/`. `roster.yaml` en Git se queda con `team: []`. Si el gate sale **50**, esos rastros están en el árbol: no se commitean.

## Invocaciones

| Comando | Acción |
|---------|--------|
| `/oficial` | Mostrar la ruta y pedir confirmación. Sin el sí, no marcar. |
| `/oficial` y en el mismo mensaje ya confirmaron esta ruta | Activar |
| `/oficial off` | Borrar la marca |
| `/oficial status` | Decir si esta carpeta puede publicar |

## Activar

1. Corré sin escribir la marca:

   ```bash
   ./scripts/dt-oficial.sh activate
   ```

2. Si el exit es **2**, mostrale al usuario la carpeta, el `origin` y el login, y preguntá: **¿Marco esta carpeta como el checkout oficial del DT?** Esperá el sí. No pases `--yes` en el mismo turno salvo que ese mensaje ya haya confirmado esa ruta.
3. Con el sí:

   ```bash
   ./scripts/dt-oficial.sh activate --yes
   ```

4. Exit **0** y la salida ya dice que el checkout está activo: no vuelvas a preguntar.
5. Exit **1**: mostrá el motivo y pará. No ofrezcas pedir acceso, ni invitación, ni `gh auth` para publicar el DT con otra cuenta.

## Apagar

```bash
./scripts/dt-oficial.sh off
```

## No hacer

- No marcar una carpeta distinta de la que muestra el script.
- No copiar `vitals/ops/canonical-checkout.yaml` a otro clone.
- No commitear ese archivo.
- No tratar `mode: canonical` ni `/yo` como sustituto de este comando.
