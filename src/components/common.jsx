// Componentes y helpers compartidos entre pantallas
export function ProgressRing({ value, total, onDark }) {
  const r = 22, c = 2 * Math.PI * r;
  const pct = total ? value / total : 0;
  return (
    <svg className={"ring" + (onDark ? "" : " on-light")} width="56" height="56">
      <circle cx="28" cy="28" r={r} className="track" fill="none" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} className="fill" fill="none" strokeWidth="5"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
    </svg>
  );
}

export const exByName = (exercises, name) =>
  exercises.find((e) => e.name === name) || { name, icon: "other" };
