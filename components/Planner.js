import { useState } from "react";
import { whereIs, planSwaps } from "../lib/schedule";

export default function Planner({ x, cur, di, working, apply }) {
  const [p, setP] = useState(0), [want, setWant] = useState({}), [all, setAll] = useState(false);
  const prof = x.profs[p] ?? x.profs[0];
  if (!prof || !cur) return <section className="card"><h3>Professor planner</h3>Add professors and keep at least one working day.</section>;
  const sh = i => x.campuses[i].short;
  const now = whereIs(x, cur, di, prof);
  const w = Array.from({ length: x.lectures }, (_, l) => want[l]);
  const res = (all ? working : [cur]).map(d => ({ d, ...planSwaps(x, d, working.indexOf(d), prof, w) }));
  const changed = res.some(r => r.ops.length);
  const suggestGrouping = () => {
    let best = null;
    // For five lectures this defaults to a 2+3 pattern: lectures 1–2 on
    // one campus, lectures 3–5 on the other. For other counts, split as
    // evenly as possible. Keep the split fixed while choosing the campus
    // order that requires the fewest changes to the current timetable.
    const split = Math.max(1, Math.min(x.lectures - 1, Math.floor(x.lectures / 2)));
    for (let a = 0; a < x.campuses.length; a++) for (let b = 0; b < x.campuses.length; b++) {
      if (a === b) continue;
      const candidate = {};
      let cost = 0;
      now.forEach((slot, l) => {
        const target = l < split ? a : b;
        if (slot && slot.ci !== target) cost++;
        candidate[l] = target;
      });
      if (!best || cost < best.cost) best = { cost, candidate, split, a, b };
    }
    if (best) setWant(best.candidate);
  };
  const map = x.profs.map(n => ({ n, w: whereIs(x, cur, di, n) }));
  return <>
    <section className="card"><h3>Move a professor between campuses</h3>
      <p className="hint">Choose the campus you want for each lecture. The professor swaps places with one teacher of the other campus <b>in the same lecture time</b>. All other teachers keep their lecture times and subjects.</p>
      <div className="col"><label>Professor</label>
        <select value={p} onChange={e => { setP(+e.target.value); setWant({}); }}>{x.profs.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></div>
      <label className="chk"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> Apply to all working days</label>
      <button className="btn o" style={{ marginBottom: 10 }} onClick={suggestGrouping}>Suggest campus grouping</button>
      <p className="hint">The suggestion groups consecutive lectures on one campus, then the remaining lectures on another. Review the proposed swaps before applying; if a swap is not possible, it will be skipped.</p>
      <table className="mini"><thead><tr><th>Lecture</th><th>Now ({cur})</th><th>Move to</th></tr></thead><tbody>
        {now.map((n, l) => <tr key={l}><td>{l + 1}</td>
          <td>{n ? `${sh(n.ci)} · ${x.secs[n.ci][n.s]}` : "Free"}</td>
          <td>{n ? <select value={want[l] ?? ""} onChange={e => setWant(o => { const v = { ...o }; e.target.value === "" ? delete v[l] : v[l] = +e.target.value; return v; })}>
            <option value="">Keep</option>{x.campuses.map((k, i) => <option key={i} value={i}>{k.short} – {k.name}</option>)}</select> : "–"}</td></tr>)}
      </tbody></table>
    </section>

    <section className="card"><h3>What will change</h3>
      {!changed ? <p className="hint">Nothing selected yet.</p> : res.filter(r => r.ops.length).map(r => <div key={r.d} className="chg">
        <b>{r.d}</b> — {prof}: <code>{r.pBefore}</code> → <code>{r.pAfter}</code>
        {r.ops.map((o, i) => <div key={i}>Lecture {o.l + 1}: {o.q} moves {sh(o.from)} → {sh(o.to)} (same time, same subject)</div>)}
        <div className="hint">Campus pattern of affected teachers: {r.affected.map(a => `${a.q} ${a.before} → ${a.after}`).join(" | ")}</div>
      </div>)}
      <div className="bar"><button className="btn" disabled={!changed} onClick={() => { apply(Object.assign({}, x.edits, ...res.map(r => r.edits))); setWant({}); }}>Apply changes</button>
        <button className="btn o" onClick={() => setWant({})}>Clear</button></div>
    </section>

    <section className="card"><h3>Who is where ({cur})</h3>
      <table className="mini map"><thead><tr><th>Teacher</th>{Array.from({ length: x.lectures }, (_, l) => <th key={l}>{l + 1}</th>)}</tr></thead><tbody>
        {map.map(r => <tr key={r.n}><td>{r.n}</td>{r.w.map((n, l) => <td key={l} className={n ? "m" + (n.ci % 4) : ""}>{n ? sh(n.ci) : ""}</td>)}</tr>)}
      </tbody></table>
    </section>
  </>;
}
