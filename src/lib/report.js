// Generación del informe en PDF (cliente). Reutiliza la lógica de cálculo de la app.
import { MEAL_DEFS, offScaleFor, DESSERT_SCALE, exerciseKcal, DEFAULT_WEEKLY_PLAN } from '../data/plan.js';
import { isoToDate, dowMon0, AVG_PLANNED_KCAL } from './helpers.js';

const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fmtDate = (d) => `${d.getDate()} de ${MESES[d.getMonth() + 1]} de ${d.getFullYear()}`;
const fmtShort = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

// ---- cálculo por día ----
function dayMealCalc(day) {
  let excess = 0, onPlan = 0, off = 0, dessertTrans = 0, dessertPlanKcal = 0;
  const notes = [];
  MEAL_DEFS.forEach(m => {
    const st = day.meals[m.key];
    if (!st) return;
    if (st.status === "yes") onPlan++;
    else if (st.status === "no") {
      off++;
      const sc = offScaleFor(m.key);
      const sev = st.severity ?? 0;
      const kcal = sc[sev]?.kcal || 0;
      excess += kcal;
      if (st.note) notes.push({ meal: m.label, note: st.note, label: sc[sev]?.label || "", kcal });
    }
    if (st.dessert === 1) dessertPlanKcal += DESSERT_SCALE[1].kcal;
    if (st.dessert != null && st.dessert >= 2) {
      dessertTrans++;
      const dk = DESSERT_SCALE[st.dessert]?.kcal || 0;
      excess += dk;
      notes.push({ meal: m.label, note: DESSERT_SCALE[st.dessert]?.label + " (postre)", label: "", kcal: dk });
    }
  });
  return { excess, onPlan, off, dessertTrans, dessertPlanKcal, notes };
}

function buildDaySeries(state, fromISO, toISO) {
  const series = [];
  let cur = isoToDate(fromISO);
  const end = isoToDate(toISO);
  while (cur <= end) {
    const iso = cur.toISOString().split("T")[0];
    const dow = dowMon0(cur);
    const day = state.days[iso];
    const hasData = day && (MEAL_DEFS.some(m => day.meals[m.key]) || (day.workout || []).length > 0 || day.sleep != null);

    const plannedWk = (state.weeklyPlan && state.weeklyPlan[dow]) || DEFAULT_WEEKLY_PLAN[dow];
    const targetBurn = plannedWk.reduce((s, n) => s + exerciseKcal(n), 0);

    if (hasData) {
      const mc = dayMealCalc(day);
      const actualBurn = (day.workout || []).reduce((s, n) => s + exerciseKcal(n), 0);
      const actualIntake = AVG_PLANNED_KCAL + mc.excess;
      series.push({
        iso, date: new Date(cur), dow, hasData: true,
        mealCalc: mc, workout: day.workout || [], plannedWorkout: plannedWk,
        sleep: day.sleep,
        actualNet: actualIntake - actualBurn,
        targetNet: AVG_PLANNED_KCAL - targetBurn,
      });
    } else {
      series.push({
        iso, date: new Date(cur), dow, hasData: false,
        plannedWorkout: plannedWk,
        actualNet: null, targetNet: AVG_PLANNED_KCAL - targetBurn,
      });
    }
    cur = new Date(cur.getTime() + 86400000);
  }
  return series;
}

function groupByWeek(series) {
  const weeks = [];
  let cur = [];
  for (const day of series) {
    if ((day.dow === 0 && cur.length) ) { weeks.push(cur); cur = []; }
    cur.push(day);
  }
  if (cur.length) weeks.push(cur);
  return weeks;
}

function weekSummary(weekDays) {
  const withData = weekDays.filter(d => d.hasData);
  const onPlan = withData.reduce((s, d) => s + d.mealCalc.onPlan, 0);
  const off = withData.reduce((s, d) => s + d.mealCalc.off, 0);
  const total = onPlan + off;
  const excess = withData.reduce((s, d) => s + d.mealCalc.excess, 0);
  const plannedCount = {}, actualCount = {};
  weekDays.forEach(d => (d.plannedWorkout || []).forEach(n => plannedCount[n] = (plannedCount[n] || 0) + 1));
  withData.forEach(d => (d.workout || []).forEach(n => actualCount[n] = (actualCount[n] || 0) + 1));
  const sleepVals = withData.filter(d => d.sleep != null).map(d => d.sleep);
  const sleepTotal = sleepVals.reduce((s, v) => s + v, 0);
  const sleepAvg = sleepVals.length ? sleepTotal / sleepVals.length : 0;
  const sleep8 = sleepVals.filter(v => v >= 8).length;
  const netDiffs = withData.map(d => d.actualNet - d.targetNet);
  const netDiffAvg = netDiffs.length ? netDiffs.reduce((s, v) => s + v, 0) / netDiffs.length : 0;
  return {
    start: weekDays[0].date, end: weekDays[weekDays.length - 1].date,
    nDays: weekDays.length, daysWithData: withData.length,
    onPlan, off, total, excess,
    excessDaily: withData.length ? Math.round(excess / withData.length) : 0,
    adherencePct: total ? Math.round(onPlan / total * 100) : 0,
    plannedCount, actualCount,
    sleepTotal, sleepAvg, sleepN: sleepVals.length, sleep8,
    netDiffAvg,
  };
}

// ---- gráfico SVG (portado del Python) ----
function trendChartSVG(series, weeks) {
  const W = 720, H = 300, padL = 52, padR = 20, padT = 24, padB = 46;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const pts = series.filter(d => d.actualNet != null);
  const allVals = series.flatMap(d => [d.targetNet, d.actualNet].filter(v => v != null));
  const vMin = Math.min(...allVals) - 150, vMax = Math.max(...allVals) + 150;
  const vRange = vMax - vMin || 1;
  const n = series.length;
  const xAt = (i) => n <= 1 ? padL + plotW / 2 : padL + plotW * i / (n - 1);
  const yAt = (v) => padT + plotH - ((v - vMin) / vRange * plotH);
  const stepX = n > 1 ? xAt(1) - xAt(0) : plotW;

  let bands = "", labels = "";
  let idx = 0;
  const bandColors = ["#FAFAF9", "#F1F0ED"];
  weeks.forEach((wk, wi) => {
    const startI = idx, endI = idx + wk.length - 1;
    const xs = Math.max(padL, xAt(startI) - stepX / 2);
    const xe = Math.min(W - padR, xAt(endI) + stepX / 2);
    bands += `<rect x="${xs.toFixed(1)}" y="${padT}" width="${(xe - xs).toFixed(1)}" height="${plotH}" fill="${bandColors[wi % 2]}"/>`;
    const cx = (xs + xe) / 2;
    labels += `<text x="${cx.toFixed(1)}" y="${padT - 8}" font-size="9" font-weight="bold" fill="#8A8A8A" text-anchor="middle">SEMANA ${wi + 1}</text>`;
    if (wi > 0) bands += `<line x1="${xs.toFixed(1)}" y1="${padT}" x2="${xs.toFixed(1)}" y2="${padT + plotH}" stroke="#E2E2E2" stroke-width="1" stroke-dasharray="2,3"/>`;
    idx = endI + 1;
  });

  let grid = "";
  for (let g = 0; g <= 4; g++) {
    const v = vMin + vRange * g / 4, y = yAt(v);
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#E8E7E4" stroke-width="1"/>`;
    grid += `<text x="${padL - 10}" y="${(y + 3.5).toFixed(1)}" font-size="10" fill="#8A8A8A" text-anchor="end" font-family="monospace">${Math.round(v)}</text>`;
  }

  const labelEvery = n <= 16 ? 1 : (n <= 24 ? 2 : 3);
  let ticks = "";
  series.forEach((d, i) => {
    const x = xAt(i);
    ticks += `<line x1="${x.toFixed(1)}" y1="${padT + plotH}" x2="${x.toFixed(1)}" y2="${padT + plotH + 4}" stroke="#CFCFCF" stroke-width="1"/>`;
    if (i % labelEvery === 0 || i === n - 1)
      ticks += `<text x="${x.toFixed(1)}" y="${padT + plotH + 16}" font-size="8.5" fill="#8A8A8A" text-anchor="middle">${d.date.getDate()}/${d.date.getMonth() + 1}</text>`;
  });

  // líneas: la real solo conecta días con dato
  const targetPath = "M " + series.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.targetNet).toFixed(1)}`).join(" L ");
  let actualPath = "", started = false;
  series.forEach((d, i) => {
    if (d.actualNet == null) { started = false; return; }
    actualPath += (started ? " L " : " M ") + `${xAt(i).toFixed(1)},${yAt(d.actualNet).toFixed(1)}`;
    started = true;
  });

  let dots = "";
  series.forEach((d, i) => {
    if (d.actualNet == null) return;
    const over = d.actualNet > d.targetNet + 50;
    dots += `<circle cx="${xAt(i).toFixed(1)}" cy="${yAt(d.actualNet).toFixed(1)}" r="3.2" fill="${over ? "#D44333" : "#0A0A0A"}" stroke="#fff" stroke-width="1"/>`;
  });

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
    ${bands}${grid}${labels}
    <path d="${targetPath}" fill="none" stroke="#8A8A8A" stroke-width="2" stroke-dasharray="5,4"/>
    <path d="${actualPath}" fill="none" stroke="#0A0A0A" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}${ticks}
  </svg>`;
}

// ---- HTML del informe ----
function buildReportHTML(state, fromISO, toISO) {
  const series = buildDaySeries(state, fromISO, toISO);
  const weeks = groupByWeek(series);
  const start = series[0].date, end = series[series.length - 1].date;
  const withData = series.filter(d => d.hasData);
  const totalOn = withData.reduce((s, d) => s + d.mealCalc.onPlan, 0);
  const totalOff = withData.reduce((s, d) => s + d.mealCalc.off, 0);
  const overallAdh = (totalOn + totalOff) ? Math.round(totalOn / (totalOn + totalOff) * 100) : 0;
  const daysEmpty = series.length - withData.length;

  const weeksHTML = weeks.map((wk, i) => {
    const s = weekSummary(wk);
    const diff = s.netDiffAvg;
    const allTypes = [...new Set([...Object.keys(s.plannedCount), ...Object.keys(s.actualCount)])].sort();
    const maxCount = Math.max(1, ...allTypes.map(t => Math.max(s.plannedCount[t] || 0, s.actualCount[t] || 0)));
    const comboBars = allTypes.map(name => {
      const p = s.plannedCount[name] || 0, a = s.actualCount[name] || 0;
      const pPct = Math.round(p / maxCount * 100), aPct = Math.round(a / maxCount * 100);
      const aColor = (a >= p && a > 0) ? "#C6F432" : "#0A0A0A";
      return `<table class="combo" cellspacing="0"><tr>
        <td class="cl">${name}</td>
        <td class="cb">
          <div class="ct"><div class="cf" style="width:${pPct}%;background:#B5B3AD"></div></div>
          <div class="cg"></div>
          <div class="ct"><div class="cf" style="width:${aPct}%;background:${aColor}"></div></div>
        </td>
        <td class="cn"><span class="p">${p}</span> / <span class="a">${a}</span></td>
      </tr></table>`;
    }).join("");

    let notesHTML = "";
    const allNotes = [];
    wk.forEach(d => { if (d.hasData) d.mealCalc.notes.forEach(nt => allNotes.push({ date: d.date, ...nt })); });
    if (allNotes.length) {
      notesHTML = `<div class="notes"><div class="sub">Detalle de transgresiones</div>` +
        allNotes.map(nt => `<div class="nl"><span class="d">${fmtShort(nt.date)}</span> · <b>${nt.meal}</b> — ${nt.note}${nt.label ? ` (${nt.label}, +${nt.kcal} kcal)` : ` (+${nt.kcal} kcal)`}</div>`).join("") +
        `</div>`;
    }
    const emptyInWeek = wk.filter(d => !d.hasData);
    const emptyHTML = emptyInWeek.length
      ? `<div class="empty-note">Días sin registrar: ${emptyInWeek.map(d => fmtShort(d.date)).join(", ")}</div>` : "";

    return `<div class="week">
      <div class="wh"><span class="wt">Semana ${i + 1}</span><span class="wr">${fmtShort(s.start)} – ${fmtShort(s.end)} · ${s.nDays} días</span></div>
      <div class="wb">
        <div class="stats">
          <div class="sc"><div class="l">Adherencia</div><div class="v">${s.adherencePct}<span>%</span></div></div>
          <div class="sc ${s.excessDaily > 100 ? "warn" : ""}"><div class="l">Kcal exceso</div><div class="v">+${s.excess}<span> total · +${s.excessDaily}/día</span></div></div>
          <div class="sc"><div class="l">Sueño prom.</div><div class="v">${s.sleepAvg.toFixed(1)}<span> h</span></div></div>
          <div class="sc accent"><div class="l">Neto vs objetivo</div><div class="v">${diff >= 0 ? "+" : ""}${diff.toFixed(0)}<span> kcal/día</span></div></div>
        </div>
        <div class="cols">
          <div class="col">
            <div class="sub">Registro</div>
            <table class="dt"><tr><th>Con datos</th><th>Sin registrar</th></tr><tr><td>${s.daysWithData}</td><td>${s.nDays - s.daysWithData}</td></tr></table>
            <div class="sub">Comidas</div>
            <table class="dt"><tr><th>En plan</th><th>Off</th><th>Total</th></tr><tr><td>${s.onPlan}</td><td>${s.off}</td><td>${s.total}</td></tr></table>
            <div class="sub">Sueño</div>
            <table class="dt"><tr><th>Total</th><th>Prom.</th><th>8h+</th></tr><tr><td>${s.sleepTotal.toFixed(1)} h</td><td>${s.sleepAvg.toFixed(1)} h</td><td>${s.sleep8}/${s.sleepN}</td></tr></table>
          </div>
          <div class="col">
            <div class="sub">Actividad — planeado / registrado</div>
            ${comboBars}
            <div class="clegend"><span><i style="background:#B5B3AD"></i>Planeado</span><span><i style="background:#0A0A0A"></i>Registrado</span></div>
          </div>
        </div>
        ${emptyHTML}
        ${notesHTML}
      </div>
    </div>`;
  }).join("");

  return `<div id="report-root" style="width:794px;background:#fff;font-family:Inter,Arial,sans-serif;color:#0A0A0A;">
    <style>
      #report-root * { box-sizing:border-box; margin:0; padding:0; }
      #report-root .cover { background:#0A0A0A; color:#fff; padding:28px 40px; }
      #report-root .eyebrow { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#C6F432; margin-bottom:12px; }
      #report-root .cover h1 { font-size:21px; font-weight:700; margin-bottom:3px; }
      #report-root .cover .csub { font-size:12px; color:#C7C7C7; }
      #report-root .pbox { display:flex; margin-top:16px; gap:40px; }
      #report-root .pi .pl { font-size:9px; letter-spacing:1px; text-transform:uppercase; color:#8A8A8A; margin-bottom:3px; }
      #report-root .pi .pv { font-size:15px; font-weight:700; }
      #report-root .pi .pv.acc { color:#C6F432; }
      #report-root .body { padding:24px 40px 32px; }
      #report-root h2 { font-size:15px; font-weight:700; border-bottom:2px solid #0A0A0A; padding-bottom:6px; margin-bottom:4px; }
      #report-root .ssub { font-size:11px; color:#545454; margin-bottom:12px; }
      #report-root .plan-grid { display:flex; gap:8px; margin-bottom:10px; }
      #report-root .pc { flex:1; background:#F6F6F6; border-radius:6px; padding:10px 12px; }
      #report-root .pc .l { font-size:8px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:#545454; margin-bottom:4px; }
      #report-root .pc .v { font-size:13px; font-weight:700; }
      #report-root .pc .v.sm { font-size:10px; font-weight:400; line-height:1.35; }
      #report-root .chart { border:1.5px solid #0A0A0A; border-radius:8px; padding:14px; margin:14px 0; }
      #report-root .clegend2 { border-top:1px solid #E2E2E2; padding-top:8px; margin-top:6px; font-size:9px; color:#545454; display:flex; gap:18px; }
      #report-root .clegend2 span { display:flex; align-items:center; gap:6px; }
      #report-root .week { margin-bottom:16px; page-break-inside:avoid; }
      #report-root .wh { background:#0A0A0A; color:#fff; border-radius:6px 6px 0 0; padding:9px 14px; display:flex; justify-content:space-between; }
      #report-root .wt { font-size:12px; font-weight:700; }
      #report-root .wr { font-size:10px; color:#C7C7C7; }
      #report-root .wb { border:1px solid #E2E2E2; border-top:none; border-radius:0 0 6px 6px; padding:14px; }
      #report-root .stats { display:flex; gap:8px; margin-bottom:10px; }
      #report-root .sc { flex:1; background:#F6F6F6; border-radius:6px; padding:9px 11px; }
      #report-root .sc .l { font-size:8px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; color:#545454; margin-bottom:3px; }
      #report-root .sc .v { font-size:15px; font-weight:700; }
      #report-root .sc .v span { font-size:9px; font-weight:400; color:#545454; }
      #report-root .sc.warn .v { color:#D44333; }
      #report-root .sc.accent { background:#0A0A0A; }
      #report-root .sc.accent .l { color:#B9B9B9; }
      #report-root .sc.accent .v { color:#C6F432; }
      #report-root .sc.accent .v span { color:#8A8A8A; }
      #report-root .cols { display:flex; gap:16px; }
      #report-root .col { flex:1; }
      #report-root .sub { font-size:9px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; color:#545454; margin:10px 0 4px; }
      #report-root .col .sub:first-child { margin-top:0; }
      #report-root table.dt { width:100%; border-collapse:collapse; font-size:10px; }
      #report-root table.dt th { text-align:left; font-size:8px; text-transform:uppercase; color:#545454; border-bottom:1px solid #E2E2E2; padding:3px 8px 4px 0; }
      #report-root table.dt td { padding:4px 8px 4px 0; border-bottom:1px solid #F0F0F0; }
      #report-root table.combo { width:100%; border-collapse:collapse; margin-bottom:7px; }
      #report-root table.combo td { vertical-align:middle; }
      #report-root .cl { width:66px; font-size:9.5px; }
      #report-root .cb { padding:0 8px 0 2px; }
      #report-root .ct { background:#EDEDED; border-radius:3px; height:7px; }
      #report-root .cf { height:7px; border-radius:3px; }
      #report-root .cg { height:3px; }
      #report-root .cn { width:44px; text-align:right; font-family:monospace; font-size:9.5px; }
      #report-root .cn .p { color:#8A8A8A; } #report-root .cn .a { font-weight:700; }
      #report-root .clegend { margin-top:6px; font-size:9px; color:#545454; display:flex; gap:14px; }
      #report-root .clegend span { display:flex; align-items:center; gap:5px; }
      #report-root .clegend i, #report-root .clegend2 i { display:inline-block; width:10px; height:7px; border-radius:2px; }
      #report-root .empty-note { margin-top:10px; font-size:9px; color:#A1291B; background:#FBEEEC; border-radius:4px; padding:6px 10px; }
      #report-root .notes { margin-top:10px; background:#FBFBFA; border-left:3px solid #E2E2E2; padding:8px 12px; }
      #report-root .nl { font-size:9px; margin-bottom:3px; color:#333; }
      #report-root .nl .d { color:#8A8A8A; font-family:monospace; }
      #report-root .footer { font-size:8px; color:#8A8A8A; border-top:1px solid #E2E2E2; padding-top:10px; margin-top:6px; }
    </style>
    <div class="cover">
      <div class="eyebrow">Informe de seguimiento · Recomposición corporal</div>
      <h1>Plan nutricional y de actividad física</h1>
      <div class="pbox">
        <div class="pi"><div class="pl">Período</div><div class="pv">${fmtShort(start)} — ${fmtShort(end)}</div></div>
        <div class="pi"><div class="pl">Días registrados</div><div class="pv">${withData.length} de ${series.length}</div></div>
        <div class="pi"><div class="pl">Adherencia general</div><div class="pv acc">${overallAdh}%</div></div>
      </div>
    </div>
    <div class="body">
      <h2>El plan, en resumen</h2>
      <div class="ssub">Base para interpretar los números de este informe.</div>
      <div class="plan-grid">
        <div class="pc"><div class="l">Calorías diarias</div><div class="v">~${AVG_PLANNED_KCAL} kcal</div></div>
        <div class="pc"><div class="l">Objetivo</div><div class="v sm">Recomposición — bajar grasa, preservar músculo</div></div>
        <div class="pc"><div class="l">Sueño objetivo</div><div class="v">8 h/noche</div></div>
        <div class="pc"><div class="l">Actividad</div><div class="v sm">Caminata 5-6x · Gym 2x · Running 2x</div></div>
      </div>
      <h2>Tendencia de calorías netas</h2>
      <div class="ssub">Balance diario objetivo vs. real (comidas − ejercicio estimado). Cada franja es una semana.</div>
      <div class="chart">
        ${trendChartSVG(series, weeks)}
        <div class="clegend2">
          <span><i style="background:#8A8A8A"></i>Objetivo diario</span>
          <span><i style="background:#0A0A0A"></i>Real registrado</span>
          <span><i style="background:#D44333;border-radius:50%;width:9px;height:9px"></i>Día sobre objetivo</span>
        </div>
      </div>
      <h2 style="margin-top:18px;">Detalle semana a semana</h2>
      <div class="ssub">Del ${fmtShort(start)} al ${fmtShort(end)} · ${series.length} días (${daysEmpty} sin registrar).</div>
      ${weeksHTML}
      <div class="footer">Informe generado automáticamente desde la app. Las estimaciones de calorías (comidas fuera de plan, postres y gasto por ejercicio) son aproximadas y sirven como guía de tendencia, no como medición clínica.</div>
    </div>
  </div>`;
}

// ---- carga de librerías desde CDN ----
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error("No se pudo cargar " + src));
    document.head.appendChild(s);
  });
}

async function ensureLibs() {
  if (!window.html2canvas) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  if (!(window.jspdf && window.jspdf.jsPDF)) await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
}

// ---- API pública: generar y descargar el PDF ----
export async function exportReportPDF(state, fromISO, toISO) {
  await ensureLibs();
  const html = buildReportHTML(state, fromISO, toISO);

  // contenedor fuera de pantalla para renderizar
  const holder = document.createElement("div");
  holder.style.cssText = "position:fixed;left:-99999px;top:0;width:794px;background:#fff;";
  holder.innerHTML = html;
  document.body.appendChild(holder);

  try {
    const node = holder.querySelector("#report-root");
    const canvas = await window.html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = canvas.height * imgW / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
    while (heightLeft > 0) {
      position -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }
    pdf.save(`Informe_${fromISO}_a_${toISO}.pdf`);
  } finally {
    document.body.removeChild(holder);
  }
}
