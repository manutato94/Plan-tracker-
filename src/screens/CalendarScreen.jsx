import React, { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { ProgressRing } from '../components/common.jsx';
import { MEAL_DEFS, DAY_SHORT } from '../data/plan.js';
import { todayISO, isoToDate, dowMon0, addDays, dayStatus } from '../lib/helpers.js';

export function CalendarScreen({ state, setDateISO, goToday }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const tISO = todayISO();
  const tDow = dowMon0(isoToDate(tISO));
  const curMon = addDays(tISO, -tDow + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => addDays(curMon, i));
  const monObj = isoToDate(curMon), sunObj = isoToDate(addDays(curMon, 6));
  const rangeLabel = `${monObj.toLocaleDateString("es-AR",{day:"numeric",month:"short"})} – ${sunObj.toLocaleDateString("es-AR",{day:"numeric",month:"short"})}`;

  let onPlan = 0, trans = 0, workouts = 0;
  days.forEach(iso => {
    const d = state.days[iso];
    if (!d) return;
    MEAL_DEFS.forEach(m => {
      if (d.meals[m.key]?.status === "yes") onPlan++;
      if (d.meals[m.key]?.status === "no") trans++;
    });
    if ((d.workout || []).length > 0) workouts++;
  });
  const plannedWorkouts = state.weeklyPlan.filter(d => d.length > 0).length;
  const remaining = Math.max(0, state.maxTransgressions - trans);
  const overLimit = trans > state.maxTransgressions;

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <div className="h-section">CALENDARIO</div>
          <h1 className="h-title">{rangeLabel}</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="iconbtn" onClick={() => setWeekOffset(w => w - 1)}><Icon name="chevL" size={18} /></button>
          <button className="iconbtn" onClick={() => setWeekOffset(w => Math.min(0, w + 1))} disabled={weekOffset >= 0}><Icon name="chevR" size={18} /></button>
        </div>
      </div>

      {/* Transgressions */}
      <div className="card">
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div>
            <div className="h-section" style={{ marginBottom: 6 }}>Transgresiones</div>
            <div className="t-mono" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>
              {trans}<span style={{ color: "var(--ink-3)" }}> / {state.maxTransgressions}</span>
            </div>
            <div className="t-meta" style={{ marginTop: 6, color: overLimit ? "var(--danger)" : "var(--ink-2)" }}>
              {overLimit ? "Pasaste el límite semanal." : `${remaining} disponibles.`}
            </div>
          </div>
          <ProgressRing value={Math.min(trans, state.maxTransgressions)} total={state.maxTransgressions} />
        </div>
        <div className={"goal-bar" + (overLimit ? " over" : "")} style={{ marginTop: 14 }}>
          <i style={{ width: `${Math.min(100, trans / state.maxTransgressions * 100)}%` }} />
        </div>
      </div>

      <div className="spacer-12" />
      <div className="stat-2">
        <div className="card">
          <div className="h-section" style={{ marginBottom: 6 }}>Comidas en plan</div>
          <div className="t-mono" style={{ fontSize: 28, fontWeight: 700 }}>{onPlan}<span style={{ color: "var(--ink-3)", fontSize: 18 }}>/28</span></div>
        </div>
        <div className="card">
          <div className="h-section" style={{ marginBottom: 6 }}>Entrenamientos</div>
          <div className="t-mono" style={{ fontSize: 28, fontWeight: 700 }}>{workouts}<span style={{ color: "var(--ink-3)", fontSize: 18 }}>/{plannedWorkouts}</span></div>
        </div>
      </div>

      <div className="spacer-24" />
      <div className="h-section" style={{ marginBottom: 10 }}>Por día</div>
      <div className="card" style={{ padding: "14px 12px" }}>
        <div className="week-grid" style={{ marginBottom: 8 }}>
          <div></div>
          {DAY_SHORT.map((d, i) => <div key={d} className={"day-label " + (days[i] === tISO ? "today" : "")}>{d[0]}</div>)}
          {MEAL_DEFS.map((m) => (
            <React.Fragment key={m.key}>
              <div className="row-label">{m.label[0]}</div>
              {days.map((iso) => {
                const v = state.days[iso]?.meals[m.key]?.status;
                const cls = v === "yes" ? "yes" : v === "no" ? "no" : "empty";
                const clickable = iso <= tISO && iso >= state.startDate;
                return <div key={iso} className={"week-cell " + cls + (clickable ? " clickable" : "")}
                  onClick={() => clickable && setDateISO(iso)}>{v === "yes" ? "✓" : v === "no" ? "·" : ""}</div>;
              })}
            </React.Fragment>
          ))}
          <div className="row-label"><Icon name="dumbbell" size={12} /></div>
          {days.map((iso) => {
            const w = (state.days[iso]?.workout || []).length;
            return <div key={iso} className={"week-cell " + (w ? "workout-yes" : "empty")}>{w || ""}</div>;
          })}
        </div>
        <div className="row" style={{ gap: 14, marginTop: 10, fontSize: 11, color: "var(--ink-2)", flexWrap: "wrap" }}>
          <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }} />En plan</span>
          <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--bg-3)", borderRadius: 2 }} />Off</span>
          <span className="row" style={{ gap: 6 }}><span style={{ width: 10, height: 10, background: "var(--ink)", borderRadius: 2 }} />Entreno</span>
        </div>
      </div>

      {/* Estado por día — semáforo (lun-vie evaluados, finde solo conteo) */}
      <div className="spacer-24" />
      <div className="h-section" style={{ marginBottom: 10 }}>Estado por día</div>
      <div className="day-status-list">
        {days.map((iso, i) => {
          const d = state.days[iso];
          const planned = state.weeklyPlan[i] || [];
          const isWeekend = i >= 5;
          const status = isWeekend ? null : dayStatus(d, planned);
          const dotClass = status || "none";
          const followedC = d ? MEAL_DEFS.filter(m => d.meals[m.key]?.status === "yes").length : 0;
          const wC = (d?.workout || []).length;
          const sleepC = d?.sleep;
          return (
            <div key={iso} className={"day-status-row" + (isWeekend ? " weekend" : "")}>
              <span className={"dot " + dotClass} />
              <span className="dname">{DAY_SHORT[i]}</span>
              {isWeekend && <span className="t-meta" style={{ fontSize: 11 }}>libre</span>}
              <div className="counts">
                <span className="c"><Icon name="bowl" size={12} /> {followedC}/4</span>
                <span className="c"><Icon name="dumbbell" size={12} /> {wC}</span>
                <span className="c"><Icon name="sleep" size={12} /> {sleepC != null ? sleepC + "h" : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="row" style={{ gap: 14, marginTop: 10, fontSize: 11, color: "var(--ink-2)", flexWrap: "wrap" }}>
        <span className="row" style={{ gap: 6 }}><span className="dot green" style={{ width: 10, height: 10, borderRadius: 999 }} />En plan</span>
        <span className="row" style={{ gap: 6 }}><span className="dot yellow" style={{ width: 10, height: 10, borderRadius: 999 }} />Desvío menor</span>
        <span className="row" style={{ gap: 6 }}><span className="dot red" style={{ width: 10, height: 10, borderRadius: 999 }} />Varios desvíos</span>
      </div>

      <div className="spacer-16" />
      <div className="gentle"><Icon name="spark" size={18} />
        <div><strong>{Math.round(onPlan / 28 * 100)}% en plan</strong> esta semana. {workouts >= plannedWorkouts ? `Meta de entrenos cumplida (${workouts}/${plannedWorkouts}).` : `${plannedWorkouts - workouts} entreno${plannedWorkouts-workouts===1?"":"s"} para llegar a tu plan.`}</div>
      </div>
    </div>
  );
}

/* ============================================================
   GOALS SCREEN
