import { useState, useEffect } from 'react';
import { Icon } from './components/Icon.jsx';
import { loadState, todayISO, blankDay } from './lib/helpers.js';
import { TodayScreen } from './screens/TodayScreen.jsx';
import { CalendarScreen } from './screens/CalendarScreen.jsx';
import { GoalsScreen } from './screens/GoalsScreen.jsx';
import { GuideScreen } from './screens/GuideScreen.jsx';
import { SettingsScreen } from './screens/SettingsScreen.jsx';

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("today");
  const [dateISO, setDateISO] = useState(todayISO());

  useEffect(() => {
    try { localStorage.setItem("manuel_tracking_v1", JSON.stringify(state)); } catch(e) {}
  }, [state]);

  const day = state.days[dateISO] || blankDay();
  const updateDay = (nd) => setState(s => ({ ...s, days: { ...s.days, [dateISO]: nd } }));

  const tabs = [
    { key: "today", label: "Hoy", icon: "today" },
    { key: "calendar", label: "Calendario", icon: "week" },
    { key: "goals", label: "Metas", icon: "goals" },
    { key: "guide", label: "Plan", icon: "guide" },
    { key: "settings", label: "Ajustes", icon: "settings" },
  ];

  return (
    <div className="app-shell">
      {tab === "today" && <TodayScreen dateISO={dateISO} setDateISO={setDateISO} day={day} updateDay={updateDay} state={state} goGuide={() => setTab("guide")} />}
      {tab === "calendar" && <CalendarScreen state={state} setDateISO={(iso) => { setDateISO(iso); setTab("today"); }} goToday={() => { setDateISO(todayISO()); setTab("today"); }} />}
      {tab === "goals" && <GoalsScreen state={state} />}
      {tab === "guide" && <GuideScreen backToToday={() => setTab("today")} />}
      {tab === "settings" && <SettingsScreen state={state} setState={setState} />}

      <nav className="tabbar">
        {tabs.map(x => (
          <button key={x.key} className={"tab " + (tab === x.key ? "active" : "")} onClick={() => setTab(x.key)}>
            <Icon name={x.icon} size={19} /><span>{x.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
