import { cellOf, fmt } from "./schedule";
export const save = (b, n) => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = n; a.click(); };
const rng = o => `${fmt(o.s)}-${fmt(o.e)}`;

export async function excel(x, working, reg, fri, hasFri, wef) {
  const m = await import("xlsx-js-style"), X = m.default || m, wb = X.utils.book_new();
  const bd = { style: "thin", color: { rgb: "222222" } }, B = { top: bd, bottom: bd, left: bd, right: bd };
  const mid = { horizontal: "center", vertical: "center", wrapText: true };
  const tr = hasFri ? 6 : 5, bk = reg.out.findIndex(o => o.type === "B"), bc = bk < 0 ? -1 : bk + 2;
  x.campuses.forEach((camp, ci) => {
    const secs = x.secs[ci];
    working.forEach((d, di) => {
      const a = [[`${x.college} (${camp.name})`], [`${x.title}  W.E.F: ${wef} - ${d}`], [],
        ["S.NO", "CLASSES", ...reg.out.map(o => o.type === "B" ? "BREAK" : o.n)],
        ["", "REG TIME", ...reg.out.map(o => o.type === "B" ? "" : rng(o))]];
      if (hasFri) a.push(["", "FRI TIME", ...fri.out.map(o => o.type === "B" ? "" : rng(o))]);
      secs.forEach((sec, s) => a.push([s + 1, sec, ...reg.out.map(o => {
        if (o.type === "B") return s === 0 ? "BREAK" : "";
        const v = cellOf(x, d, di, ci, s, o.n - 1); return `${v.sub}\n${v.prof}`; })]));
      a.push([], ["", "", ...x.signs.map(g => `${g.role}\n${g.name || "________"}\n${g.date || ""}`)]);
      const ws = X.utils.aoa_to_sheet(a), nc = 2 + reg.out.length, end = tr + secs.length;
      const mg = [{ s: { r: 0, c: 0 }, e: { r: 0, c: nc - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: nc - 1 } }];
      if (bc >= 0) { mg.push({ s: { r: 3, c: bc }, e: { r: tr - 1, c: bc } }); if (secs.length > 1) mg.push({ s: { r: tr, c: bc }, e: { r: end - 1, c: bc } }); }
      ws["!merges"] = mg;
      ws["!cols"] = Array.from({ length: nc }, (_, k) => ({ wch: k < 2 ? 10 : 24 }));
      ws["!rows"] = a.map((_, r) => ({ hpt: r === 0 ? 28 : r >= tr && r < end ? 42 : r === end + 1 ? 54 : 20 }));
      const set = (r, c, s) => { const k = X.utils.encode_cell({ r, c }); if (!ws[k]) ws[k] = { t: "s", v: "" }; ws[k].s = s; };
      set(0, 0, { font: { bold: true, sz: 16 }, alignment: mid }); set(1, 0, { font: { bold: true, sz: 11 }, alignment: mid });
      for (let r = 3; r < end; r++) for (let c = 0; c < nc; c++) {
        const s = { border: B, font: { bold: r < tr || c < 2, sz: 10 }, alignment: c === bc && r >= tr ? { ...mid, textRotation: 90 } : mid };
        if (r < tr) s.fill = { fgColor: { rgb: "E8EDF3" } }; else if (c === bc) s.fill = { fgColor: { rgb: "F6F1E4" } };
        set(r, c, s);
      }
      for (let c = 2; c < nc; c++) set(end + 1, c, { alignment: mid, font: { sz: 10 } });
      X.utils.book_append_sheet(wb, ws, `${camp.short} ${d}`.replace(/[\\/?*[\]:]/g, "").slice(0, 31));
    });
  });
  X.writeFile(wb, "timetable.xlsx");
}
