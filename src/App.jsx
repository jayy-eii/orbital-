import React, { useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Activity, Stethoscope, User, Users, LayoutDashboard, ClipboardList, AlertTriangle,
  Pill as PillIcon, Settings, Bell, FileText, TrendingUp, LogOut, Sparkles, Check, ChevronRight,
  Search, Plus, X, Clock, HeartPulse, ShieldCheck, ArrowLeft, Loader2, CalendarDays,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Design tokens                                                          */
/* ---------------------------------------------------------------------- */

const FONT_IMPORT_ID = "care-platform-fonts";

function useFonts() {
  React.useEffect(() => {
    if (document.getElementById(FONT_IMPORT_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_IMPORT_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

const T = {
  // Main backgrounds
  bg: "#F7F8F6",
  bgElevated: "#FFFFFF",

  // Cards / surfaces
  surface: "#FFFFFF",
  surfaceHover: "#F1F4F2",

  // Borders
  border: "#E2E6E3",
  borderStrong: "#CBD2CE",

  // Text
  textPrimary: "#17201C",
  textSecondary: "#66736D",
  textTertiary: "#89948E",

  // Accents
  accent: "#D98A24",
  accentSoft: "rgba(217,138,36,0.12)",

  mint: "#2F9B72",
  mintSoft: "rgba(47,155,114,0.12)",

  red: "#D94B43",
  redSoft: "rgba(217,75,67,0.12)",

  blue: "#5278D4",
  blueSoft: "rgba(82,120,212,0.12)",
};

const heading = { fontFamily: "'Space Grotesk', sans-serif" };
const body = { fontFamily: "'Inter', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

/* ---------------------------------------------------------------------- */
/* Mock data                                                              */
/* ---------------------------------------------------------------------- */

const DIAGNOSIS_TAGS = [
  "Type 2 Diabetes", "Hypertension", "Hyperlipidemia", "CKD Stage 2",
  "Obesity", "Pre-diabetes", "CAD", "Hypothyroidism",
];

function genVitals(base, days, drift) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const noise = (s) => s + (Math.random() - 0.5) * 4;
    out.push({
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      sys: Math.round(noise(base.sys + drift.sys * (days - 1 - i))),
      dia: Math.round(noise(base.dia + drift.dia * (days - 1 - i))),
      sugar: Math.round(noise(base.sugar + drift.sugar * (days - 1 - i))),
      weight: +(base.weight + drift.weight * (days - 1 - i) + (Math.random() - 0.5)).toFixed(1),
    });
  }
  return out;
}

const INITIAL_PATIENTS = [
  {
    id: "p1", name: "Aarav Sharma", age: 54, gender: "Male",
    condition: "Type 2 Diabetes", tags: ["Type 2 Diabetes", "Hyperlipidemia"],
    avatarColor: T.accent,
    vitals: genVitals({ sys: 128, dia: 82, sugar: 145, weight: 82 }, 10, { sys: 1.2, dia: 0.3, sugar: 2.1, weight: 0.05 }),
    notes: [
      { id: "n0", date: "24 Aug", soap: { subjective: "Patient reports fatigue and mild thirst over the past week.", objective: "BP 132/84, FBS 152 mg/dL, weight stable.", assessment: "Suboptimal glycemic control.", plan: "Increase Metformin to 1000mg BID, recheck HbA1c in 6 weeks." }, approved: true },
    ],
    prescriptions: [
      { id: "rx1", medicine: "Metformin", dosage: "500mg", freq: "Twice daily", duration: "30 days" },
      { id: "rx2", medicine: "Atorvastatin", dosage: "10mg", freq: "Once at night", duration: "30 days" },
    ],
    symptomLog: [
      { id: "s1", date: "Today, 8:02 AM", symptom: "Fatigue", severity: "Mild", note: "Slight tiredness after breakfast." },
    ],
    reminders: [
      { id: "r1", medicine: "Metformin", time: "8:00 AM", enabled: true },
      { id: "r2", medicine: "Metformin", time: "8:00 PM", enabled: true },
      { id: "r3", medicine: "Atorvastatin", time: "10:00 PM", enabled: false },
    ],
    afterVisitSummary: "Your sugar levels have been a bit high, so Dr. Rao increased your Metformin dose. Keep logging your readings daily and cut down on sugary drinks. Next check-up in 6 weeks.",
  },
  {
    id: "p2", name: "Meera Iyer", age: 61, gender: "Female",
    condition: "Hypertension", tags: ["Hypertension"],
    avatarColor: T.blue,
    vitals: genVitals({ sys: 146, dia: 92, sugar: 98, weight: 68 }, 10, { sys: 0.6, dia: 0.2, sugar: 0.1, weight: -0.02 }),
    notes: [],
    prescriptions: [{ id: "rx3", medicine: "Amlodipine", dosage: "5mg", freq: "Once daily", duration: "30 days" }],
    symptomLog: [],
    reminders: [{ id: "r4", medicine: "Amlodipine", time: "7:30 AM", enabled: true }],
    afterVisitSummary: "",
  },
  {
    id: "p3", name: "Ravi Verma", age: 47, gender: "Male",
    condition: "Diabetes + Hypertension", tags: ["Type 2 Diabetes", "Hypertension"],
    avatarColor: T.red,
    vitals: genVitals({ sys: 150, dia: 96, sugar: 190, weight: 91 }, 10, { sys: 0.3, dia: 0.4, sugar: 1.0, weight: 0.03 }),
    notes: [],
    prescriptions: [
      { id: "rx4", medicine: "Metformin", dosage: "1000mg", freq: "Twice daily", duration: "30 days" },
      { id: "rx5", medicine: "Telmisartan", dosage: "40mg", freq: "Once daily", duration: "30 days" },
    ],
    symptomLog: [{ id: "s2", date: "Yesterday, 9:14 PM", symptom: "Headache", severity: "Moderate", note: "Started after work, resolved with rest." }],
    reminders: [{ id: "r5", medicine: "Telmisartan", time: "9:00 AM", enabled: true }],
    afterVisitSummary: "",
  },
  {
    id: "p4", name: "Sunita Rao", age: 68, gender: "Female",
    condition: "CKD Stage 2", tags: ["CKD Stage 2", "Hypertension"],
    avatarColor: T.mint,
    vitals: genVitals({ sys: 134, dia: 84, sugar: 110, weight: 60 }, 10, { sys: 0.1, dia: 0.05, sugar: 0.2, weight: -0.04 }),
    notes: [],
    prescriptions: [{ id: "rx6", medicine: "Losartan", dosage: "25mg", freq: "Once daily", duration: "30 days" }],
    symptomLog: [],
    reminders: [{ id: "r6", medicine: "Losartan", time: "8:00 AM", enabled: true }],
    afterVisitSummary: "",
  },
  {
    id: "p5", name: "Karan Mehta", age: 39, gender: "Male",
    condition: "Pre-diabetes", tags: ["Pre-diabetes", "Obesity"],
    avatarColor: "#B285E8",
    vitals: genVitals({ sys: 122, dia: 78, sugar: 118, weight: 95 }, 10, { sys: 0.1, dia: 0.1, sugar: 0.3, weight: 0.02 }),
    notes: [],
    prescriptions: [],
    symptomLog: [],
    reminders: [],
    afterVisitSummary: "",
  },
];

function latestVitals(p) {
  return p.vitals[p.vitals.length - 1];
}

function isAbnormal(v) {
  const reasons = [];
  if (v.sys >= 140 || v.dia >= 90) reasons.push(`BP ${v.sys}/${v.dia} mmHg`);
  if (v.sugar >= 160) reasons.push(`Sugar ${v.sugar} mg/dL`);
  return reasons;
}

/* ---------------------------------------------------------------------- */
/* Small UI primitives                                                    */
/* ---------------------------------------------------------------------- */

function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: 20,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "neutral", style }) {
  const tones = {
    neutral: { bg: T.bgElevated, fg: T.textSecondary, bd: T.border },
    accent: { bg: T.accentSoft, fg: T.accent, bd: "transparent" },
    mint: { bg: T.mintSoft, fg: T.mint, bd: "transparent" },
    red: { bg: T.redSoft, fg: T.red, bd: "transparent" },
    blue: { bg: T.blueSoft, fg: T.blue, bd: "transparent" },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 10px", borderRadius: 100, fontSize: 12.5, fontWeight: 500,
        background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, ...body, ...style,
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, variant = "primary", icon: Icon, style, disabled, type = "button" }) {
  const variants = {
    primary: { background: T.accent, color: "#FFFFFF", border: "1px solid transparent" },
    ghost: { background: "transparent", color: T.textPrimary, border: `1px solid ${T.border}` },
    subtle: { background: T.bgElevated, color: T.textSecondary, border: `1px solid ${T.border}` },
    danger: { background: T.redSoft, color: T.red, border: "1px solid transparent" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        padding: "9px 16px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1, transition: "filter .15s ease, transform .1s ease",
        ...variants[variant], ...body, ...style,
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(1.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; }}
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
      <div>
        {eyebrow && <div style={{ ...body, fontSize: 13, color: T.textTertiary, marginBottom: 4 }}>{eyebrow}</div>}
        <h2 style={{ ...heading, fontSize: 22, fontWeight: 600, color: T.textPrimary, margin: 0 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Avatar({ name, color, size = 38 }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: `${color}22`, color,
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: size * 0.36,
      ...heading, flexShrink: 0, border: `1px solid ${color}44`,
    }}>
      {initials}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ ...body, fontSize: 12.5, color: T.textSecondary, marginBottom: 7, fontWeight: 500 }}>{label}</div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: T.bgElevated, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: "9px 12px", color: T.textPrimary, fontSize: 13.5, outline: "none", ...body,
};

/* ---------------------------------------------------------------------- */
/* AI helper — calls a local Ollama server                                */
/* ---------------------------------------------------------------------- */

// Change this if your Ollama model name is different (check with `ollama list`)
const OLLAMA_MODEL = "llama3.1:latest";
const OLLAMA_URL = "http://localhost:11434/api/chat";

async function askClaude(prompt) {
  let response;
  try {
    response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach Ollama at ${OLLAMA_URL}. Make sure "ollama serve" is running and that this app is opened from http://localhost (not an https:// sandbox). Original error: ${networkErr.message}`
    );
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Ollama returned ${response.status} ${response.statusText}. ${bodyText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Ollama error: ${data.error}`);
  }

  const text = data.message?.content;
  if (!text) {
    throw new Error("Ollama responded but returned no message content.");
  }
  return text;
}

function stripFences(text) {
  return text.replace(/```json|```/g, "").trim();
}

/* ---------------------------------------------------------------------- */
/* Landing screen                                                          */
/* ---------------------------------------------------------------------- */

function EKGLine() {
  return (
    <svg viewBox="0 0 1200 120" width="100%" height="90" preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline
        points="0,60 140,60 165,60 180,20 195,100 210,40 225,60 400,60 430,60 450,15 468,100 486,60 520,60 700,60 730,60 748,10 766,105 784,60 820,60 1000,60 1020,60 1038,25 1056,95 1074,60 1200,60"
        fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${T.accent}66)` }}
      >
        <animate attributeName="stroke-dasharray" from="0,2000" to="2000,0" dur="3.2s" repeatCount="indefinite" />
      </polyline>
    </svg>
  );
}

function Landing({ onSelect }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "38%", left: 0, right: 0, opacity: 0.55 }}>
        <EKGLine />
      </div>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 620 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...body, fontSize: 13, color: T.textTertiary, marginBottom: 18, letterSpacing: 0.2 }}>
          <HeartPulse size={15} color={T.accent} /> Chronic-care documentation, built for the visit and the days between
        </div>
        <h1 style={{ ...heading, fontSize: 44, lineHeight: 1.12, color: T.textPrimary, margin: "0 0 14px", fontWeight: 600 }}>
          One record.<br />Two people watching it.
        </h1>
        <p style={{ ...body, fontSize: 15.5, color: T.textSecondary, lineHeight: 1.6, margin: "0 0 40px" }}>
          Vitals logged at home, notes drafted at the clinic, and the space between visits actually accounted for.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <RoleCard icon={Stethoscope} title="Doctor" desc="Review patients, draft notes, catch flags early" color={T.accent} onClick={() => onSelect("doctor")} />
          <RoleCard icon={User} title="Patient" desc="Log vitals, follow the care plan, stay on track" color={T.mint} onClick={() => onSelect("patient")} />
        </div>
        <button onClick={() => onSelect("admin")} style={{ marginTop: 30, background: "none", border: "none", color: T.textTertiary, ...body, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
          View system overview (admin)
        </button>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, title, desc, color, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 230, textAlign: "left", padding: 22, borderRadius: 16, cursor: "pointer",
        background: hover ? T.surfaceHover : T.surface, border: `1px solid ${hover ? color : T.border}`,
        transition: "all .18s ease", transform: hover ? "translateY(-2px)" : "none",
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}1F`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ ...heading, fontSize: 17, fontWeight: 600, color: T.textPrimary, marginBottom: 5 }}>{title} portal</div>
      <div style={{ ...body, fontSize: 12.5, color: T.textSecondary, lineHeight: 1.5 }}>{desc}</div>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Shell (sidebar + topbar) shared by doctor/patient/admin                */
/* ---------------------------------------------------------------------- */

function Shell({ role, navItems, active, onNavigate, onExit, userLabel, userSub, accentColor, children }) {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", ...body }}>
      <aside style={{ width: 232, flexShrink: 0, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", padding: "22px 14px", background: T.bgElevated }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px", marginBottom: 30 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accentColor}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color={accentColor} />
          </div>
          <span style={{ ...heading, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>CarePath</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {navItems.map((item) => {
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 9,
                  background: isActive ? `${accentColor}17` : "transparent", border: "none", cursor: "pointer",
                  color: isActive ? accentColor : T.textSecondary, fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                  textAlign: "left", width: "100%", position: "relative",
                }}
              >
                <item.icon size={16} />
                {item.label}
                {item.badge ? (
                  <span style={{ marginLeft: "auto", background: T.red, color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 100 }}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 12 }}>
            <Avatar name={userLabel} color={accentColor} size={32} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: T.textPrimary, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userLabel}</div>
              <div style={{ fontSize: 11, color: T.textTertiary }}>{userSub}</div>
            </div>
          </div>
          <button onClick={onExit} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", borderRadius: 9, background: "transparent", border: "none", cursor: "pointer", color: T.textTertiary, fontSize: 13, width: "100%" }}>
            <LogOut size={15} /> Switch portal
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, padding: "30px 36px 60px", maxWidth: 1180 }}>
        {children}
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DOCTOR PORTAL                                                           */
/* ---------------------------------------------------------------------- */

function DoctorPortal({ patients, setPatients, onExit }) {
  const [section, setSection] = useState("dashboard");
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");

  const alerts = useMemo(() => {
    return patients
      .map((p) => ({ p, reasons: isAbnormal(latestVitals(p)) }))
      .filter((x) => x.reasons.length > 0);
  }, [patients]);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "patients", label: "Patients", icon: Users },
    { key: "alerts", label: "Alerts", icon: AlertTriangle, badge: alerts.length || undefined },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const openPatient = (id) => { setSelectedId(id); setSection("patient-detail"); };

  const updatePatient = useCallback((id, updater) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  }, [setPatients]);

  const selectedPatient = patients.find((p) => p.id === selectedId);

  return (
    <Shell
      navItems={navItems}
      active={section === "patient-detail" ? "patients" : section}
      onNavigate={(k) => { setSection(k); }}
      onExit={onExit}
      userLabel="Dr. Anjali Rao"
      userSub="General Medicine"
      accentColor={T.accent}
    >
      {section === "dashboard" && (
        <DoctorDashboard patients={patients} alerts={alerts} onOpenPatient={openPatient} />
      )}
      {section === "patients" && (
        <PatientList patients={patients} search={search} setSearch={setSearch} onOpen={openPatient} />
      )}
      {section === "alerts" && (
        <AlertsPanel alerts={alerts} onOpen={openPatient} />
      )}
      {section === "settings" && <DoctorSettings />}
      {section === "patient-detail" && selectedPatient && (
        <PatientDetail
          patient={selectedPatient}
          onBack={() => setSection("patients")}
          onUpdate={(updater) => updatePatient(selectedPatient.id, updater)}
        />
      )}
    </Shell>
  );
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <Card style={{ flex: 1, minWidth: 160 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12.5, color: T.textSecondary, fontWeight: 500 }}>{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div style={{ ...heading, fontSize: 27, fontWeight: 600, color: T.textPrimary }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function DoctorDashboard({ patients, alerts, onOpenPatient }) {
  return (
    <div>
      <SectionHeader eyebrow="Good morning" title="Today's overview" />
      <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard label="Assigned patients" value={patients.length} icon={Users} color={T.blue} />
        <StatCard label="Flagged today" value={alerts.length} icon={AlertTriangle} color={T.red} sub={alerts.length ? "Needs review" : "All within range"} />
        <StatCard label="Notes pending review" value={patients.reduce((n, p) => n + p.notes.filter((x) => !x.approved).length, 0)} icon={FileText} color={T.accent} />
        <StatCard label="Active prescriptions" value={patients.reduce((n, p) => n + p.prescriptions.length, 0)} icon={PillIcon} color={T.mint} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ ...heading, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>Your patients</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {patients.map((p) => (
              <PatientRow key={p.id} patient={p} onClick={() => onOpenPatient(p.id)} />
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <AlertTriangle size={15} color={T.red} />
            <span style={{ ...heading, fontSize: 15, fontWeight: 600, color: T.textPrimary }}>Flagged readings</span>
          </div>
          {alerts.length === 0 && <div style={{ fontSize: 13, color: T.textTertiary }}>No abnormal readings right now.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alerts.map(({ p, reasons }) => (
              <div key={p.id} onClick={() => onOpenPatient(p.id)} style={{ cursor: "pointer", padding: 12, borderRadius: 10, background: T.redSoft, border: `1px solid ${T.red}33` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.red, ...mono }}>{reasons.join(" · ")}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PatientRow({ patient, onClick }) {
  const v = latestVitals(patient);
  const abnormal = isAbnormal(v).length > 0;
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "11px 10px", borderRadius: 10, cursor: "pointer",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Avatar name={patient.name} color={patient.avatarColor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: T.textPrimary }}>{patient.name}</div>
        <div style={{ fontSize: 12, color: T.textTertiary }}>{patient.age} yrs · {patient.condition}</div>
      </div>
      <div style={{ fontSize: 12, ...mono, color: abnormal ? T.red : T.mint }}>
        {v.sys}/{v.dia}
      </div>
      {abnormal && <Pill tone="red">Flagged</Pill>}
      <ChevronRight size={15} color={T.textTertiary} />
    </div>
  );
}

function PatientList({ patients, search, setSearch, onOpen }) {
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <SectionHeader
        eyebrow="Panel"
        title="Patients"
        action={
          <div style={{ position: "relative" }}>
            <Search size={14} color={T.textTertiary} style={{ position: "absolute", left: 11, top: 10 }} />
            <input placeholder="Search patients" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 32, width: 220 }} />
          </div>
        }
      />
      <Card style={{ padding: 8 }}>
        {filtered.map((p) => <PatientRow key={p.id} patient={p} onClick={() => onOpen(p.id)} />)}
        {filtered.length === 0 && <div style={{ padding: 16, fontSize: 13, color: T.textTertiary }}>No patients match "{search}".</div>}
      </Card>
    </div>
  );
}

function AlertsPanel({ alerts, onOpen }) {
  return (
    <div>
      <SectionHeader eyebrow="Safety net" title="Flagged patients" />
      {alerts.length === 0 && (
        <Card><div style={{ fontSize: 13.5, color: T.textSecondary }}>Nothing flagged — every patient's latest reading is within normal range.</div></Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map(({ p, reasons }) => {
          const v = latestVitals(p);
          return (
            <Card key={p.id} style={{ border: `1px solid ${T.red}3A` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={p.name} color={p.avatarColor} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: T.textPrimary }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: T.textSecondary }}>{p.condition}</div>
                </div>
                <div style={{ textAlign: "right", marginRight: 10 }}>
                  <div style={{ fontSize: 11.5, color: T.textTertiary, marginBottom: 3 }}>Reason</div>
                  <Pill tone="red">{reasons.join(" · ")}</Pill>
                </div>
                <Button variant="ghost" icon={ChevronRight} onClick={() => onOpen(p.id)}>Review</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DoctorSettings() {
  return (
    <div>
      <SectionHeader eyebrow="Account" title="Settings" />
      <Card style={{ maxWidth: 480 }}>
        <Field label="Full name"><input defaultValue="Dr. Anjali Rao" style={inputStyle} /></Field>
        <Field label="Specialty"><input defaultValue="General Medicine" style={inputStyle} /></Field>
        <Field label="Clinic"><input defaultValue="Sunrise Family Clinic, Aurangabad" style={inputStyle} /></Field>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${T.border}`, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>Email alert digest</div>
            <div style={{ fontSize: 12, color: T.textTertiary }}>Daily summary of flagged patients</div>
          </div>
          <Toggle defaultOn />
        </div>
        <Button style={{ marginTop: 18 }}>Save changes</Button>
      </Card>
    </div>
  );
}

function Toggle({ defaultOn = false, onChange }) {
  const [on, setOn] = useState(defaultOn);
  React.useEffect(() => { setOn(defaultOn); }, [defaultOn]);
  const flip = () => { const next = !on; setOn(next); if (onChange) onChange(next); };
  return (
    <button onClick={flip} style={{
      width: 38, height: 22, borderRadius: 100, border: "none", cursor: "pointer",
      background: on ? T.accent : T.border, position: "relative", transition: "background .15s",
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%", background: "#FFFFFF", position: "absolute", top: 3,
        left: on ? 19 : 3, transition: "left .15s",
      }} />
    </button>
  );
}

/* --- Patient detail (doctor view): history, vitals, AI note, rx --- */

function PatientDetail({ patient, onBack, onUpdate }) {
  const [tab, setTab] = useState("history");
  const tabs = [
    { key: "history", label: "History" },
    { key: "vitals", label: "Vitals trend" },
    { key: "note", label: "Note & AI SOAP" },
    { key: "rx", label: "Prescriptions" },
  ];
  const v = latestVitals(patient);
  const abnormal = isAbnormal(v);

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: T.textTertiary, fontSize: 12.5, cursor: "pointer", marginBottom: 18, padding: 0 }}>
        <ArrowLeft size={14} /> All patients
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
        <Avatar name={patient.name} color={patient.avatarColor} size={52} />
        <div style={{ flex: 1 }}>
          <h2 style={{ ...heading, fontSize: 22, fontWeight: 600, color: T.textPrimary, margin: "0 0 4px" }}>{patient.name}</h2>
          <div style={{ fontSize: 13, color: T.textSecondary }}>{patient.age} yrs · {patient.gender} · {patient.condition}</div>
        </div>
        {abnormal.length > 0 && <Pill tone="red"><AlertTriangle size={12} /> {abnormal.join(" · ")}</Pill>}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 22, borderBottom: `1px solid ${T.border}`, paddingBottom: 2 }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "9px 4px", marginRight: 22, background: "none", border: "none", cursor: "pointer",
            color: tab === t.key ? T.textPrimary : T.textTertiary, fontSize: 13.5, fontWeight: 600,
            borderBottom: tab === t.key ? `2px solid ${T.accent}` : "2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "history" && <HistoryTab patient={patient} />}
      {tab === "vitals" && <VitalsTrendTab patient={patient} />}
      {tab === "note" && <NoteTab patient={patient} onUpdate={onUpdate} />}
      {tab === "rx" && <PrescriptionsTab patient={patient} onUpdate={onUpdate} />}
    </div>
  );
}

function HistoryTab({ patient }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {patient.tags.map((t) => <Pill key={t} tone="accent">{t}</Pill>)}
      </div>
      {patient.notes.length === 0 && (
        <Card><div style={{ fontSize: 13.5, color: T.textTertiary }}>No past visit notes yet — start one from the Note & AI SOAP tab.</div></Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[...patient.notes].reverse().map((n) => (
          <Card key={n.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.textTertiary }}>
                <CalendarDays size={13} /> {n.date}
              </div>
              {n.approved && <Pill tone="mint"><Check size={11} /> Approved</Pill>}
            </div>
            {["subjective", "objective", "assessment", "plan"].map((k) => (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, textTransform: "capitalize", color: T.textTertiary, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.5 }}>{n.soap[k]}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}

function VitalsTrendTab({ patient }) {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 16 }}>Blood pressure (mmHg)</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={patient.vitals}>
            <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={T.textTertiary} fontSize={11} />
            <YAxis stroke={T.textTertiary} fontSize={11} domain={[60, 170]} />
            <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sys" name="Systolic" stroke={T.red} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="dia" name="Diastolic" stroke={T.blue} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 16 }}>Blood sugar (mg/dL)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={patient.vitals}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={T.textTertiary} fontSize={10.5} />
              <YAxis stroke={T.textTertiary} fontSize={10.5} />
              <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="sugar" stroke={T.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 16 }}>Weight (kg)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={patient.vitals}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke={T.textTertiary} fontSize={10.5} />
              <YAxis stroke={T.textTertiary} fontSize={10.5} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="weight" stroke={T.mint} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function NoteTab({ patient, onUpdate }) {
  const [freeText, setFreeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);
  const [selectedTags, setSelectedTags] = useState(patient.tags);

  const generate = async () => {
    if (!freeText.trim()) return;
    setLoading(true); setError(""); setDraft(null);
    try {
      const prompt = `You are helping a doctor convert free-text consultation notes into a structured SOAP note for a chronic-disease patient. Patient: ${patient.name}, ${patient.age}, known condition: ${patient.condition}.
Consultation notes: """${freeText}"""

Respond with ONLY a JSON object, no preamble, no markdown fences, in this exact shape:
{"subjective": "...", "objective": "...", "assessment": "...", "plan": "...", "suggestedTags": ["tag1","tag2"]}
Pick suggestedTags only from this list: ${DIAGNOSIS_TAGS.join(", ")}.`;
      const text = await askClaude(prompt);
      const parsed = JSON.parse(stripFences(text));
      setDraft(parsed);
      if (parsed.suggestedTags) setSelectedTags((prev) => Array.from(new Set([...prev, ...parsed.suggestedTags])));
    } catch (e) {
      console.error("SOAP note generation failed:", e);
      setError(e.message || "Couldn't generate the note. You can try again or write it manually below.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const approve = () => {
    if (!draft) return;
    const newNote = {
      id: `n${Date.now()}`, date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      soap: draft, approved: true,
    };
    onUpdate((p) => ({ ...p, notes: [...p.notes, newNote], tags: selectedTags }));
    setDraft(null); setFreeText("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
      <Card>
        <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>Consultation notes</div>
        <div style={{ fontSize: 12, color: T.textTertiary, marginBottom: 12 }}>Type freely — the AI will structure it into a SOAP note.</div>
        <textarea
          value={freeText} onChange={(e) => setFreeText(e.target.value)} rows={9}
          placeholder="e.g. Patient complains of increased thirst and fatigue over 2 weeks. BP 138/88, sugar fasting 162..."
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
        />
        <Button style={{ marginTop: 12 }} icon={loading ? Loader2 : Sparkles} onClick={generate} disabled={loading || !freeText.trim()}>
          {loading ? "Generating…" : "Generate SOAP note with AI"}
        </Button>
        {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 10, lineHeight: 1.5 }}>{error}</div>}

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12.5, color: T.textSecondary, marginBottom: 8, fontWeight: 500 }}>Diagnosis tags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DIAGNOSIS_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                padding: "5px 11px", borderRadius: 100, fontSize: 12, cursor: "pointer", ...body,
                background: selectedTags.includes(tag) ? T.accentSoft : T.bgElevated,
                color: selectedTags.includes(tag) ? T.accent : T.textSecondary,
                border: `1px solid ${selectedTags.includes(tag) ? "transparent" : T.border}`,
              }}>{tag}</button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary }}>AI draft — review before saving</div>
          {draft && <Pill tone="accent"><Sparkles size={11} /> AI-generated</Pill>}
        </div>
        {!draft && <div style={{ fontSize: 13, color: T.textTertiary }}>Generate a note to see the structured draft here. You can edit every field before approving.</div>}
        {draft && (
          <>
            {["subjective", "objective", "assessment", "plan"].map((k) => (
              <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                <textarea rows={2} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.4 }} />
              </Field>
            ))}
            <Button icon={Check} onClick={approve}>Approve & save to history</Button>
          </>
        )}
      </Card>
    </div>
  );
}

function PrescriptionsTab({ patient, onUpdate }) {
  const [form, setForm] = useState({ medicine: "", dosage: "", freq: "Once daily", duration: "30 days" });

  const add = () => {
    if (!form.medicine.trim()) return;
    onUpdate((p) => ({ ...p, prescriptions: [...p.prescriptions, { id: `rx${Date.now()}`, ...form }] }));
    setForm({ medicine: "", dosage: "", freq: "Once daily", duration: "30 days" });
  };
  const remove = (id) => onUpdate((p) => ({ ...p, prescriptions: p.prescriptions.filter((r) => r.id !== id) }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
      <Card>
        <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>Add prescription</div>
        <Field label="Medicine name"><input value={form.medicine} onChange={(e) => setForm({ ...form, medicine: e.target.value })} style={inputStyle} placeholder="e.g. Metformin" /></Field>
        <Field label="Dosage"><input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} style={inputStyle} placeholder="e.g. 500mg" /></Field>
        <Field label="Frequency">
          <select value={form.freq} onChange={(e) => setForm({ ...form, freq: e.target.value })} style={inputStyle}>
            <option>Once daily</option><option>Twice daily</option><option>Thrice daily</option><option>Once at night</option>
          </select>
        </Field>
        <Field label="Duration"><input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} style={inputStyle} /></Field>
        <Button icon={Plus} onClick={add}>Add to prescriptions</Button>
      </Card>
      <Card>
        <div style={{ ...heading, fontSize: 14, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>Current prescriptions</div>
        {patient.prescriptions.length === 0 && <div style={{ fontSize: 13, color: T.textTertiary }}>No active prescriptions.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {patient.prescriptions.map((rx) => (
            <div key={rx.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 11, background: T.bgElevated, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <PillIcon size={16} color={T.mint} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.textPrimary }}>{rx.medicine} <span style={{ color: T.textTertiary, fontWeight: 400 }}>· {rx.dosage}</span></div>
                <div style={{ fontSize: 12, color: T.textSecondary }}>{rx.freq} · {rx.duration}</div>
              </div>
              <button onClick={() => remove(rx.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textTertiary }}><X size={15} /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PATIENT PORTAL                                                          */
/* ---------------------------------------------------------------------- */

function PatientPortal({ patients, setPatients, onExit }) {
  const [patientId, setPatientId] = useState(patients[0].id);
  const [section, setSection] = useState("dashboard");
  const patient = patients.find((p) => p.id === patientId);

  const updatePatient = useCallback((updater) => {
    setPatients((prev) => prev.map((p) => (p.id === patientId ? updater(p) : p)));
  }, [setPatients, patientId]);

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "log", label: "Log vitals", icon: HeartPulse },
    { key: "trends", label: "Trends", icon: TrendingUp },
    { key: "careplan", label: "Care plan", icon: ClipboardList },
    { key: "meds", label: "Medications", icon: PillIcon },
    { key: "symptoms", label: "Symptom log", icon: FileText },
    { key: "summary", label: "Visit summary", icon: Sparkles },
    { key: "notifications", label: "Notifications", icon: Bell, badge: 2 },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Shell
      navItems={navItems} active={section} onNavigate={setSection} onExit={onExit}
      userLabel={patient.name} userSub={patient.condition} accentColor={T.mint}
    >
      <div style={{ marginBottom: 18 }}>
        <select value={patientId} onChange={(e) => { setPatientId(e.target.value); }} style={{ ...inputStyle, width: 220, fontSize: 12.5 }}>
          {patients.map((p) => <option key={p.id} value={p.id}>Viewing as: {p.name}</option>)}
        </select>
      </div>
      {section === "dashboard" && <PatientDashboard patient={patient} onNavigate={setSection} />}
      {section === "log" && <VitalsLogSection patient={patient} onUpdate={updatePatient} />}
      {section === "trends" && <VitalsTrendTab patient={patient} />}
      {section === "careplan" && <CarePlanSection patient={patient} />}
      {section === "meds" && <MedicationsSection patient={patient} onUpdate={updatePatient} />}
      {section === "symptoms" && <SymptomLogSection patient={patient} onUpdate={updatePatient} />}
      {section === "summary" && <VisitSummarySection patient={patient} onUpdate={updatePatient} />}
      {section === "notifications" && <NotificationsSection patient={patient} />}
      {section === "settings" && <PatientSettings patient={patient} />}
    </Shell>
  );
}

function PatientDashboard({ patient, onNavigate }) {
  const v = latestVitals(patient);
  const abnormal = isAbnormal(v);
  return (
    <div>
      <SectionHeader eyebrow="Hi there" title={`Welcome back, ${patient.name.split(" ")[0]}`} />
      <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Blood pressure" value={`${v.sys}/${v.dia}`} icon={HeartPulse} color={abnormal.some(r=>r.includes("BP")) ? T.red : T.mint} sub="mmHg, latest" />
        <StatCard label="Blood sugar" value={v.sugar} icon={Activity} color={abnormal.some(r=>r.includes("Sugar")) ? T.red : T.mint} sub="mg/dL, latest" />
        <StatCard label="Weight" value={`${v.weight} kg`} icon={TrendingUp} color={T.blue} sub="latest entry" />
      </div>

      {abnormal.length > 0 && (
        <Card style={{ border: `1px solid ${T.red}3A`, background: T.redSoft, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, color: T.red, fontSize: 13.5, fontWeight: 600 }}>
            <AlertTriangle size={16} /> {abnormal.join(" · ")} — your care team has been notified.
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card style={{ cursor: "pointer" }} onClick={() => onNavigate("log")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <HeartPulse size={16} color={T.mint} />
            <span style={{ ...heading, fontSize: 14.5, fontWeight: 600, color: T.textPrimary }}>Log today's vitals</span>
          </div>
          <div style={{ fontSize: 12.5, color: T.textSecondary }}>Takes under a minute — BP, sugar, weight, symptoms.</div>
        </Card>
        <Card style={{ cursor: "pointer" }} onClick={() => onNavigate("careplan")}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <ClipboardList size={16} color={T.blue} />
            <span style={{ ...heading, fontSize: 14.5, fontWeight: 600, color: T.textPrimary }}>Today's care plan</span>
          </div>
          <div style={{ fontSize: 12.5, color: T.textSecondary }}>{patient.prescriptions.length} medicine(s) · {patient.reminders.filter(r=>r.enabled).length} reminder(s) active</div>
        </Card>
      </div>
    </div>
  );
}

function VitalsLogSection({ patient, onUpdate }) {
  const [form, setForm] = useState({ sys: "", dia: "", sugar: "", weight: "", symptom: "" });
  const [saved, setSaved] = useState(false);

  const submit = () => {
    if (!form.sys || !form.dia || !form.sugar || !form.weight) return;
    const entry = {
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      sys: +form.sys, dia: +form.dia, sugar: +form.sugar, weight: +form.weight,
    };
    onUpdate((p) => ({ ...p, vitals: [...p.vitals, entry] }));
    setSaved(true);
    setForm({ sys: "", dia: "", sugar: "", weight: "", symptom: "" });
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <SectionHeader eyebrow="Daily check-in" title="Log your vitals" />
      <Card style={{ maxWidth: 460 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Systolic (mmHg)"><input type="number" value={form.sys} onChange={(e) => setForm({ ...form, sys: e.target.value })} style={inputStyle} placeholder="120" /></Field>
          <Field label="Diastolic (mmHg)"><input type="number" value={form.dia} onChange={(e) => setForm({ ...form, dia: e.target.value })} style={inputStyle} placeholder="80" /></Field>
          <Field label="Blood sugar (mg/dL)"><input type="number" value={form.sugar} onChange={(e) => setForm({ ...form, sugar: e.target.value })} style={inputStyle} placeholder="110" /></Field>
          <Field label="Weight (kg)"><input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={inputStyle} placeholder="70" /></Field>
        </div>
        <Field label="Any symptoms today? (optional)"><input value={form.symptom} onChange={(e) => setForm({ ...form, symptom: e.target.value })} style={inputStyle} placeholder="e.g. mild headache" /></Field>
        <Button icon={saved ? Check : Plus} onClick={submit} style={saved ? { background: T.mint, color: "#08150F" } : {}}>
          {saved ? "Saved" : "Save today's reading"}
        </Button>
      </Card>
    </div>
  );
}

function CarePlanSection({ patient }) {
  return (
    <div>
      <SectionHeader eyebrow="From your doctor" title="Care plan" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patient.prescriptions.length === 0 && <Card><div style={{ fontSize: 13.5, color: T.textTertiary }}>No active care plan yet.</div></Card>}
        {patient.prescriptions.map((rx) => (
          <Card key={rx.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.mintSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PillIcon size={17} color={T.mint} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{rx.medicine} · {rx.dosage}</div>
              <div style={{ fontSize: 12.5, color: T.textSecondary }}>{rx.freq} · {rx.duration}</div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 22 }}>
        <div style={{ ...heading, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 10 }}>Diagnosis on file</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {patient.tags.map((t) => <Pill key={t} tone="blue">{t}</Pill>)}
        </div>
      </div>
    </div>
  );
}
function MedicationsSection({ patient, onUpdate }) {
  const toggle = (id) => onUpdate((p) => ({ ...p, reminders: p.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) }));
  return (
    <div>
      <SectionHeader eyebrow="Stay on schedule" title="Medication reminders" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patient.reminders.length === 0 && <Card><div style={{ fontSize: 13.5, color: T.textTertiary }}>No reminders set yet.</div></Card>}
        {patient.reminders.map((r) => (
          <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={16} color={T.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{r.medicine}</div>
              <div style={{ fontSize: 12.5, color: T.textSecondary }}>Daily at {r.time}</div>
            </div>
            <Toggle defaultOn={r.enabled} onChange={() => toggle(r.id)} />
          </Card>
        ))}
      </div>
      <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 14 }}>Reminders appear in-app and by email at the scheduled time.</div>
    </div>
  );
}

function SymptomLogSection({ patient, onUpdate }) {
  const [symptom, setSymptom] = useState("Fatigue");
  const [severity, setSeverity] = useState("Mild");
  const [note, setNote] = useState("");

  const add = () => {
    const entry = { id: `s${Date.now()}`, date: "Just now", symptom, severity, note };
    onUpdate((p) => ({ ...p, symptomLog: [entry, ...p.symptomLog] }));
    setNote("");
  };

  return (
    <div>
      <SectionHeader eyebrow="Quick check-in" title="Symptom log" />
      <Card style={{ maxWidth: 460, marginBottom: 20 }}>
        <Field label="Symptom">
          <select value={symptom} onChange={(e) => setSymptom(e.target.value)} style={inputStyle}>
            {["Fatigue", "Headache", "Dizziness", "Nausea", "Blurred vision", "Swelling", "Chest discomfort", "None today"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Severity">
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={inputStyle}>
            {["Mild", "Moderate", "Severe"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Notes (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} placeholder="Any detail that might help your doctor" /></Field>
        <Button icon={Plus} onClick={add}>Add entry</Button>
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {patient.symptomLog.map((s) => (
          <div key={s.id} style={{ display: "flex", gap: 12, padding: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: T.textTertiary, width: 110, flexShrink: 0 }}>{s.date}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: T.textPrimary }}>{s.symptom}</span>
              <span style={{ marginLeft: 8 }}><Pill tone={s.severity === "Severe" ? "red" : s.severity === "Moderate" ? "accent" : "neutral"}>{s.severity}</Pill></span>
              {s.note && <div style={{ fontSize: 12.5, color: T.textSecondary, marginTop: 4 }}>{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitSummarySection({ patient, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastNote = patient.notes[patient.notes.length - 1];

  const generate = async () => {
    if (!lastNote) return;
    setLoading(true);
    setError("");
    try {
      const prompt = `Rewrite this doctor's SOAP note as a short, warm, plain-language after-visit summary for the patient (2-4 sentences, no medical jargon, second person "you"). 
Subjective: ${lastNote.soap.subjective}
Objective: ${lastNote.soap.objective}
Assessment: ${lastNote.soap.assessment}
Plan: ${lastNote.soap.plan}
Respond with ONLY the summary text, nothing else.`;
      const text = await askClaude(prompt);
      onUpdate((p) => ({ ...p, afterVisitSummary: text.trim() }));
    } catch (e) {
      console.error("Visit summary generation failed:", e);
      setError(e.message || "Couldn't generate the summary right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader eyebrow="In plain language" title="After-visit summary" />
      <Card style={{ maxWidth: 560 }}>
        {patient.afterVisitSummary ? (
          <p style={{ fontSize: 14.5, lineHeight: 1.7, color: T.textPrimary, margin: 0 }}>{patient.afterVisitSummary}</p>
        ) : (
          <p style={{ fontSize: 13.5, color: T.textTertiary, margin: 0 }}>No summary yet for the latest visit.</p>
        )}
        {error && <div style={{ color: T.red, fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>{error}</div>}
        {lastNote && (
          <Button variant="subtle" icon={loading ? Loader2 : Sparkles} onClick={generate} disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Rewriting…" : "Regenerate in plain language"}
          </Button>
        )}
        {!lastNote && <div style={{ fontSize: 12, color: T.textTertiary, marginTop: 12 }}>This fills in automatically after your doctor approves a visit note.</div>}
      </Card>
    </div>
  );
}

function NotificationsSection({ patient }) {
  const items = [
    { icon: HeartPulse, color: T.mint, text: "Your last BP reading was within range — nice work staying consistent.", time: "2h ago" },
    { icon: PillIcon, color: T.accent, text: `Reminder: take ${patient.prescriptions[0]?.medicine || "your medicine"} tonight.`, time: "5h ago" },
    { icon: FileText, color: T.blue, text: "Your after-visit summary was updated by Dr. Rao.", time: "1d ago" },
  ];
  return (
    <div>
      <SectionHeader eyebrow="Stay in the loop" title="Notifications" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((n, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${n.color}1F`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <n.icon size={15} color={n.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: T.textPrimary }}>{n.text}</div>
              <div style={{ fontSize: 11.5, color: T.textTertiary, marginTop: 3 }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PatientSettings({ patient }) {
  return (
    <div>
      <SectionHeader eyebrow="Account" title="Settings" />
      <Card style={{ maxWidth: 460 }}>
        <Field label="Full name"><input defaultValue={patient.name} style={inputStyle} /></Field>
        <Field label="Age"><input defaultValue={patient.age} style={inputStyle} /></Field>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${T.border}`, marginTop: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>Medication reminders</div>
            <div style={{ fontSize: 12, color: T.textTertiary }}>In-app and email</div>
          </div>
          <Toggle defaultOn />
        </div>
        <Button style={{ marginTop: 18 }}>Save changes</Button>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ADMIN (light overview)                                                  */
/* ---------------------------------------------------------------------- */

function AdminPortal({ patients, onExit }) {
  const [section, setSection] = useState("overview");
  const navItems = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "accounts", label: "Accounts", icon: ShieldCheck },
  ];
  const flaggedCount = patients.filter((p) => isAbnormal(latestVitals(p)).length > 0).length;
  return (
    <Shell navItems={navItems} active={section} onNavigate={setSection} onExit={onExit} userLabel="System Admin" userSub="Full access" accentColor={T.blue}>
      {section === "overview" && (
        <div>
          <SectionHeader eyebrow="Across the system" title="System overview" />
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            <StatCard label="Total patients" value={patients.length} icon={Users} color={T.blue} />
            <StatCard label="Doctors active" value={1} icon={Stethoscope} color={T.accent} />
            <StatCard label="Flagged this week" value={flaggedCount} icon={AlertTriangle} color={T.red} />
            <StatCard label="Notes approved" value={patients.reduce((n, p) => n + p.notes.length, 0)} icon={FileText} color={T.mint} />
          </div>
          <Card>
            <div style={{ ...heading, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 14 }}>Patients by condition</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {patients.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 130, fontSize: 13, color: T.textPrimary }}>{p.name}</div>
                  <div style={{ flex: 1, height: 6, borderRadius: 4, background: T.bgElevated, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, (p.tags.length / 3) * 100)}%`, height: "100%", background: T.blue }} />
                  </div>
                  <div style={{ fontSize: 12, color: T.textTertiary, width: 150 }}>{p.condition}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {section === "accounts" && (
        <div>
          <SectionHeader eyebrow="Roles" title="Accounts" />
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name="Dr. Anjali Rao" color={T.accent} /><div style={{ flex: 1, fontSize: 13.5, color: T.textPrimary }}>Dr. Anjali Rao</div><Pill tone="accent">Doctor</Pill>
              </div>
              {patients.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={p.name} color={p.avatarColor} /><div style={{ flex: 1, fontSize: 13.5, color: T.textPrimary }}>{p.name}</div><Pill tone="mint">Patient</Pill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------------------- */
/* Root                                                                    */
/* ---------------------------------------------------------------------- */

export default function App() {
  useFonts();
  const [role, setRole] = useState("landing");
  const [patients, setPatients] = useState(INITIAL_PATIENTS);

  return (
    <div style={{ ...body }}>
      {role === "landing" && <Landing onSelect={setRole} />}
      {role === "doctor" && <DoctorPortal patients={patients} setPatients={setPatients} onExit={() => setRole("landing")} />}
      {role === "patient" && <PatientPortal patients={patients} setPatients={setPatients} onExit={() => setRole("landing")} />}
      {role === "admin" && <AdminPortal patients={patients} onExit={() => setRole("landing")} />}
    </div>
  );
}