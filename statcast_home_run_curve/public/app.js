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
  fillMulti($("seasonFilter"), unique(state.all.map((row) => row.season)));
  fillMulti($("teamFilter"), unique(state.all.map((row) => row.batting_team)));
}

function fillMulti(element, values) {
  element.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = true;
    element.appendChild(option);
  });
}

function selectedValues(element) {
  return [...element.selectedOptions].map((option) => option.value);
}

function applyFilters() {
  const seasons = new Set(selectedValues($("seasonFilter")));
  const teams = new Set(selectedValues($("teamFilter")));
  state.filtered = state.all.filter((row) => (
    (!seasons.size || seasons.has(String(row.season)))
    && (!teams.size || teams.has(String(row.batting_team)))
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
  paper_bgcolor: "#fff",
  plot_bgcolor: "#fff",
  font: { color: "#17324a", family: "Inter, system-ui, sans-serif" },
  margin: { l: 60, r: 25, t: 22, b: 55 },
  hoverlabel: { align: "left" },
};

function videoUrl(row) {
  return state.source.toLowerCase().includes("demo") ? "" : (row.video_url || "");
}

function hoverText(row) {
  return [
    `<b>Career HR #${row.home_run_number ?? "—"}</b>`,
    row.game_date_label,
    row.matchup,
    `${row.inning_label || ""} · Count ${row.count_label || "—"}`,
    `Distance: ${fmt(row.home_run_distance, 0)} ft`,
    `Exit velo: ${fmt(row.launch_speed, 1)} mph`,
    `Launch angle: ${fmt(row.launch_angle, 0)}°`,
    `Pitch: ${row.pitch_label || "—"} · ${fmt(row.release_speed, 1)} mph`,
    `xBA: ${fmt(row.estimated_ba_using_speedangle, 3)} · xwOBA: ${fmt(row.estimated_woba_using_speedangle, 3)}`,
    row.bat_speed != null ? `Bat speed: ${fmt(row.bat_speed, 1)} mph` : null,
    row.base_state ? `Runners: ${row.base_state}` : null,
    row.des,
  ].filter(Boolean).join("<br>");
}

function renderAll() {
  renderMetrics();
  renderCareer();
  renderSeason();
  renderSprayChart();
  renderTimeline();
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

function metricMeta(key) {
  return {
    home_run_number: ["Career home-run number", "HR #"],
    home_run_distance: ["Home-run distance", "ft"],
    launch_speed: ["Exit velocity", "mph"],
    launch_angle: ["Launch angle", "°"],
  }[key];
}

function renderCareer() {
  const rows = state.filtered;
  const key = $("curveMetric").value;
  const [label, unit] = metricMeta(key);
  $("curveTitle").textContent = key === "home_run_number" ? "Career home-run progression" : `${label} by home run`;
  Plotly.react("careerChart", [{
    x: rows.map((row) => row.game_date),
    y: rows.map((row) => row[key]),
    mode: "lines+markers",
    line: { width: 2, color: "#178f9c" },
    marker: { size: 7, color: "#178f9c", line: { width: 1, color: "#fff" } },
    text: rows.map(hoverText),
    hovertemplate: "%{text}<extra></extra>",
  }], {
    ...baseLayout,
    xaxis: { title: "Date", gridcolor: "#edf0f2" },
    yaxis: { title: unit ? `${label} (${unit})` : label, gridcolor: "#edf0f2" },
  }, plotConfig);
}

function renderSeason() {
  const counts = {};
  state.filtered.forEach((row) => { counts[row.season] = (counts[row.season] || 0) + 1; });
  const years = Object.keys(counts).sort();
  Plotly.react("seasonChart", [{
    x: years,
    y: years.map((year) => counts[year]),
    type: "bar",
    marker: { color: "#178f9c" },
    hovertemplate: "%{x}: %{y} HR<extra></extra>",
  }], {
    ...baseLayout,
    xaxis: { title: "Season", gridcolor: "#edf0f2" },
    yaxis: { title: "Home runs", gridcolor: "#edf0f2" },
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
  const angles = [-45, -22.5, 0, 22.5, 45];
  const wall = park.wall.map((distance, index) => fieldPoint(distance, angles[index]));
  const fieldX = [0, ...wall.map((point) => point.x), 0];
  const fieldY = [0, ...wall.map((point) => point.y), 0];
  const rows = state.filtered.filter((row) => Number.isFinite(Number(row.spray_x)) && Number.isFinite(Number(row.spray_y)));
  const chart = $("launchChart");
  $("stadiumLabel").textContent = `${park.name}${team ? ` · ${team}` : ""}`;

  const traces = [
    {
      x: fieldX,
      y: fieldY,
      mode: "lines",
      fill: "toself",
      fillcolor: "#e2f0e5",
      line: { color: "#39785b", width: 3 },
      hoverinfo: "skip",
      showlegend: false,
    },
    {
      x: [-63.64, 0, 63.64, 0, -63.64],
      y: [63.64, 127.28, 63.64, 0, 63.64],
      mode: "lines",
      fill: "toself",
      fillcolor: "#d7b58c",
      line: { color: "#fff", width: 2 },
      hoverinfo: "skip",
      showlegend: false,
    },
    {
      x: rows.map((row) => row.spray_x),
      y: rows.map((row) => row.spray_y),
      mode: "markers",
      marker: {
        size: 10,
        color: rows.map((row) => row.season),
        colorscale: [[0, "#2563eb"], [0.5, "#f59e0b"], [1, "#dc2626"]],
        line: { color: "#fff", width: 1.3 },
        opacity: 0.88,
        showscale: rows.length > 1,
        colorbar: { title: "Season", thickness: 10, len: 0.48, y: 0.78 },
      },
      text: rows.map(hoverText),
      customdata: rows.map((row) => [videoUrl(row)]),
      hovertemplate: "%{text}<extra></extra>",
      showlegend: false,
    },
  ];

  const annotations = wall.map((point, index) => ({
    x: point.x,
    y: point.y,
    text: `${park.wall[index]}'`,
    showarrow: false,
    yshift: 13,
    font: { size: 11, color: "#39785b" },
  }));
  annotations.push(
    { x: -280, y: 225, text: "LF", showarrow: false, font: { size: 11, color: "#667085" } },
    { x: 0, y: 445, text: "CF", showarrow: false, font: { size: 11, color: "#667085" } },
    { x: 280, y: 225, text: "RF", showarrow: false, font: { size: 11, color: "#667085" } },
  );
  if (!rows.length) annotations.push({ x: 0, y: 240, text: "Spray coordinates unavailable", showarrow: false, font: { color: "#667085" } });

  Plotly.react(chart, traces, {
    ...baseLayout,
    margin: { l: 20, r: 20, t: 10, b: 15 },
    xaxis: { range: [-365, 365], visible: false, fixedrange: true },
    yaxis: { range: [-25, 485], visible: false, fixedrange: true, scaleanchor: "x", scaleratio: 1 },
    annotations,
    showlegend: false,
  }, { ...plotConfig, displayModeBar: false });

  chart.removeAllListeners?.("plotly_click");
  chart.on("plotly_click", (event) => {
    const url = event.points?.[0]?.customdata?.[0];
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });
}

function renderTimeline() {
  const key = $("timelineMetric").value;
  const [label, unit] = metricMeta(key);
  const rollingKey = {
    home_run_distance: "rolling_distance_10",
    launch_speed: "rolling_exit_velocity_10",
    launch_angle: "rolling_launch_angle_10",
  }[key];
  const rows = state.filtered;
  Plotly.react("timelineChart", [
    {
      x: rows.map((row) => row.game_date),
      y: rows.map((row) => row[key]),
      mode: "markers",
      name: label,
      marker: { size: 6, color: "#778899", opacity: 0.45 },
      text: rows.map(hoverText),
      hovertemplate: "%{text}<extra></extra>",
    },
    {
      x: rows.map((row) => row.game_date),
      y: rows.map((row) => row[rollingKey]),
      mode: "lines",
      name: "10-HR rolling average",
      line: { width: 3, color: "#178f9c" },
      hovertemplate: `10-HR avg: %{y:.1f} ${unit}<extra></extra>`,
    },
  ], {
    ...baseLayout,
    xaxis: { title: "Date", gridcolor: "#edf0f2" },
    yaxis: { title: `${label} (${unit})`, gridcolor: "#edf0f2" },
    legend: { orientation: "h", y: 1.08 },
  }, plotConfig);
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
  [...$("seasonFilter").options, ...$("teamFilter").options].forEach((option) => { option.selected = true; });
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
$("curveMetric").addEventListener("change", renderCareer);
$("timelineMetric").addEventListener("change", renderTimeline);
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
