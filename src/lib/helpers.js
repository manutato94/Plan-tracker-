// Helpers de fecha, estado y analytics
import { MEAL_DEFS, OFFPLAN_SCALE, DESSERT_SCALE, MEALS_WITH_DESSERT } from '../data/plan.js';

export const todayISO = () => {
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().split("T")[0];
};
export const isoToDate = (iso) => { const [y,m,d] = iso.split("-").map(Number); return new Date(y, m-1, d); };
// Mon=0..Sun=6
export const dowMon0 = (dateObj) => (dateObj.getDay() + 6) % 7;
export const addDays = (iso, n) => {
  const d = isoToDate(iso); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
export const AVG_PLANNED_KCAL = 2350;

export const loadState = () => {
  try {
    const raw = localStorage.getItem("manuel_tracking_v1");
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return {
    startDate: todayISO(),   // app starts tracking today
    days: {},                // { iso: { meals:{key:{status,severity,note}}, workout:[], extra:[], sleep } }
    weeklyPlan: DEFAULT_WEEKLY_PLAN,
    exercises: DEFAULT_EXERCISES,
    maxTransgressions: 3,
  };
};

export const blankDay = () => ({
  meals: { breakfast: null, lunch: null, snack: null, dinner: null },
  workout: [], extra: [], sleep: null,
});

/* ============================================================
   ANALYTICS HELPERS — semáforo, balance semanal, insight de finde
   ============================================================ */

// Suma kcal extra de un día (transgresiones de comida + postres 2+)
export function dayExtraKcal(d) {
  if (!d) return 0;
  let extra = 0;
  MEAL_DEFS.forEach(m => {
    const st = d.meals[m.key];
    if (st?.status === "no" && st.severity != null) extra += OFFPLAN_SCALE[st.severity]?.kcal || 0;
    if (st?.dessert != null && st.dessert >= 2) extra += DESSERT_SCALE[st.dessert]?.kcal || 0;
  });
  return extra;
}

// Suma kcal de TODOS los postres del día (en plan + transgresores) — para la cuenta total
export function dayDessertKcal(d) {
  if (!d) return 0;
  let k = 0;
  MEALS_WITH_DESSERT.forEach(key => {
    const st = d.meals[key];
    if (st?.dessert != null) k += DESSERT_SCALE[st.dessert]?.kcal || 0;
  });
  return k;
}

// Cuenta transgresiones de un día (comida off + postre 2+)
export function dayTransgressions(d) {
  if (!d) return 0;
  let n = 0;
  MEAL_DEFS.forEach(m => {
    const st = d.meals[m.key];
    if (st?.status === "no") n++;
    if (st?.dessert != null && st.dessert >= 2) n++;
  });
  return n;
}

// Semáforo de un día laboral. Devuelve 'green'|'yellow'|'red'|null
// Criterios: verde = 4/4 comidas en plan + ≥1 entreno planeado + sueño ≥7.5h
//            amarillo = desvío menor (1 transgresión, faltó entreno, o sueño 6-7.5h)
//            rojo = 2+ transgresiones o sueño <6h
export function dayStatus(d, planned) {
  if (!d) return null;
  const logged = d.workout || [];
  const anyLogged = MEAL_DEFS.some(m => d.meals[m.key]) || logged.length > 0 || d.sleep != null;
  if (!anyLogged) return null; // sin registro, sin semáforo

  const trans = dayTransgressions(d);
  const sleep = d.sleep;
  const followed = MEAL_DEFS.filter(m => d.meals[m.key]?.status === "yes").length;
  const workoutOK = planned.length === 0 || planned.some(p => logged.includes(p));

  // rojo
  if (trans >= 2) return "red";
  if (sleep != null && sleep < 6) return "red";
  // verde
  if (trans === 0 && followed === 4 && workoutOK && (sleep == null || sleep >= 7.5)) return "green";
  // resto amarillo
  return "yellow";
}

// Analiza lun-vie de la semana que contiene weekMonISO. Devuelve señales.
export function analyzeWeekdays(state, weekMonISO) {
  let extra = 0, transDays = 0, sleepSum = 0, sleepN = 0, sleepBad = 0;
  let plannedWk = 0, doneWk = 0;
  for (let i = 0; i < 5; i++) { // lun a vie
    const iso = addDays(weekMonISO, i);
    const d = state.days[iso];
    const planned = state.weeklyPlan[i] || [];
    plannedWk += planned.length;
    if (!d) continue;
    extra += dayExtraKcal(d);
    if (dayTransgressions(d) > 0) transDays++;
    const logged = d.workout || [];
    planned.forEach(p => { if (logged.includes(p)) doneWk++; });
    if (d.sleep != null) { sleepSum += d.sleep; sleepN++; if (d.sleep < 7) sleepBad++; }
  }
  const avgSleep = sleepN ? sleepSum / sleepN : null;
  return { extra, transDays, plannedWk, doneWk, avgSleep, sleepN, sleepBad, missedWorkouts: Math.max(0, plannedWk - doneWk) };
}

// Genera el insight de finde. Jerarquía: sueño → comida → ejercicio.
// Tope: máximo 2 sesiones de compensación sugeridas.
export function weekendInsight(sig) {
  // 1) SUEÑO primero
  if (sig.avgSleep != null && sig.avgSleep < 7) {
    return {
      tone: "sleep",
      icon: "sleep",
      title: "Priorizá el descanso este finde",
      body: `Dormiste ${sig.avgSleep.toFixed(1)}h promedio de lunes a viernes. Antes de sumar ejercicio, apuntá a descansar bien: el sueño es lo que sostiene la recomposición. El resto se acomoda solo.`,
    };
  }
  // 2) COMIDA — exceso calórico
  if (sig.extra >= 1500) {
    const sessions = Math.min(2, Math.ceil(sig.extra / 1200));
    return {
      tone: "food",
      icon: "run",
      title: "Recuperá el déficit este finde",
      body: `Esta semana sumaste +${sig.extra} kcal sobre el plan. Aprovechá el finde para ${sessions} salida${sessions === 1 ? "" : "s"} de caminata, bici o running suave y volvés al balance. Sin culpa — es parte del proceso.`,
    };
  }
  if (sig.extra >= 700) {
    return {
      tone: "food",
      icon: "walk",
      title: "Un empujón chico el finde",
      body: `Vas +${sig.extra} kcal sobre el plan esta semana. Con 1 caminata o salida en bici extra este finde lo compensás tranquilo.`,
    };
  }
  // 3) EJERCICIO — faltaron entrenos
  if (sig.missedWorkouts >= 2) {
    return {
      tone: "move",
      icon: "dumbbell",
      title: "Te quedaron entrenos pendientes",
      body: `Cerraste la semana con ${sig.doneWk} de ${sig.plannedWk} actividades planeadas. El finde es buen momento para sumar ${Math.min(2, sig.missedWorkouts)} — el volumen de movimiento es tu palanca principal.`,
    };
  }
  // 4) TODO OK
  return {
    tone: "ok",
    icon: "flame",
    title: "Semana sólida — disfrutá el finde",
    body: "Venís en plan con la comida, el movimiento y el descanso. Comé la comida libre del finde con tranquilidad, sin necesidad de compensar. Eso también es parte del plan.",
  };
}
