import { Icon } from '../components/Icon.jsx';
import { MEAL_DEFS } from '../data/plan.js';
import { todayISO, isoToDate, dowMon0, addDays } from '../lib/helpers.js';

export function GoalsScreen({ state }) {
  const tISO = todayISO();
  const tDow = dowMon0(isoToDate(tISO));
  const curMon = addDays(tISO, -tDow);
  const days = Array.from({ length: 7 }, (_, i) => addDays(curMon, i));

  let onPlan = 0, trans = 0, workouts = 0, sleepSum = 0, sleepN = 0;
  days.forEach(iso => {
    const d = state.days[iso]; if (!d) return;
    MEAL_DEFS.forEach(m => {
      if (d.meals[m.key]?.status === "yes") onPlan++;
      if (d.meals[m.key]?.status === "no") trans++;
    });
    if ((d.workout || []).length > 0) workouts++;
    if (d.sleep != null) { sleepSum += d.sleep; sleepN++; }
  });
  const plannedWorkouts = state.weeklyPlan.filter(d => d.length > 0).length;
  const avgSleep = sleepN ? (sleepSum / sleepN).toFixed(1) : "—";

  const goals = [
    { label: "No pasar el límite de transgresiones", meta: `${trans} de ${state.maxTransgressions} esta semana`, pct: Math.min(100, trans / state.maxTransgressions * 100), over: trans > state.maxTransgressions },
    { label: "Cumplir el plan de entrenamiento", meta: `${workouts} de ${plannedWorkouts} entrenos`, pct: Math.min(100, workouts / Math.max(1, plannedWorkouts) * 100) },
    { label: "Comidas en plan (28/sem)", meta: `${onPlan} de 28 comidas`, pct: Math.min(100, onPlan / 28 * 100) },
    { label: "Dormir 8 h promedio", meta: sleepN ? `${avgSleep} h de promedio` : "Sin registros aún", pct: sleepN ? Math.min(100, (sleepSum / sleepN) / 8 * 100) : 0 },
  ];

  return (
    <div className="screen active">
      <div className="topbar">
        <div><div className="h-section">METAS</div><h1 className="h-title">Esta semana</h1></div>
      </div>
      {goals.map((g, i) => (
        <div key={i} className="goal-item">
          <div className="row between">
            <div className="h-card">{g.label}</div>
            <div className="t-mono t-meta" style={{ color: g.over ? "var(--danger)" : "var(--ink-2)" }}>{Math.round(g.pct)}%</div>
          </div>
          <div className="t-meta" style={{ marginTop: 2 }}>{g.meta}</div>
          <div className={"goal-bar" + (g.over ? " over" : "")}><i style={{ width: g.pct + "%" }} /></div>
        </div>
      ))}
      <div className="spacer-24" />
      <div className="gentle"><Icon name="flame" size={18} />
        <div><strong>Recomposición en marcha.</strong> Objetivo: bajar grasa preservando los 54 kg de músculo. La constancia semanal es la palanca.</div>
      </div>
    </div>
  );
}

/* ============================================================
   NUTRITION GUIDE SCREEN
