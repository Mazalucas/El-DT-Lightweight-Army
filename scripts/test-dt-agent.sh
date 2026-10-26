#!/usr/bin/env bash
# Tests: dt-agent hace cumplir el contrato de vitals/specs/agent-inbox.md.
# Corre en una copia temporal; no toca el repo.
set -uo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/scripts" "$T/vitals/config" "$T/vitals/ops"
cp -R "$SRC/scripts/lib" "$SRC/scripts/dt-agent.rb" "$T/scripts/"
cd "$T"
printf 'version: 1\nupdated: "x"\nteam:\n  - id: ana\n    name: "Ana"\n    role: "owner"\n' > vitals/config/roster.yaml
ana_session() { mkdir -p vitals/ops; printf 'operator:\n  id: ana\n  name: Ana\n' > vitals/ops/session.yaml; }

FAIL=0
a() { ruby scripts/dt-agent.rb "$@"; }
ok()   { if "$@" >/dev/null 2>&1; then echo "  OK   $DESC"; else echo "  FAIL $DESC"; FAIL=1; fi; }
nope() { if "$@" >/dev/null 2>&1; then echo "  FAIL $DESC (debía rechazar)"; FAIL=1; else echo "  OK   $DESC"; fi; }

DESC="register rechaza owner que no es humano del roster"; nope a register --id bot1 --name B --owner nadie --runtime automation --scope docs
DESC="register crea alta pending";                         ok   a register --id bot1 --name "Bot uno" --owner ana --runtime automation --scope "docs/"
DESC="alta deja pedido en el inbox del owner";             ok   ls vitals/work/inbox/ana/*-bot1-alta-bot1.md
DESC="login rechaza agente pending";                       nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb login
DESC="un agente no se autoactiva";                         nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb activate bot1
DESC="activate rechaza --as";                              nope env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate bot1 --as ana
ana_session
DESC="el owner activa";                                    ok   env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate bot1
DESC="activate deja status_by del owner";                  ok   grep -q 'status_by: "ana"' vitals/config/roster.yaml
a register --id bot2 --name "Bot dos" --owner ana --runtime cursor-cloud --scope "tests/" >/dev/null
ana_session; env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate bot2 >/dev/null
DESC="login de agente activo escribe sesión";              ok   env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb login
DESC="sesión marcada kind: agent";                         ok   grep -q "kind: agent" vitals/ops/session.yaml

export DT_AGENT_ID=bot1
M="$(a send --to bot2 --type request --slug "Revisar tests" --text "corré la suite")"; F="$(basename "$M")"
DESC="send crea mensaje open";                             ok   grep -q "status: open" "$M"
DESC="send rechaza duplicado abierto";                     nope a send --to bot2 --type request --slug "revisar tests" --text x
DESC="no-dueño no cambia estado";                          nope a claim "$F"
DESC="type inválido";                                      nope a send --to bot2 --type chisme --slug q --text x

export DT_AGENT_ID=bot2
DESC="dueño toma (claimed)";                               ok   a claim "$F"
DESC="decline exige motivo";                               nope a decline "$F"

export DT_AGENT_ID=bot1
a send --to bot2 --type fyi --slug b --text x >/dev/null
a send --to bot2 --type fyi --slug c --text x >/dev/null
DESC="tope de pendientes por remitente";                   nope a send --to bot2 --type fyi --slug d --text x
C="$(ls vitals/work/inbox/bot2/*-bot1-b.md)"
DESC="remitente cancela (status cancelled)";               ok   a cancel "$C" --note "ya no hace falta"
DESC="cancel deja cancelled en el archivo";                ok   grep -q "status: cancelled" "$C"
DESC="otro no cancela pedido ajeno";                       nope env DT_AGENT_ID=bot2 ruby scripts/dt-agent.rb cancel "$C" --note x

export DT_AGENT_ID=bot2
a done "$F" --note listo >/dev/null
for f in vitals/work/inbox/bot2/*.md; do a decline "$(basename "$f")" --note limpieza >/dev/null 2>&1; done

P="$F"; THREAD_BLOCKED=1
for i in 1 2 3 4; do
  if [ $((i % 2)) -eq 1 ]; then fr=bot2; to=bot1; else fr=bot1; to=bot2; fi
  R="$(DT_AGENT_ID=$fr a send --to $to --type question --slug "h$i" --text x --reply-to "$P" 2>&1)" || { echo "    hilo $i: $R"; THREAD_BLOCKED=0; break; }
  P="$(basename "$R")"
done
DESC="hilo entre agentes hasta el tope";                   ok   test "$THREAD_BLOCKED" = 1
DESC="hilo entre agentes pasa el tope → escalar";          nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb send --to bot2 --type question --slug h5 --text x --reply-to "$P"
DESC="a un humano sí se le puede seguir escribiendo";      ok   env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb send --to ana --type question --slug escalo --text x --reply-to "$P"

DESC="activate/pause/retire rechazan modo agente (DT_AGENT_ID)"; nope env DT_AGENT_ID=bot2 ruby scripts/dt-agent.rb pause bot2
ana_session; env -u DT_AGENT_ID ruby scripts/dt-agent.rb pause bot2 >/dev/null
DESC="agente pausado no recibe";                           nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb send --to bot2 --type fyi --slug z --text x
DESC="archive mueve cerrados";                             ok   a archive
DESC="mensaje archivado con registro";                     ok   grep -q "## Registro" "vitals/work/inbox/bot2/archive/$F"

# --- pausa y carril prioritario ---
as() { local id="$1"; shift; DT_AGENT_ID="$id" ruby scripts/dt-agent.rb "$@"; }
for n in rp rx sa sb; do
  a register --id $n --name "Agente $n" --owner ana --runtime x --scope y >/dev/null
  ana_session
  env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate $n >/dev/null 2>&1
done

# tope de pausas por miembro
for i in 1 2 3 4 5; do
  P="$(as sb send --to rp --type fyi --slug "p$i" --text x)"; as rp park "$(basename "$P")" --note "libero cupo" >/dev/null
done
P="$(as sb send --to rp --type fyi --slug p6 --text x)"
DESC="el sexto mensaje en pausa se rechaza (tope 5)";      nope as rp park "$(basename "$P")" --note x

# pausa libera cupo del remitente
M1="$(as sa send --to rx --type request --slug uno --text x)"; F1="$(basename "$M1")"
M2="$(as sa send --to rx --type request --slug dos --text x)"; F2="$(basename "$M2")"
M3="$(as sa send --to rx --type request --slug tres --text x)"
DESC="el cuarto pendiente del remitente se rechaza";       nope as sa send --to rx --type request --slug cuatro --text x
DESC="pausar exige motivo";                                nope as rx park "$F1"
DESC="solo el dueño pausa";                                nope as sa park "$F1" --note x
DESC="el dueño pausa con motivo";                          ok   as rx park "$F1" --note "entra otro trabajo"
DESC="pausar libera cupo: el remitente envía otro";        ok   as sa send --to rx --type request --slug cuatro --text x
DESC="reenviar lo que está en pausa se rechaza (duplicado)"; nope as sa send --to rx --type request --slug uno --text x
DESC="done no aplica a un mensaje en pausa";               nope as rx done "$F1"
DESC="resume vuelve al estado anterior (open)";            ok   as rx resume "$F1"
DESC="resume deja el mensaje open";                        ok   grep -q "status: open" "vitals/work/inbox/rx/$F1"
DESC="resume no aplica a un mensaje que no está en pausa"; nope as rx resume "$F1"

# escalar sin tocar lo pendiente
DESC="escalate exige motivo";                              nope as sa escalate "$F1"
DESC="solo el remitente escala su pedido";                 nope as sb escalate "$F1" --reason x
DESC="escalate abre el urgente en priority/";              ok   as sa escalate "$F1" --reason "bloquea el release"
DESC="el urgente es type escalate";                        ok   grep -rq "type: escalate" vitals/work/inbox/rx/priority
DESC="el original sigue open";                             ok   grep -q "status: open" "vitals/work/inbox/rx/$F1"
DESC="escalar no consume cupo (sa sigue con 3 pendientes)"; ok  bash -c "ls vitals/work/inbox/rx/*-sa-*.md | wc -l | grep -q 4"
DESC="el owner del destinatario recibe aviso";             ok   ls vitals/work/inbox/ana/*-sa-urgente-para-rx.md
DESC="members muestra el carril ocupado";                  ok   bash -c "ruby scripts/dt-agent.rb members | grep '^rx ' | grep -q 'carril=ocupado'"
DESC="inbox pone el urgente primero";                      ok   bash -c "DT_AGENT_ID=rx ruby scripts/dt-agent.rb inbox | sed -n 2p | grep -q URGENTE"
DESC="el urgente no se pausa";                             nope as rx park "$(basename "$(ls vitals/work/inbox/rx/priority/*.md | head -1)")" --note x
DESC="send no puede crear type escalate";                  nope as sa send --to rx --type escalate --slug x --text x
SB="$(as sb send --to rx --type request --slug otro --text x)"
DESC="con el carril ocupado otro remitente no puede escalar"; nope as sb escalate "$(basename "$SB")" --reason "yo también"
DESC="el rechazo apunta al owner del destinatario";        ok   bash -c "DT_AGENT_ID=sb ruby scripts/dt-agent.rb escalate '$(basename "$SB")' --reason y 2>&1 | grep -q 'send --to ana'"
U="$(basename "$(ls vitals/work/inbox/rx/priority/*.md | head -1)")"
DESC="rechazar un urgente exige motivo";                   nope as rx decline "$U"
DESC="rx rechaza el urgente con motivo";                   ok   as rx decline "$U" --note "no es de mi scope"
DESC="el rechazo le llega a quien escaló";                 ok   ls vitals/work/inbox/sa/*-rx-urgente-rechazado.md
DESC="el rechazo le llega a su owner";                     ok   ls vitals/work/inbox/ana/*-rx-urgente-rechazado.md
DESC="liberado el carril, otro puede escalar";             ok   as sb escalate "$(basename "$SB")" --reason "ahora sí"
DESC="sent lista lo enviado con su estado";                ok   bash -c "DT_AGENT_ID=sb ruby scripts/dt-agent.rb sent | grep -q URGENTE"
DESC="fyi trae expires por defecto";                       ok   bash -c 'M=$(DT_AGENT_ID=sb ruby scripts/dt-agent.rb send --to rp --type fyi --slug ex --text x); grep -q "^expires:" "$M"'
DESC="broadcast crea dos archivos";                        ok   bash -c 'DT_AGENT_ID=sb ruby scripts/dt-agent.rb send --to rp,rx --type fyi --slug bc --text x | wc -l | grep -q 2'

# --- dt-doctor: el commit que cambia el estado debe ser del email del owner ---
G="$(mktemp -d)"; trap 'rm -rf "$T" "$G"' EXIT
mkdir -p "$G/vitals/config" && cp -R "$SRC/scripts" "$G/scripts" && cp "$SRC/vitals/config/collaboration.yaml.example" "$G/vitals/config/" 2>/dev/null
(cd "$G" && git init -q && git config user.name t && git config user.email t@x)
cat > "$G/vitals/config/roster.yaml" <<EOF2
version: 1
updated: "x"
team:
  - id: ana
    name: Ana
    email: ana@x.com
  - id: bot
    kind: agent
    name: Bot
    owner: ana
    runtime: x
    scope: y
    status: pending
EOF2
(cd "$G" && git add -A && git -c user.email=bot@x.com commit -qm base)
sed -i.bak 's/status: pending/status: active\n    status_by: "ana"\n    status_at: "2026-10-24T10:00:00+02:00"/' "$G/vitals/config/roster.yaml" && rm "$G/vitals/config/roster.yaml.bak"
(cd "$G" && git add vitals/config/roster.yaml && git -c user.email=bot@x.com commit -qm "forjado")
DESC="doctor: estado commiteado por otro email → error";   ok   bash -c "cd '$G' && ruby scripts/dt-doctor.rb 2>&1 | grep -q 'no el owner ana'"
(cd "$G" && git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -q --amend --reset-author --no-edit -c user.email=ana@x.com 2>/dev/null || git -c user.email=ana@x.com commit -q --amend --reset-author --no-edit)
DESC="doctor: estado commiteado por el owner → sin error"; nope bash -c "cd '$G' && ruby scripts/dt-doctor.rb 2>&1 | grep -q 'no el owner ana'"

# doctor: carril y pausa
mkdir -p "$G/vitals/work/inbox/bot/priority"
for n in 1 2; do
  printf -- '---\nfrom: ana\nto: bot\ntype: escalate\nstatus: open\ncreated: "%s"\nescalates: x.md\nreason: r\nexpires: "2999-01-01"\n---\n' "$(date -u +%Y-%m-%dT%H:%M:%S+00:00)" > "$G/vitals/work/inbox/bot/priority/2026102$n-1000-ana-u$n.md"
done
DESC="doctor: dos urgentes abiertos → error";              ok   bash -c "cd '$G' && ruby scripts/dt-doctor.rb 2>&1 | grep -q 'el carril admite uno'"
rm -f "$G"/vitals/work/inbox/bot/priority/*.md
printf -- '---\nfrom: ana\nto: bot\ntype: request\nstatus: paused\ncreated: "2026-10-01T10:00:00+02:00"\n---\n' > "$G/vitals/work/inbox/bot/20261001-1000-ana-p.md"
DESC="doctor: pausa sin motivo → error";                   ok   bash -c "cd '$G' && ruby scripts/dt-doctor.rb 2>&1 | grep -q 'en pausa sin paused_reason'"
printf -- '---\nfrom: ana\nto: bot\ntype: request\nstatus: open\ncreated: "2026-10-01T10:00:00+02:00"\n---\n' > "$G/vitals/work/inbox/bot/20261001-1000-ana-e.md"
printf -- '---\nfrom: ana\nto: bot\ntype: escalate\nstatus: open\ncreated: "2026-10-01T10:00:00+02:00"\n---\n' > "$G/vitals/work/inbox/bot/20261001-1000-ana-fuera.md"
DESC="doctor: type escalate fuera de priority/ → error";   ok   bash -c "cd '$G' && ruby scripts/dt-doctor.rb 2>&1 | grep -q 'type escalate solo va en priority'"

DESC="register rechaza id inválido";                       nope a register --id '../../pwn' --name x --owner ana --runtime x --scope y
export DT_AGENT_ID=bot1
FYI="$(a send --to ana --type fyi --slug ackme --text x)"
a send --to ana --type fyi --slug ackme2 --text x >/dev/null
DESC="ack --fyi cierra abiertos";                          ok   a ack --fyi
ana_session; env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate bot2 >/dev/null
MOWN="$(env DT_AGENT_ID=bot2 ruby scripts/dt-agent.rb send --to bot1 --type request --slug ob2 --text x)"
FOWN="$(basename "$MOWN")"
DESC="owner on-behalf park";                                ok   env -u DT_AGENT_ID ruby scripts/dt-agent.rb park "$FOWN" --on-behalf --note "prioridad"
export DT_AGENT_ID=bot2

touch vitals/ops/canonical-checkout.yaml
DESC="checkout oficial bloquea altas";                     nope a register --id bot3 --name C --owner ana --runtime x --scope y

[ "$FAIL" = 0 ] && echo "test-dt-agent: OK" || { echo "test-dt-agent: FALLÓ"; exit 1; }
