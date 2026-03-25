import type { Handler } from 'hono';

const adminUI: Handler = (ctx) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GameNews RSS Hub — Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0d0d0d;color:#d4d4d4;min-height:100vh;padding:2rem 1rem}
.wrap{max-width:760px;margin:0 auto}
h1{font-size:1.4rem;color:#fff;font-weight:600}
.sub{color:#555;font-size:.8rem;margin-bottom:2rem;margin-top:.2rem}
.card{background:#161616;border:1px solid #222;border-radius:8px;padding:1.25rem;margin-bottom:1.25rem}
h2{font-size:.75rem;color:#666;text-transform:uppercase;letter-spacing:.08em;font-weight:500;margin-bottom:1rem}
label{font-size:.75rem;color:#666;display:block;margin-bottom:.25rem}
input{width:100%;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:5px;padding:.45rem .7rem;color:#d4d4d4;font-size:.875rem;transition:border .15s}
input:focus{outline:none;border-color:#3b7de8}
.row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
.row.full{grid-template-columns:1fr}
.field{display:flex;flex-direction:column;gap:.25rem}
.actions{display:flex;align-items:center;gap:.75rem;margin-top:.5rem}
btn,button{background:#2563eb;color:#fff;border:none;border-radius:5px;padding:.45rem 1.1rem;cursor:pointer;font-size:.875rem;font-family:inherit}
button:hover{background:#1d4ed8}
button.del{background:transparent;border:1px solid #3a1a1a;color:#b45555;padding:.35rem .8rem;font-size:.8rem}
button.del:hover{background:#1f0f0f;border-color:#7f1d1d}
.msg{font-size:.8rem;padding:.35rem .7rem;border-radius:4px;display:none}
.msg.ok{background:#052e16;color:#4ade80;border:1px solid #14532d}
.msg.err{background:#200f0f;color:#f87171;border:1px solid #7f1d1d}
.feed-list{display:flex;flex-direction:column;gap:.6rem}
.feed-item{background:#0d0d0d;border:1px solid #1e1e1e;border-radius:6px;padding:.85rem 1rem;display:flex;align-items:flex-start;gap:1rem}
.feed-body{flex:1;min-width:0}
.feed-name{font-size:.9rem;color:#e0e0e0;font-weight:500}
.feed-src{font-size:.72rem;color:#444;margin-top:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.feed-proxy{font-size:.72rem;color:#2563eb;margin-top:.15rem}
.copy-btn{font-size:.65rem;background:#1a2a40;color:#3b7de8;border:none;border-radius:3px;padding:.15rem .5rem;cursor:pointer;margin-left:.4rem;vertical-align:middle}
.copy-btn:hover{background:#1e3354}
.empty{color:#444;text-align:center;padding:1.5rem;font-size:.85rem}
.key-row{display:flex;gap:.5rem;align-items:center}
.key-row input{flex:1}
.key-row .hint{font-size:.72rem;color:#444;white-space:nowrap}
</style>
</head>
<body>
<div class="wrap">
  <h1>GameNews RSS Hub</h1>
  <p class="sub">Admin Panel</p>

  <div class="card">
    <h2>Admin Key</h2>
    <div class="key-row">
      <input type="password" id="adminKey" placeholder="Leave empty if ADMIN_KEY is not set">
      <span class="hint">stored in memory only</span>
    </div>
  </div>

  <div class="card">
    <h2>Add Feed</h2>
    <div class="row">
      <div class="field"><label>Name</label><input id="fname" placeholder="IGN Gaming News"></div>
      <div class="field"><label>Slug (proxy URL)</label><input id="fslug" placeholder="ign-gaming"></div>
    </div>
    <div class="row full" style="margin-top:.75rem">
      <div class="field"><label>RSS / Atom URL</label><input id="furl" type="url" placeholder="https://feeds.ign.com/ign/games"></div>
    </div>
    <div class="row full" style="margin-top:.75rem">
      <div class="field"><label>Description (optional)</label><input id="fdesc" placeholder="IGN gaming reviews and news"></div>
    </div>
    <div class="actions">
      <button onclick="addFeed()">Add Feed</button>
      <div class="msg" id="addMsg"></div>
    </div>
  </div>

  <div class="card">
    <h2>Active Feeds</h2>
    <div id="feedList" class="feed-list"><div class="empty">Loading…</div></div>
  </div>
</div>

<script>
const origin = location.origin;

function key() { return document.getElementById('adminKey').value; }

function apiUrl(path) {
  const k = key();
  return k ? origin + path + '?key=' + encodeURIComponent(k) : origin + path;
}

function msg(id, text, isErr) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg ' + (isErr ? 'err' : 'ok');
  el.style.display = 'inline-block';
  setTimeout(() => el.style.display = 'none', 3500);
}

document.getElementById('fname').addEventListener('input', function() {
  document.getElementById('fslug').value = this.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
});

async function load() {
  try {
    const r = await fetch(apiUrl('/api/gamenews/feeds'));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    render(await r.json());
  } catch(e) {
    document.getElementById('feedList').innerHTML = '<div class="empty">Failed to load: ' + e.message + '</div>';
  }
}

function render(feeds) {
  const el = document.getElementById('feedList');
  if (!feeds.length) { el.innerHTML = '<div class="empty">No feeds yet.</div>'; return; }
  el.innerHTML = feeds.map(f => {
    const proxyUrl = origin + '/proxy/' + f.slug;
    return '<div class="feed-item">' +
      '<div class="feed-body">' +
        '<div class="feed-name">' + esc(f.name) + '</div>' +
        '<div class="feed-src">' + esc(f.url) + '</div>' +
        '<div class="feed-proxy">' + proxyUrl +
          '<button class="copy-btn" onclick="copy(\\'' + proxyUrl + '\\')">copy</button>' +
        '</div>' +
      '</div>' +
      '<button class="del" onclick="del(\\'' + esc(f.slug) + '\\')">Delete</button>' +
    '</div>';
  }).join('');
}

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function copy(url) { navigator.clipboard.writeText(url).catch(() => {}); }

async function addFeed() {
  const name = document.getElementById('fname').value.trim();
  const url  = document.getElementById('furl').value.trim();
  const slug = document.getElementById('fslug').value.trim();
  const description = document.getElementById('fdesc').value.trim();
  if (!name || !url || !slug) { msg('addMsg','Name, URL and slug are required',true); return; }
  try {
    const r = await fetch(apiUrl('/api/gamenews/feeds'), {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({name,url,slug,description})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Error ' + r.status);
    msg('addMsg','Feed added!',false);
    ['fname','furl','fslug','fdesc'].forEach(id => document.getElementById(id).value = '');
    load();
  } catch(e) { msg('addMsg', e.message, true); }
}

async function del(slug) {
  if (!confirm('Delete "' + slug + '"?')) return;
  try {
    const r = await fetch(apiUrl('/api/gamenews/feeds/' + slug), {method:'DELETE'});
    if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
    load();
  } catch(e) { alert('Error: ' + e.message); }
}

document.getElementById('adminKey').addEventListener('change', load);
load();
</script>
</body>
</html>`;

    return ctx.html(html);
};

export default adminUI;
