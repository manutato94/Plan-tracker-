// Icon registry — Font Awesome solid (Base design system)
const FA = {
  today: "fa-calendar-day", week: "fa-calendar-week", goals: "fa-bullseye",
  settings: "fa-gear", guide: "fa-utensils",
  check: "fa-check", x: "fa-xmark", plus: "fa-plus", minus: "fa-minus",
  chevL: "fa-chevron-left", chevR: "fa-chevron-right", back: "fa-chevron-right",
  spark: "fa-wand-magic-sparkles", flame: "fa-fire-flame-curved",
  sun: "fa-mug-hot", bowl: "fa-bowl-food", leaf: "fa-apple-whole", moon: "fa-moon",
  sleep: "fa-bed",
  run: "fa-person-running", walk: "fa-person-walking", bike: "fa-person-biking",
  dumbbell: "fa-dumbbell", core: "fa-person", yoga: "fa-spa",
  swim: "fa-person-swimming", bolt: "fa-bolt", stretch: "fa-child-reaching",
  rest: "fa-bed", other: "fa-star",
};

export function Icon({ name, size = 22, style }) {
  const cls = FA[name] || FA.other;
  return (
    <i
      className={"fa-solid " + cls}
      style={{ fontSize: size, lineHeight: 1, width: "1em", height: "1em", display: "inline-flex", alignItems: "center", justifyContent: "center", ...style }}
      aria-hidden="true"
    />
  );
}
