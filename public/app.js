const state = {
  player: null,
  all: [],
  filtered: [],
  source: "",
  logSort: { key: "home_run_number", direction: "asc" },
};

const BALLPARKS = {
  ARI: { name: "Chase Field", wall: [330, 374, 407, 374, 335] },
  ATH: { name: "Sutter Health Park", wall: [330, 365, 403, 365, 325] },
  OAK: { name: "Oakland Coliseum", wall: [330, 375, 400, 375, 330] },
  ATL: { name: "Truist Park", wall: [335, 385, 400, 375, 325] },
  BAL: { name: "Oriole Park at Camden Yards", wall: [333, 376, 410, 373, 318] },
  BOS: { name: "Fenway Park", wall: [310, 379, 420, 380, 302] },
  CHC: { name: "Wrigley Field", wall: [355, 368, 400, 368, 353] },
  CWS: { name: "Rate Field", wall: [330, 375, 400, 375, 335] },
  CIN: { name: "Great American Ball Park", wall: [328, 379, 404, 370, 325] },
  CLE: { name: "Progressive Field", wall: [325, 370, 405, 375, 325] },
  COL: { name: "Coors Field", wall: [347, 390, 415, 375, 350] },
  DET: { name: "Comerica Park", wall: [342, 370, 412, 365, 330] },
  HOU: { name: "Daikin Park", wall: [315, 362, 409, 373, 326] },
  KC: { name: "Kauffman Stadium", wall: [330, 387, 410, 387, 330] },
  LAA: { name: "Angel Stadium", wall: [330, 389, 396, 365, 330] },
  LAD: { name: "Dodger Stadium", wall: [330, 375, 400, 375, 330] },
  MIA: { name: "loanDepot park", wall: [344, 386, 400, 387, 335] },
  MIL: { name: "American Family Field", wall: [344, 371, 400, 374, 345] },
  MIN: { name: "Target Field", wall: [339, 377, 404, 367, 328] },
  NYM: { name: "Citi Field", wall: [335, 358, 408, 375, 330] },
  NYY: { name: "Yankee Stadium", wall: [318, 399, 408, 385, 314] },
  PHI: { name: "Citizens Bank Park", wall: [329, 374, 401, 369, 330] },
  PIT: { name: "PNC Park", wall: [325, 383, 399, 375, 320] },
  SD: { name: "Petco Park", wall: [336, 386, 396, 391, 322] },
  SF: { name: "Oracle Park", wall: [339, 399, 391, 415, 309] },
  SEA: { name: "T-Mobile Park", wall: [331, 378, 401, 381, 326] },
  STL: { name: "Busch Stadium", wall: [336, 375, 400, 375, 335] },
  TB: { name: "Tropicana Field", wall: [315, 370, 404, 370, 322] },
  TEX: { name: "Globe Life Field", wall: [329, 372, 407, 374, 326] },
  TOR: { name: "Rogers Centre", wall: [328, 375, 400, 359, 328] },
  WSH: { name: "Nationals Park", wall: [336, 377, 402, 370, 335] },
};

const DEFAULT_PARK = { name: "MLB ballpark", wall: [330, 375, 400, 375, 330] };
const SEASON_COLORS = [
  "#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2",
  "#db2777", "#65a30d", "#9333ea", "#ea580c", "#0f766e", "#4f46e5",
];
// Regular-season MLB home runs downloaded from Baseball Savant on 2026-08-12.
const MLB_HR_BENCHMARKS = {
  2015: { home_run_distance: { mean: 399.7974, n: 4758 }, launch_speed: { mean: 103.2079, n: 4764 }, launch_angle: { mean: 27.8617, n: 4764 } },
  2016: { home_run_distance: { mean: 399.4928, n: 5493 }, launch_speed: { mean: 103.3530, n: 5503 }, launch_angle: { mean: 28.0769, n: 5503 } },
  2017: { home_run_distance: { mean: 400.1411, n: 5955 }, launch_speed: { mean: 103.1515, n: 5989 }, launch_angle: { mean: 28.0673, n: 5989 } },
  2018: { home_run_distance: { mean: 397.4549, n: 5469 }, launch_speed: { mean: 103.5343, n: 5565 }, launch_angle: { mean: 28.2171, n: 5565 } },
  2019: { home_run_distance: { mean: 400.1326, n: 6691 }, launch_speed: { mean: 103.5489, n: 6719 }, launch_angle: { mean: 28.2195, n: 6719 } },
  2020: { home_run_distance: { mean: 400.8634, n: 2299 }, launch_speed: { mean: 103.6279, n: 2301 }, launch_angle: { mean: 28.9483, n: 2301 } },
  2021: { home_run_distance: { mean: 400.8842, n: 5933 }, launch_speed: { mean: 104.4359, n: 5933 }, launch_angle: { mean: 28.7136, n: 5933 } },
  2022: { home_run_distance: { mean: 398.5012, n: 5213 }, launch_speed: { mean: 104.2519, n: 5213 }, launch_angle: { mean: 28.7750, n: 5213 } },
  2023: { home_run_distance: { mean: 399.8371, n: 5862 }, launch_speed: { mean: 104.3241, n: 5866 }, launch_angle: { mean: 28.5760, n: 5866 } },
  2024: { home_run_distance: { mean: 398.0039, n: 5444 }, launch_speed: { mean: 104.3081, n: 5450 }, launch_angle: { mean: 28.7200, n: 5450 } },
  2025: { home_run_distance: { mean: 396.6994, n: 5646 }, launch_speed: { mean: 104.6383, n: 5648 }, launch_angle: { mean: 28.7546, n: 5648 } },
  2026: { home_run_distance: { mean: 396.8827, n: 4143 }, launch_speed: { mean: 104.0136, n: 4149 }, launch_angle: { mean: 29.0342, n: 4149 } },
};
const $ = (id) => document.getElementById(id);
$("endYear").value = new Date().getFullYear();

function setStatus(message, error = false) {
  const el = $("status");
  el.textContent = message;
  el.className = error ? "status error" : "status";
}

function fmt(value, digits = 1) {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({ detail: "Unexpected server response" }));
  if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
  return body;
}

async function searchPlayers() {
  const query = $("playerSearch").value.trim();
  if (query.length < 2) {
    setStatus("Enter at least two characters.", true);
    return;
  }
  setStatus("Searching MLB player records...");
  $("matches").hidden = true;
  try {
    const data = await jsonFetch(`/api/search?q=${encodeURIComponent(query)}`);
    renderMatches(data.matches || []);
    setStatus(data.matches?.length ? "Select the correct player, then load home runs." : "No players found.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderMatches(matches) {
  const box = $("matches");
  box.innerHTML = "";
  box.hidden = !matches.length;
  matches.forEach((player) => {
    const button = document.createElement("button");
    const career = [player.debut_date, player.last_played_date].filter(Boolean).join(" - ");
    button.type = "button";
    button.className = "match";
    button.innerHTML = `<span><strong>${escapeHtml(player.full_name)}</strong><br><small>${escapeHtml([player.position, player.team, career].filter(Boolean).join(" · "))}</small></span><small>MLBAM ${player.player_id}</small>`;
    button.addEventListener("click", () => {
      document.querySelectorAll(".match").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      state.player = player;
      $("loadBtn").disabled = false;
      if (player.debut_date) $("startYear").value = Math.max(2015, Number(player.debut_date.slice(0, 4)));
      if (player.last_played_date && !player.active) $("endYear").value = player.last_played_date.slice(0, 4);
    });
    box.appendChild(button);
  });
}

async function loadPlayer() {
  if (!state.player) return;
  const player = state.player;
  const params = new URLSearchParams({
    player_id: player.player_id,
    player_name: player.full_name,
    start_year: $("startYear").value,
    end_year: $("endYear").value,
    game_types: $("gameType").value,
  });
  setStatus(`Loading ${player.full_name}'s home runs from Baseball Savant...`);
  $("loadBtn").disabled = true;
  try {
    const data = await jsonFetch(`/api/home-runs?${params}`);
    loadPayload(data);
    setStatus(`Loaded ${data.home_runs.length} home runs.`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    $("loadBtn").disabled = false;
  }
}

async function loadDemo() {
  setStatus("Loading demo...");
  try {
    loadPayload(await jsonFetch("/api/demo"));
    setStatus("Demo loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function uploadCsv(file) {
  if (!file) return;
  const form = new FormData();
  form.append("file", file);
  setStatus("Reading uploaded Savant CSV...");
  try {
    loadPayload(await jsonFetch("/api/upload", { method: "POST", body: form }));
    setStatus("CSV loaded.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

function loadPayload(data) {
  state.player = data.player || { full_name: "Uploaded player" };
  state.source = data.source || "";
  state.all = data.home_runs || [];
  state.logSort = { key: "home_run_number", direction: "asc" };
  $("results").hidden = false;
  $("playerTitle").textContent = state.player?.full_name || "Home runs";
  $("sourceLabel").textContent = state.source;
  setupFilters();
  resetLogFilters(false);
  applyFilters();
  window.scrollTo({ top: $("results").offsetTop - 20, behavior: "smooth" });
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function setupFilters() {
  fillChecks($("seasonFilter"), unique(state.all.map((row) => row.season)), "season");
  fillChecks($("teamFilter"), unique(state.all.map((row) => row.batting_team)), "team");
}

function fillChecks(element, values, name) {
  element.innerHTML = "";
  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = "checkbox-option";
    label.innerHTML = `<input type="checkbox" name="${name}" value="${escapeHtml(value)}" checked><span>${escapeHtml(value)}</span>`;
    element.appendChild(label);
  });
}

function checkedValues(element) {
  return [...element.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function applyFilters() {
  const seasons = new Set(checkedValues($("seasonFilter")));
  const teams = new Set(checkedValues($("teamFilter")));
  state.filtered = state.all.filter((row) => (
    seasons.has(String(row.season))
    && teams.has(String(row.batting_team))
  ));
  renderAll();
}

function percentile(values, proportion) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const rank = (sorted.length - 1) * proportion;
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower);
}

const plotConfig = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d"],
};

const baseLayout = {
  paper_bgcolor: "rgba(0, 0, 0, 0)",
  plot_bgcolor: "rgba(0, 0, 0, 0)",
  font: { color: "#f7f7f5", family: "Inter, system-ui, sans-serif" },
  margin: { l: 60, r: 25, t: 22, b: 55 },
  hoverlabel: { align: "left", bgcolor: "#171717", bordercolor: "#ff7a1a", font: { color: "#ffffff" } },
};

function videoUrl(row) {
  return state.source.toLowerCase().includes("demo") ? "" : (row.video_url || "");
}

function renderAll() {
  renderMetrics();
  renderDistributions();
  renderSeason();
  renderSprayChart();
  renderTable();
}

function renderMetrics() {
  const rows = state.filtered;
  const numbers = (key) => rows.map((row) => Number(row[key])).filter(Number.isFinite);
  const distances = numbers("home_run_distance");
  const velocities = numbers("launch_speed");
  const metrics = [
    ["Home runs", rows.length.toLocaleString(), ""],
    ["Longest", distances.length ? `${Math.max(...distances).toFixed(0)} ft` : "—", ""],
    ["Hardest", velocities.length ? `${Math.max(...velocities).toFixed(1)} mph` : "—", ""],
    ["Avg. distance", distances.length ? `${(distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(1)} ft` : "—", ""],
    ["Avg. EV", velocities.length ? `${(velocities.reduce((a, b) => a + b, 0) / velocities.length).toFixed(1)} mph` : "—", ""],
    ["EV90", velocities.length ? `${percentile(velocities, 0.90).toFixed(1)} mph` : "—", "90th percentile of loaded home-run exit velocities"],
  ];
  $("metrics").innerHTML = metrics.map(([label, value, title]) => `
    <div class="metric"${title ? ` title="${escapeHtml(title)}"` : ""}>
      <div class="label">${label}</div><div class="value">${value}</div>
    </div>
  `).join("");
}

const DISTRIBUTION_METRICS = [
  { key: "home_run_distance", chartId: "distanceDistribution", label: "Distance", unit: "ft", digits: 0 },
  { key: "launch_speed", chartId: "exitVelocityDistribution", label: "Exit velocity", unit: "mph", digits: 1 },
  { key: "launch_angle", chartId: "launchAngleDistribution", label: "Launch angle", unit: "°", digits: 0 },
];

function seasonColorMap() {
  const seasons = unique(state.all.map((row) => row.season));
  return Object.fromEntries(seasons.map((season, index) => [String(season), SEASON_COLORS[index % SEASON_COLORS.length]]));
}

function weightedMlbAverage(key) {
  const selectedSeasons = checkedValues($("seasonFilter"));
  const samples = selectedSeasons
    .map((season) => MLB_HR_BENCHMARKS[season]?.[key])
    .filter((sample) => sample && Number.isFinite(sample.mean) && sample.n > 0);
  if (!samples.length) return null;
  const total = samples.reduce((sum, sample) => sum + sample.n, 0);
  return samples.reduce((sum, sample) => sum + sample.mean * sample.n, 0) / total;
}

function benchmarkSeasonLabel() {
  const seasons = checkedValues($("seasonFilter"))
    .map(Number)
    .filter((season) => MLB_HR_BENCHMARKS[season])
    .sort((a, b) => a - b);
  if (!seasons.length) return "No benchmark seasons selected";
  if (seasons.length === 1) return `MLB HR average · ${seasons[0]}`;
  const consecutive = seasons.every((season, index) => index === 0 || season === seasons[index - 1] + 1);
  if (consecutive) return `MLB HR average · ${seasons[0]}–${seasons.at(-1)}`;
  if (seasons.length <= 4) return `MLB HR average · ${seasons.join(", ")}`;
  return `MLB HR average · ${seasons.length} selected seasons`;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function densityCurve(values, benchmark) {
  if (!values.length) return { x: [], y: [], maxDensity: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const deviation = standardDeviation(sorted);
  const iqr = percentile([...sorted], 0.75) - percentile([...sorted], 0.25);
  const spread = Math.min(deviation || Infinity, iqr > 0 ? iqr / 1.34 : Infinity);
  const fallbackSpread = Math.max((sorted.at(-1) - sorted[0]) / 4, 1);
  const bandwidth = Math.max(0.9 * (Number.isFinite(spread) ? spread : fallbackSpread) * (sorted.length ** -0.2), 0.35);
  const endpoints = [sorted[0], sorted.at(-1), benchmark].filter(Number.isFinite);
  const minimum = Math.min(...endpoints) - bandwidth * 3;
  const maximum = Math.max(...endpoints) + bandwidth * 3;
  const x = Array.from({ length: 120 }, (_, index) => minimum + ((maximum - minimum) * index / 119));
  const normalizer = sorted.length * bandwidth * Math.sqrt(2 * Math.PI);
  const y = x.map((position) => sorted.reduce(
    (sum, value) => sum + Math.exp(-0.5 * (((position - value) / bandwidth) ** 2)),
    0,
  ) / normalizer);
  return { x, y, maxDensity: Math.max(...y) };
}

function detailMarkup(row, metric = null) {
  if (!row) return '<p class="detail-kicker">HOME-RUN DETAILS</p><h4>No home run selected</h4>';
  const url = videoUrl(row);
  const statRows = [
    { key: "home_run_distance", label: "Distance", value: `${fmt(row.home_run_distance, 0)} ft` },
    { key: "launch_speed", label: "Exit velocity", value: `${fmt(row.launch_speed, 1)} mph` },
    { key: "launch_angle", label: "Launch angle", value: `${fmt(row.launch_angle, 0)}°` },
  ];
  if (metric) statRows.sort((left, right) => (left.key === metric.key ? -1 : right.key === metric.key ? 1 : 0));
  const stats = statRows.map((stat) => `<div><dt>${stat.label}</dt><dd>${stat.value}</dd></div>`).join("");
  return `
    <p class="detail-kicker">HOME-RUN DETAILS</p>
    <h4>Career HR #${row.home_run_number ?? "—"}</h4>
    <p class="detail-context">${escapeHtml(row.game_date_label)} · ${escapeHtml(row.matchup)}</p>
    <dl class="detail-stats">
      ${stats}
      <div><dt>Pitch</dt><dd>${escapeHtml(row.pitch_label || "—")} · ${fmt(row.release_speed, 1)} mph</dd></div>
    </dl>
    <p class="detail-description">${escapeHtml(row.des || "")}</p>
    ${url ? `<a class="video-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">▶ Watch video</a>` : ""}
  `;
}

function bindPointDetails(chart, target, metric = null) {
  chart.removeAllListeners?.("plotly_hover");
  chart.removeAllListeners?.("plotly_click");
  chart.on("plotly_hover", (event) => {
    const row = event.points?.find((point) => point.customdata)?.customdata;
    if (row) target.innerHTML = detailMarkup(row, metric);
  });
  chart.on("plotly_click", (event) => {
    const row = event.points?.find((point) => point.customdata)?.customdata;
    if (row) target.innerHTML = detailMarkup(row, metric);
    const url = row ? videoUrl(row) : "";
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
}

function renderDistribution(metric, detailTarget) {
  const rows = state.filtered.filter((row) => Number.isFinite(Number(row[metric.key])));
  const values = rows.map((row) => Number(row[metric.key]));
  const benchmark = weightedMlbAverage(metric.key);
  const density = densityCurve(values, benchmark);
  const colors = seasonColorMap();
  const rugDepth = density.maxDensity * 0.15 || 0.01;
  const chart = $(metric.chartId);
  const traces = [];

  if (values.length) {
    traces.push({
      x: density.x,
      y: density.y,
      mode: "lines",
      name: "Player HR density",
      line: { width: 3, color: "#ff7a1a" },
      fill: "tozeroy",
      fillcolor: "rgba(255, 122, 26, 0.16)",
      hoverinfo: "skip",
    });
    traces.push({
      x: values,
      y: rows.map((_, index) => -rugDepth * (0.34 + (index % 3) * 0.25)),
      mode: "markers",
      name: "Home runs",
      marker: {
        size: 8,
        color: rows.map((row) => colors[String(row.season)]),
        line: { color: "#fff", width: 1 },
        opacity: 0.86,
      },
      customdata: rows,
      hoverinfo: "none",
    });
  }

  const shapes = Number.isFinite(benchmark) ? [{
    type: "line",
    x0: benchmark,
    x1: benchmark,
    y0: -rugDepth,
    y1: density.maxDensity * 1.08,
    line: { color: "#ffffff", width: 2, dash: "dot" },
  }] : [];
  const annotations = [];
  if (Number.isFinite(benchmark)) {
    annotations.push({
      x: benchmark,
      y: density.maxDensity * 1.08,
      text: `MLB avg ${fmt(benchmark, metric.digits)} ${metric.unit}`,
      showarrow: false,
      xanchor: "left",
      xshift: 6,
      font: { size: 11, color: "#ffffff" },
    });
  }
  if (!rows.length) {
    annotations.push({
      x: 0.5,
      y: 0.5,
      xref: "paper",
      yref: "paper",
      text: "No home runs match these filters",
      showarrow: false,
      font: { color: "#aaa9a4" },
    });
  }

  Plotly.react(chart, traces, {
    ...baseLayout,
    margin: { l: 58, r: 20, t: 28, b: 54 },
    xaxis: { title: `${metric.label} (${metric.unit})`, gridcolor: "#343431", fixedrange: true },
    yaxis: {
      title: "Density",
      gridcolor: "#343431",
      rangemode: "tozero",
      range: values.length ? [-rugDepth * 1.08, density.maxDensity * 1.18] : undefined,
      fixedrange: true,
    },
    shapes,
    annotations,
    showlegend: false,
  }, { ...plotConfig, displayModeBar: false });
  bindPointDetails(chart, detailTarget, metric);
}

function renderDistributions() {
  const detailTarget = $("distributionDetail");
  detailTarget.innerHTML = detailMarkup(null);
  $("benchmarkLabel").textContent = benchmarkSeasonLabel();
  DISTRIBUTION_METRICS.forEach((metric) => renderDistribution(metric, detailTarget));
}

function renderSeason() {
  const counts = {};
  state.filtered.forEach((row) => { counts[row.season] = (counts[row.season] || 0) + 1; });
  const years = Object.keys(counts).sort();
  Plotly.react("seasonChart", [{
    x: years,
    y: years.map((year) => counts[year]),
    type: "bar",
    marker: { color: "#ff7a1a" },
    hovertemplate: "%{x}: %{y} HR<extra></extra>",
  }], {
    ...baseLayout,
    xaxis: { title: "Season", gridcolor: "#343431" },
    yaxis: { title: "Home runs", gridcolor: "#343431" },
  }, plotConfig);
}

function latestTeam() {
  const rows = state.all.filter((row) => row.batting_team && row.game_date);
  if (!rows.length) return "";
  return [...rows].sort((a, b) => String(a.game_date).localeCompare(String(b.game_date))).at(-1).batting_team;
}

function fieldPoint(distance, angle) {
  const radians = angle * Math.PI / 180;
  return { x: distance * Math.sin(radians), y: distance * Math.cos(radians) };
}

function renderSprayChart() {
  const team = latestTeam();
  const park = BALLPARKS[team] || DEFAULT_PARK;
  const colors = seasonColorMap();
  const angles = [-45, -22.5, 0, 22.5, 45];
  const wall = park.wall.map((distance, index) => fieldPoint(distance, angles[index]));
  const fieldX = [0, ...wall.map((point) => point.x), 0];
  const fieldY = [0, ...wall.map((point) => point.y), 0];
  const rows = state.filtered.filter((row) => Number.isFinite(Number(row.spray_x)) && Number.isFinite(Number(row.spray_y)));
  const chart = $("launchChart");
  const detailTarget = $("sprayDetail");
  $("stadiumLabel").textContent = `${park.name}${team ? ` · ${team}` : ""}`;
  detailTarget.innerHTML = detailMarkup(null);

  const traces = [
    {
      x: fieldX,
      y: fieldY,
      mode: "lines",
      fill: "toself",
      fillcolor: "#171717",
      line: { color: "#ff7a1a", width: 3 },
      hoverinfo: "skip",
      showlegend: false,
    },
    {
      x: [-63.64, 0, 63.64, 0, -63.64],
      y: [63.64, 127.28, 63.64, 0, 63.64],
      mode: "lines",
      fill: "toself",
      fillcolor: "#2a170a",
      line: { color: "#fff", width: 2 },
      hoverinfo: "skip",
      showlegend: false,
    },
  ];

  unique(rows.map((row) => row.season)).forEach((season) => {
    const seasonRows = rows.filter((row) => String(row.season) === String(season));
    traces.push({
      x: seasonRows.map((row) => row.spray_x),
      y: seasonRows.map((row) => row.spray_y),
      mode: "markers",
      name: String(season),
      marker: {
        size: 10,
        color: colors[String(season)],
        line: { color: "#fff", width: 1.3 },
        opacity: 0.9,
      },
      customdata: seasonRows,
      hoverinfo: "none",
    });
  });

  const annotations = wall.map((point, index) => ({
    x: point.x,
    y: point.y,
    text: `${park.wall[index]}'`,
    showarrow: false,
    yshift: 13,
    font: { size: 11, color: "#ff9b52" },
  }));
  annotations.push(
    { x: -280, y: 225, text: "LF", showarrow: false, font: { size: 11, color: "#aaa9a4" } },
    { x: 0, y: 445, text: "CF", showarrow: false, font: { size: 11, color: "#aaa9a4" } },
    { x: 280, y: 225, text: "RF", showarrow: false, font: { size: 11, color: "#aaa9a4" } },
  );
  if (!rows.length) annotations.push({ x: 0, y: 240, text: "Spray coordinates unavailable", showarrow: false, font: { color: "#aaa9a4" } });

  Plotly.react(chart, traces, {
    ...baseLayout,
    margin: { l: 20, r: 20, t: 10, b: 58 },
    xaxis: { range: [-365, 365], visible: false, fixedrange: false },
    yaxis: { range: [-25, 485], visible: false, fixedrange: false, scaleanchor: "x", scaleratio: 1 },
    annotations,
    dragmode: "zoom",
    legend: {
      orientation: "h",
      x: 0.5,
      xanchor: "center",
      y: -0.08,
      yanchor: "top",
      font: { size: 11 },
    },
    showlegend: rows.length > 0,
  }, {
    ...plotConfig,
    displayModeBar: true,
    scrollZoom: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d", "toImage", "hoverClosestCartesian", "hoverCompareCartesian"],
  });
  bindPointDetails(chart, detailTarget);
}

function filterNumber(row, key, minimumId, maximumId) {
  const rawValue = row[key];
  const value = rawValue === null || rawValue === undefined || rawValue === "" ? Number.NaN : Number(rawValue);
  const minimum = $(minimumId).value === "" ? null : Number($(minimumId).value);
  const maximum = $(maximumId).value === "" ? null : Number($(maximumId).value);
  return (minimum === null || (Number.isFinite(value) && value >= minimum))
    && (maximum === null || (Number.isFinite(value) && value <= maximum));
}

function filteredLogRows() {
  const query = $("logSearch").value.trim().toLowerCase();
  const from = $("logDateFrom").value;
  const to = $("logDateTo").value;
  return state.filtered.filter((row) => {
    const date = String(row.game_date || "").slice(0, 10);
    const searchable = [row.matchup, row.batting_team, row.pitch_label, row.des].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (!from || date >= from)
      && (!to || date <= to)
      && filterNumber(row, "home_run_number", "logHrMin", "logHrMax")
      && filterNumber(row, "home_run_distance", "logDistanceMin", "logDistanceMax")
      && filterNumber(row, "launch_speed", "logEvMin", "logEvMax")
      && filterNumber(row, "launch_angle", "logLaMin", "logLaMax")
      && filterNumber(row, "release_speed", "logPitchVeloMin", "logPitchVeloMax");
  });
}

function sortedLogRows(rows) {
  const { key, direction } = state.logSort;
  const multiplier = direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    if (typeof a === "number" || typeof b === "number") return (Number(a) - Number(b)) * multiplier;
    return String(a).localeCompare(String(b), undefined, { numeric: true }) * multiplier;
  });
}

function renderTable() {
  const rows = sortedLogRows(filteredLogRows());
  $("logCount").textContent = `${rows.length.toLocaleString()} of ${state.filtered.length.toLocaleString()}`;
  document.querySelectorAll("th[data-sort]").forEach((header) => {
    const active = header.dataset.sort === state.logSort.key;
    header.setAttribute("aria-sort", active ? (state.logSort.direction === "asc" ? "ascending" : "descending") : "none");
    const indicator = header.querySelector(".sort-indicator");
    if (indicator) indicator.textContent = active ? (state.logSort.direction === "asc" ? "▲" : "▼") : "";
  });
  if (!rows.length) {
    $("hrTable").innerHTML = '<tr><td class="empty-row" colspan="11">No home runs match these filters.</td></tr>';
    return;
  }
  $("hrTable").innerHTML = rows.map((row) => {
    const url = videoUrl(row);
    const video = url
      ? `<a class="video-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">▶ Watch</a>`
      : '<span class="muted-cell">—</span>';
    return `<tr>
      <td>${row.home_run_number ?? ""}</td>
      <td>${escapeHtml(row.game_date_label)}</td>
      <td>${escapeHtml(row.batting_team)}</td>
      <td>${escapeHtml(row.matchup)}</td>
      <td>${fmt(row.home_run_distance, 0)}</td>
      <td>${fmt(row.launch_speed, 1)}</td>
      <td>${fmt(row.launch_angle, 0)}°</td>
      <td>${escapeHtml(row.pitch_label)}</td>
      <td>${fmt(row.release_speed, 1)}</td>
      <td>${video}</td>
      <td class="desc">${escapeHtml(row.des)}</td>
    </tr>`;
  }).join("");
}

function resetFilters() {
  document.querySelectorAll('#seasonFilter input[type="checkbox"], #teamFilter input[type="checkbox"]')
    .forEach((input) => { input.checked = true; });
  applyFilters();
}

function resetLogFilters(render = true) {
  document.querySelectorAll("#logFilters input").forEach((input) => { input.value = ""; });
  if (render) renderTable();
}

function downloadCsv() {
  const columns = [
    "home_run_number", "game_date_label", "season", "batting_team", "matchup",
    "home_run_distance", "launch_speed", "launch_angle", "spray_angle",
    "pitch_label", "release_speed", "estimated_ba_using_speedangle",
    "estimated_woba_using_speedangle", "bat_speed", "video_url", "des",
  ];
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [columns.join(","), ...state.filtered.map((row) => columns.map((column) => quote(row[column])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `${(state.player?.full_name || "player").replace(/[^a-z0-9]+/gi, "_")}_home_runs.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

$("searchBtn").addEventListener("click", searchPlayers);
$("playerSearch").addEventListener("keydown", (event) => { if (event.key === "Enter") searchPlayers(); });
$("loadBtn").addEventListener("click", loadPlayer);
$("demoBtn").addEventListener("click", loadDemo);
$("csvUpload").addEventListener("change", (event) => uploadCsv(event.target.files[0]));
$("seasonFilter").addEventListener("change", applyFilters);
$("teamFilter").addEventListener("change", applyFilters);
$("resetFilters").addEventListener("click", resetFilters);
$("downloadBtn").addEventListener("click", downloadCsv);
$("resetLogFilters").addEventListener("click", () => resetLogFilters());

document.querySelectorAll("#logFilters input").forEach((input) => {
  input.addEventListener("input", renderTable);
});

document.querySelectorAll("th[data-sort] button").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.closest("th").dataset.sort;
    if (state.logSort.key === key) {
      state.logSort.direction = state.logSort.direction === "asc" ? "desc" : "asc";
    } else {
      state.logSort = { key, direction: "asc" };
    }
    renderTable();
  });
});

const topNavLinks = [...document.querySelectorAll(".topnav a")];
topNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    topNavLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

function updateActiveNav() {
  const current = topNavLinks.reduce((active, link) => {
    const section = document.querySelector(link.getAttribute("href"));
    return section && section.getBoundingClientRect().top <= 100 ? link : active;
  }, topNavLinks[0]);
  topNavLinks.forEach((link) => link.classList.toggle("active", link === current));
}

window.addEventListener("scroll", updateActiveNav, { passive: true });
updateActiveNav();

if (window.lucide) {
  window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}
