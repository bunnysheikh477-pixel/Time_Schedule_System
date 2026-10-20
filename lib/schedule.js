export const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export const toMin = t => { const [h, m] = (t || "0:0").split(":").map(Number); return h * 60 + m; };
export const fmt = m => String(Math.floor(m / 60) % 12 || 12).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
export const lines = t => (t || "").split("\n").map(s => s.trim()).filter(Boolean);

export const DEF = {
  college: "KIPS College for Girls Gujranwala", departmentsTxt: "Pre-Medical\nPre-Engineering\nICS\nHumanities", classesTxt: "First Year\nSecond Year", title: "Timetable Pre & Reg First Year Classes 2026",
  wef: "2026-09-08", end: "2027-06-30", holidayDates: [],
  campuses: [
    { name: "Satellite Town Campus", short: "C1", sectionsTxt: "PMG1\nPMG2\nPICSPG1" },
    { name: "Model Town Campus", short: "C2", sectionsTxt: "RMG3\nRMG4\nRMG5" }],
  lectures: 7,
  subjects: ["Biology", "English", "Urdu", "Physics", "Chemistry", "Maths", "Computer"],
  profsTxt: "P. Faseeha\nP. Asif\nP. Waqas\nP. Abu Bakar\nP. Azwa\nP. Adil Zaman\nP. Ahsan Maqsood\nP. Namra",
  profSubj: [],
  start: "07:30", len: 50, gap: 0, friStart: "07:30", friLen: 40, friGap: 0,
  breakAfter: 4, breakMin: 30, friBreak: 30, closing: "13:00",
  holidays: ["Sunday"],
  signs: [{ role: "Time Table Incharge", name: "", date: "", img: "" }, { role: "Vice Principal", name: "", date: "", img: "" }, { role: "Principal", name: "", date: "", img: "" }],
  edits: {}
};

// derived context: sections per campus, global section offsets, professor list
export const ctx = c => {
  const secs = c.campuses.map(k => lines(k.sectionsTxt)); let o = 0;
  const off = secs.map(s => { const r = o; o += s.length; return r; });
  return { ...c, secs, off, total: o, profs: lines(c.profsTxt) };
};

export function slots(c, fri) {
  let t = toMin(fri ? c.friStart : c.start);
  const len = fri ? c.friLen : c.len, gap = fri ? c.friGap : c.gap, br = fri ? c.friBreak : c.breakMin, out = [];
  for (let i = 1; i <= c.lectures; i++) {
    out.push({ type: "L", n: i, s: t, e: t + len }); t += len;
    if (i === c.breakAfter) { out.push({ type: "B", s: t, e: t + br }); t += br; } else t += gap;
  }
  return { out, end: out.length ? out[out.length - 1].e : t };
}

// lecture length that makes the last lecture end exactly at closing time
export function fit(c, fri) {
  const N = c.lectures, br = c.breakAfter > 0 ? (fri ? c.friBreak : c.breakMin) : 0, g = fri ? c.friGap : c.gap;
  const gaps = Math.max(0, N - 1 - (c.breakAfter > 0 && c.breakAfter < N ? 1 : 0));
  return Math.max(5, Math.floor((toMin(c.closing) - toMin(fri ? c.friStart : c.start) - br - gaps * g) / N));
}

export function workingCount(c) {
  let n = 0; const a = new Date(c.wef + "T00:00:00Z"), b = new Date(c.end + "T00:00:00Z");
  for (let d = new Date(a); d <= b; d.setUTCDate(d.getUTCDate() + 1)) {
    const nm = DAYS[(d.getUTCDay() + 6) % 7];
    if (!c.holidays.includes(nm) && !c.holidayDates.includes(d.toISOString().slice(0, 10))) n++;
  }
  return n;
}

// base (auto) schedule: teacher index rotates by lecture, global section and day => no clashes while professors >= sections
export function cellOf(x, day, di, ci, s, l) {
  const e = x.edits[`${day}|${ci}|${s}|${l}`];
  if (e) return e;
  const P = x.profs.length, N = x.lectures;
  if (!P) return { sub: "", prof: "" };
  const t = (l + x.off[ci] + s + di) % P;
  return { sub: x.subjects[(x.profSubj[t] ?? t) % N] || "", prof: x.profs[t] };
}

// where is a professor on a given day: array per lecture -> {ci, s} or null
export function whereIs(x, day, di, prof) {
  const r = Array(x.lectures).fill(null);
  x.secs.forEach((ss, ci) => ss.forEach((_, s) => { for (let l = 0; l < x.lectures; l++) if (cellOf(x, day, di, ci, s, l).prof === prof) r[l] = { ci, s }; }));
  return r;
}
const pat = (x, d, di, p) => whereIs(x, d, di, p).map(w => w ? x.campuses[w.ci].short : "–").join("  ");

export function conflictsOf(x, day, di) {
  const out = [];
  for (let l = 0; l < x.lectures; l++) {
    const m = {};
    x.secs.forEach((ss, ci) => ss.forEach((sec, s) => { const p = cellOf(x, day, di, ci, s, l).prof; if (p) (m[p] = m[p] || []).push(`${x.campuses[ci].short} ${sec}`); }));
    Object.entries(m).forEach(([p, w]) => { if (w.length > 1) out.push(`Lecture ${l + 1}: ${p} is in ${w.join(" and ")} at the same time`); });
  }
  return out;
}

/* Move one professor to the campus he wants for some lectures.
   For each such lecture he swaps places with ONE teacher of the target campus in the SAME lecture time.
   Everyone else is untouched. The swapped teacher keeps his lecture time and subject, only his campus/section changes.
   The partner is chosen so that his own campus pattern gets disturbed as little as possible. */
export function planSwaps(x, day, di, prof, want) {
  const ed = { ...x.edits }, t = { ...x, edits: ed }, ops = [];
  const put = (ci, s, l, v) => { ed[`${day}|${ci}|${s}|${l}`] = v; };
  for (let l = 0; l < x.lectures; l++) {
    const me = whereIs(t, day, di, prof)[l], to = want[l];
    if (!me || to == null || to === me.ci || !t.secs[to]?.length) continue;
    const A = cellOf(t, day, di, me.ci, me.s, l);
    let best = null, bs = -1e9;
    t.secs[to].forEach((_, s) => {
      const B = cellOf(t, day, di, to, s, l);
      if (B.prof === prof) return;
      const w = whereIs(t, day, di, B.prof); let sc = 0;
      [l - 1, l + 1].forEach(k => { if (w[k]) sc += w[k].ci === me.ci ? 1 : w[k].ci === to ? -1 : 0; });
      if (sc > bs) { bs = sc; best = { s, B }; }
    });
    if (!best) continue;
    put(me.ci, me.s, l, best.B); put(to, best.s, l, A);
    ops.push({ l, q: best.B.prof, from: to, to: me.ci });
  }
  const affected = [...new Set(ops.map(o => o.q))].map(q => ({ q, before: pat(x, day, di, q), after: pat(t, day, di, q) }));
  return { ops, edits: ed, affected, pBefore: pat(x, day, di, prof), pAfter: pat(t, day, di, prof) };
}
