import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell
} from "recharts";

const data = {
  kpis: {
    averageScore: 78.4,
    averageScoreDelta: 2.1,
    topScore: 98,
    passRate: 86,
    passRateDelta: 5,
    totalStudents: 240
  },
  averageScoreByComponent: [
    { component: "Coding", score: 78 },
    { component: "Quiz", score: 75 },
    { component: "HackerRank", score: 80 },
    { component: "Practical", score: 77 },
    { component: "Theory", score: 73 }
  ],
  scoreDistribution: [
    { range: "40–50", count: 4 },
    { range: "50–60", count: 8 },
    { range: "60–70", count: 16 },
    { range: "70–80", count: 12 },
    { range: "80–90", count: 7 },
    { range: "90–100", count: 2 }
  ],
  performanceByBatch: [
    { batch: "B1", CSE: 82, IT: 76, ECE: 70, MECH: 65 },
    { batch: "B2", CSE: 79, IT: 80, ECE: 74, MECH: 68 },
    { batch: "B3", CSE: 85, IT: 78, ECE: 72, MECH: 71 }
  ],
  topPerformers: [
    { rank: 1, name: "Alice", score: 98 },
    { rank: 2, name: "John", score: 94 },
    { rank: 3, name: "Priya", score: 92 },
    { rank: 4, name: "Ryan", score: 88 },
    { rank: 5, name: "Deepa", score: 85 }
  ],
  radarData: [
    { subject: "Coding", value: 78 },
    { subject: "Quiz", value: 75 },
    { subject: "HackerRank", value: 80 },
    { subject: "Practical", value: 77 },
    { subject: "Theory", value: 73 }
  ]
};

const DEPT_COLORS = { CSE: "#6ee7f7", IT: "#a78bfa", ECE: "#fb923c", MECH: "#34d399" };
const DIST_COLORS = ["#1e3a5f", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #07090f; }

  .dash-root {
    min-height: 100vh;
    background: #07090f;
    background-image:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(37,99,235,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99,37,235,0.12) 0%, transparent 60%);
    font-family: 'Syne', sans-serif;
    color: #e2e8f0;
    padding: 24px 20px 48px;
  }

  /* Header */
  .dash-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 32px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding-bottom: 20px;
  }
  .dash-title {
    font-size: clamp(20px, 3vw, 28px);
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .dash-subtitle {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #475569;
    margin-top: 4px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .dash-badge {
    background: rgba(37,99,235,0.15);
    border: 1px solid rgba(37,99,235,0.3);
    color: #60a5fa;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    padding: 6px 14px;
    border-radius: 20px;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  /* KPI Grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 500px)  { .kpi-grid { grid-template-columns: 1fr 1fr; } }

  .kpi-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 20px 22px 18px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
  }
  .kpi-card:hover {
    transform: translateY(-2px);
    border-color: rgba(96,165,250,0.3);
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--accent);
    border-radius: 2px 2px 0 0;
  }
  .kpi-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 10px;
  }
  .kpi-value {
    font-size: clamp(28px, 4vw, 38px);
    font-weight: 800;
    line-height: 1;
    color: #f1f5f9;
    letter-spacing: -1px;
  }
  .kpi-unit { font-size: 0.55em; font-weight: 600; color: #94a3b8; }
  .kpi-delta {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #34d399;
    background: rgba(52,211,153,0.1);
    padding: 3px 8px;
    border-radius: 20px;
    margin-top: 8px;
  }
  .kpi-icon {
    position: absolute;
    right: 18px;
    top: 18px;
    font-size: 20px;
    opacity: 0.18;
  }

  /* Charts Grid */
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }
  @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }

  .charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
  }
  @media (max-width: 1024px) { .charts-row { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 640px)  { .charts-row { grid-template-columns: 1fr; } }

  /* Panel */
  .panel {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 22px 20px 18px;
    backdrop-filter: blur(8px);
  }
  .panel-title {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-title::before {
    content: '';
    width: 3px;
    height: 14px;
    background: var(--accent, #3b82f6);
    border-radius: 2px;
    display: block;
  }

  /* Tooltip */
  .custom-tip {
    background: #0f172a;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: #e2e8f0;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  /* Top Performers */
  .performer-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    transition: background 0.15s;
  }
  .performer-item:last-child { border-bottom: none; }
  .performer-rank {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(37,99,235,0.2);
    border: 1px solid rgba(96,165,250,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #60a5fa;
    flex-shrink: 0;
  }
  .performer-rank.gold   { background: rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.4); color: #fbbf24; }
  .performer-rank.silver { background: rgba(148,163,184,0.15); border-color: rgba(148,163,184,0.4); color: #94a3b8; }
  .performer-rank.bronze { background: rgba(251,146,60,0.15); border-color: rgba(251,146,60,0.4); color: #fb923c; }
  .performer-name {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #cbd5e1;
  }
  .performer-bar-wrap {
    flex: 2;
    height: 5px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
  }
  .performer-bar {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #2563eb, #60a5fa);
    transition: width 1s cubic-bezier(0.4,0,0.2,1);
  }
  .performer-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    color: #e2e8f0;
    min-width: 28px;
    text-align: right;
  }

  /* Legend */
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
    justify-content: center;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #64748b;
  }
  .legend-dot {
    width: 8px; height: 8px;
    border-radius: 2px;
  }

  /* Animated counter */
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .anim-in { animation: countUp 0.5s ease forwards; }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tip">
      <div style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#60a5fa" }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const KPICard = ({ label, value, unit, delta, icon, accent }) => (
  <div className="kpi-card" style={{ "--accent": accent }}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-label">{label}</div>
    <div className="kpi-value anim-in">
      {value}{unit && <span className="kpi-unit">{unit}</span>}
    </div>
    {delta !== undefined && (
      <div className="kpi-delta">▲ {delta}{unit}</div>
    )}
  </div>
);

export default function AnalystDashboard() {
  const { kpis, averageScoreByComponent, scoreDistribution, performanceByBatch, topPerformers, radarData } = data;

  const rankClass = (r) => r === 1 ? "gold" : r === 2 ? "silver" : r === 3 ? "bronze" : "";

  return (
    <>
      <style>{styles}</style>
      <div className="dash-root">
        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="dash-title">Student Performance Analytics</div>
            <div className="dash-subtitle">Analyst Dashboard · Academic Cycle 2024–25</div>
          </div>
          <div className="dash-badge">⬤ LIVE · 240 STUDENTS</div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <KPICard label="Average Score" value={kpis.averageScore} delta={kpis.averageScoreDelta} icon="◎" accent="#3b82f6" />
          <KPICard label="Top Score" value={kpis.topScore} icon="★" accent="#fbbf24" />
          <KPICard label="Pass Rate" value={kpis.passRate} unit="%" delta={kpis.passRateDelta} icon="✓" accent="#34d399" />
          <KPICard label="Total Students" value={kpis.totalStudents} icon="⊞" accent="#a78bfa" />
        </div>

        {/* Row 1: Component Scores + Score Distribution */}
        <div className="charts-grid" style={{ marginBottom: 20 }}>
          <div className="panel" style={{ "--accent": "#3b82f6" }}>
            <div className="panel-title">Avg Score by Component</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={averageScoreByComponent} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="component" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 90]} tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {averageScoreByComponent.map((_, i) => (
                    <Cell key={i} fill={`hsl(${210 + i * 10}, 80%, ${50 + i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel" style={{ "--accent": "#fb923c" }}>
            <div className="panel-title">Score Distribution</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {scoreDistribution.map((_, i) => (
                    <Cell key={i} fill={DIST_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Batch Performance + Top Performers + Radar */}
        <div className="charts-row">
          {/* Batch Performance */}
          <div className="panel" style={{ "--accent": "#6ee7f7" }}>
            <div className="panel-title">Performance by Batch & Dept</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={performanceByBatch} barCategoryGap="25%" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="batch" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {Object.keys(DEPT_COLORS).map((dept) => (
                  <Bar key={dept} dataKey={dept} fill={DEPT_COLORS[dept]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            <div className="legend">
              {Object.entries(DEPT_COLORS).map(([dept, color]) => (
                <div className="legend-item" key={dept}>
                  <div className="legend-dot" style={{ background: color }} />
                  {dept}
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="panel" style={{ "--accent": "#fbbf24" }}>
            <div className="panel-title">Top Performers</div>
            {topPerformers.map((p) => (
              <div className="performer-item" key={p.rank}>
                <div className={`performer-rank ${rankClass(p.rank)}`}>{p.rank}</div>
                <div className="performer-name">{p.name}</div>
                <div className="performer-bar-wrap">
                  <div className="performer-bar" style={{ width: `${(p.score / 100) * 100}%` }} />
                </div>
                <div className="performer-score">{p.score}</div>
              </div>
            ))}
          </div>

          {/* Radar */}
          <div className="panel" style={{ "--accent": "#a78bfa" }}>
            <div className="panel-title">Skill Radar — Avg Student</div>
            <ResponsiveContainer width="100%" height={230}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#64748b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                />
                <PolarRadiusAxis angle={90} domain={[60, 90]} tick={false} axisLine={false} />
                <Radar
                  dataKey="value"
                  stroke="#a78bfa"
                  fill="#a78bfa"
                  fillOpacity={0.25}
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}