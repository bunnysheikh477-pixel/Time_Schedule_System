"use client";
import { useEffect, useRef, useState } from "react";
import { DAYS, DEF, ctx, slots, toMin, fit, cellOf, conflictsOf, workingCount } from "../lib/schedule";
import { Sheet } from "../components/Sheet";
import Planner from "../components/Planner";
import { excel, save } from "../lib/export";

const NAV = ["College & campuses", "Lectures & subjects", "Time & break", "Professors", "Holidays", "Approval", "Departments", "Classes & sections", "Professor planner"];
const F = ({ l, children }) => <div className="col"><label>{l}</label>{children}</div>;
const put = (p, cv, first) => {
  if (!first) p.addPage();
  const W = p.internal.pageSize.getWidth() - 40, H = p.internal.pageSize.getHeight() - 40, w = Math.min(W, H * cv.width / cv.height);
  p.addImage(cv.toDataURL("image/png"), "PNG", 20, 20, w, w * cv.height / cv.width);
};

export default function Page() {
  const [c, setC] = useState(DEF), [ready, setReady] = useState(false);
  const [nav, setNav] = useState(0), [ci, setCi] = useState(0), [day, setDay] = useState("Monday"), [edit, setEdit] = useState(false), [nd, setNd] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true), [reference, setReference] = useState(null), [uploadMessage, setUploadMessage] = useState("");
  const ref = useRef();
  const uploadRef = useRef(null);
  useEffect(() => { try { const s = localStorage.getItem("tt2"); if (s) setC({ ...DEF, ...JSON.parse(s) }); } catch {} setReady(true); }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("tt2", JSON.stringify(c)); } catch {} }, [c, ready]);

  const x = ctx(c);
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const setAt = (k, i, v) => setC(p => { const a = [...p[k]]; a[i] = v; return { ...p, [k]: a }; });
  const setCamp = (i, k, v) => setC(p => ({ ...p, campuses: p.campuses.map((y, j) => j === i ? { ...y, [k]: v } : y) }));
  const num = k => e => set(k, +e.target.value || 0);
  const working = DAYS.filter(d => !c.holidays.includes(d));
  const cur = working.includes(day) ? day : working[0], di = working.indexOf(cur);
  const k = Math.min(ci, c.campuses.length - 1);
  const reg = slots(c, false), fri = slots(c, true), hasFri = working.includes("Friday");
  const over = Math.max(reg.end, hasFri ? fri.end : 0) > toMin(c.closing);
  const issues = cur ? conflictsOf(x, cur, di) : [];
  const wef = c.wef.split("-").reverse().join("--");

  const setLec = n => { n = Math.max(1, Math.min(12, +n || 1));
    setC(p => ({ ...p, lectures: n, breakAfter: Math.min(p.breakAfter, n), subjects: Array.from({ length: n }, (_, i) => p.subjects[i] || `Subject ${i + 1}`) })); };
  const onEdit = (cc, s, l, f, v) => setC(p => ({ ...p, edits: { ...p.edits, [`${cur}|${cc}|${s}|${l}`]: { ...cellOf(ctx(p), cur, di, cc, s, l), [f]: v } } }));
  const toggle = d => set("holidays", c.holidays.includes(d) ? c.holidays.filter(y => y !== d) : [...c.holidays, d]);
  const addCamp = () => setC(p => ({ ...p, campuses: [...p.campuses, { name: `Campus ${p.campuses.length + 1}`, short: `C${p.campuses.length + 1}`, sectionsTxt: "" }] }));
  const delCamp = i => setC(p => ({ ...p, campuses: p.campuses.filter((_, j) => j !== i), edits: {} }));
  const pickSig = (i, f) => { if (!f) return; const r = new FileReader(); r.onload = () => setAt("signs", i, { ...c.signs[i], img: r.result }); r.readAsDataURL(f); };

  // ---- exports ----
  const canvas = async () => { const { toCanvas } = await import("html-to-image"); return toCanvas(ref.current, { pixelRatio: 2, backgroundColor: "#ffffff" }); };
  const name = `${c.campuses[k].short}-${cur}`;
  const img = async (t, ext) => { const cv = await canvas(); cv.toBlob(b => save(b, `timetable-${name}.${ext}`), t, 0.95); };
  const pdf = async () => { const cv = await canvas(), { jsPDF } = await import("jspdf"); const p = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" }); put(p, cv, true); p.save(`timetable-${name}.pdf`); };
  const pdfAll = async () => {
    const { jsPDF } = await import("jspdf"), p = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" }), keep = cur;
    for (let i = 0; i < working.length; i++) { setDay(working[i]); await new Promise(r => setTimeout(r, 300)); put(p, await canvas(), i === 0); }
    setDay(keep); p.save(`timetable-${c.campuses[k].short}-all-days.pdf`);
  };
  const share = async () => { const cv = await canvas(); cv.toBlob(async b => { const f = new File([b], "timetable.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: c.title }); else window.open("https://wa.me/?text=" + encodeURIComponent(`${c.college} - ${c.title}`)); }); };
  const backup = () => save(new Blob([JSON.stringify(c, null, 2)], { type: "application/json" }), "timetable-data.json");
  const restore = f => { if (!f) return; const r = new FileReader(); r.onload = () => { try { setC({ ...DEF, ...JSON.parse(r.result) }); } catch { alert("This file is not a valid timetable backup."); } }; r.readAsText(f); };
  const shuffleDay = () => {
    if (!cur) return;
    const next = { ...c.edits };
    for (let l = 0; l < c.lectures; l++) {
      const cells = [];
      x.secs.forEach((ss, cc) => ss.forEach((_, si) => cells.push({ cc, si, value: cellOf(x, cur, di, cc, si, l) })));
      const vals = cells.map(q => ({ ...q.value }));
      for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
      cells.forEach((q, i) => { next[`${cur}|${q.cc}|${q.si}|${l}`] = vals[i]; });
    }
    set("edits", next);
    setUploadMessage(`Shuffled teacher/subject assignments for ${cur}. Check the clash indicator before using the timetable.`);
  };
  const importFile = async file => {
    if (!file) return;
    setUploadMessage("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "json") { restore(file); setUploadMessage("Timetable backup imported."); return; }
    if (["png", "jpg", "jpeg", "pdf"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = () => setReference({ name: file.name, url: reader.result, type: ext === "pdf" ? "pdf" : "image" });
      reader.readAsDataURL(file);
      setUploadMessage(ext === "pdf" ? "PDF opened as a reference. PDF pages are not automatically converted into editable timetable cells; use it alongside Edit timetable." : "Image opened as a reference. Image text is not automatically converted into timetable cells; use it alongside Edit timetable.");
      return;
    }
    if (["xlsx", "xls"].includes(ext)) {
      try {
        const mod = await import("xlsx-js-style"), X = mod.default || mod, wb = X.read(await file.arrayBuffer(), { type: "array" });
        const next = { ...c.edits }; let imported = 0;
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName], rows = X.utils.sheet_to_json(ws, { header: 1, defval: "" });
          const headerIndex = rows.findIndex(r => r.some(v => String(v).trim().toUpperCase() === "CLASSES"));
          if (headerIndex < 0) return;
          const headers = rows[headerIndex], dayName = DAYS.find(d => sheetName.toLowerCase().includes(d.toLowerCase())) || cur;
          let campusIndex = c.campuses.findIndex(m => sheetName.toLowerCase().startsWith(m.short.toLowerCase()));
          if (campusIndex < 0) campusIndex = k;
          const classCol = headers.findIndex(v => String(v).trim().toUpperCase() === "CLASSES");
          headers.forEach((h, col) => {
            const lecture = Number(h);
            if (!Number.isInteger(lecture) || lecture < 1 || lecture > c.lectures) return;
            rows.slice(headerIndex + 2).forEach(row => {
              const section = String(row[classCol] ?? "").trim();
              const si = x.secs[campusIndex].indexOf(section), raw = String(row[col] ?? "");
              if (si < 0 || !raw) return;
              const parts = raw.split(/\\n|\r?\n/).map(v => v.trim()).filter(Boolean);
              if (!parts.length) return;
              next[`${dayName}|${campusIndex}|${si}|${lecture - 1}`] = { sub: parts[0], prof: parts.slice(1).join(" ") || cellOf(x, dayName, working.indexOf(dayName), campusIndex, si, lecture - 1).prof };
              imported++;
            });
          });
        });
        if (!imported) { setUploadMessage("This Excel file was opened, but no timetable cells were recognized. Use the app's exported timetable.xlsx format, or import a JSON backup."); return; }
        set("edits", next); setUploadMessage(`Imported ${imported} timetable cells from Excel.`);
      } catch (err) { setUploadMessage("Could not read this Excel file. Please check that it is a valid .xls or .xlsx file."); }
      return;
    }
    setUploadMessage("Unsupported file type. Choose PDF, PNG, JPG/JPEG, Excel, or a timetable JSON backup.");
  };

  const panels = [
    <>
      <section className="card"><h3>College</h3>
        <F l="College name"><input value={c.college} onChange={e => set("college", e.target.value)} /></F>
        <F l="Timetable title"><input value={c.title} onChange={e => set("title", e.target.value)} /></F>
        <div className="row"><F l="Effective from"><input type="date" value={c.wef} onChange={e => set("wef", e.target.value)} /></F>
          <F l="Session ends"><input type="date" value={c.end} onChange={e => set("end", e.target.value)} /></F></div>
      </section>
      {c.campuses.map((m, i) => <section className="card" key={i}><h3>Campus {i + 1}</h3>
        <div className="row"><F l="Campus name"><input value={m.name} onChange={e => setCamp(i, "name", e.target.value)} /></F>
          <F l="Short code"><input value={m.short} onChange={e => setCamp(i, "short", e.target.value)} /></F></div>
        <F l="Sections (one per line)"><textarea value={m.sectionsTxt} onChange={e => setCamp(i, "sectionsTxt", e.target.value)} /></F>
        {c.campuses.length > 1 && <button className="btn o" onClick={() => delCamp(i)}>Remove campus</button>}
      </section>)}
      <button className="btn o" onClick={addCamp}>Add campus</button>
    </>,
    <>
      <section className="card"><h3>Total lectures</h3>
        <F l="Lectures per day (1–12)"><input type="number" min="1" max="12" value={c.lectures} onChange={e => setLec(e.target.value)} /></F>
        <div className="chips">{Array.from({ length: c.lectures }, (_, i) => <span key={i} className="chip">Lecture {i + 1}</span>)}</div></section>
      <section className="card"><h3>Subjects</h3>
        {c.subjects.map((s, i) => <div className="lst" key={i} style={{ gridTemplateColumns: "28px 1fr" }}><b>{i + 1}</b><input value={s} onChange={e => setAt("subjects", i, e.target.value)} /></div>)}</section>
    </>,
    <>
      <section className="card"><h3>Daily time (Mon–Sat)</h3><div className="row">
        <F l="First lecture starts"><input type="time" value={c.start} onChange={e => set("start", e.target.value)} /></F>
        <F l="College closing time"><input type="time" value={c.closing} onChange={e => set("closing", e.target.value)} /></F>
        <F l="Lecture length (min)"><input type="number" value={c.len} onChange={num("len")} /></F>
        <F l="Gap between lectures (min)"><input type="number" value={c.gap} onChange={num("gap")} /></F></div>
        <button className="btn o" onClick={() => set("len", fit(c, false))}>Fit lectures to closing time</button></section>
      <section className="card"><h3>Friday time</h3><div className="row">
        <F l="First lecture starts"><input type="time" value={c.friStart} onChange={e => set("friStart", e.target.value)} /></F>
        <F l="Lecture length (min)"><input type="number" value={c.friLen} onChange={num("friLen")} /></F>
        <F l="Gap between lectures (min)"><input type="number" value={c.friGap} onChange={num("friGap")} /></F></div>
        <button className="btn o" onClick={() => set("friLen", fit(c, true))}>Fit Friday to closing time</button></section>
      <section className="card"><h3>Break</h3><div className="row">
        <F l="Break after lecture no. (0 = none)"><input type="number" min="0" max={c.lectures} value={c.breakAfter} onChange={e => set("breakAfter", Math.min(c.lectures, +e.target.value || 0))} /></F>
        <F l="Break length (min)"><input type="number" value={c.breakMin} onChange={num("breakMin")} /></F>
        <F l="Friday break length (min)"><input type="number" value={c.friBreak} onChange={num("friBreak")} /></F></div></section>
    </>,
    <section className="card"><h3>Professors</h3>
      <F l="Professor names (one per line)"><textarea style={{ minHeight: 150 }} value={c.profsTxt} onChange={e => set("profsTxt", e.target.value)} /></F>
      <label>Subject of each professor</label>
      {x.profs.map((p, i) => <div className="lst" key={i} style={{ gridTemplateColumns: "1fr 1fr", marginTop: 6 }}><span>{p}</span>
        <select value={(c.profSubj[i] ?? i) % c.lectures} onChange={e => setAt("profSubj", i, +e.target.value)}>{c.subjects.map((s, j) => <option key={j} value={j}>{s}</option>)}</select></div>)}
      {x.profs.length < x.total && <p className="warn">You have {x.total} sections but only {x.profs.length} professors. Add at least {x.total - x.profs.length} more so no one teaches two sections at once.</p>}
    </section>,
    <section className="card"><h3>Holidays</h3>
      <p className="hint">Click a weekday to make it a holiday. It is removed from the schedule.</p>
      <div className="chips">{DAYS.map(d => <button key={d} className={"chip" + (c.holidays.includes(d) ? " on" : "")} onClick={() => toggle(d)}>{d}</button>)}</div>
      <h3 style={{ marginTop: 16 }}>Special holiday dates</h3>
      <div className="sigrow"><input type="date" value={nd} onChange={e => setNd(e.target.value)} />
        <button className="btn" onClick={() => { if (nd && !c.holidayDates.includes(nd)) set("holidayDates", [...c.holidayDates, nd].sort()); setNd(""); }}>Add</button></div>
      <div className="chips" style={{ marginTop: 8 }}>{c.holidayDates.map(d => <button key={d} className="chip on" onClick={() => set("holidayDates", c.holidayDates.filter(y => y !== d))}>{d}</button>)}</div>
      <p className="hint" style={{ marginTop: 10 }}>Working days between {c.wef} and {c.end}: <b>{workingCount(c)}</b></p>
    </section>,
    <section className="card"><h3>Approval signatures</h3>
      {c.signs.map((g, i) => <div key={i} style={{ marginBottom: 12 }}><div className="row">
        <F l="Role"><input value={g.role} onChange={e => setAt("signs", i, { ...g, role: e.target.value })} /></F>
        <F l="Name"><input value={g.name} onChange={e => setAt("signs", i, { ...g, name: e.target.value })} /></F>
        <F l="Approval date"><input type="date" value={g.date} onChange={e => setAt("signs", i, { ...g, date: e.target.value })} /></F>
        <F l="Signature image"><input type="file" accept="image/*" onChange={e => pickSig(i, e.target.files[0])} /></F></div>
        {g.img && <button className="btn o" onClick={() => setAt("signs", i, { ...g, img: "" })}>Remove signature</button>}</div>)}
    </section>,
    <section className="card academic-card"><div className="card-kicker">ACADEMIC DIRECTORY</div><h3>Departments</h3><p className="hint">Create and maintain the academic departments used by your institution. Add one department per line.</p>
      <F l="Department names"><textarea value={c.departmentsTxt || ""} onChange={e => set("departmentsTxt", e.target.value)} placeholder={"Pre-Medical\nPre-Engineering\nComputer Science"} /></F>
      <div className="directory-preview">{(c.departmentsTxt || "").split("\n").map(v => v.trim()).filter(Boolean).map((v, i) => <span className="directory-pill" key={`${v}-${i}`}><span className="pill-dot" />{v}</span>)}</div>
      <p className="hint">{(c.departmentsTxt || "").split("\n").map(v => v.trim()).filter(Boolean).length} departments configured</p>
    </section>,
    <section className="card academic-card"><div className="card-kicker">ACADEMIC DIRECTORY</div><h3>Classes &amp; sections</h3><p className="hint">Define the class levels here, then manage the sections assigned to each campus below. Keep each item on a separate line.</p>
      <F l="Classes / year groups"><textarea value={c.classesTxt || ""} onChange={e => set("classesTxt", e.target.value)} placeholder={"First Year\nSecond Year\nO Levels"} /></F>
      <div className="directory-preview">{(c.classesTxt || "").split("\n").map(v => v.trim()).filter(Boolean).map((v, i) => <span className="directory-pill class-pill" key={`${v}-${i}`}><span className="pill-dot" />{v}</span>)}</div>
      <div className="section-manager"><h3>Campus sections</h3><p className="hint">Sections are grouped by campus and feed directly into the timetable and clash checks.</p>
      {c.campuses.map((m, i) => <div className="section-campus" key={i}><div className="section-campus-head"><span className="campus-icon">{String(i + 1).padStart(2, "0")}</span><div><b>{m.name || `Campus ${i + 1}`}</b><small>{m.short || `C${i + 1}`} · {(m.sectionsTxt || "").split("\n").map(v => v.trim()).filter(Boolean).length} sections</small></div></div><F l="Section names (one per line)"><textarea value={m.sectionsTxt} onChange={e => setCamp(i, "sectionsTxt", e.target.value)} placeholder={"1A\n1B\n2A"} /></F></div>)}
      <button className="btn o" onClick={addCamp}>＋ Add another campus</button></div>
    </section>,
    <Planner x={x} cur={cur} di={di} working={working} apply={ed => set("edits", ed)} />
  ];

  return <div className={"app" + (!sidebarOpen ? " sidebar-closed" : "")}>
    <nav className="nav"><div className="navhead"><button className="burger" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "☰" : "☷"}</button>{sidebarOpen && <div className="brand-mark">TT</div>}{sidebarOpen && <h1>Timetable <span>Studio</span><small>ACADEMIC WORKSPACE</small></h1>}</div>
      {sidebarOpen && <div className="nav-label">WORKSPACE</div>}{NAV.map((n, i) => <button key={n} title={n} className={nav === i ? "on" : ""} onClick={() => setNav(i)}><span className="nav-index">{["01","02","03","04","05","06","07","08","09"][i]}</span>{sidebarOpen && <span>{n}</span>}</button>)}
      {sidebarOpen && <div className="sidebar-footer"><div className="status-dot"/> All changes saved locally <small>Timetable Studio · v2.1</small></div>}</nav>
    <div className="main">
      <header className="page-head"><div><div className="eyebrow">ACADEMIC OPERATIONS / 2026–27</div><h2>{NAV[nav]}</h2><p>Design, organize and publish your institution’s timetable from one workspace.</p></div><div className="head-actions"><span className="session-tag">● Local workspace</span><button className="btn" onClick={backup}>Export backup ↗</button></div></header>
      <div className="stats">
        {[[c.campuses.length, "Campuses"], [x.total, "Sections"], [x.profs.length, "Professors"], [c.lectures, "Lectures a day"], [working.length, "Working days"], [issues.length, "Clashes today"]]
          .map(([v, l]) => <div className="stat" key={l}><b>{v}</b><span>{l}</span></div>)}
      </div>
      <div className={"wrap" + (nav === 8 ? " wide" : "") + ([6,7].includes(nav) ? " academic-layout" : "")}>
        <section className="form">{panels[nav]}</section>
        <main className="prev">
          <div className="bar">
            {c.campuses.map((m, i) => <button key={i} className={"tab cmp" + (i === k ? " on" : "")} onClick={() => setCi(i)}>{m.short} · {m.name}</button>)}
          </div>
          <div className="bar">
            {working.map(d => <button key={d} className={"tab" + (d === cur ? " on" : "")} onClick={() => setDay(d)}>{d}</button>)}
            <span style={{ flex: 1 }} />
            <button className={"btn" + (edit ? "" : " o")} onClick={() => setEdit(!edit)}>{edit ? "Finish editing" : "Edit timetable"}</button>
            {Object.keys(c.edits).length > 0 && <button className="btn o" onClick={() => set("edits", {})}>Reset all edits</button>}
          </div>
          {over && <div className="warn">Lectures end after closing time ({c.closing}). Use “Fit lectures to closing time” in Time & break.</div>}
          {issues.length > 0 && <div className="warn"><b>Clashes on {cur}:</b>{issues.map((s, i) => <div key={i}>{s}</div>)}</div>}
          {!working.length ? <div className="warn">Every day is a holiday. Unmark at least one day.</div> :
            <div className="scroll"><Sheet ref={ref} x={x} ci={k} day={cur} di={di} edit={edit} onEdit={onEdit} reg={reg} fri={fri} hasFri={hasFri} wef={wef} /></div>}
          <div className="exp bar" style={{ marginBottom: 0 }}>
            <button className="btn" onClick={backup}>Download data</button>
            <button className="btn o" type="button" onClick={() => uploadRef.current?.click()}>Upload timetable</button>
            <input ref={uploadRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx,.json" hidden onChange={e => { importFile(e.target.files?.[0]); e.target.value = ""; }} />
            <button className="btn" disabled={edit} onClick={() => excel(x, working, reg, fri, hasFri, wef)}>Move to Excel</button>
            <button className="btn" disabled={edit} onClick={share}>Share</button>
            <button className="btn o" disabled={edit} onClick={() => img("image/png", "png")}>PNG</button>
            <button className="btn o" disabled={edit} onClick={() => img("image/webp", "webp")}>WebP</button>
            <button className="btn o" disabled={edit} onClick={pdf}>PDF (this day)</button>
            <button className="btn o" disabled={edit} onClick={pdfAll}>PDF (all days)</button>
          </div>
          {uploadMessage && <div className="upload-message" role="status" style={{ marginTop: 10, padding: "10px 12px", borderRadius: 8, background: "#eef6ff", color: "#174477", fontSize: 13 }}>{uploadMessage}</div>}
          {reference && <section className="card" style={{ marginTop: 12 }}>
            <div className="bar" style={{ alignItems: "center" }}>
              <b>Uploaded reference: {reference.name}</b>
              <span style={{ flex: 1 }} />
              <button className="btn o" type="button" onClick={() => setReference(null)}>Close preview</button>
            </div>
            {reference.type === "pdf"
              ? <iframe title={`Preview of ${reference.name}`} src={reference.url} style={{ width: "100%", height: 520, border: "1px solid #d7dce5", borderRadius: 8 }} />
              : <img src={reference.url} alt={`Preview of ${reference.name}`} style={{ display: "block", maxWidth: "100%", maxHeight: 520, objectFit: "contain", margin: "12px auto" }} />}
          </section>}
          <p className="hint" style={{ marginTop: 8 }}>Red cells: the same professor is teaching two sections at the same time (across both campuses).</p>
        </main>
      </div>
    </div>
  </div>;
}
