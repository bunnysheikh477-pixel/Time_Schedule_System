import { forwardRef } from "react";
import { fmt, cellOf } from "../lib/schedule";
const rng = o => `${fmt(o.s)}–${fmt(o.e)}`;

export const Sheet = forwardRef(function Sheet({ x, ci, day, di, edit, onEdit, reg, fri, hasFri, wef }, ref) {
  const secs = x.secs[ci] || [], camp = x.campuses[ci];
  const busy = (l, p) => { let n = 0; x.secs.forEach((ss, c) => ss.forEach((_, s) => { if (cellOf(x, day, di, c, s, l).prof === p) n++; })); return n > 1; };
  const Cell = ({ s, l }) => {
    const v = cellOf(x, day, di, ci, s, l);
    if (!edit) return <><b>{v.sub}</b><span>{v.prof}</span></>;
    return <>
      <select value={v.sub} onChange={e => onEdit(ci, s, l, "sub", e.target.value)}>{[...new Set([...x.subjects, v.sub])].map(o => <option key={o}>{o}</option>)}</select>
      <select value={v.prof} onChange={e => onEdit(ci, s, l, "prof", e.target.value)}>{[...new Set([...x.profs, v.prof])].map(o => <option key={o}>{o}</option>)}</select>
    </>;
  };
  return <div className="sheet" ref={ref}>
    <h2>{x.college.toUpperCase()} <small>({camp.name})</small></h2>
    <p>{x.title.toUpperCase()} W.E.F: {wef} — {day}</p>
    {!secs.length ? <p>No sections added for this campus.</p> :
    <table className="tt"><thead>
      <tr><th rowSpan="3">S.NO</th><th>CLASSES</th>{reg.out.map((o, i) => o.type === "B" ? <th key={i} rowSpan="3">BREAK</th> : <th key={i}>{o.n}</th>)}</tr>
      <tr><th>REG TIME</th>{reg.out.filter(o => o.type === "L").map(o => <th key={o.n}>{rng(o)}</th>)}</tr>
      <tr><th>FRI TIME</th>{fri.out.filter(o => o.type === "L").map(o => <th key={o.n}>{hasFri ? rng(o) : "—"}</th>)}</tr>
    </thead><tbody>
      {secs.map((sec, s) => <tr key={s}><td>{s + 1}</td><td><b>{sec}</b></td>
        {reg.out.map((o, i) => o.type === "B" ? (s === 0 ? <td key={i} rowSpan={secs.length} className="brk">BREAK</td> : null)
          : <td key={i} className={busy(o.n - 1, cellOf(x, day, di, ci, s, o.n - 1).prof) ? "conf" : ""}><Cell s={s} l={o.n - 1} /></td>)}</tr>)}
    </tbody></table>}
    <div className="sign">{x.signs.map((g, i) => <div key={i}>
      <div className="sg">{g.img && <img src={g.img} alt="" />}</div><b>{g.name || "\u00a0"}</b><br />{g.role}{g.date && <><br /><small>{g.date}</small></>}</div>)}</div>
  </div>;
});
