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

FAIL=0
a() { ruby scripts/dt-agent.rb "$@"; }
ok()   { if "$@" >/dev/null 2>&1; then echo "  OK   $DESC"; else echo "  FAIL $DESC"; FAIL=1; fi; }
nope() { if "$@" >/dev/null 2>&1; then echo "  FAIL $DESC (debía rechazar)"; FAIL=1; else echo "  OK   $DESC"; fi; }

DESC="register rechaza owner que no es humano del roster"; nope a register --id bot1 --name B --owner nadie --runtime automation --scope docs
DESC="register crea alta pending";                         ok   a register --id bot1 --name "Bot uno" --owner ana --runtime automation --scope "docs/"
DESC="alta deja pedido en el inbox del owner";             ok   ls vitals/work/inbox/ana/*-bot1-alta-bot1.md
DESC="login rechaza agente pending";                       nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb login
DESC="un agente no se autoactiva";                         nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb activate bot1
DESC="el owner activa";                                    ok   env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate bot1 --as ana
DESC="activate deja status_by del owner";                  ok   grep -q 'status_by: "ana"' vitals/config/roster.yaml
a register --id bot2 --name "Bot dos" --owner ana --runtime cursor-cloud --scope "tests/" >/dev/null
env -u DT_AGENT_ID ruby scripts/dt-agent.rb activate bot2 --as ana >/dev/null
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
DESC="remitente cancela (mensaje type cancel)";            ok   a cancel "$C" --note "ya no hace falta"
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

DESC="activate/pause/retire rechazan modo agente (DT_AGENT_ID)"; nope env DT_AGENT_ID=bot2 ruby scripts/dt-agent.rb pause bot2 --as ana
env -u DT_AGENT_ID ruby scripts/dt-agent.rb pause bot2 --as ana >/dev/null
DESC="agente pausado no recibe";                           nope env DT_AGENT_ID=bot1 ruby scripts/dt-agent.rb send --to bot2 --type fyi --slug z --text x
DESC="archive mueve cerrados";                             ok   a archive
DESC="mensaje archivado con registro";                     ok   grep -q "## Registro" "vitals/work/inbox/bot2/archive/$F"

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

touch vitals/ops/canonical-checkout.yaml
DESC="checkout oficial bloquea altas";                     nope a register --id bot3 --name C --owner ana --runtime x --scope y

[ "$FAIL" = 0 ] && echo "test-dt-agent: OK" || { echo "test-dt-agent: FALLÓ"; exit 1; }
