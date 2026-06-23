(function () {
  if (window.__jvDone) return; window.__jvDone = true;

  // ---- detect a raw-JSON page (fast bail otherwise) ----
  const b = document.body; if (!b) return;
  const onlyPre = b.childElementCount === 1 && b.firstElementChild && b.firstElementChild.tagName === "PRE";
  const raw = (onlyPre ? b.firstElementChild.textContent : (b.innerText || "")).trim();
  if (raw.length < 2 || (raw[0] !== "{" && raw[0] !== "[")) return;
  const ct = document.contentType || "";
  const looksJson = ct.includes("json") || onlyPre || /\.json(\?|$)/i.test(location.pathname);
  if (!looksJson) return;
  let data; try { data = JSON.parse(raw); } catch { return; }

  // ---- styles ----
  const css = `
  html,body{margin:0;background:#0d1117;color:#c9d1d9;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  #jv-bar{position:sticky;top:0;display:flex;gap:8px;align-items:center;padding:8px 14px;background:#161b22;border-bottom:1px solid #21262d;z-index:9}
  #jv-bar b{font-family:-apple-system,system-ui,sans-serif;color:#e6edf3;margin-right:auto;font-size:13px}
  #jv-bar button,#jv-search{background:#21262d;color:#c9d1d9;border:1px solid #30363d;border-radius:6px;padding:5px 10px;font:12px ui-monospace,monospace;cursor:pointer}
  #jv-search{cursor:text;width:170px}
  #jv-bar button:hover{background:#30363d}
  #jv{padding:14px 16px 60px;white-space:pre}
  .jv-tog{cursor:pointer;user-select:none;color:#7d8590;display:inline-block;width:12px}
  .jv-key{color:#79c0ff}.jv-str{color:#a5d6ff}.jv-num{color:#f2cc60}.jv-bool,.jv-null{color:#ff7b72}.jv-punct{color:#7d8590}
  .jv-kids{display:block;margin-left:16px;border-left:1px solid #1d242d;padding-left:8px}
  .jv-collapsed>.jv-kids{display:none}
  .jv-count{color:#6e7681;font-size:11px}
  .jv-hide{display:none}
  a.jv-link{color:#58a6ff}`;
  const st = document.createElement("style"); st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
  document.body.innerHTML = "";

  const esc = s => String(s).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  function valHtml(v) {
    if (v === null) return '<span class="jv-null">null</span>';
    const t = typeof v;
    if (t === "string") { const u = /^https?:\/\//.test(v) ? `<a class="jv-link" href="${esc(v)}" target="_blank" rel="noopener">${esc(v)}</a>` : esc(v); return `<span class="jv-str">"${u}"</span>`; }
    if (t === "number") return `<span class="jv-num">${v}</span>`;
    if (t === "boolean") return `<span class="jv-bool">${v}</span>`;
    return esc(String(v));
  }
  function build(val, key, last) {
    const row = document.createElement("div");
    const isObj = val && typeof val === "object";
    const keyHtml = key !== null ? `<span class="jv-key">"${esc(key)}"</span><span class="jv-punct">: </span>` : "";
    if (!isObj) { row.innerHTML = `<span class="jv-tog"></span>${keyHtml}${valHtml(val)}<span class="jv-punct">${last ? "" : ","}</span>`; return row; }
    const arr = Array.isArray(val), keys = arr ? val.map((_, i) => i) : Object.keys(val);
    row.innerHTML = `<span class="jv-tog">▾</span>${keyHtml}<span class="jv-punct">${arr ? "[" : "{"}</span> <span class="jv-count">${keys.length}</span>`;
    const kids = document.createElement("div"); kids.className = "jv-kids";
    keys.forEach((k, i) => kids.appendChild(build(arr ? val[k] : val[k], arr ? null : k, i === keys.length - 1)));
    const end = document.createElement("div"); end.innerHTML = `<span class="jv-tog"></span><span class="jv-punct">${arr ? "]" : "}"}${last ? "" : ","}</span>`;
    row.appendChild(kids); row.appendChild(end);
    const tog = row.querySelector(".jv-tog");
    tog.onclick = () => { row.classList.toggle("jv-collapsed"); tog.textContent = row.classList.contains("jv-collapsed") ? "▸" : "▾"; };
    return row;
  }

  const bar = document.createElement("div"); bar.id = "jv-bar";
  bar.innerHTML = `<b>JSON Viewer</b><input id="jv-search" placeholder="filter…"/><button id="jv-exp">Expand</button><button id="jv-col">Collapse</button><button id="jv-copy">Copy</button><button id="jv-raw">Raw</button>`;
  document.body.appendChild(bar);
  const wrap = document.createElement("div"); wrap.id = "jv";
  wrap.appendChild(build(data, null, true));
  document.body.appendChild(wrap);

  document.getElementById("jv-exp").onclick = () => wrap.querySelectorAll(".jv-collapsed").forEach(r => { r.classList.remove("jv-collapsed"); r.querySelector(".jv-tog").textContent = "▾"; });
  document.getElementById("jv-col").onclick = () => wrap.querySelectorAll("div").forEach(r => { if (r.querySelector(":scope > .jv-kids")) { r.classList.add("jv-collapsed"); r.querySelector(".jv-tog").textContent = "▸"; } });
  document.getElementById("jv-copy").onclick = e => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); e.target.textContent = "Copied"; setTimeout(() => e.target.textContent = "Copy", 1200); };
  let rawMode = false;
  document.getElementById("jv-raw").onclick = e => { rawMode = !rawMode; wrap.innerHTML = ""; if (rawMode) { wrap.textContent = JSON.stringify(data, null, 2); e.target.textContent = "Tree"; } else { wrap.appendChild(build(data, null, true)); e.target.textContent = "Raw"; } };
  document.getElementById("jv-search").oninput = e => { const q = e.target.value.toLowerCase(); wrap.querySelectorAll("div").forEach(r => r.classList.toggle("jv-hide", q && !r.textContent.toLowerCase().includes(q))); };
})();
