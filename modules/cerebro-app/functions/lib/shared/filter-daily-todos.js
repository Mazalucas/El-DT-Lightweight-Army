function isSameCalendarDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfDay(d) {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
}
export function filterDailyTodos(todos, now = new Date()) {
    const open = todos.filter((t) => t.status === 'open');
    const todayStart = startOfDay(now).getTime();
    const today = [];
    const overdue = [];
    const noDate = [];
    for (const t of open) {
        if (!t.dueAt) {
            noDate.push(t);
            continue;
        }
        const due = new Date(t.dueAt);
        if (due.getTime() < todayStart) {
            overdue.push(t);
        }
        else if (isSameCalendarDay(due, now)) {
            today.push(t);
        }
    }
    const byDue = (a, b) => (a.dueAt ? new Date(a.dueAt).getTime() : 0) - (b.dueAt ? new Date(b.dueAt).getTime() : 0);
    return {
        today: today.sort(byDue),
        overdue: overdue.sort(byDue),
        noDate: noDate.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')),
    };
}
export function meetingsInLastDays(meetings, days, now = new Date()) {
    const cutoff = now.getTime() - days * 86400000;
    return meetings.filter((m) => m.startedAt && new Date(m.startedAt).getTime() >= cutoff).length;
}
