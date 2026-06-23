import { truncateString } from '../lib/text-coerce.js';
const DEFAULT_LIMIT = 120;
function nodeId(type, id) {
    return `${type}:${id}`;
}
export function rebuildGraphEdges(store, opts) {
    const now = new Date().toISOString();
    const edges = [];
    const push = (source, target, kind, weight) => {
        const id = `${source}-${target}-${kind}`;
        edges.push({ id, source, target, kind, weight, updatedAt: now });
    };
    for (const t of store.teams) {
        for (const p of store.people) {
            if (p.teamIds.includes(t.id))
                push(nodeId('person', p.id), nodeId('team', t.id), 'member_of');
        }
    }
    for (const pr of store.projects) {
        for (const p of store.people) {
            if (p.projectIds?.includes(pr.id))
                push(nodeId('person', p.id), nodeId('project', pr.id), 'works_on');
        }
    }
    for (const m of store.meetings) {
        for (const pid of m.personIds) {
            push(nodeId('person', pid), nodeId('meeting', m.id), 'attended');
        }
        for (const pid of m.prospectIds ?? []) {
            push(nodeId('prospect', pid), nodeId('meeting', m.id), 'prospect_attended');
        }
        for (const tid of m.teamIds) {
            push(nodeId('meeting', m.id), nodeId('team', tid), 'tagged');
        }
        for (const pid of m.projectIds) {
            push(nodeId('meeting', m.id), nodeId('project', pid), 'about');
        }
        if (opts?.includeMembers && m.contributorUids?.length) {
            for (const uid of m.contributorUids) {
                push(nodeId('member', uid), nodeId('meeting', m.id), 'contributed');
            }
        }
    }
    for (const t of store.todos) {
        push(nodeId('todo', t.id), nodeId('meeting', t.meetingId), 'from_meeting');
        for (const pid of t.personIds) {
            push(nodeId('person', pid), nodeId('todo', t.id), 'assigned');
        }
    }
    const coCount = new Map();
    for (const m of store.meetings) {
        const ids = m.personIds;
        for (let i = 0; i < ids.length; i++) {
            for (let j = i + 1; j < ids.length; j++) {
                const a = ids[i];
                const b = ids[j];
                const key = a < b ? `${a}|${b}` : `${b}|${a}`;
                coCount.set(key, (coCount.get(key) ?? 0) + 1);
            }
        }
    }
    for (const [key, weight] of coCount) {
        const [a, b] = key.split('|');
        push(nodeId('person', a), nodeId('person', b), 'co_attended', weight);
        push(nodeId('person', b), nodeId('person', a), 'co_attended', weight);
    }
    if (opts?.includeMembers && opts.members?.length) {
        for (const member of opts.members) {
            for (const m of store.meetings) {
                if (m.contributorUids?.includes(member.uid)) {
                    for (const pid of m.personIds) {
                        push(nodeId('member', member.uid), nodeId('person', pid), 'org_member');
                    }
                }
            }
        }
    }
    return edges;
}
export function buildGraphSnapshot(store, opts) {
    const limit = opts?.limit ?? DEFAULT_LIMIT;
    const depth = opts?.depth ?? 2;
    const edges = store.graphEdges?.length ? store.graphEdges : rebuildGraphEdges(store, {
        includeMembers: Boolean(opts?.members?.length),
        members: opts?.members,
    });
    const allNodes = new Map();
    const addNode = (n) => {
        if (!allNodes.has(n.id))
            allNodes.set(n.id, n);
    };
    for (const p of store.people) {
        addNode({ id: nodeId('person', p.id), type: 'person', label: p.displayName, meta: { emails: p.emails } });
    }
    for (const pr of store.prospects.filter((p) => !p.linkedPersonId)) {
        addNode({ id: nodeId('prospect', pr.id), type: 'prospect', label: pr.displayName });
    }
    for (const m of store.meetings) {
        addNode({
            id: nodeId('meeting', m.id),
            type: 'meeting',
            label: truncateString(m.title, 40) ?? m.id,
            meta: { startedAt: m.startedAt },
        });
    }
    for (const pr of store.projects) {
        addNode({ id: nodeId('project', pr.id), type: 'project', label: pr.name });
    }
    for (const t of store.teams) {
        addNode({ id: nodeId('team', t.id), type: 'team', label: t.name });
    }
    for (const t of store.todos.filter((x) => x.status !== 'dismissed').slice(0, 40)) {
        addNode({ id: nodeId('todo', t.id), type: 'todo', label: truncateString(t.text, 36) ?? 'Tarea' });
    }
    if (opts?.members?.length) {
        for (const m of opts.members) {
            addNode({
                id: nodeId('member', m.uid),
                type: 'member',
                label: m.displayName ?? m.email.split('@')[0] ?? m.uid.slice(0, 8),
                meta: { email: m.email },
            });
        }
    }
    let activeIds = new Set();
    if (opts?.center && allNodes.has(opts.center)) {
        activeIds.add(opts.center);
        let frontier = new Set([opts.center]);
        for (let d = 0; d < depth; d++) {
            const next = new Set();
            for (const e of edges) {
                if (frontier.has(e.source) && allNodes.has(e.target))
                    next.add(e.target);
                if (frontier.has(e.target) && allNodes.has(e.source))
                    next.add(e.source);
            }
            for (const id of next)
                activeIds.add(id);
            frontier = next;
        }
    }
    else {
        activeIds = new Set([...allNodes.keys()].slice(0, limit));
    }
    const typeFilter = opts?.types?.length ? new Set(opts.types) : null;
    const nodes = [...allNodes.values()]
        .filter((n) => activeIds.has(n.id) && (!typeFilter || typeFilter.has(n.type)))
        .slice(0, limit);
    const nodeSet = new Set(nodes.map((n) => n.id));
    const graphEdges = edges.filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target));
    return {
        nodes,
        edges: graphEdges,
        generatedAt: new Date().toISOString(),
        centerId: opts?.center,
        depth: opts?.depth,
    };
}
