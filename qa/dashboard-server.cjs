// QA Dashboard Server — real-time test log sheet (localhost:9200)
// Reads master-sheet.json, accepts status updates via POST /api/update (from Playwright reporter),
// pushes live changes to browsers via SSE.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const SHEET = path.join(ROOT, 'master-sheet.json');
const PORT = 9200;

let clients = [];
function load() { return JSON.parse(fs.readFileSync(SHEET, 'utf8')); }
function save(data) { fs.writeFileSync(SHEET, JSON.stringify(data, null, 2)); }
function broadcast(event, payload) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach(res => { try { res.write(msg); } catch (e) {} });
}

const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8">
<title>QA Test Automation Log — Lorcana PlayLab Cloud</title>
<meta http-equiv="refresh" content="0">
<style>
  :root{--bg:#08090a;--panel:#111318;--line:#23262d;--txt:#f1f5f9;--mut:#94a3b8;--amber:#f59e0b}
  body{margin:0;font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--txt)}
  header{padding:20px 28px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center}
  h1{font-size:18px;margin:0}.live{color:#22c55e;font-family:monospace;font-size:13px}
  .summary{display:flex;gap:14px;padding:16px 28px;flex-wrap:wrap}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 20px;min-width:110px}
  .card .n{font-size:26px;font-weight:800}.card .l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em}
  .pass .n{color:#22c55e}.fail .n{color:#ef4444}.untested .n{color:var(--mut)}.blocked .n{color:var(--amber)}
  table{width:calc(100% - 56px);margin:0 28px 40px;border-collapse:collapse;font-size:12.5px;background:var(--panel);border-radius:10px;overflow:hidden}
  th{background:#181b21;text-align:left;padding:10px 10px;font-size:11px;text-transform:uppercase;color:var(--mut);letter-spacing:.06em;border-bottom:1px solid var(--line)}
  td{padding:9px 10px;border-bottom:1px solid #1a1d23;vertical-align:top;line-height:1.45}
  tr:hover td{background:#15181e}
  .st{font-weight:700;padding:3px 9px;border-radius:6px;font-size:11px;display:inline-block}
  .st.PASS{background:#052e16;color:#22c55e}.st.FAIL{background:#450a0a;color:#ef4444}
  .st.BLOCKED{background:#422006;color:var(--amber)}.st.UNTESTED{background:#1e293b;color:var(--mut)}
  code,.mono{font-family:Consolas,monospace;font-size:11.5px;color:#7dd3fc}
</style></head><body>
<header><h1>🧪 QA Test Automation Log — Disney Lorcana PlayLab Cloud <span class="mono">/ Full QA Campaign</span></h1>
<span class="live" id="live">● LIVE — auto-updating via SSE</span></header>
<div class="summary" id="summary"></div>
<table id="tbl"><thead><tr>
<th>Test CaseID</th><th>Module / Feature</th><th>Description / Objective</th><th>Pre-condition</th><th>Test Steps</th><th>Expected Result</th><th>Actual Result</th><th>Status</th><th>Technique</th><th>Remark</th>
</tr></thead><tbody></tbody></table>
<script>
const es=new EventSource('/api/events');
es.onmessage=e=>{ if(e.data==='update') location.reload(); };
async function load(){
 const d=await (await fetch('/api/sheet')).json();
 const tb=document.querySelector('#tbl tbody');tb.innerHTML='';
 let pass=0,fail=0,blocked=0,un=0;
 for(const t of d.tests){
  const st=(t.status||'UNTESTED').toUpperCase();
  if(st==='PASS')pass++;else if(st==='FAIL')fail++;else if(st==='BLOCKED')blocked++;else un++;
  tb.insertAdjacentHTML('beforeend','<tr>'+
   '<td class="mono">'+t.caseId+'</td><td>'+t.module+'</td><td>'+t.description+'</td><td>'+t.precondition+'</td>'+
   '<td style="max-width:230px">'+t.steps+'</td><td style="max-width:200px">'+t.expected+'</td>'+
   '<td style="max-width:200px">'+(t.actual||'—')+'</td>'+
   '<td><span class="st '+st+'">'+st+'</span></td><td>'+t.technique+'</td><td>'+(t.remark||'')+'</td></tr>');
 }
 document.getElementById('summary').innerHTML=
  '<div class="card"><div class="n">'+d.tests.length+'</div><div class="l">Total Tests</div></div>'+
  '<div class="card pass"><div class="n">'+pass+'</div><div class="l">Pass</div></div>'+
  '<div class="card fail"><div class="n">'+fail+'</div><div class="l">Fail</div></div>'+
  '<div class="card blocked"><div class="n">'+blocked+'</div><div class="l">Blocked</div></div>'+
  '<div class="card untested"><div class="n">'+un+'</div><div class="l">Untested</div></div>';
}
load();
const urlParams = new URLSearchParams(location.search);
if (urlParams.get('static') !== '1') {
  const es = new EventSource('/api/events');
  es.onmessage = e => { if (e.data === 'update') location.reload(); };
  setInterval(() => fetch('/api/sheet').then(r => r.json()).then(d => {
    const changed = JSON.stringify(d) !== window._last;
    window._last = JSON.stringify(d); if (changed) load();
  }), 2000);
}
</script></body></html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(html); return; }
  if (req.url === '/api/sheet') { res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify(load())); return; }
  if (req.url === '/api/events') {
    res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    res.write(':connected\n\n'); clients.push(res);
    req.on('close', () => { clients = clients.filter(c => c !== res); });
    return;
  }
  if (req.url === '/api/update' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const upd = JSON.parse(body); // {caseId, status, actual, remark}
        const data = load();
        const row = data.tests.find(t => t.caseId === upd.caseId);
        if (!row) { res.writeHead(404); res.end(JSON.stringify({error:'unknown caseId', caseId: upd.caseId})); return; }
        if (upd.status) row.status = upd.status.toUpperCase();
        if (upd.actual !== undefined) row.actual = upd.actual;
        if (upd.remark !== undefined) row.remark = upd.remark;
        save(data);
        broadcast('update', 'refresh');
        console.log(`[${new Date().toLocaleTimeString()}] ${upd.caseId} → ${row.status}`);
        res.writeHead(200, {'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true}));
      } catch (e) { res.writeHead(400); res.end(JSON.stringify({error:e.message})); }
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(PORT, () => console.log(`QA Dashboard running → http://localhost:${PORT}`));
