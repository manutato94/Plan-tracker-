import { useState } from 'react';
import { Icon } from '../components/Icon.jsx';
import { DAY_ACTIVITY, DAY_NAMES, GUIDE_FIXED, GUIDE_MAIN, RULES } from '../data/plan.js';
import { dowMon0 } from '../lib/helpers.js';

export function GuideScreen({ backToToday }) {
  const [openDay, setOpenDay] = useState(dowMon0(new Date()));
  const actLabel = { gym: "Gym", run: "Running", rest: "Descanso" };
  return (
    <div className="screen active">
      <div className="topbar">
        <div><div className="h-section">GUÍA</div><h1 className="h-title">Plan de Federico</h1></div>
        <button className="iconbtn" onClick={backToToday} aria-label="Volver"><Icon name="today" size={18} /></button>
      </div>

      <div className="info-banner" style={{ marginBottom: 16 }}>
        <Icon name="spark" size={18} />
        <div><strong>~2350 kcal/día · recomposición.</strong> Los días son intercambiables. Todo con ensalada libre + 1 cda de oliva.</div>
      </div>

      {/* Fixed meals */}
      <div className="h-section" style={{ marginBottom: 10 }}>Todos los días</div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="nutri-meal" style={{ borderTop: "none", paddingTop: 0 }}>
          <div className="mt"><Icon name="sun" size={14} /> Desayuno <span className="mkcal">~{GUIDE_FIXED.breakfast.kcal} kcal</span></div>
          {GUIDE_FIXED.breakfast.options.map((o, i) => (
            <div key={i}><div className="opt-label">Opción {i+1}</div><div className="t-body" style={{ fontSize: 14 }}>{o}</div></div>
          ))}
        </div>
        <div className="nutri-meal">
          <div className="mt"><Icon name="leaf" size={14} /> Merienda <span className="mkcal">~{GUIDE_FIXED.snack.kcal} kcal</span></div>
          {GUIDE_FIXED.snack.options.map((o, i) => (
            <div key={i}><div className="opt-label">Opción {i+1}</div><div className="t-body" style={{ fontSize: 14 }}>{o}</div></div>
          ))}
        </div>
        <div className="nutri-meal">
          <div className="mt"><Icon name="mug-hot" size={14} /> Media mañana</div>
          <div className="t-body" style={{ fontSize: 14 }}>Infusión a gusto (opcional)</div>
        </div>
      </div>

      {/* Per-day lunch & dinner */}
      <div className="h-section" style={{ marginBottom: 10 }}>Almuerzo y cena por día</div>
      {DAY_NAMES.map((name, i) => {
        const act = DAY_ACTIVITY[i];
        const open = openDay === i;
        return (
          <div key={i} className={"nutri-day" + (open ? " open" : "")}>
            <button className="nutri-day-head" onClick={() => setOpenDay(open ? -1 : i)}>
              <div className="dname">{name}</div>
              <div className="row" style={{ gap: 10 }}>
                <span className={"dtag " + act}>{actLabel[act]}</span>
                <span className="chev"><Icon name="chevR" size={14} /></span>
              </div>
            </button>
            <div className="nutri-day-body">
              <div className="nutri-meal">
                <div className="mt"><Icon name="bowl" size={14} /> Almuerzo</div>
                <div className="t-body" style={{ fontSize: 14 }}>{GUIDE_MAIN[i].lunch}</div>
              </div>
              <div className="nutri-meal">
                <div className="mt"><Icon name="moon" size={14} /> Cena</div>
                <div className="t-body" style={{ fontSize: 14, fontWeight: GUIDE_MAIN[i].dinner === "LIBRE" ? 700 : 400 }}>
                  {GUIDE_MAIN[i].dinner === "LIBRE" ? "🎉 Comida libre" : GUIDE_MAIN[i].dinner}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="spacer-16" />
      <div className="h-section" style={{ marginBottom: 10 }}>Reglas del plan</div>
      <div className="card">
        {RULES.map((r, i) => (
          <div key={i} className="row" style={{ gap: 10, padding: "8px 0", borderBottom: i < RULES.length-1 ? "1px solid var(--line)" : "none", alignItems: "flex-start" }}>
            <Icon name="check" size={14} style={{ color: "var(--accent-ink)", background: "var(--accent)", borderRadius: 999, padding: 3, marginTop: 2, flexShrink: 0 }} />
            <div className="t-body" style={{ fontSize: 14 }}>{r}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS SCREEN
