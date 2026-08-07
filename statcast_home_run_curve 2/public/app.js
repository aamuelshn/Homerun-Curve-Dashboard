const state = { player: null, all: [], filtered: [], source: "" };
const $ = (id) => document.getElementById(id);
$("endYear").value = new Date().getFullYear();

function setStatus(message, error=false){ const el=$("status"); el.textContent=message; el.className=error?"status error":"status"; }
function fmt(v,d=1){ return v===null || v===undefined || Number.isNaN(Number(v)) ? "—" : Number(v).toFixed(d); }
function escapeHtml(s){ return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
async function jsonFetch(url, opts={}){ const r=await fetch(url,opts); const body=await r.json().catch(()=>({detail:"Unexpected server response"})); if(!r.ok) throw new Error(body.detail || `Request failed (${r.status})`); return body; }

async function searchPlayers(){
  const q=$("playerSearch").value.trim(); if(q.length<2){setStatus("Enter at least two characters.",true);return;}
  setStatus("Searching MLB player records…"); $("matches").hidden=true;
  try{
    const data=await jsonFetch(`/api/search?q=${encodeURIComponent(q)}`); renderMatches(data.matches||[]); setStatus(data.matches?.length?"Select the correct player, then load home runs.":"No players found.");
  }catch(e){setStatus(e.message,true);}
}
function renderMatches(matches){
  const box=$("matches"); box.innerHTML=""; box.hidden=!matches.length;
  matches.forEach(p=>{ const b=document.createElement("button"); b.type="button"; b.className="match"; const career=[p.debut_date,p.last_played_date].filter(Boolean).join(" – "); b.innerHTML=`<span><strong>${escapeHtml(p.full_name)}</strong><br><small>${escapeHtml([p.position,p.team,career].filter(Boolean).join(" · "))}</small></span><small>MLBAM ${p.player_id}</small>`; b.addEventListener("click",()=>{ document.querySelectorAll(".match").forEach(x=>x.classList.remove("selected")); b.classList.add("selected"); state.player=p; $("loadBtn").disabled=false; if(p.debut_date){$("startYear").value=Math.max(2015,Number(p.debut_date.slice(0,4)));} if(p.last_played_date && !p.active){$("endYear").value=p.last_played_date.slice(0,4);} }); box.appendChild(b); });
}

async function loadPlayer(){
  if(!state.player)return; const p=state.player; const params=new URLSearchParams({player_id:p.player_id,player_name:p.full_name,start_year:$("startYear").value,end_year:$("endYear").value,game_types:$("gameType").value});
  setStatus(`Loading ${p.full_name}'s home runs from Baseball Savant…`); $("loadBtn").disabled=true;
  try{ const data=await jsonFetch(`/api/home-runs?${params}`); loadPayload(data); setStatus(`Loaded ${data.home_runs.length} home runs.`); }
  catch(e){setStatus(e.message,true);} finally{$("loadBtn").disabled=false;}
}
async function loadDemo(){ setStatus("Loading demo…"); try{loadPayload(await jsonFetch("/api/demo"));setStatus("Demo loaded.");}catch(e){setStatus(e.message,true);} }
async function uploadCsv(file){ if(!file)return; const fd=new FormData();fd.append("file",file);setStatus("Reading uploaded Savant CSV…");try{loadPayload(await jsonFetch("/api/upload",{method:"POST",body:fd}));setStatus("CSV loaded.");}catch(e){setStatus(e.message,true);} }

function loadPayload(data){ state.player=data.player||{full_name:"Uploaded player"}; state.source=data.source||""; state.all=data.home_runs||[]; setupFilters(); applyFilters(); $("results").hidden=false; $("playerTitle").textContent=state.player?.full_name||"Home runs"; $("sourceLabel").textContent=state.source; window.scrollTo({top:$("results").offsetTop-20,behavior:"smooth"}); }
function unique(arr){return [...new Set(arr.filter(v=>v!==null&&v!==undefined&&v!==""))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));}
function setupFilters(){ fillMulti($("seasonFilter"),unique(state.all.map(d=>d.season))); fillMulti($("teamFilter"),unique(state.all.map(d=>d.batting_team))); }
function fillMulti(el,vals){el.innerHTML="";vals.forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;o.selected=true;el.appendChild(o);});}
function selectedValues(el){return [...el.selectedOptions].map(o=>o.value);}
function applyFilters(){ const seasons=new Set(selectedValues($("seasonFilter"))); const teams=new Set(selectedValues($("teamFilter"))); state.filtered=state.all.filter(d=>(!seasons.size||seasons.has(String(d.season)))&&(!teams.size||teams.has(String(d.batting_team)))); renderAll(); }

const plotConfig={responsive:true,displaylogo:false,modeBarButtonsToRemove:["lasso2d","select2d"]};
const baseLayout={paper_bgcolor:"#fff",plot_bgcolor:"#fff",font:{color:"#17324a",family:"Inter, system-ui, sans-serif"},margin:{l:60,r:25,t:22,b:55},hoverlabel:{align:"left"}};
function hoverText(d){
  const items=[`<b>Career HR #${d.home_run_number ?? "—"}</b>`,d.game_date_label,d.matchup,`${d.inning_label||""} · Count ${d.count_label||"—"}`,`Distance: ${fmt(d.home_run_distance,0)} ft`,`Exit velo: ${fmt(d.launch_speed,1)} mph`,`Launch angle: ${fmt(d.launch_angle,0)}°`,`Pitch: ${d.pitch_label||"—"} · ${fmt(d.release_speed,1)} mph`,`xBA: ${fmt(d.estimated_ba_using_speedangle,3)} · xwOBA: ${fmt(d.estimated_woba_using_speedangle,3)}`,d.bat_speed!=null?`Bat speed: ${fmt(d.bat_speed,1)} mph`:null,d.base_state?`Runners: ${d.base_state}`:null,d.des].filter(Boolean); return items.join("<br>");
}
function renderAll(){ renderMetrics(); renderCareer(); renderSeason(); renderLaunch(); renderTimeline(); renderTable(); }
function renderMetrics(){ const d=state.filtered; const nums=(key)=>d.map(x=>Number(x[key])).filter(Number.isFinite); const dist=nums("home_run_distance"),ev=nums("launch_speed"); const metricData=[ ["Home runs",d.length.toLocaleString()], ["Longest",dist.length?`${Math.max(...dist).toFixed(0)} ft`:"—"], ["Hardest",ev.length?`${Math.max(...ev).toFixed(1)} mph`:"—"], ["Avg. distance",dist.length?`${(dist.reduce((a,b)=>a+b,0)/dist.length).toFixed(1)} ft`:"—"], ["Avg. EV",ev.length?`${(ev.reduce((a,b)=>a+b,0)/ev.length).toFixed(1)} mph`:"—"] ]; $("metrics").innerHTML=metricData.map(([l,v])=>`<div class="metric"><div class="label">${l}</div><div class="value">${v}</div></div>`).join(""); }
function metricMeta(key){ return {home_run_number:["Career home-run number","HR #"],home_run_distance:["Home-run distance","ft"],launch_speed:["Exit velocity","mph"],launch_angle:["Launch angle","°"]}[key]; }
function renderCareer(){ const d=state.filtered,key=$("curveMetric").value,[label,unit]=metricMeta(key); $("curveTitle").textContent=key==="home_run_number"?"Career home-run progression":`${label} by home run`; Plotly.react("careerChart",[{x:d.map(x=>x.game_date),y:d.map(x=>x[key]),mode:"lines+markers",line:{width:2,color:"#178f9c"},marker:{size:7,color:"#178f9c",line:{width:1,color:"#fff"}},text:d.map(hoverText),hovertemplate:"%{text}<extra></extra>"}],{...baseLayout,xaxis:{title:"Date",gridcolor:"#edf0f2"},yaxis:{title:unit?`${label} (${unit})`:label,gridcolor:"#edf0f2"}},plotConfig); }
function renderSeason(){ const counts={};state.filtered.forEach(d=>counts[d.season]=(counts[d.season]||0)+1);const years=Object.keys(counts).sort();Plotly.react("seasonChart",[{x:years,y:years.map(y=>counts[y]),type:"bar",marker:{color:"#178f9c"},hovertemplate:"%{x}: %{y} HR<extra></extra>"}],{...baseLayout,xaxis:{title:"Season",gridcolor:"#edf0f2"},yaxis:{title:"Home runs",gridcolor:"#edf0f2"}},plotConfig);}
function renderLaunch(){ const d=state.filtered.filter(x=>x.launch_speed!=null&&x.launch_angle!=null);Plotly.react("launchChart",[{x:d.map(x=>x.launch_speed),y:d.map(x=>x.launch_angle),mode:"markers",marker:{size:d.map(x=>Math.max(6,Math.min(18,(x.home_run_distance||350)/28))),color:"#178f9c",opacity:.7},text:d.map(hoverText),hovertemplate:"%{text}<extra></extra>"}],{...baseLayout,xaxis:{title:"Exit velocity (mph)",gridcolor:"#edf0f2"},yaxis:{title:"Launch angle (°)",gridcolor:"#edf0f2"}},plotConfig);}
function renderTimeline(){ const key=$("timelineMetric").value,[label,unit]=metricMeta(key);const roll={home_run_distance:"rolling_distance_10",launch_speed:"rolling_exit_velocity_10",launch_angle:"rolling_launch_angle_10"}[key];const d=state.filtered;Plotly.react("timelineChart",[{x:d.map(x=>x.game_date),y:d.map(x=>x[key]),mode:"markers",name:label,marker:{size:6,color:"#778899",opacity:.45},text:d.map(hoverText),hovertemplate:"%{text}<extra></extra>"},{x:d.map(x=>x.game_date),y:d.map(x=>x[roll]),mode:"lines",name:"10-HR rolling average",line:{width:3,color:"#178f9c"},hovertemplate:`10-HR avg: %{y:.1f} ${unit}<extra></extra>`}],{...baseLayout,xaxis:{title:"Date",gridcolor:"#edf0f2"},yaxis:{title:`${label} (${unit})`,gridcolor:"#edf0f2"},legend:{orientation:"h",y:1.08}},plotConfig);}
function renderTable(){ $("hrTable").innerHTML=state.filtered.map(d=>`<tr><td>${d.home_run_number??""}</td><td>${escapeHtml(d.game_date_label)}</td><td>${d.season??""}</td><td>${escapeHtml(d.matchup)}</td><td>${fmt(d.home_run_distance,0)}</td><td>${fmt(d.launch_speed,1)}</td><td>${fmt(d.launch_angle,0)}°</td><td>${escapeHtml(d.pitch_label)}</td><td>${fmt(d.release_speed,1)}</td><td class="desc" title="${escapeHtml(d.des)}">${escapeHtml(d.des)}</td></tr>`).join("");}
function resetFilters(){ [...$("seasonFilter").options,...$("teamFilter").options].forEach(o=>o.selected=true);applyFilters(); }
function downloadCsv(){ const cols=["home_run_number","game_date_label","season","matchup","home_run_distance","launch_speed","launch_angle","pitch_label","release_speed","estimated_ba_using_speedangle","estimated_woba_using_speedangle","bat_speed","des"]; const esc=v=>`"${String(v??"").replaceAll('"','""')}"`; const csv=[cols.join(","),...state.filtered.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n");const blob=new Blob([csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${(state.player?.full_name||"player").replace(/[^a-z0-9]+/gi,"_")}_home_runs.csv`;a.click();URL.revokeObjectURL(a.href);}

$("searchBtn").addEventListener("click",searchPlayers);$("playerSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchPlayers();});$("loadBtn").addEventListener("click",loadPlayer);$("demoBtn").addEventListener("click",loadDemo);$("csvUpload").addEventListener("change",e=>uploadCsv(e.target.files[0]));$("seasonFilter").addEventListener("change",applyFilters);$("teamFilter").addEventListener("change",applyFilters);$("curveMetric").addEventListener("change",renderCareer);$("timelineMetric").addEventListener("change",renderTimeline);$("resetFilters").addEventListener("click",resetFilters);$("downloadBtn").addEventListener("click",downloadCsv);
