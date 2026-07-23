import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { ProgressRing, exByName } from '../components/common.jsx';
import { MEAL_DEFS, OFFPLAN_SCALE, offScaleFor, DESSERT_SCALE, MEALS_WITH_DESSERT, DAY_NAMES } from '../data/plan.js';
import { todayISO, isoToDate, dowMon0, addDays, analyzeWeekdays, weekendInsight } from '../lib/helpers.js';

export function TodayScreen({ dateISO, setDateISO, day, updateDay, state, goGuide }) {
  const dObj = isoToDate(dateISO);
  const isToday = dateISO === todayISO();
  const isFuture = dateISO > todayISO();
  const beforeStart = dateISO < state.startDate;
  const dow = dowMon0(dObj);

  const setMeal = (key, status) => {
    const meals = { ...day.meals };
    const prevDessert = meals[key]?.dessert;
    if (status === null) {
      // quitar status de comida pero preservar postre si existe
      meals[key] = prevDessert != null ? { dessert: prevDessert } : null;
    }
    else if (status === "yes") meals[key] = { status: "yes", ...(prevDessert != null ? { dessert: prevDessert } : {}) };
    else {
      const prev = meals[key] && meals[key].status === "no" ? meals[key] : {};
      meals[key] = { status: "no", severity: prev.severity ?? 1, note: prev.note ?? "", ...(prevDessert != null ? { dessert: prevDessert } : {}) };
    }
    updateDay({ ...day, meals });
  };
  const setSeverity = (key, sev) => {
    const meals = { ...day.meals };
    meals[key] = { ...meals[key], severity: sev };
    updateDay({ ...day, meals });
  };
  const setNote = (key, note) => {
    const meals = { ...day.meals };
    meals[key] = { ...meals[key], note };
    updateDay({ ...day, meals });
  };
  const setDessert = (key, level) => {
    const meals = { ...day.meals };
    const cur = meals[key] || {};
    meals[key] = { ...cur, dessert: level };
    updateDay({ ...day, meals });
  };

  const planned = state.weeklyPlan[dow] || [];
  const logged = day.workout || [];
  const toggleEx = (name) => {
    const next = logged.includes(name) ? logged.filter(x => x !== name) : [...logged, name];
    updateDay({ ...day, workout: next });
  };
  const markAllPlanned = () => updateDay({ ...day, workout: [...new Set([...logged, ...planned])] });
  const allPlannedDone = planned.length > 0 && planned.every(p => logged.includes(p));

  const setSleep = (delta) => {
    const cur = day.sleep ?? 8;
    let next = Math.round((cur + delta) * 2) / 2;
    next = Math.max(0, Math.min(14, next));
    updateDay({ ...day, sleep: next });
  };

  const followed = MEAL_DEFS.filter(m => day.meals[m.key]?.status === "yes").length;
  const offCount = MEAL_DEFS.filter(m => day.meals[m.key]?.status === "no").length;

  // week transgressions (Mon–Sun containing this date)
  const weekMon = addDays(dateISO, -dow);
  let weekTrans = 0;
  for (let i = 0; i < 7; i++) {
    const dd = state.days[addDays(weekMon, i)];
    if (dd) weekTrans += MEAL_DEFS.filter(m => dd.meals[m.key]?.status === "no").length;
  }
  const remaining = Math.max(0, state.maxTransgressions - weekTrans);

  const dateLabel = dObj.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <div className="h-section">{isToday ? "HOY" : "REGISTRO"}</div>
          <h1 className="h-title" style={{ textTransform: "capitalize" }}>{DAY_NAMES[dow]}</h1>
        </div>
        <button className="iconbtn" onClick={goGuide} aria-label="Ver plan"><Icon name="guide" size={18} /></button>
      </div>

      {/* Day navigation */}
      <div className="datestrip">
        <button className="nav" onClick={() => setDateISO(addDays(dateISO, -1))}
          disabled={beforeStart} aria-label="Día anterior"><Icon name="chevL" size={16} /></button>
        <button className={"today-btn" + (isToday ? " is-today" : "")} onClick={() => setDateISO(todayISO())}>
          {isToday ? <><Icon name="check" size={13} /> Hoy</> : <span style={{ textTransform: "capitalize" }}>{dObj.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</span>}
        </button>
        <button className="nav" onClick={() => setDateISO(addDays(dateISO, 1))}
          disabled={isToday || isFuture} aria-label="Día siguiente"><Icon name="chevR" size={16} /></button>
      </div>

      {beforeStart ? (
        <div className="info-banner"><Icon name="spark" size={18} />
          <div>Este día es anterior al inicio del tracking (<strong>{isoToDate(state.startDate).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</strong>). Empezá desde ahí.</div>
        </div>
      ) : (
      <>
      {/* Insight de finde (sáb/dom) — analiza lun-vie de esta semana */}
      {(dow === 5 || dow === 6) && (() => {
        const weekMon = addDays(dateISO, -dow);
        const sig = analyzeWeekdays(state, weekMon);
        const ins = weekendInsight(sig);
        return (
          <div className={"insight-card " + ins.tone} style={{ marginBottom: 16 }}>
            <div className="insight-icon"><Icon name={ins.icon} size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="insight-title">{ins.title}</div>
              <div className="insight-body">{ins.body}</div>
            </div>
          </div>
        );
      })()}

      {/* Streak / summary */}
      <div className="streak-card">
        <div className="streak-num t-mono">{followed}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, letterSpacing: "0.06em", textTransform: "uppercase" }}>de 4 comidas en plan</div>
          <div style={{ fontSize: 15, marginTop: 2 }}>
            {offCount === 0 && followed === 4 ? "Día perfecto. Seguí así." :
             remaining === 0 ? "Llegaste al límite semanal. Reinicia el lunes." :
             `${remaining} transgresión${remaining === 1 ? "" : "es"} restante${remaining === 1 ? "" : "s"} esta semana.`}
          </div>
        </div>
        <ProgressRing value={followed} total={4} onDark />
      </div>

      <div className="spacer-24" />

      {/* SLEEP */}
      <div className="h-section" style={{ marginBottom: 10 }}>Sueño</div>
      <div className={"card sleep-card" + ((day.sleep ?? 0) >= 8 ? " hit" : "")}>
        <div className="sleep-icon"><Icon name="sleep" size={22} /></div>
        <div style={{ flex: 1 }}>
          <div className="meal-name">{day.sleep != null ? `${day.sleep} h` : "Sin registrar"}</div>
          <div className="meal-meta">{(day.sleep ?? 0) >= 8 ? "Meta cumplida ✓" : "Meta: 8 h"}</div>
        </div>
        <div className="stepper">
          <button onClick={() => setSleep(-0.5)}><Icon name="minus" size={14} /></button>
          <span className="val">{day.sleep != null ? day.sleep : "—"}</span>
          <button onClick={() => setSleep(+0.5)}><Icon name="plus" size={14} /></button>
        </div>
      </div>

      <div className="spacer-24" />

      {/* MEALS */}
      <div className="h-section" style={{ marginBottom: 10 }}>Comidas · {followed}/4 en plan</div>
      {MEAL_DEFS.map((m) => {
        const st = day.meals[m.key];
        const status = st?.status || null;
        return (
          <div key={m.key} style={{ marginBottom: 8 }}>
            <div className={"meal-row " + (status === "yes" ? "followed" : status === "no" ? "transgressed" : "")}>
              <div className="meal-icon"><Icon name={m.icon} size={20} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="meal-name">{m.label}</div>
                <div className="meal-meta">{m.time}</div>
              </div>
              <div className="meal-actions">
                <button className={"pill-btn " + (status === "yes" ? "active-yes" : "")} onClick={() => setMeal(m.key, status === "yes" ? null : "yes")}>
                  <Icon name="check" size={15} /> En plan
                </button>
                <button className={"pill-btn " + (status === "no" ? "active-no" : "")} onClick={() => setMeal(m.key, status === "no" ? null : "no")}>
                  Off
                </button>
              </div>
            </div>

            {status === "no" && (() => {
              const scale = offScaleFor(m.key);
              const sev = Math.min(st.severity ?? 0, scale.length - 1);
              return (
              <div className="offplan-detail">
                <div className="lbl">¿Qué tan off?</div>
                <div className="sev-value">
                  <span className="name">{scale[sev].label}</span>
                  <span className="kcal">+{scale[sev].kcal} kcal</span>
                </div>
                <div className="t-meta" style={{ fontSize: 12 }}>{scale[sev].example}</div>
                <input className="slider" type="range" min="0" max={scale.length - 1} step="1"
                  value={sev} onChange={(e) => setSeverity(m.key, parseInt(e.target.value))} />
                <div className="slider-scale">
                  <span>Menos peor</span><span>Peor</span>
                </div>
                <textarea className="note-input" rows="2" placeholder="¿Qué comiste? (ej: 3 porciones de pizza + cerveza)"
                  value={st.note || ""} onChange={(e) => setNote(m.key, e.target.value)} />
              </div>
              );
            })()}

            {/* Postre — solo almuerzo y cena, independiente del status */}
            {MEALS_WITH_DESSERT.includes(m.key) && (() => {
              const dv = st?.dessert ?? 0;
              const dObj2 = DESSERT_SCALE[dv];
              const isTrans = dv >= 2;
              return (
                <div className="offplan-detail" style={{ borderColor: isTrans ? "var(--ink)" : "var(--line)" }}>
                  <div className="lbl"><Icon name="leaf" size={12} style={{ marginRight: 6 }} />Postre</div>
                  <div className="sev-value">
                    <span className="name">{dObj2.label}</span>
                    {dObj2.kcal > 0 && <span className="kcal">+{dObj2.kcal} kcal</span>}
                    {dObj2.onPlan && dv === 1 && <span className="kcal" style={{ color: "var(--ink-2)" }}>en plan</span>}
                  </div>
                  <input className="slider" type="range" min="0" max={DESSERT_SCALE.length - 1} step="1"
                    value={dv} onChange={(e) => setDessert(m.key, parseInt(e.target.value))} />
                  <div className="slider-scale">
                    <span>No comí</span><span>Peor</span>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      <div className="spacer-32" />

      {/* WORKOUT */}
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="h-section">Entrenamiento</div>
        <div className="t-meta t-mono">{logged.length} hecho{logged.length === 1 ? "" : "s"}</div>
      </div>

      {(() => {
        // extras = registrados que no están en el plan del día
        const extras = logged.filter(n => !planned.includes(n));
        const hasContent = planned.length > 0 || extras.length > 0;
        return (
          <div className={"plan-card" + (hasContent ? "" : " rest")}>
            {planned.length > 0 ? (
              <>
                <div className="plan-eyebrow"><Icon name="dumbbell" size={12} /> Planeado hoy</div>
                {planned.map((name) => {
                  const ex = exByName(state.exercises, name);
                  const done = logged.includes(name);
                  return (
                    <div key={name} className="ex-row">
                      <div className={"ex-icon-tile" + (done ? " done" : "")}><Icon name={ex.icon} size={24} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ex-name">{ex.name}</div>
                        <div className="ex-sub">{done ? "Registrado" : "Tocá para registrar"}</div>
                      </div>
                      <button className={"pill-btn " + (done ? "active-yes" : "")} onClick={() => toggleEx(name)}>
                        {done ? <><Icon name="check" size={15} /> Hecho</> : "Log"}
                      </button>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="plan-eyebrow"><Icon name="rest" size={12} /> Sin plan hoy — registrá lo que hagas</div>
            )}

            {/* Extras registrados fuera del plan */}
            {extras.length > 0 && (
              <>
                <div className="plan-eyebrow" style={{ marginTop: planned.length ? 14 : 0, paddingTop: planned.length ? 14 : 0, borderTop: planned.length ? "1px solid var(--line)" : "none" }}>
                  <Icon name="plus" size={12} /> Actividad extra
                </div>
                {extras.map((name) => {
                  const ex = exByName(state.exercises, name);
                  return (
                    <div key={name} className="ex-row">
                      <div className="ex-icon-tile done"><Icon name={ex.icon} size={24} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ex-name">{ex.name}</div>
                        <div className="ex-sub">Registrado (fuera del plan)</div>
                      </div>
                      <button className="pill-btn active-yes" onClick={() => toggleEx(name)}>
                        <Icon name="check" size={15} /> Hecho
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {planned.length > 0 && !allPlannedDone && (
              <button className="btn accent" style={{ marginTop: 14 }} onClick={markAllPlanned}>
                <Icon name="check" size={18} /> Marcar plan como hecho
              </button>
            )}
          </div>
        );
      })()}

      {/* Add / log any activity, even off-plan */}
      <ExtraExercises state={state} logged={logged} toggleEx={toggleEx} />
      </>
      )}
    </div>
  );
}

export function ExtraExercises({ state, logged, toggleEx }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setOpen(o => !o)}>
        {open ? "Listo" : "+ Registrar otra actividad"}
      </button>
      {open && (
        <>
          <div className="t-meta" style={{ margin: "12px 2px 8px" }}>Tocá para sumar o quitar. Sirve aunque no siga el plan del día.</div>
          <div className="chip-list">
            {state.exercises.map((ex) => {
              const on = logged.includes(ex.name);
              return (
                <button key={ex.name} className={"chip " + (on ? "selected" : "")} onClick={() => toggleEx(ex.name)}>
                  <span className="chip-ico"><Icon name={ex.icon} size={14} /></span>{ex.name}
                  {on && <Icon name="check" size={13} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
