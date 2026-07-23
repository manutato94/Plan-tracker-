import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { exByName } from '../components/common.jsx';
import { MEAL_DEFS, OFFPLAN_SCALE, offScaleFor, DESSERT_SCALE, DAY_SHORT, DAY_NAMES } from '../data/plan.js';
import { todayISO, isoToDate, AVG_PLANNED_KCAL } from '../lib/helpers.js';

export function SettingsScreen({ state, setState }) {
  const [newEx, setNewEx] = useState("");
  const [editingDay, setEditingDay] = useState(null);

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

  const exportReport = () => {
    const days = Object.entries(state.days).sort();
    let totalMeals = 0, onPlan = 0, off = 0, extraKcal = 0;
    let dessertTrans = 0, dessertKcal = 0, dessertPlanKcal = 0;
    let gym = 0, run = 0, walk = 0, bike = 0, otherEx = 0;
    let sleepSum = 0, sleepN = 0, sleep8 = 0;
    const offNotes = [];
    days.forEach(([iso, d]) => {
      MEAL_DEFS.forEach(m => {
        const st = d.meals[m.key]; if (!st) return;
        if (st.status) {
          totalMeals++;
          if (st.status === "yes") onPlan++;
          else if (st.status === "no") { off++; const sc = offScaleFor(m.key); extraKcal += sc[st.severity]?.kcal || 0; if (st.note) offNotes.push(`${iso} ${m.label}: ${st.note} (${sc[st.severity]?.label})`); }
        }
        // postre en plan (fruta/dátiles, nivel 1): suma a kcal totales, NO es transgresión
        if (st.dessert === 1) {
          dessertPlanKcal += DESSERT_SCALE[1]?.kcal || 0;
        }
        // postre transgresor (nivel 2+)
        if (st.dessert != null && st.dessert >= 2) {
          dessertTrans++;
          const dk = DESSERT_SCALE[st.dessert]?.kcal || 0;
          dessertKcal += dk; extraKcal += dk;
          offNotes.push(`${iso} ${m.label} · postre: ${DESSERT_SCALE[st.dessert]?.label} (+${dk} kcal)`);
        }
      });
      (d.workout || []).forEach(w => {
        if (w === "Gym") gym++; else if (w === "Running") run++; else if (w === "Caminata") walk++; else if (w === "Bicicleta") bike++; else otherEx++;
      });
      if (d.sleep != null) { sleepSum += d.sleep; sleepN++; if (d.sleep >= 8) sleep8++; }
    });
    const dayCount = days.length;
    const avgExtra = dayCount ? Math.round(extraKcal / dayCount) : 0;
    const R = [];
    R.push("INFORME DE TRACKING — MANUEL TATO");
    R.push(`Generado: ${new Date().toLocaleDateString("es-AR")}`);
    R.push(`Período: ${days[0]?.[0] || "—"} a ${days[days.length-1]?.[0] || "—"} (${dayCount} días)`);
    R.push("");
    R.push("— ADHERENCIA ALIMENTARIA —");
    R.push(`Comidas registradas: ${totalMeals}`);
    R.push(`En plan: ${onPlan}  |  Off (transgresiones): ${off}`);
    R.push(`Postres transgresores: ${dessertTrans} (+${dessertKcal} kcal)`);
    R.push(`Adherencia: ${totalMeals ? Math.round(onPlan/totalMeals*100) : 0}%`);
    R.push("");
    R.push("— CALORÍAS —");
    R.push(`Base del plan: ~${AVG_PLANNED_KCAL} kcal/día`);
    R.push(`Postres en plan (fruta/dátiles): +${dessertPlanKcal} kcal (dentro del plan, no es exceso)`);
    R.push(`Exceso estimado (comidas off + postres transgresores): +${extraKcal} kcal total (~+${avgExtra} kcal/día)`);
    R.push("");
    R.push("— ACTIVIDAD FÍSICA —");
    R.push(`Gym: ${gym}  |  Running: ${run}  |  Caminata: ${walk}  |  Bicicleta: ${bike}  |  Otros: ${otherEx}`);
    R.push("");
    R.push("— SUEÑO —");
    R.push(`Noches registradas: ${sleepN}  |  Total: ${sleepSum.toFixed(1)} h  |  Promedio: ${sleepN ? (sleepSum/sleepN).toFixed(1) : 0} h  |  Noches 8h+: ${sleep8}`);
    R.push("");
    if (offNotes.length) { R.push("— DETALLE DE TRANSGRESIONES —"); offNotes.forEach(n => R.push("• " + n)); }
    const blob = new Blob([R.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Informe_Manuel_${todayISO()}.txt`; a.click();
    URL.revokeObjectURL(url);
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
      <div className="h-section" style={{ marginBottom: 6 }}>Informe para Federico</div>
      <div className="card">
        <div className="t-meta" style={{ marginBottom: 12 }}>Resumen agregado: adherencia, calorías, actividad y sueño. Sin detalle comida por comida ni datos de peso.</div>
        <button className="btn accent" onClick={exportReport}><Icon name="spark" size={18} /> Descargar informe</button>
      </div>

      <div className="spacer-16" />
      <div className="h-section" style={{ marginBottom: 6 }}>Datos</div>
      <div className="card">
        <div className="setting-row">
          <div style={{ flex: 1 }}><div className="setting-label">Inicio del tracking</div><div className="setting-meta">{isoToDate(state.startDate).toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}</div></div>
        </div>
        <div className="setting-row" style={{ borderBottom: "none" }}>
          <div style={{ flex: 1 }}><div className="setting-label">Nutricionista</div><div className="setting-meta">Federico von Proschek · MN 4740</div></div>
        </div>
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

/* ============================================================
   ROOT APP
