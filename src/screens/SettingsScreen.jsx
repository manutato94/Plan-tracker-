import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { exByName } from '../components/common.jsx';
import { DAY_SHORT, DAY_NAMES } from '../data/plan.js';
import { todayISO, isoToDate } from '../lib/helpers.js';
import { exportReportPDF } from '../lib/report.js';

export function SettingsScreen({ state, setState }) {
  const [newEx, setNewEx] = useState("");
  const [editingDay, setEditingDay] = useState(null);
  const [reportBusy, setReportBusy] = useState(false);
  // Rango del informe: por defecto, últimos 45 días hasta hoy
  const [reportTo, setReportTo] = useState(todayISO());
  const [reportFrom, setReportFrom] = useState(() => {
    const d = isoToDate(todayISO()); d.setDate(d.getDate() - 44);
    return d.toISOString().split("T")[0];
  });

  const setMax = (delta) => setState(s => ({ ...s, maxTransgressions: Math.max(0, Math.min(28, s.maxTransgressions + delta)) }));
  const removeEx = (name) => setState(s => ({ ...s, exercises: s.exercises.filter(e => e.name !== name) }));
  const addEx = () => {
    const v = newEx.trim();
    if (v && !state.exercises.some(e => e.name.toLowerCase() === v.toLowerCase())) {
      setState(s => ({ ...s, exercises: [...s.exercises, { name: v, icon: "other" }] }));
      setNewEx("");
    }
  };
  const setDayPlan = (di, list) => setState(s => { const wp = s.weeklyPlan.slice(); wp[di] = list; return { ...s, weeklyPlan: wp }; });
  const plannedWorkouts = state.weeklyPlan.filter(d => d.length > 0).length;

  const exportReport = async () => {
    const from = reportFrom <= reportTo ? reportFrom : reportTo;
    const to = reportFrom <= reportTo ? reportTo : reportFrom;
    setReportBusy(true);
    try {
      await exportReportPDF(state, from, to);
    } catch (err) {
      alert("No se pudo generar el PDF. Revisá que tengas conexión a internet e intentá de nuevo.");
    } finally {
      setReportBusy(false);
    }
  };

  // ==== RESPALDO COMPLETO (.json con todo el state) ====
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `respaldo-tracking-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // validación mínima: que tenga la forma esperada
        if (!data || typeof data !== "object" || !("days" in data)) {
          alert("El archivo no parece un respaldo válido de la app.");
          return;
        }
        const ok = window.confirm("Esto va a REEMPLAZAR todos tus datos actuales por los del respaldo. ¿Continuar?");
        if (!ok) return;
        setState(data);
        alert("Respaldo restaurado correctamente.");
      } catch (err) {
        alert("No se pudo leer el archivo. ¿Seguro que es un respaldo .json de la app?");
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className="screen active">
      <div className="topbar"><div><div className="h-section">AJUSTES</div><h1 className="h-title">Tu plan</h1></div></div>

      <div className="h-section" style={{ marginTop: 8, marginBottom: 6 }}>Metas</div>
      <div className="card">
        <div className="setting-row">
          <div style={{ flex: 1 }}>
            <div className="setting-label">Máx. transgresiones / semana</div>
            <div className="setting-meta">Comidas off que te permitís</div>
          </div>
          <div className="stepper">
            <button onClick={() => setMax(-1)}><Icon name="minus" size={14} /></button>
            <span className="val">{state.maxTransgressions}</span>
            <button onClick={() => setMax(+1)}><Icon name="plus" size={14} /></button>
          </div>
        </div>
        <div className="setting-row">
          <div style={{ flex: 1 }}>
            <div className="setting-label">Entrenamientos / semana</div>
            <div className="setting-meta">Según tu plan</div>
          </div>
          <div className="t-mono" style={{ fontWeight: 700, fontSize: 18 }}>{plannedWorkouts}</div>
        </div>
      </div>

      <div className="spacer-24" />
      <div className="row between" style={{ marginBottom: 6 }}>
        <div className="h-section">Plan de entrenamiento</div>
        <div className="t-meta">Se repite cada semana</div>
      </div>
      <div className="card" style={{ padding: "4px 16px" }}>
        {DAY_SHORT.map((d, di) => {
          const planned = state.weeklyPlan[di]; const has = planned.length > 0;
          return (
            <button key={d} className={"plan-day" + (has ? " has" : "")} onClick={() => setEditingDay(di)}>
              <div className="dow">{d.toUpperCase()}</div>
              <div className="summary">
                {has ? planned.map(name => {
                  const ex = exByName(state.exercises, name);
                  return <span key={name} className="mini"><Icon name={ex.icon} size={14} />{ex.name}</span>;
                }) : <span className="rest-tag">Descanso</span>}
              </div>
              <span className="edit-link">Editar<Icon name="back" size={12} /></span>
            </button>
          );
        })}
      </div>

      <div className="spacer-24" />
      <div className="row between" style={{ marginBottom: 6 }}>
        <div className="h-section">Ejercicios</div>
        <div className="t-meta t-mono">{state.exercises.length}</div>
      </div>
      <div className="card">
        <div className="t-meta" style={{ marginBottom: 12 }}>La librería de la que elegís al planear.</div>
        <div className="chip-list">
          {state.exercises.map((ex) => (
            <span key={ex.name} className="chip" style={{ paddingRight: 8 }}>
              <span className="chip-ico"><Icon name={ex.icon} size={14} /></span>{ex.name}
              <button className="x" onClick={() => removeEx(ex.name)} aria-label={`Quitar ${ex.name}`}><Icon name="x" size={12} /></button>
            </span>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14, gap: 8 }}>
          <input className="text-input" value={newEx} onChange={e => setNewEx(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addEx()} placeholder="Agregar ejercicio…" style={{ flex: 1 }} />
          <button className="btn" style={{ width: "auto", height: 44, padding: "0 16px" }} onClick={addEx}><Icon name="plus" size={16} /> Add</button>
        </div>
      </div>

      <div className="spacer-24" />
      <div className="h-section" style={{ marginBottom: 6 }}>Informe</div>
      <div className="card">
        <div className="t-meta" style={{ marginBottom: 12 }}>Informe visual en PDF: adherencia, calorías, actividad y sueño, semana a semana. Requiere conexión a internet.</div>
        <div className="date-range">
          <label className="date-field">
            <span>Desde</span>
            <input type="date" value={reportFrom} max={reportTo} onChange={e => setReportFrom(e.target.value)} />
          </label>
          <label className="date-field">
            <span>Hasta</span>
            <input type="date" value={reportTo} min={reportFrom} max={todayISO()} onChange={e => setReportTo(e.target.value)} />
          </label>
        </div>
        <button className="btn accent" onClick={exportReport} disabled={reportBusy}>
          <Icon name={reportBusy ? "spark" : "spark"} size={18} /> {reportBusy ? "Generando PDF…" : "Descargar informe PDF"}
        </button>
      </div>

      <div className="spacer-16" />
      <div className="h-section" style={{ marginBottom: 6 }}>Datos</div>
      <div className="card">
        <div className="setting-row" style={{ borderBottom: "none" }}>
          <div style={{ flex: 1 }}><div className="setting-label">Inicio del tracking</div><div className="setting-meta">{isoToDate(state.startDate).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}</div></div>
        </div>
      </div>

      <div className="spacer-16" />
      <div className="h-section" style={{ marginBottom: 6 }}>Respaldo</div>
      <div className="card">
        <div className="t-meta" style={{ marginBottom: 12 }}>Guardá una copia de todos tus registros en un archivo. Podés restaurarla si cambiás de dispositivo o perdés los datos del navegador.</div>
        <button className="btn" onClick={exportBackup}><Icon name="check" size={18} /> Exportar respaldo completo</button>
        <div className="spacer-8" />
        <label className="btn ghost" style={{ cursor: "pointer" }}>
          <Icon name="plus" size={18} /> Restaurar desde respaldo
          <input type="file" accept="application/json,.json" style={{ display: "none" }}
            onChange={e => { importBackup(e.target.files[0]); e.target.value = ""; }} />
        </label>
      </div>

      {editingDay !== null && (
        <DayPlanSheet dayIdx={editingDay} exercises={state.exercises} current={state.weeklyPlan[editingDay]}
          onSave={(list) => { setDayPlan(editingDay, list); setEditingDay(null); }} onClose={() => setEditingDay(null)} />
      )}
    </div>
  );
}

export function DayPlanSheet({ dayIdx, exercises, current, onSave, onClose }) {
  const [sel, setSel] = useState(current);
  const toggle = (name) => setSel(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{DAY_NAMES[dayIdx]}</div>
        <div className="sheet-meta">{sel.length === 0 ? "Sin ejercicios — será día de descanso." : `${sel.length} ejercicio${sel.length===1?"":"s"} planeado${sel.length===1?"":"s"}.`}</div>
        <div className="sheet-body">
          <div className="chip-list">
            {exercises.map((ex) => {
              const on = sel.includes(ex.name);
              return <button key={ex.name} className={"chip " + (on ? "selected" : "")} onClick={() => toggle(ex.name)}>
                <span className="chip-ico"><Icon name={ex.icon} size={14} /></span>{ex.name}{on && <Icon name="check" size={13} />}
              </button>;
            })}
          </div>
        </div>
        <div className="sheet-actions">
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn" style={{ flex: 2 }} onClick={() => onSave(sel)}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
