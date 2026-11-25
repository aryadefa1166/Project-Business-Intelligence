import { useMemo, useState } from "react";
import data from "./data/dashboard_data.json";

const ROLE_COLORS = {
  focus: "#38bdf8",
  band: "#a855f7",
  collaborator: "#22c55e",
  influencer: "#f59e0b",
  influenced_direct: "#f43f5e",
};

const ROLE_LABELS = {
  focus: "Fokus (Sailor Shift)",
  band: "Band",
  collaborator: "Kolaborator",
  influencer: "Memengaruhi Sailor",
  influenced_direct: "Dipengaruhi Sailor",
};

function HorizontalBars({ items, labelKey, valueKey, color = "#38bdf8", maxItems = 10 }) {
  const sliced = items.slice(0, maxItems);
  const maxVal = Math.max(...sliced.map((d) => d[valueKey]), 1);
  return (
    <div>
      {sliced.map((item, i) => (
        <div className="bar-row" key={`${item[labelKey]}-${i}`}>
          <div className="bar-head">
            <span>{item[labelKey]}</span>
            <strong>{item[valueKey]}</strong>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item[valueKey] / maxVal) * 100}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==================== TAB 1: SAILOR SHIFT ==================== */
function TabSailor() {
  const { profile, timeline, influenced_by, collaborators, influenced_direct, ego_graph } = data.q1_sailor;
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedNode, setSelectedNode] = useState(ego_graph.nodes[0]);

  const positionedGraph = useMemo(() => {
    const cx = 410;
    const cy = 240;
    const pos = {};
    const byRole = { band: [], influencer: [], collaborator: [], influenced_direct: [] };

    ego_graph.nodes.forEach((n) => {
      if (n.role === "focus") pos[n.id] = { x: cx, y: cy };
      else if (byRole[n.role]) byRole[n.role].push(n);
    });

    const placeArc = (list, startDeg, endDeg, rInner, rOuter) => {
      list.forEach((n, i) => {
        const t = list.length === 1 ? 0.5 : i / (list.length - 1);
        const deg = startDeg + t * (endDeg - startDeg);
        const rad = (deg * Math.PI) / 180;
        const r = i % 2 === 0 ? rInner : rOuter;
        pos[n.id] = { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
      });
    };

    placeArc(byRole.band, -90, -90, 95, 95);
    placeArc(byRole.influencer, 130, 230, 175, 225);
    placeArc(byRole.collaborator, -70, -10, 165, 225);
    placeArc(byRole.influenced_direct, 15, 105, 165, 225);

    const visibleNodes = ego_graph.nodes.filter(
      (n) => roleFilter === "all" || n.role === "focus" || n.role === roleFilter || (roleFilter === "collaborator" && n.role === "band")
    );
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleLinks = ego_graph.links.filter((l) => visibleIds.has(l.source) && visibleIds.has(l.target));

    return { pos, visibleNodes, visibleLinks };
  }, [ego_graph, roleFilter]);

  const maxTimeline = Math.max(...timeline.map((t) => t.total), 1);

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Karya Unik</div>
          <div className="kpi-value">{profile.total_works}</div>
          <div className="kpi-sub">{profile.direct_works} solo/langsung · {profile.band_works} via Ivy Echos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Karya Notable (Chart)</div>
          <div className="kpi-value">{profile.notable_works}</div>
          <div className="kpi-sub">{Math.round((profile.notable_works / profile.total_works) * 100)}% dari total karya</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Rentang Karier</div>
          <div className="kpi-value">{profile.debut_year}–{profile.latest_year}</div>
          <div className="kpi-sub">44 Oceanus Folk · 1 Synthwave · 1 Americana</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pengaruh Langsung (1-Hop)</div>
          <div className="kpi-value">{profile.direct_influenced_nodes}</div>
          <div className="kpi-sub">InStyleOf (8) · LyricalRef (6) · Interpolates (4) · Samples (2)</div>
        </div>
      </div>

      <div className="card">
        <h2>Peta Jaringan Ego Sailor Shift (Interaktif)</h2>
        <p className="card-desc">Klik filter kategori di bawah atau klik titik node pada graf untuk melihat detail relasinya.</p>
        <div className="controls">
          {[
            ["all", "Semua Relasi"],
            ["influencer", "Memengaruhi Sailor"],
            ["collaborator", "Band & Kolaborator"],
            ["influenced_direct", "Dipengaruhi Sailor"],
          ].map(([key, label]) => (
            <button key={key} className={`pill ${roleFilter === key ? "active" : ""}`} onClick={() => setRoleFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2.2fr) minmax(240px, 1fr)", gap: 14 }}>
          <svg viewBox="0 0 820 480" style={{ width: "100%", background: "#09101d", borderRadius: 10, border: "1px solid #243454" }}>
            {positionedGraph.visibleLinks.map((l, idx) => {
              const s = positionedGraph.pos[l.source];
              const t = positionedGraph.pos[l.target];
              if (!s || !t) return null;
              return (
                <line
                  key={`${l.source}-${l.target}-${l.relation}-${idx}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="#3b527d"
                  strokeOpacity="0.65"
                  strokeWidth={Math.min(4, 1 + (l.weight || 1) * 0.35)}
                />
              );
            })}
            {positionedGraph.visibleNodes.map((n) => {
              const p = positionedGraph.pos[n.id];
              if (!p) return null;
              const isSelected = selectedNode?.id === n.id;
              const r = n.role === "focus" ? 16 : n.role === "band" ? 11 : 7;
              return (
                <g key={n.id} onClick={() => setSelectedNode(n)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isSelected ? r + 3 : r}
                    fill={ROLE_COLORS[n.role] || "#94a3b8"}
                    stroke={isSelected ? "#ffffff" : "#0b1220"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={p.x + (p.x < 410 ? -10 : 10)}
                    y={p.y + 4}
                    textAnchor={p.x < 410 ? "end" : "start"}
                    fill="#dce7fb"
                    fontSize={n.role === "focus" ? "12" : "10"}
                    fontWeight={n.role === "focus" ? "700" : "500"}
                  >
                    {n.name.length > 20 ? `${n.name.slice(0, 19)}…` : n.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ background: "#17233d", borderRadius: 10, padding: 14, border: "1px solid #243454" }}>
            <div className="kpi-label">Node Terpilih</div>
            <h3 style={{ margin: "6px 0 4px" }}>{selectedNode?.name}</h3>
            <p style={{ margin: "0 0 10px", fontSize: "0.84rem", color: "#93a4c3" }}>
              ID: {selectedNode?.id} · Tipe: {selectedNode?.type}
            </p>
            <span
              className="badge"
              style={{ background: `${ROLE_COLORS[selectedNode?.role]}33`, color: ROLE_COLORS[selectedNode?.role] }}
            >
              {ROLE_LABELS[selectedNode?.role] || selectedNode?.role}
            </span>
            <hr style={{ border: "none", borderTop: "1px solid #243454", margin: "14px 0" }} />
            <div className="kpi-label" style={{ marginBottom: 8 }}>Legenda Warna</div>
            {Object.entries(ROLE_LABELS).map(([k, label]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", marginBottom: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: ROLE_COLORS[k], display: "inline-block" }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Timeline Rilis Sailor Shift (2024–2040)</h2>
          <p className="card-desc">Biru muda = total karya; hijau = karya notable (masuk tangga lagu).</p>
          <svg viewBox="0 0 560 210" style={{ width: "100%" }}>
            {timeline.map((t, i) => {
              const x = 35 + i * 34;
              const hTotal = (t.total / maxTimeline) * 140;
              const hNotable = (t.notable / maxTimeline) * 140;
              return (
                <g key={t.year}>
                  <rect x={x} y={165 - hTotal} width={18} height={hTotal} rx={3} fill="#38bdf8" opacity="0.45" />
                  <rect x={x} y={165 - hNotable} width={18} height={hNotable} rx={3} fill="#22c55e" />
                  <text x={x + 9} y={160 - hTotal} textAnchor="middle" fill="#e6eefc" fontSize="9">{t.total}</text>
                  <text x={x + 9} y={182} textAnchor="middle" fill="#93a4c3" fontSize="9">{String(t.year).slice(2)}</text>
                </g>
              );
            })}
            <line x1="25" y1="165" x2="545" y2="165" stroke="#243454" />
          </svg>
        </div>

        <div className="card">
          <h2>Kolaborator Utama & Artis Dipengaruhi (Q1b)</h2>
          <p className="card-desc">Top kolaborator di kiri; top grup/artis yang langsung terpengaruh di bawahnya.</p>
          <HorizontalBars items={collaborators} labelKey="name" valueKey="count" color="#22c55e" maxItems={6} />
          <hr style={{ border: "none", borderTop: "1px solid #243454", margin: "12px 0" }} />
          <HorizontalBars items={influenced_direct} labelKey="name" valueKey="count" color="#f43f5e" maxItems={5} />
        </div>
      </div>

      <div className="card">
        <h2>Siapa yang Paling Memengaruhi Sailor Shift? (Q1a)</h2>
        <p className="card-desc">Sumber inspirasi teratas dari karya-karya Sailor Shift beserta jenis relasinya.</p>
        <HorizontalBars items={influenced_by} labelKey="name" valueKey="count" color="#f59e0b" maxItems={8} />
      </div>
    </>
  );
}

/* ==================== TAB 2: OCEANUS FOLK ==================== */
function TabOceanusFolk() {
  const q2 = data.q2_oceanus_folk;
  const [startYear, setStartYear] = useState(1992);
  const [endYear, setEndYear] = useState(2040);
  const [excludeSelf, setExcludeSelf] = useState(true);
  const [hoverPoint, setHoverPoint] = useState(null);

  const filteredTrend = useMemo(
    () => q2.yearly_trend.filter((d) => d.year >= startYear && d.year <= endYear),
    [q2.yearly_trend, startYear, endYear]
  );

  const influencedGenres = useMemo(
    () => (excludeSelf ? q2.influenced_genres.filter((g) => g.genre !== "Oceanus Folk") : q2.influenced_genres),
    [q2.influenced_genres, excludeSelf]
  );

  const maxY = Math.max(...filteredTrend.map((d) => Math.max(d.of_releases, d.influenced_works)), 1);
  const w = 960;
  const h = 250;
  const padL = 42;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const getX = (i) => padL + (filteredTrend.length <= 1 ? plotW / 2 : (i / (filteredTrend.length - 1)) * plotW);
  const getY = (val) => padT + plotH - (val / maxY) * plotH;

  const linePath = filteredTrend.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.influenced_works)}`).join(" ");
  const sailorIdx = filteredTrend.findIndex((d) => d.year === 2024);

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Karya Oceanus Folk</div>
          <div className="kpi-value">{q2.total_works}</div>
          <div className="kpi-sub">Rentang 1992–2040 (235 Song · 70 Album)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Artis Terlibat</div>
          <div className="kpi-value">{q2.total_artists}</div>
          <div className="kpi-sub">Person & MusicalGroup unik (berbasis ID)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Puncak Penyebaran</div>
          <div className="kpi-value">2023</div>
          <div className="kpi-sub">34 rilis OF · 44 karya terpengaruh OF</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pola Pertumbuhan (Q2a)</div>
          <div className="kpi-value">Intermittent</div>
          <div className="kpi-sub">Bergelombang: puncak 2017, 2023, 2026–2029</div>
        </div>
      </div>

      <div className="card">
        <h2>Tren Rilis & Penyebaran Pengaruh Oceanus Folk (Q2a)</h2>
        <p className="card-desc">
          Batang biru = jumlah rilis Oceanus Folk; garis kuning = karya yang terpengaruh Oceanus Folk. Arahkan kursor ke titik tahun untuk membaca angka detail.
        </p>
        <div className="slider-grid">
          <div className="slider-item">
            <label><span>Tahun Mulai</span><strong>{startYear}</strong></label>
            <input type="range" min={1992} max={2035} value={startYear} onChange={(e) => setStartYear(Math.min(Number(e.target.value), endYear - 1))} />
          </div>
          <div className="slider-item">
            <label><span>Tahun Akhir</span><strong>{endYear}</strong></label>
            <input type="range" min={1995} max={2040} value={endYear} onChange={(e) => setEndYear(Math.max(Number(e.target.value), startYear + 1))} />
          </div>
        </div>

        <div className="info-box" style={{ marginTop: 0, marginBottom: 10 }}>
          {hoverPoint ? (
            <>
              <strong>Tahun {hoverPoint.year}:</strong> {hoverPoint.of_releases} rilis Oceanus Folk ({hoverPoint.of_notable} notable) ·{" "}
              <strong>{hoverPoint.influenced_works}</strong> karya terpengaruh Oceanus Folk.
            </>
          ) : (
            "Arahkan kursor ke salah satu tahun pada grafik untuk melihat rincian angka per tahun."
          )}
        </div>

        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", background: "#09101d", borderRadius: 10, border: "1px solid #243454" }}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = padT + plotH * (1 - f);
            return (
              <g key={f}>
                <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="#1d2c4a" />
                <text x={padL - 8} y={y + 4} textAnchor="end" fill="#93a4c3" fontSize="10">{Math.round(maxY * f)}</text>
              </g>
            );
          })}

          {sailorIdx >= 0 && (
            <g>
              <line x1={getX(sailorIdx)} y1={padT} x2={getX(sailorIdx)} y2={padT + plotH} stroke="#22c55e" strokeDasharray="4 4" />
              <text x={getX(sailorIdx) + 5} y={padT + 12} fill="#86efac" fontSize="10">Debut Sailor (2024)</text>
            </g>
          )}

          {filteredTrend.map((d, i) => {
            const x = getX(i);
            const barH = (d.of_releases / maxY) * plotH;
            return (
              <rect
                key={`bar-${d.year}`}
                x={x - 5}
                y={padT + plotH - barH}
                width={10}
                height={barH}
                fill="#38bdf8"
                opacity="0.55"
                rx={2}
                onMouseEnter={() => setHoverPoint(d)}
              />
            );
          })}

          <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

          {filteredTrend.map((d, i) => {
            const x = getX(i);
            const y = getY(d.influenced_works);
            return (
              <g key={`pt-${d.year}`} onMouseEnter={() => setHoverPoint(d)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={hoverPoint?.year === d.year ? 6 : 3.5} fill="#f59e0b" />
                {i % Math.max(1, Math.ceil(filteredTrend.length / 14)) === 0 && (
                  <text x={x} y={h - 10} textAnchor="middle" fill="#93a4c3" fontSize="10">{d.year}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Genre Paling Terpengaruh Oceanus Folk (Q2b)</h2>
          <div className="controls">
            <button className={`pill ${excludeSelf ? "active" : ""}`} onClick={() => setExcludeSelf(true)}>
              Lintas Genre Saja (Tanpa OF)
            </button>
            <button className={`pill ${!excludeSelf ? "active" : ""}`} onClick={() => setExcludeSelf(false)}>
              Sertakan Sesama OF (98)
            </button>
          </div>
          <HorizontalBars items={influencedGenres} labelKey="genre" valueKey="count" color="#38bdf8" maxItems={8} />
        </div>

        <div className="card">
          <h2>Pergeseran Inspirasi Oceanus Folk (Q2c)</h2>
          <p className="card-desc">Perbandingan genre yang menginspirasi Oceanus Folk sebelum vs sejak debut Sailor Shift (2024).</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <div className="kpi-label" style={{ marginBottom: 8 }}>Sebelum 2024</div>
              <HorizontalBars
                items={q2.inspired_by_before_sailor.filter((g) => g.genre !== "Oceanus Folk")}
                labelKey="genre"
                valueKey="count"
                color="#93a4c3"
                maxItems={6}
              />
            </div>
            <div>
              <div className="kpi-label" style={{ marginBottom: 8 }}>Sejak 2024</div>
              <HorizontalBars
                items={q2.inspired_by_since_sailor.filter((g) => g.genre !== "Oceanus Folk")}
                labelKey="genre"
                valueKey="count"
                color="#22c55e"
                maxItems={6}
              />
            </div>
          </div>
          <div className="info-box">
            <strong>Temuan Q2c:</strong> Sejak 2024, Oceanus Folk makin banyak menyerap inspirasi dari <strong>Dream Pop (2 → 13)</strong>,{" "}
            <strong>Psychedelic Rock (2 → 10)</strong>, dan <strong>Desert Rock (0 → 8)</strong>.
          </div>
        </div>
      </div>
    </>
  );
}

/* ==================== TAB 3: RISING STARS ==================== */
function TabRisingStars() {
  const { top_of_artists, rising_candidates } = data.q3_rising_stars;

  // Gabungkan semua artis unik + Sailor Shift untuk perbandingan karier (Q3a)
  const comparableArtists = useMemo(() => {
    let cumW = 0;
    let cumN = 0;
    const sailorTraj = data.q1_sailor.timeline.map((t) => {
      cumW += t.total;
      cumN += t.notable;
      return { year: t.year, works: t.total, cum_works: cumW, cum_notable: cumN };
    });
    const sailorEntry = {
      id: 17255,
      name: "Sailor Shift (Benchmark)",
      type: "Person",
      debut_year: data.q1_sailor.profile.debut_year,
      trajectory: sailorTraj,
    };
    const map = new Map([[sailorEntry.id, sailorEntry]]);
    [...top_of_artists, ...rising_candidates].forEach((a) => {
      if (!map.has(a.id)) map.set(a.id, a);
    });
    return Array.from(map.values());
  }, [top_of_artists, rising_candidates]);

  const [selectedIds, setSelectedIds] = useState([17255, 17327, 17349]);
  const [wOf, setWOf] = useState(2.0);
  const [wNotable, setWNotable] = useState(3.0);
  const [wRecency, setWRecency] = useState(1.5);
  const [wSailor, setWSailor] = useState(3.0);
  const [typeFilter, setTypeFilter] = useState("all");

  const rankedCandidates = useMemo(() => {
    return rising_candidates
      .filter((c) => typeFilter === "all" || c.type === typeFilter)
      .map((c) => {
        const recencyBonus = Math.max(0, c.latest_year - 2029);
        const customScore = Number(
          (
            c.of_works * wOf +
            c.notable_works * wNotable +
            c.influenced_others * 2.5 +
            recencyBonus * wRecency +
            (c.connected_to_sailor ? wSailor : 0)
          ).toFixed(1)
        );
        return { ...c, customScore };
      })
      .sort((a, b) => b.customScore - a.customScore || b.notable_works - a.notable_works);
  }, [rising_candidates, typeFilter, wOf, wNotable, wRecency, wSailor]);

  const chosenArtists = selectedIds
    .map((id) => comparableArtists.find((a) => a.id === id))
    .filter(Boolean);
  const lineColors = ["#38bdf8", "#f59e0b", "#22c55e"];

  const allYears = chosenArtists.flatMap((a) => a.trajectory.map((t) => t.year));
  const minY = Math.min(...allYears, 2005);
  const maxY = Math.max(...allYears, 2040);
  const maxNotable = Math.max(...chosenArtists.flatMap((a) => a.trajectory.map((t) => t.cum_notable)), 1);

  return (
    <>
      <div className="card">
        <h2>Perbandingan Lintasan Karier 3 Artis (Q3a)</h2>
        <p className="card-desc">Pilih 3 artis di bawah untuk membandingkan pertumbuhan kumulatif karya notable mereka dari waktu ke waktu.</p>
        <div className="select-row">
          {[0, 1, 2].map((slot) => (
            <select
              key={slot}
              value={selectedIds[slot]}
              onChange={(e) => {
                const next = [...selectedIds];
                next[slot] = Number(e.target.value);
                setSelectedIds(next);
              }}
              style={{ borderColor: lineColors[slot] }}
            >
              {comparableArtists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type}, debut {a.debut_year})
                </option>
              ))}
            </select>
          ))}
        </div>

        <svg viewBox="0 0 880 230" style={{ width: "100%", background: "#09101d", borderRadius: 10, border: "1px solid #243454" }}>
          {[0, 0.5, 1].map((f) => {
            const y = 20 + 170 * (1 - f);
            return (
              <g key={f}>
                <line x1="45" y1={y} x2="855" y2={y} stroke="#1d2c4a" />
                <text x="38" y={y + 4} textAnchor="end" fill="#93a4c3" fontSize="10">{Math.round(maxNotable * f)}</text>
              </g>
            );
          })}
          {chosenArtists.map((artist, idx) => {
            const pts = artist.trajectory.map((t) => {
              const x = 45 + ((t.year - minY) / Math.max(maxY - minY, 1)) * 810;
              const y = 190 - (t.cum_notable / maxNotable) * 170;
              return { x, y, ...t };
            });
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            return (
              <g key={artist.id}>
                <path d={d} fill="none" stroke={lineColors[idx]} strokeWidth="2.5" />
                {pts.map((p) => (
                  <circle key={`${artist.id}-${p.year}`} cx={p.x} cy={p.y} r="4" fill={lineColors[idx]} />
                ))}
              </g>
            );
          })}
          <text x="45" y="214" fill="#93a4c3" fontSize="10">{minY}</text>
          <text x="855" y="214" textAnchor="end" fill="#93a4c3" fontSize="10">{maxY}</text>
        </svg>
      </div>

      <div className="card">
        <h2>Prediksi Top 3 Rising Star Oceanus Folk (Q3b — Interaktif)</h2>
        <p className="card-desc">
          Geser bobot penilaian untuk menguji sensitivitas ranking kandidat debut ≥ 2030.
        </p>

        <div className="controls">
          {[
            ["all", "Semua Tipe"],
            ["Person", "Solois (Person)"],
            ["MusicalGroup", "Grup / Band"],
          ].map(([k, lbl]) => (
            <button key={k} className={`pill ${typeFilter === k ? "active" : ""}`} onClick={() => setTypeFilter(k)}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="slider-grid">
          <div className="slider-item">
            <label><span>Bobot Karya OF</span><strong>{wOf}x</strong></label>
            <input type="range" min={0} max={5} step={0.5} value={wOf} onChange={(e) => setWOf(Number(e.target.value))} />
          </div>
          <div className="slider-item">
            <label><span>Bobot Karya Notable</span><strong>{wNotable}x</strong></label>
            <input type="range" min={0} max={5} step={0.5} value={wNotable} onChange={(e) => setWNotable(Number(e.target.value))} />
          </div>
          <div className="slider-item">
            <label><span>Bobot Aktivitas Terbaru</span><strong>{wRecency}x</strong></label>
            <input type="range" min={0} max={5} step={0.5} value={wRecency} onChange={(e) => setWRecency(Number(e.target.value))} />
          </div>
          <div className="slider-item">
            <label><span>Bonus Koneksi Sailor</span><strong>+{wSailor}</strong></label>
            <input type="range" min={0} max={10} step={1} value={wSailor} onChange={(e) => setWSailor(Number(e.target.value))} />
          </div>
        </div>

        <div className="kpi-grid">
          {rankedCandidates.slice(0, 3).map((c, i) => (
            <div className="kpi-card" key={c.id} style={{ borderColor: i === 0 ? "#f59e0b" : "#243454" }}>
              <div className="kpi-label">Prediksi #{i + 1} · {c.type}</div>
              <div className="kpi-value" style={{ fontSize: "1.2rem" }}>{c.name}</div>
              <div className="kpi-sub">
                Skor: <strong>{c.customScore}</strong> · Notable: {c.notable_works}/{c.total_works} ({c.notable_rate}%) · Aktif {c.debut_year}–{c.latest_year}
              </div>
            </div>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Artis / Grup</th>
                <th>Tipe</th>
                <th>Karya OF</th>
                <th>Notable</th>
                <th>Debut–Terakhir</th>
                <th>Terkait Sailor</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {rankedCandidates.slice(0, 12).map((c, i) => (
                <tr key={c.id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.type}</td>
                  <td>{c.of_works}</td>
                  <td>{c.notable_works} ({c.notable_rate}%)</td>
                  <td>{c.debut_year}–{c.latest_year}</td>
                  <td>
                    <span className={`badge ${c.connected_to_sailor ? "badge-yes" : "badge-no"}`}>
                      {c.connected_to_sailor ? "Ya" : "Tidak"}
                    </span>
                  </td>
                  <td><strong>{c.customScore}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ==================== MAIN APP ==================== */
export default function App() {
  const [tab, setTab] = useState("q1");

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Oceanus Folk & Sailor Shift — Visual Analytics Dashboard</h1>
          <p className="subtitle">
            VAST Challenge 2025 Mini-Challenge 1 · {data.meta.total_nodes.toLocaleString("id-ID")} Node ·{" "}
            {data.meta.total_edges.toLocaleString("id-ID")} Edge
          </p>
        </div>
        <nav className="tabs">
          <button className={`tab-btn ${tab === "q1" ? "active" : ""}`} onClick={() => setTab("q1")}>
            1. Profil Sailor Shift
          </button>
          <button className={`tab-btn ${tab === "q2" ? "active" : ""}`} onClick={() => setTab("q2")}>
            2. Evolusi Oceanus Folk
          </button>
          <button className={`tab-btn ${tab === "q3" ? "active" : ""}`} onClick={() => setTab("q3")}>
            3. Prediksi Rising Star
          </button>
        </nav>
      </header>

      {tab === "q1" && <TabSailor />}
      {tab === "q2" && <TabOceanusFolk />}
      {tab === "q3" && <TabRisingStars />}

      <footer className="footer-note">
        <strong>Catatan Validasi & Keterbatasan Data:</strong> Seluruh agregasi dikunci menggunakan <code>id</code> unik karena terdapat{" "}
        <strong>{data.meta.duplicate_person_names.toLocaleString("id-ID")} nama Person kembar</strong> di dataset. Data bersifat sintetis dan
        sebagian berasal dari repositori <em>crowdsourced</em>, sehingga skor prediksi Rising Star merupakan indikasi berbasis graf (bukan jaminan kausalitas).
      </footer>
    </div>
  );
}
