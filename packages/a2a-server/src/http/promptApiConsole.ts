/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

export function getPromptApiConsoleHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Gemini Prompt API</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0b0d11;--surface:#12151c;--surface2:#181c26;--surface3:#1e2330;
  --border:#252a37;--border2:#2f3649;
  --text:#e4e8f1;--text2:#9ba3b8;--text3:#6b7490;
  --accent:#818cf8;--accent2:#6366f1;--accent-glow:rgba(99,102,241,.15);
  --green:#34d399;--green-bg:rgba(52,211,153,.1);
  --amber:#fbbf24;--amber-bg:rgba(251,191,36,.1);
  --red:#f87171;--red-bg:rgba(248,113,113,.1);
  --mono:'JetBrains Mono','Cascadia Code','SF Mono',Consolas,monospace;
  --sans:'Inter',-apple-system,'Segoe UI',sans-serif;
  --radius:12px;--radius-lg:16px;--radius-xl:20px;
  --shadow:0 4px 24px rgba(0,0,0,.4);
}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh;line-height:1.5}
a{color:var(--accent);text-decoration:none}

/* ── Auth Screen ── */
.auth-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.auth-box{width:100%;max-width:400px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:40px 32px;text-align:center;box-shadow:var(--shadow)}
.auth-box .logo{font-size:32px;font-weight:800;letter-spacing:-.03em;margin-bottom:4px}
.auth-box .logo span{color:var(--accent)}
.auth-box .subtitle{color:var(--text3);font-size:14px;margin-bottom:28px}
.auth-input{width:100%;padding:12px 16px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font:14px var(--sans);outline:none;transition:border-color .15s}
.auth-input:focus{border-color:var(--accent)}
.auth-input::placeholder{color:var(--text3)}
.auth-btn{width:100%;margin-top:16px;padding:12px;background:var(--accent2);color:#fff;border:0;border-radius:var(--radius);font:600 14px var(--sans);cursor:pointer;transition:background .15s}
.auth-btn:hover{background:var(--accent)}
.auth-btn:disabled{opacity:.7;cursor:not-allowed}
.auth-btn .spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
.auth-error{margin-top:12px;color:var(--red);font-size:13px;min-height:20px}

/* ── Shell ── */
.shell{display:none;max-width:1280px;margin:0 auto;padding:20px 24px 48px}

/* ── Header ── */
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:16px;flex-wrap:wrap}
.header-left{display:flex;align-items:center;gap:12px}
.brand{font-size:22px;font-weight:800;letter-spacing:-.03em}
.brand span{color:var(--accent)}
.header-right{display:flex;align-items:center;gap:10px}

/* ── Status Pills ── */
.status-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
.pill{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;background:var(--surface);border:1px solid var(--border);font-size:12px;font-weight:500;color:var(--text2)}
.pill .dot{width:7px;height:7px;border-radius:50%}
.dot-ok{background:var(--green)}.dot-warn{background:var(--amber)}.dot-err{background:var(--red)}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:0;border-radius:var(--radius);font:600 13px var(--sans);cursor:pointer;transition:all .15s;white-space:nowrap}
.btn-primary{background:var(--accent2);color:#fff}.btn-primary:hover{background:var(--accent)}
.btn-ghost{background:var(--accent-glow);color:var(--accent)}.btn-ghost:hover{background:rgba(99,102,241,.22)}
.btn-outline{background:transparent;color:var(--text2);border:1px solid var(--border)}.btn-outline:hover{border-color:var(--text3);color:var(--text)}
.btn-danger{background:var(--red-bg);color:var(--red)}.btn-danger:hover{background:rgba(248,113,113,.18)}
.btn-sm{padding:5px 10px;font-size:12px}
.btn:disabled{opacity:.4;cursor:not-allowed}

/* ── Cards / Panels ── */
.grid{display:grid;gap:16px}
.grid-2{grid-template-columns:1fr 1fr}
.grid-3{grid-template-columns:1fr 1fr 1fr}
.grid-23{grid-template-columns:2fr 3fr}
.grid-32{grid-template-columns:3fr 2fr}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;position:relative;overflow:hidden}
.card-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
.card-title{font-size:15px;font-weight:700;color:var(--text)}
.card-desc{color:var(--text3);font-size:13px;margin-bottom:16px}

/* ── Form Elements ── */
.field{margin-bottom:14px}
.field:last-child{margin-bottom:0}
.label{display:block;font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.input,.select,.textarea{width:100%;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);color:var(--text);font:14px var(--sans);outline:none;transition:border-color .15s}
.input:focus,.select:focus,.textarea:focus{border-color:var(--accent)}
.input::placeholder,.textarea::placeholder{color:var(--text3)}
.textarea{font-family:var(--mono);font-size:13px;min-height:80px;resize:vertical}
.select{cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%236b7490' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
.select option{background:var(--surface2);color:var(--text)}

.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.stack{display:flex;flex-direction:column;gap:12px}

/* ── Notice ── */
.notice{display:none;padding:12px 16px;border-radius:var(--radius);background:var(--red-bg);border:1px solid rgba(248,113,113,.2);color:var(--red);font-size:13px;font-weight:500;margin-bottom:16px}
.notice.visible{display:block}
.notice.notice-ok{background:var(--green-bg);border-color:rgba(52,211,153,.25);color:var(--green)}

/* ── Toggle Row ── */
.toggle-row{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;font-weight:500;color:var(--text);flex-wrap:wrap}
.toggle-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent2);cursor:pointer}
.toggle-hint{display:block;width:100%;font-size:12px;font-weight:400;color:var(--text3);margin-left:26px;margin-top:-4px}

/* ── Credential Test Result ── */
.cred-test-result{font-size:12px;margin-top:8px;padding:6px 10px;border-radius:8px;display:none;word-break:break-all}
.cred-test-result.test-ok{display:block;background:var(--green-bg);color:var(--green)}
.cred-test-result.test-err{display:block;background:var(--red-bg);color:var(--red)}

/* ── Credential Cards ── */
.cred-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.cred-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;transition:border-color .15s}
.cred-card.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}
.cred-name{font-weight:700;font-size:15px;margin-bottom:2px}
.cred-email{color:var(--text2);font-size:13px}
.cred-id{font-family:var(--mono);font-size:11px;color:var(--text3);margin-top:4px;word-break:break-all}
.cred-actions{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}

/* ── Credential Cooldown Chips ── */
.cred-cooldowns{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.cred-cooldown{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:6px;font-size:11.5px;font-weight:600;font-family:var(--mono);line-height:1.4;cursor:help}
.cred-cooldown-model{background:var(--amber-bg);color:var(--amber);border:1px solid rgba(245,158,11,.2)}
.cred-cooldown-auth{background:var(--red-bg);color:var(--red);border:1px solid rgba(239,68,68,.25);font-weight:700}

.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600}
.badge-active{background:var(--green-bg);color:var(--green)}
.badge-stored{background:rgba(155,163,184,.1);color:var(--text3)}

/* ── Quota ── */
.quota-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px}
.quota-card:last-child{margin-bottom:0}
.metric-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:14px}
.metric{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px}
.metric-label{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em}
.metric-value{font-size:20px;font-weight:800;margin-top:4px;letter-spacing:-.02em}
.chip-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.chip{padding:4px 10px;border-radius:999px;font-size:11px;font-weight:600;background:var(--accent-glow);color:var(--accent);border:1px solid rgba(99,102,241,.2)}

/* ── Per-Model Quota Rows ── */
.model-quota-section{margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
.model-quota-title{font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px}
.model-quota-row{display:grid;grid-template-columns:minmax(140px,1.2fr) minmax(90px,0.8fr) minmax(110px,1fr) minmax(100px,1fr);gap:10px;align-items:center;padding:8px 10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;font-size:12px}
.model-quota-row:last-child{margin-bottom:0}
.model-quota-name{font-weight:600;color:var(--text1)}
.model-quota-name small{display:block;color:var(--text3);font-size:10px;font-weight:400;margin-top:1px}
.model-quota-num{font-family:var(--mono);font-size:11px;color:var(--text2)}
.model-quota-bar{position:relative;height:6px;background:var(--surface2);border-radius:3px;overflow:hidden}
.model-quota-bar-fill{position:absolute;inset:0;right:auto;background:linear-gradient(90deg,var(--accent) 0%,var(--accent) 100%);border-radius:3px;transition:width .3s}
.model-quota-bar-fill.low{background:var(--red)}
.model-quota-bar-fill.warn{background:#f59e0b}
.model-quota-reset{color:var(--text3);font-size:11px}
@media (max-width:640px){.model-quota-row{grid-template-columns:1fr 1fr;row-gap:6px}.model-quota-bar{grid-column:1/-1}.model-quota-reset{grid-column:1/-1}}

/* ── Code Block ── */
.code-block{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;font-family:var(--mono);font-size:12px;line-height:1.7;color:var(--text2);overflow-x:auto;white-space:pre-wrap;word-break:break-all;min-height:60px}

/* ── Endpoint Docs ── */
.ep-item{padding:12px 0;border-bottom:1px solid var(--border)}
.ep-item:last-child{border-bottom:0}
.ep-method{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;font-family:var(--mono)}
.ep-get{background:var(--green-bg);color:var(--green)}
.ep-post{background:var(--accent-glow);color:var(--accent)}
.ep-put{background:var(--amber-bg);color:var(--amber)}
.ep-delete{background:var(--red-bg);color:var(--red)}
.ep-path{font-family:var(--mono);font-size:13px;margin-left:8px;color:var(--text)}
.ep-desc{color:var(--text3);font-size:12px;margin-top:4px;padding-left:2px}

/* ── Empty State ── */
.empty{padding:24px;text-align:center;color:var(--text3);border:1px dashed var(--border);border-radius:var(--radius);font-size:13px}

/* ── Footer ── */
.footer{margin-top:20px;padding-top:18px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:6px;color:var(--text3);font-size:12px}
.footer strong{color:var(--text2);font-weight:700}

/* ── Responsive ── */
@media(max-width:860px){
  .grid-2,.grid-3,.grid-23,.grid-32{grid-template-columns:1fr}
}

/* ── Logs Panel ── */
.logs-card{position:relative}
.logs-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.logs-head .spacer{flex:1}
.logs-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0}
.logs-toolbar select,.logs-toolbar input{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:8px;font:13px var(--sans);outline:none}
.logs-toolbar select:focus,.logs-toolbar input:focus{border-color:var(--accent)}
.logs-toolbar .search{flex:1;min-width:160px}
.logs-toolbar .counter{font-size:12px;color:var(--text3);font-family:var(--mono)}
.logs-body{background:var(--surface2);border:1px solid var(--border);border-radius:10px;height:360px;overflow-y:auto;padding:6px;font:12px/1.55 var(--mono);scrollbar-width:thin}
.logs-body::-webkit-scrollbar{width:8px}
.logs-body::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
.logs-body.paused{box-shadow:inset 0 0 0 1px var(--amber)}
.log-row{display:grid;grid-template-columns:78px 54px 1fr;gap:8px;padding:3px 6px;border-radius:6px;word-break:break-word;white-space:pre-wrap}
.log-row:hover{background:var(--surface3)}
.log-row.lv-error{color:var(--red)}
.log-row.lv-warn{color:var(--amber)}
.log-row.lv-info{color:var(--text)}
.log-row.lv-debug{color:var(--text3)}
.log-ts{color:var(--text3);font-variant-numeric:tabular-nums}
.log-lv{font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.5px;align-self:center;padding:1px 6px;border-radius:4px;text-align:center}
.log-row.lv-error .log-lv{background:var(--red-bg);color:var(--red)}
.log-row.lv-warn .log-lv{background:var(--amber-bg);color:var(--amber)}
.log-row.lv-info .log-lv{background:var(--accent-glow);color:var(--accent)}
.log-row.lv-debug .log-lv{background:var(--surface3);color:var(--text3)}
.log-msg{min-width:0}
.log-rest{display:block;margin-top:2px;color:var(--text3);font-size:11px;opacity:.85}
.logs-empty{color:var(--text3);padding:16px;text-align:center;font-size:13px}
.logs-stream-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.6s ease-in-out infinite}
.logs-stream-dot.off{background:var(--text3);animation:none}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@media(max-width:640px){
  .log-row{grid-template-columns:68px 48px 1fr;font-size:11px}
}

/* ── ACP Worker Cards (expandable) ── */
.acp-worker{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface2);margin-bottom:8px;overflow:hidden}
.acp-worker[open]{box-shadow:0 0 0 1px var(--accent-glow)}
.acp-worker-summary{cursor:pointer;list-style:none;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px}
.acp-worker-summary::-webkit-details-marker{display:none}
.acp-worker-summary::before{content:'▸';color:var(--text3);font-size:10px;transition:transform .15s;display:inline-block;width:10px}
.acp-worker[open] > .acp-worker-summary::before{transform:rotate(90deg)}
.acp-worker-summary:hover{background:var(--surface3)}
.acp-worker-cred{font-family:var(--mono);font-weight:600;color:var(--text)}
.acp-worker-state{font-size:11px;font-weight:600;text-transform:uppercase;padding:2px 8px;border-radius:999px;letter-spacing:.04em}
.acp-worker-state.s-ready{background:var(--green-bg);color:var(--green)}
.acp-worker-state.s-starting{background:var(--amber-bg);color:var(--amber)}
.acp-worker-state.s-error,.acp-worker-state.s-dead{background:var(--red-bg);color:var(--red)}
.acp-worker-meta{font-size:12px;color:var(--text3)}
.acp-worker-spacer{flex:1}
.acp-worker-body{padding:0 14px 14px;border-top:1px solid var(--border);background:var(--surface)}
.acp-section-title{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 8px}
.acp-prompt-row{padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;font-size:12px}
.acp-prompt-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px}
.acp-prompt-id{font-family:var(--mono);color:var(--text3);font-size:11px}
.acp-prompt-status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:.04em;text-transform:uppercase}
.acp-prompt-status.st-completed{background:var(--green-bg);color:var(--green)}
.acp-prompt-status.st-in_progress{background:var(--accent-glow);color:var(--accent);animation:pulse 1.6s ease-in-out infinite}
.acp-prompt-status.st-error{background:var(--red-bg);color:var(--red)}
.acp-prompt-status.st-cancelled{background:var(--amber-bg);color:var(--amber)}
.acp-prompt-meta{font-size:11px;color:var(--text3);font-family:var(--mono)}
.acp-prompt-tokens{display:inline-flex;gap:6px;font-family:var(--mono);font-size:11px;color:var(--text2)}
.acp-prompt-tokens span{padding:1px 6px;background:var(--surface3);border-radius:4px}
.acp-prompt-content{margin-top:6px;display:grid;grid-template-columns:60px 1fr;gap:8px;align-items:start;font-size:12px;line-height:1.55}
.acp-prompt-content + .acp-prompt-content{margin-top:4px}
.acp-prompt-label{color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;padding-top:2px}
.acp-prompt-text{font-family:var(--mono);font-size:11.5px;color:var(--text);background:var(--surface3);border-radius:6px;padding:6px 10px;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto}
.acp-prompt-text.empty{color:var(--text3);font-style:italic}
.acp-prompt-error{color:var(--red);font-size:11.5px;font-family:var(--mono);margin-top:4px;background:var(--red-bg);border-radius:6px;padding:6px 10px}
.acp-quota-mini{display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:var(--text2)}
.acp-quota-mini .acp-quota-pill{padding:3px 10px;background:var(--surface3);border:1px solid var(--border);border-radius:999px;font-family:var(--mono);font-size:11px}
.acp-empty-mini{padding:10px;text-align:center;color:var(--text3);font-size:12px;background:var(--surface2);border:1px dashed var(--border);border-radius:var(--radius)}
.acp-live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 1.6s ease-in-out infinite;margin-right:4px;vertical-align:middle}
.acp-live-dot.off{background:var(--text3);animation:none}
.acp-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
.acp-toolbar .acp-status-text{font-size:12px;color:var(--text3);margin-left:auto}
@media(max-width:640px){
  .acp-prompt-content{grid-template-columns:1fr}
  .acp-prompt-label{padding-top:0}
}
</style>
</head>
<body>

<!-- Auth Screen -->
<div id="auth-screen" class="auth-screen">
  <div class="auth-box">
    <div class="logo">Gemini <span>API</span></div>
    <div id="auth-subtitle" class="subtitle">Prompt API Management Console</div>
    <input id="token-input" class="auth-input" type="password" placeholder="Enter access token" autocomplete="off"/>
    <button id="auth-submit" class="auth-btn">Sign In</button>
    <div id="auth-error" class="auth-error"></div>
  </div>
</div>

<!-- Main App -->
<div id="app" class="shell">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="brand">Gemini <span>Prompt API</span></div>
    </div>
    <div class="header-right">
      <button class="btn btn-outline btn-sm" id="lang-btn" style="font-weight:700;min-width:36px;text-align:center">EN</button>
      <button class="btn btn-outline btn-sm" id="refresh-all-btn">Refresh All</button>
      <button class="btn btn-danger btn-sm" id="logout-btn">Sign Out</button>
    </div>
  </div>

  <!-- Notice -->
  <div class="notice" id="notice"></div>

  <!-- Status Bar -->
  <div class="status-bar" id="status-bar"></div>

  <!-- Row 1: Login + Complete Login -->
  <div class="grid grid-23" style="margin-bottom:16px">

    <!-- Start Login -->
    <div class="card">
      <div class="card-title" id="t-start-login">Start Login</div>
      <div class="card-desc" id="t-start-login-desc">Initiate a Google OAuth flow for a new credential.</div>
      <div class="stack">
        <div class="field">
          <span class="label" id="t-cred-label">Credential Label</span>
          <input id="login-label" class="input" placeholder="e.g. Main Google Account"/>
        </div>
        <div class="row">
          <button class="btn btn-primary" id="start-login-btn">Start Login</button>
          <button class="btn btn-ghost" id="open-auth-btn" disabled>Open Auth URL</button>
        </div>
        <div class="field">
          <span class="label" id="t-auth-url">Auth URL</span>
          <textarea id="auth-url" class="textarea" readonly placeholder="Auth URL will appear here after starting login..."></textarea>
        </div>
        <div class="field">
          <span class="label" id="t-redirect-uri">Redirect URI</span>
          <input id="redirect-uri" class="input" readonly placeholder="Redirect URI..."/>
        </div>
      </div>
    </div>

    <!-- Complete Login -->
    <div class="card">
      <div class="card-title" id="t-complete-login">Complete Login</div>
      <div class="card-desc" id="t-complete-login-desc">After Google authorization finishes, copy the one-time authorization code shown by Google and paste it here.</div>
      <div class="stack">
        <div class="field">
          <span class="label" id="t-callback-url">Authorization Code</span>
          <textarea id="callback-url" class="textarea" placeholder="Paste the one-time authorization code shown by Google"></textarea>
        </div>
        <div class="row">
          <button class="btn btn-primary" id="complete-login-btn">Complete Login</button>
          <button class="btn btn-outline" id="check-status-btn">Check Status</button>
        </div>
        <div id="login-meta" style="color:var(--text3);font-size:13px"></div>
        <div id="login-output" class="code-block" style="display:none"></div>
      </div>
    </div>
  </div>

  <!-- Row 2: Credentials -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <div>
        <div class="card-title" id="t-credentials">Credentials</div>
        <div style="color:var(--text3);font-size:13px" id="t-cred-desc">Manage your OAuth credentials. Switch active credential, view quota, or delete.</div>
      </div>
      <div class="row">
        <button class="btn btn-outline btn-sm" id="refresh-creds-btn">Refresh</button>
        <button class="btn btn-danger btn-sm" id="delete-all-btn">Delete All</button>
      </div>
    </div>
    <div id="cred-list" class="cred-grid"></div>
  </div>

  <!-- Row 3: Quotas + Model + Quota Detail -->
  <div class="grid grid-32" style="margin-bottom:16px">

    <!-- Quota Overview -->
    <div class="card">
      <div class="card-header">
        <div class="card-title" id="t-quota-overview">Quota Overview</div>
        <button class="btn btn-outline btn-sm" id="refresh-quotas-btn">Refresh</button>
      </div>
      <div id="quota-list"></div>
    </div>

    <!-- Right column: Model + Quota Detail -->
    <div class="stack">
      <!-- Model -->
      <div class="card">
        <div class="card-title" id="t-default-model">Default Model</div>
        <div class="card-desc" id="t-default-model-desc">Used when chat requests don't specify a model.</div>
        <div class="field">
          <select id="model-select" class="select"></select>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn btn-primary btn-sm" id="save-model-btn">Save</button>
          <span id="model-meta" style="color:var(--text3);font-size:12px"></span>
        </div>
      </div>

      <!-- Quota Detail -->
      <div class="card" style="flex:1">
        <div class="card-title" id="t-quota-detail">Quota Detail</div>
        <div class="card-desc" id="t-quota-detail-desc">Click "View Quota" on a credential to see its raw quota data.</div>
        <div id="quota-detail-meta" style="color:var(--text3);font-size:12px;margin-bottom:8px"></div>
        <div id="quota-detail" class="code-block" style="min-height:100px"></div>
      </div>
    </div>
  </div>

  <!-- Row 4: Token Management + Request Settings -->
  <div class="grid grid-2" style="margin-bottom:16px">
    <!-- Token Management -->
    <div class="card">
      <div class="card-title" id="t-token-mgmt">Token Management</div>
      <div class="card-desc" id="t-token-mgmt-desc">Token is used for both Web login and API Authorization header.</div>
      <div class="field">
        <label class="label" id="t-new-token-label">New Token</label>
        <input type="text" id="new-token-input" class="input" placeholder="Enter new token..."/>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn btn-primary btn-sm" id="change-token-btn">Change Token</button>
        <span id="token-meta" style="color:var(--text3);font-size:12px"></span>
      </div>
      <label class="toggle-row" style="margin-top:14px">
        <input type="checkbox" id="open-api-toggle"/>
        <span id="t-open-api-label">Disable API Auth</span>
        <span class="toggle-hint" id="t-open-api-hint">Allow API requests without token (Web login still required)</span>
      </label>
      <div class="row" style="margin-top:8px">
        <button class="btn btn-outline btn-sm" id="save-open-api-btn" style="font-size:12px" id2="t-save-open-api">Save</button>
        <span id="open-api-meta" style="color:var(--text3);font-size:12px"></span>
      </div>
    </div>

    <!-- Request Settings -->
    <div class="card">
      <div class="card-title" id="t-req-settings">Request Settings</div>
      <div class="card-desc" id="t-req-settings-desc">Configure credential rotation and error retry behavior.</div>
      <div class="stack" style="gap:12px">
        <label class="toggle-row">
          <input type="checkbox" id="rotation-toggle"/>
          <span id="t-rotation-label">Credential Rotation</span>
          <span class="toggle-hint" id="t-rotation-hint">Round-robin across all credentials per request</span>
        </label>
        <label class="toggle-row">
          <input type="checkbox" id="retry-toggle"/>
          <span id="t-retry-label">Auto Retry on Error</span>
          <span class="toggle-hint" id="t-retry-hint">Automatically retry failed requests</span>
        </label>
        <div class="field" id="retry-count-row" style="display:none">
          <span class="label" id="t-retry-count-label">Retry Count</span>
          <select id="retry-count-select" class="select" style="width:80px">
            <option value="1">1</option><option value="2">2</option><option value="3" selected>3</option>
            <option value="4">4</option><option value="5">5</option>
          </select>
        </div>
        <div style="border-top:1px solid var(--border);margin:4px 0 8px;padding-top:8px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px" id="t-cli-init-title">CLI Initialization (disabling speeds up cold start)</div>
          <label class="toggle-row">
            <input type="checkbox" id="mcp-toggle"/>
            <span id="t-mcp-label">MCP Servers</span>
            <span class="toggle-hint" id="t-mcp-hint">Start MCP servers in CLI subprocess</span>
          </label>
          <label class="toggle-row">
            <input type="checkbox" id="extensions-toggle"/>
            <span id="t-extensions-label">Extensions</span>
            <span class="toggle-hint" id="t-extensions-hint">Load extensions in CLI subprocess</span>
          </label>
          <label class="toggle-row">
            <input type="checkbox" id="skills-toggle"/>
            <span id="t-skills-label">Skills</span>
            <span class="toggle-hint" id="t-skills-hint">Enable skill discovery in CLI subprocess</span>
          </label>
        </div>
        <div class="field">
          <span class="label" id="t-proxy-label">Proxy</span>
          <div class="row" style="gap:8px;align-items:center">
            <input type="text" id="proxy-input" class="input" style="width:260px" placeholder="http://127.0.0.1:7890" value=""/>
            <span class="toggle-hint" id="t-proxy-hint" style="margin-left:0">Leave empty to disable</span>
          </div>
        </div>
        <div class="field">
          <span class="label" id="t-timeout-label">Timeout (seconds)</span>
          <div class="row" style="gap:8px;align-items:center">
            <input type="number" id="timeout-input" class="input" style="width:100px" min="0" step="10" value="0"/>
            <span class="toggle-hint" id="t-timeout-hint" style="margin-left:0">0 = use default</span>
          </div>
        </div>
        <div style="border-top:1px solid var(--border);margin:4px 0 8px;padding-top:8px">
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px" id="t-worker-title">Worker Process Settings</div>
          <div class="field">
            <span class="label" id="t-max-workers-label">Max Workers</span>
            <div class="row" style="gap:8px;align-items:center">
              <input type="number" id="max-workers-input" class="input" style="width:100px" min="0" step="1" value="0"/>
              <span class="toggle-hint" id="t-max-workers-hint" style="margin-left:0">0 = unlimited</span>
            </div>
          </div>
          <div class="field">
            <span class="label" id="t-failover-workers-label">Failover Workers</span>
            <div class="row" style="gap:8px;align-items:center">
              <input type="number" id="failover-workers-input" class="input" style="width:100px" min="0" step="1" value="0"/>
              <span class="toggle-hint" id="t-failover-workers-hint" style="margin-left:0">Standby workers for instant credential failover</span>
            </div>
          </div>
          <div class="field">
            <span class="label" id="t-acp-idle-label">Idle Timeout (seconds)</span>
            <div class="row" style="gap:8px;align-items:center">
              <input type="number" id="acp-idle-input" class="input" style="width:100px" min="0" step="30" value="0"/>
              <span class="toggle-hint" id="t-acp-idle-hint" style="margin-left:0">0 = never timeout</span>
            </div>
          </div>
          <div class="field">
            <span class="label" id="t-acp-keepalive-label">Keepalive Interval (seconds)</span>
            <div class="row" style="gap:8px;align-items:center">
              <input type="number" id="acp-keepalive-input" class="input" style="width:100px" min="0" step="30" value="540"/>
              <span class="toggle-hint" id="t-acp-keepalive-hint" style="margin-left:0">0 = disabled — first request after long idle pays cold-start cost</span>
            </div>
          </div>
        </div>
        <div class="row">
          <button class="btn btn-primary btn-sm" id="save-settings-btn">Save</button>
          <span id="settings-meta" style="color:var(--text3);font-size:12px"></span>
        </div>
      </div>
    </div>

    <!-- ACP Sessions -->
    <div class="card" id="acp-sessions-card">
      <div class="card-title">
        <span class="acp-live-dot off" id="acp-live-dot" title="Auto-refresh"></span>
        <span id="t-acp-sessions">ACP Sessions</span>
      </div>
      <div class="card-desc" id="t-acp-sessions-desc">Manage active ACP sessions and worker processes.</div>
      <div id="acp-sessions-list" style="font-size:13px;color:var(--text2)"></div>
      <div class="acp-toolbar">
        <button class="btn btn-outline btn-sm" id="refresh-acp-btn" id2="t-refresh-acp">Refresh</button>
        <label class="row" style="gap:6px;align-items:center;font-size:12px;color:var(--text3);cursor:pointer">
          <input type="checkbox" id="acp-auto-refresh-toggle" checked style="margin:0"/>
          <span id="t-acp-auto-refresh">Auto-refresh</span>
        </label>
        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" id="kill-all-acp-btn" id2="t-kill-all-acp">Kill All Workers</button>
        <span class="acp-status-text" id="acp-status-text"></span>
      </div>
    </div>
  </div>

  <!-- Row 5: API Docs -->
  <div class="card">
    <div class="card-title" id="t-api-endpoints">API Endpoints</div>
    <div class="card-desc" id="t-api-desc">All endpoints require <code style="color:var(--accent)">Authorization: Bearer &lt;token&gt;</code> header.</div>
    <div id="ep-list"></div>
  </div>

  <!-- Row 6: Logs Panel (collapsible) -->
  <details class="card logs-card" id="logs-card" style="margin-top:16px">
    <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px">
      <span class="card-title" style="margin:0" id="t-logs">Logs</span>
      <span class="logs-stream-dot off" id="logs-stream-dot" title="Live stream"></span>
      <span class="spacer" style="flex:1"></span>
      <span style="font-size:12px;color:var(--text3)" id="t-logs-toggle">Click to expand</span>
    </summary>
    <div class="card-desc" id="t-logs-desc" style="margin-top:8px">Recent server logs (in-memory ring buffer). Secrets are redacted before being shown here.</div>
    <div class="logs-toolbar">
      <select id="logs-level">
        <option value="info" id="logs-level-info">Info+</option>
        <option value="warn" id="logs-level-warn">Warn+</option>
        <option value="error" id="logs-level-error">Error only</option>
        <option value="debug" id="logs-level-debug">All (debug)</option>
      </select>
      <input id="logs-search" class="search" type="search" placeholder="Filter..."/>
      <button class="btn btn-outline btn-sm" id="logs-pause-btn">Pause</button>
      <button class="btn btn-outline btn-sm" id="logs-clear-btn">Clear</button>
      <span class="counter" id="logs-counter">0</span>
    </div>
    <div class="logs-body" id="logs-body"></div>
  </details>

  <div class="footer">
    <div id="footer-license-1"><strong>License:</strong> Upstream Gemini CLI code remains Apache-2.0.</div>
    <div id="footer-license-2">gemini-api2cli-specific files in this fork are marked under CNC-1.0. See LICENSING.md for the current scope.</div>
  </div>

</div>

<script>
const TOKEN_KEY = 'gemini_prompt_api_token';
const LANG_KEY = 'gemini_prompt_api_lang';
const LOGIN_ID_KEY = 'gemini_prompt_api_login_id';
const S = {
  token: localStorage.getItem(TOKEN_KEY) || '',
  lang: localStorage.getItem(LANG_KEY) || (navigator.language.startsWith('zh') ? 'zh' : 'en'),
  loginId: sessionStorage.getItem(LOGIN_ID_KEY),
  credentials: [],
  lastHealth: null,
  lastModels: null,
  lastCreds: null,
  lastQuotas: null,
  lastSettings: null,
};

const $ = id => document.getElementById(id);

/* ── i18n ── */
const I = {
  en: {
    authSubtitle: 'Prompt API Management Console',
    authPlaceholder: 'Enter access token',
    authSignIn: 'Sign In',
    authSigningIn: 'Signing in...',
    authEmpty: 'Please enter a token.',
    authInvalid: 'Invalid token.',
    authConnErr: 'Connection error: ',
    refreshAll: 'Refresh All',
    signOut: 'Sign Out',
    startLogin: 'Start Login',
    startLoginDesc: 'Initiate a Google OAuth flow for a new credential.',
    credLabel: 'Credential Label',
    credLabelPh: 'e.g. Main Google Account',
    openAuthUrl: 'Open Auth URL',
    authUrl: 'Auth URL',
    authUrlPh: 'Auth URL will appear here after starting login...',
    redirectUri: 'Redirect URI',
    redirectUriPh: 'Redirect URI...',
    completeLogin: 'Complete Login',
    completeLoginDesc: 'After Google authorization finishes, copy the one-time authorization code shown by Google and paste it here.',
    callbackUrl: 'Authorization Code',
    callbackUrlPh: 'Paste the one-time authorization code shown by Google',
    checkStatus: 'Check Status',
    credentials: 'Credentials',
    credDesc: 'Manage your OAuth credentials. Switch active credential, view quota, or delete.',
    refresh: 'Refresh',
    deleteAll: 'Delete All',
    quotaOverview: 'Quota Overview',
    defaultModel: 'Default Model',
    defaultModelDesc: "Used when chat requests don't specify a model.",
    save: 'Save',
    quotaDetail: 'Quota Detail',
    quotaDetailDesc: 'Click "View Quota" on a credential to see its raw quota data.',
    apiEndpoints: 'API Endpoints',
    apiEndpointsDesc: 'All endpoints require <code style="color:var(--accent)">Authorization: Bearer &lt;token&gt;</code> header.',
    noCreds: 'No credentials yet. Start a login flow to create one.',
    noQuota: 'No quota data. Add credentials first.',
    active: 'Active',
    stored: 'Stored',
    setActive: 'Set Active',
    viewQuota: 'View Quota',
    delete: 'Delete',
    notLoggedIn: 'Not logged in',
    loginStarted: 'Login started. Credential: ',
    loginCompleted: 'Login completed successfully.',
    startFirst: 'Start a login flow first.',
    noLoginFlow: 'No active login flow.',
    saved: 'Saved: ',
    confirmDeleteAll: 'Delete ALL managed credentials? This cannot be undone.',
    confirmDelete: 'Delete credential?\\n',
    loadingQuota: 'Loading quota for ',
    credentialColon: 'Credential: ',
    sessionExpired: 'Session expired.',
    health: 'Health', cli: 'CLI', context: 'Context', model: 'Model', credential: 'Credential', acp: 'ACP',
    ok: 'OK', error: 'Error', built: 'Built', notBuilt: 'Not Built', isolated: 'Isolated', unknown: 'Unknown', none: 'None', on: 'On', off: 'Off',
    remaining: 'Remaining', numeric: 'Numeric', plan: 'Plan', credits: 'Credits', reset: 'Reset', models: 'Models',
    modelQuotas: 'Per-Model Quotas', modelQuotasEmpty: 'No per-model data.',
    statusOk: 'OK', statusNotLoggedIn: 'Not Logged In', statusError: 'Error',
    tokenMgmt: 'Token Management',
    tokenMgmtDesc: 'Token applies to both Web console login and API request Authorization header.',
    openApiLabel: 'Disable API Auth',
    openApiHint: 'Allow API requests without token (Web login still required)',
    openApiSaved: 'Saved.',
    newTokenLabel: 'New Token',
    newTokenPh: 'Enter new token...',
    changeToken: 'Change Token',
    tokenChanged: 'Token changed. Please re-login with the new token.',
    tokenEmpty: 'Please enter a token.',
    testSuccess: 'OK — Request succeeded.',
    testing: 'Testing...',
    msgTesting: 'Sending message...',
    startingLogin: 'Starting...',
    completingLogin: 'Completing...',
    testCredBtn: 'Available?',
    testCredTip: 'Auth check — verify OAuth token & projectId are valid (cheap, no quota cost).',
    msgTestBtn: 'Message Test',
    msgTestTip: 'Send a real "hi" message via gemini-2.5-flash to verify the credential can actually generate (catches per-model quota exhaustion).',
    credCooldownAuth: 'Auth failed — re-login needed',
    credCooldownAuthHint: 'This credential returned 400/401/403. The OAuth token is likely expired or revoked. Delete and re-add this credential, or wait until the cooldown ends to retry.',
    credCooldownQuotaHint: 'Quota cooldown until the timestamp Google reported. This model on this credential is paused; other models on the same credential keep working.',
    reqSettings: 'Request Settings',
    reqSettingsDesc: 'Configure credential rotation and error retry behavior.',
    rotationLabel: 'Credential Rotation',
    rotationHint: 'Round-robin across all credentials per request',
    retryLabel: 'Auto Retry on Error',
    retryHint: 'Automatically retry failed requests',
    retryCountLabel: 'Retry Count',
    timeoutLabel: 'Timeout (seconds)',
    timeoutHint: '0 = use default',
    settingsSaved: 'Settings saved.',
    cliInitTitle: 'CLI Initialization (disabling speeds up cold start)',
    mcpLabel: 'MCP Servers',
    mcpHint: 'Start MCP servers in CLI subprocess',
    extensionsLabel: 'Extensions',
    extensionsHint: 'Load extensions in CLI subprocess',
    skillsLabel: 'Skills',
    skillsHint: 'Enable skill discovery in CLI subprocess',
    proxyLabel: 'Proxy',
    proxyHint: 'Leave empty to disable',
    proxyPlaceholder: 'http://127.0.0.1:7890',
    workerTitle: 'Worker Process Settings',
    maxWorkersLabel: 'Max Workers',
    maxWorkersHint: '0 = unlimited',
    failoverWorkersLabel: 'Failover Workers',
    failoverWorkersHint: 'Standby workers for instant credential failover',
    acpIdleLabel: 'Worker Idle Timeout (seconds)',
    acpIdleHint: '0 = never timeout',
    acpKeepaliveLabel: 'Keepalive Interval (seconds)',
    acpKeepaliveHint: '0 = disabled. Periodically refreshes OAuth + warms the gRPC channel so first request after a long lull is fast. Recommended 540 (9 min).',
    acpSessions: 'ACP Sessions',
    acpSessionsDesc: 'Manage active ACP sessions and worker processes.',
    acpNoWorkers: 'No active workers.',
    acpRefresh: 'Refresh',
    acpKillAll: 'Kill All Workers',
    acpWorker: 'Worker',
    acpSessions2: 'sessions',
    acpKillWorker: 'Kill',
    acpAutoRefresh: 'Auto-refresh',
    acpLastUpdated: 'Updated',
    acpRecentPrompts: 'Recent prompt turns',
    acpQuotaSection: 'Credential quota',
    acpNoRecentPrompts: 'No prompts on this worker yet.',
    acpPromptUser: 'In',
    acpPromptAgent: 'Out',
    acpPromptStatusInProgress: 'streaming',
    acpPromptStatusCompleted: 'done',
    acpPromptStatusError: 'error',
    acpPromptStatusCancelled: 'cancelled',
    acpPromptDuration: 'duration',
    acpPromptCharsTruncated: 'truncated',
    acpQuotaLoading: 'Loading quota...',
    acpQuotaError: 'Quota unavailable.',
    acpRecentLoading: 'Loading recent prompts...',
    acpRecentError: 'Failed to load recent prompts.',
    acpAgo: ' ago',
    epGeminiGen: 'Gemini native non-streaming. Request/response in Gemini API format.',
    epGeminiStream: 'Gemini native streaming (SSE). Request in Gemini API format.',
    epOpenai: 'OpenAI-compatible chat completions. Set "stream":true for SSE streaming.',
    epModels: 'List available models and aliases.',
    epModelsCur: 'Get current default model.',
    epModelsSet: 'Set default model. Body: {"model":"..."}',
    epCreds: 'List all managed credentials.',
    epCredsCur: 'Get current active credential.',
    epCredsSet: 'Set active credential. Body: {"credentialId":"..."}',
    epCredsDel: 'Delete all credentials.',
    epCredDel: 'Delete a specific credential.',
    epLogin: 'Start OAuth login flow.',
    epLoginStatus: 'Check login status.',
    epLoginComplete: 'Complete OAuth with callback URL.',
    epQuotas: 'Get quotas for all credentials.',
    epQuota: 'Get quota for a specific credential.',
    epHealth: 'Health check.',
    logs: 'Logs',
    logsToggleCollapsed: 'Click to expand',
    logsToggleExpanded: 'Click to collapse',
    logsDesc: 'Recent server logs (in-memory ring buffer). Secrets are redacted before being shown here.',
    logsLevelInfo: 'Info+',
    logsLevelWarn: 'Warn+',
    logsLevelError: 'Error only',
    logsLevelDebug: 'All (debug)',
    logsSearchPh: 'Filter...',
    logsPause: 'Pause',
    logsResume: 'Resume',
    logsClear: 'Clear',
    logsEmpty: 'No logs yet.',
    logsStreamOn: 'Live',
    logsStreamOff: 'Disconnected',
    logsCounter: 'showing',
    footerLicense1: '<strong>License:</strong> Upstream Gemini CLI code remains Apache-2.0.',
    footerLicense2: 'gemini-api2cli-specific files in this fork are marked under CNC-1.0. See LICENSING.md for the current scope.',
  },
  zh: {
    authSubtitle: 'Prompt API 管理控制台',
    authPlaceholder: '请输入访问令牌',
    authSignIn: '登录',
    authSigningIn: '登录中...',
    authEmpty: '请输入令牌。',
    authInvalid: '令牌无效。',
    authConnErr: '连接错误：',
    refreshAll: '刷新全部',
    signOut: '退出登录',
    startLogin: '开始登录',
    startLoginDesc: '为新凭据发起一次 Google OAuth 登录流程。',
    credLabel: '凭据名称',
    credLabelPh: '例如：主 Google 账号',
    openAuthUrl: '打开授权链接',
    authUrl: '授权链接',
    authUrlPh: '开始登录后，授权链接会显示在这里...',
    redirectUri: '回调地址',
    redirectUriPh: '回调地址...',
    completeLogin: '完成登录',
    completeLoginDesc: 'Google 授权完成后，会显示一次性授权码。请把该授权码复制到这里提交。即使 /manage 是在另一台设备上打开也可以使用。',
    callbackUrl: '授权码',
    callbackUrlPh: '粘贴 Google 显示的一次性授权码',
    checkStatus: '查看状态',
    credentials: '凭据管理',
    credDesc: '管理 OAuth 凭据。可切换当前凭据、查看额度或删除。',
    refresh: '刷新',
    deleteAll: '删除全部',
    quotaOverview: '额度总览',
    defaultModel: '默认模型',
    defaultModelDesc: '聊天请求未指定模型时使用此默认模型。',
    save: '保存',
    quotaDetail: '额度详情',
    quotaDetailDesc: '点击凭据上的"查看额度"按钮可在此查看原始额度数据。',
    apiEndpoints: 'API 接口文档',
    apiEndpointsDesc: '所有接口需要 <code style="color:var(--accent)">Authorization: Bearer &lt;token&gt;</code> 请求头。',
    noCreds: '暂无凭据。请先发起登录流程。',
    noQuota: '暂无额度数据。请先添加凭据。',
    active: '当前使用',
    stored: '已存储',
    setActive: '设为当前',
    viewQuota: '查看额度',
    delete: '删除',
    notLoggedIn: '未登录',
    loginStarted: '登录已发起，凭据 ID：',
    loginCompleted: '登录已完成。',
    startFirst: '请先发起一次登录流程。',
    noLoginFlow: '当前没有进行中的登录流程。',
    saved: '已保存：',
    confirmDeleteAll: '确定删除全部凭据吗？此操作不可撤销。',
    confirmDelete: '确定删除此凭据吗？\\n',
    loadingQuota: '正在加载额度：',
    credentialColon: '凭据：',
    sessionExpired: '会话已过期。',
    health: '健康状态', cli: 'CLI', context: '上下文', model: '模型', credential: '凭据', acp: 'ACP',
    ok: '正常', error: '异常', built: '已构建', notBuilt: '未构建', isolated: '隔离', unknown: '未知', none: '无', on: '已启用', off: '已关闭',
    remaining: '剩余比例', numeric: '数值额度', plan: '套餐', credits: '积分', reset: '重置时间', models: '模型数',
    modelQuotas: '各模型配额', modelQuotasEmpty: '暂无各模型数据。',
    statusOk: '正常', statusNotLoggedIn: '未登录', statusError: '错误',
    tokenMgmt: '密钥管理',
    tokenMgmtDesc: '密钥同时用于 Web 管理页面登录和 API 请求的 Authorization 请求头鉴权。',
    openApiLabel: '放开 API 鉴权',
    openApiHint: '允许 API 请求不带密钥（Web 登录仍需密钥）',
    openApiSaved: '已保存。',
    newTokenLabel: '新密钥',
    newTokenPh: '输入新密钥...',
    changeToken: '更改密钥',
    tokenChanged: '密钥已更改，请使用新密钥重新登录。',
    tokenEmpty: '请输入密钥。',
    testSuccess: '正常 — 请求成功。',
    testing: '测试中...',
    msgTesting: '发送消息中...',
    startingLogin: '发起中...',
    completingLogin: '完成中...',
    testCredBtn: '凭证可用',
    testCredTip: '认证检查 — 验证 OAuth Token 和 projectId 是否有效（轻量级，不消耗配额）。',
    msgTestBtn: '消息测试',
    msgTestTip: '通过 gemini-2.5-flash 发送一条真实的 "hi" 消息，验证凭证能否真正生成内容（可发现单模型配额耗尽问题）。',
    credCooldownAuth: '认证失败，需要重新登录',
    credCooldownAuthHint: '此凭据返回了 400/401/403，OAuth token 已过期或被吊销。请删除并重新添加此凭据，或等到冷却期结束再重试。',
    credCooldownQuotaHint: '配额冷却中，将在 Google 提供的重置时间后自动恢复。此凭据的这个模型暂停可用，同凭据的其他模型仍然正常。',
    reqSettings: '请求设置',
    reqSettingsDesc: '配置凭据轮询和错误重试行为。',
    rotationLabel: '凭据轮询',
    rotationHint: '每次请求轮流使用不同凭据',
    retryLabel: '错误自动重试',
    retryHint: '请求失败时自动重试',
    retryCountLabel: '重试次数',
    timeoutLabel: '超时时间（秒）',
    timeoutHint: '0 = 使用默认值',
    settingsSaved: '设置已保存。',
    cliInitTitle: 'CLI 初始化项（关闭可加快冷启动速度）',
    mcpLabel: 'MCP 服务器',
    mcpHint: '在 CLI 子进程中启动 MCP 服务器',
    extensionsLabel: '扩展',
    extensionsHint: '在 CLI 子进程中加载扩展',
    skillsLabel: '技能',
    skillsHint: '在 CLI 子进程中启用技能发现',
    proxyLabel: '代理',
    proxyHint: '留空则不使用代理',
    proxyPlaceholder: 'http://127.0.0.1:7890',
    workerTitle: '工作进程设置',
    maxWorkersLabel: '最大进程数',
    maxWorkersHint: '0 = 不限制',
    failoverWorkersLabel: '故障转移进程',
    failoverWorkersHint: '预热的备用进程，故障转移时即时切换',
    acpIdleLabel: '进程空闲超时（秒）',
    acpIdleHint: '0 = 不超时',
    acpKeepaliveLabel: '保活间隔（秒）',
    acpKeepaliveHint: '0 = 关闭。定期刷新 OAuth 并保持 gRPC 长连接，避免长时间不用后第一次请求很慢。推荐 540（9 分钟）。',
    acpSessions: 'ACP 会话',
    acpSessionsDesc: '管理活跃的 ACP 会话和工作进程。',
    acpNoWorkers: '无活跃的工作进程。',
    acpRefresh: '刷新',
    acpKillAll: '终止所有进程',
    acpWorker: '进程',
    acpSessions2: '个会话',
    acpKillWorker: '终止',
    acpAutoRefresh: '自动刷新',
    acpLastUpdated: '更新于',
    acpRecentPrompts: '最近的对话轮次',
    acpQuotaSection: '凭据额度',
    acpNoRecentPrompts: '此进程暂无对话记录。',
    acpPromptUser: '输入',
    acpPromptAgent: '输出',
    acpPromptStatusInProgress: '进行中',
    acpPromptStatusCompleted: '完成',
    acpPromptStatusError: '错误',
    acpPromptStatusCancelled: '已取消',
    acpPromptDuration: '耗时',
    acpPromptCharsTruncated: '已截断',
    acpQuotaLoading: '加载额度中...',
    acpQuotaError: '无法加载额度。',
    acpRecentLoading: '加载最近对话中...',
    acpRecentError: '无法加载最近对话。',
    acpAgo: '前',
    epGeminiGen: 'Gemini 原生非流式接口，请求/响应均为 Gemini API 格式。',
    epGeminiStream: 'Gemini 原生流式接口 (SSE)，请求为 Gemini API 格式。',
    epOpenai: 'OpenAI 兼容聊天补全接口，设置 "stream":true 开启 SSE 流式。',
    epModels: '列出可用模型和别名。',
    epModelsCur: '获取当前默认模型。',
    epModelsSet: '设置默认模型。Body: {"model":"..."}',
    epCreds: '列出所有托管凭据。',
    epCredsCur: '获取当前活跃凭据。',
    epCredsSet: '设置活跃凭据。Body: {"credentialId":"..."}',
    epCredsDel: '删除所有凭据。',
    epCredDel: '删除指定凭据。',
    epLogin: '发起 OAuth 登录流程。',
    epLoginStatus: '查看登录状态。',
    epLoginComplete: '用回调 URL 完成 OAuth 登录。',
    epQuotas: '获取所有凭据的额度。',
    epQuota: '获取指定凭据的额度。',
    epHealth: '健康检查。',
    logs: '日志',
    logsToggleCollapsed: '点击展开',
    logsToggleExpanded: '点击收起',
    logsDesc: '最近的服务端日志（内存环形缓冲）。展示前已自动脱敏。',
    logsLevelInfo: 'Info 以上',
    logsLevelWarn: 'Warn 以上',
    logsLevelError: '仅错误',
    logsLevelDebug: '全部（含 debug）',
    logsSearchPh: '按关键字过滤...',
    logsPause: '暂停',
    logsResume: '继续',
    logsClear: '清空',
    logsEmpty: '暂无日志。',
    logsStreamOn: '实时',
    logsStreamOff: '未连接',
    logsCounter: '条',
    footerLicense1: '<strong>许可说明：</strong>上游 Gemini CLI 代码仍然保持 Apache-2.0。',
    footerLicense2: '这个 fork 中新增的 gemini-api2cli 特定文件标记为 CNC-1.0。当前适用范围请查看 LICENSING.md。',
  },
};

function t(key) { return (I[S.lang] || I.en)[key] || I.en[key] || key; }

/* ── Apply language to all static elements ── */
function applyLang() {
  document.documentElement.lang = S.lang === 'zh' ? 'zh-CN' : 'en';
  $('lang-btn').textContent = S.lang === 'zh' ? '中文' : 'EN';
  // Auth screen
  $('auth-subtitle').textContent = t('authSubtitle');
  $('token-input').placeholder = t('authPlaceholder');
  if (!$('auth-submit').disabled) $('auth-submit').textContent = t('authSignIn');
  // Header
  $('refresh-all-btn').textContent = t('refreshAll');
  $('logout-btn').textContent = t('signOut');
  // Start Login
  $('t-start-login').textContent = t('startLogin');
  $('t-start-login-desc').textContent = t('startLoginDesc');
  $('t-cred-label').textContent = t('credLabel');
  $('login-label').placeholder = t('credLabelPh');
  $('start-login-btn').textContent = t('startLogin');
  $('open-auth-btn').textContent = t('openAuthUrl');
  $('t-auth-url').textContent = t('authUrl');
  $('auth-url').placeholder = t('authUrlPh');
  $('t-redirect-uri').textContent = t('redirectUri');
  $('redirect-uri').placeholder = t('redirectUriPh');
  // Complete Login
  $('t-complete-login').textContent = t('completeLogin');
  $('t-complete-login-desc').textContent = t('completeLoginDesc');
  $('t-callback-url').textContent = t('callbackUrl');
  $('callback-url').placeholder = t('callbackUrlPh');
  $('complete-login-btn').textContent = t('completeLogin');
  $('check-status-btn').textContent = t('checkStatus');
  // Credentials
  $('t-credentials').textContent = t('credentials');
  $('t-cred-desc').textContent = t('credDesc');
  $('refresh-creds-btn').textContent = t('refresh');
  $('delete-all-btn').textContent = t('deleteAll');
  // Quota
  $('t-quota-overview').textContent = t('quotaOverview');
  $('refresh-quotas-btn').textContent = t('refresh');
  // Model
  $('t-default-model').textContent = t('defaultModel');
  $('t-default-model-desc').textContent = t('defaultModelDesc');
  $('save-model-btn').textContent = t('save');
  // Quota Detail
  $('t-quota-detail').textContent = t('quotaDetail');
  $('t-quota-detail-desc').textContent = t('quotaDetailDesc');
  // Token Management
  $('t-token-mgmt').textContent = t('tokenMgmt');
  $('t-token-mgmt-desc').textContent = t('tokenMgmtDesc');
  $('t-new-token-label').textContent = t('newTokenLabel');
  $('new-token-input').placeholder = t('newTokenPh');
  $('change-token-btn').textContent = t('changeToken');
  $('t-open-api-label').textContent = t('openApiLabel');
  $('t-open-api-hint').textContent = t('openApiHint');
  $('save-open-api-btn').textContent = t('save');
  // Request Settings
  $('t-req-settings').textContent = t('reqSettings');
  $('t-req-settings-desc').textContent = t('reqSettingsDesc');
  $('t-rotation-label').textContent = t('rotationLabel');
  $('t-rotation-hint').textContent = t('rotationHint');
  $('t-retry-label').textContent = t('retryLabel');
  $('t-retry-hint').textContent = t('retryHint');
  $('t-retry-count-label').textContent = t('retryCountLabel');
  $('t-cli-init-title').textContent = t('cliInitTitle');
  $('t-mcp-label').textContent = t('mcpLabel');
  $('t-mcp-hint').textContent = t('mcpHint');
  $('t-extensions-label').textContent = t('extensionsLabel');
  $('t-extensions-hint').textContent = t('extensionsHint');
  $('t-skills-label').textContent = t('skillsLabel');
  $('t-skills-hint').textContent = t('skillsHint');
  $('t-proxy-label').textContent = t('proxyLabel');
  $('t-proxy-hint').textContent = t('proxyHint');
  $('proxy-input').placeholder = t('proxyPlaceholder');
  $('t-timeout-label').textContent = t('timeoutLabel');
  $('t-timeout-hint').textContent = t('timeoutHint');
  $('t-worker-title').textContent = t('workerTitle');
  $('t-max-workers-label').textContent = t('maxWorkersLabel');
  $('t-max-workers-hint').textContent = t('maxWorkersHint');
  $('t-failover-workers-label').textContent = t('failoverWorkersLabel');
  $('t-failover-workers-hint').textContent = t('failoverWorkersHint');
  $('t-acp-idle-label').textContent = t('acpIdleLabel');
  $('t-acp-idle-hint').textContent = t('acpIdleHint');
  const acpKeepaliveLabelEl = $('t-acp-keepalive-label');
  if (acpKeepaliveLabelEl) acpKeepaliveLabelEl.textContent = t('acpKeepaliveLabel');
  const acpKeepaliveHintEl = $('t-acp-keepalive-hint');
  if (acpKeepaliveHintEl) acpKeepaliveHintEl.textContent = t('acpKeepaliveHint');
  $('t-acp-sessions').textContent = t('acpSessions');
  $('t-acp-sessions-desc').textContent = t('acpSessionsDesc');
  $('refresh-acp-btn').textContent = t('acpRefresh');
  $('kill-all-acp-btn').textContent = t('acpKillAll');
  const acpAutoRefreshEl = $('t-acp-auto-refresh');
  if (acpAutoRefreshEl) acpAutoRefreshEl.textContent = t('acpAutoRefresh');
  $('save-settings-btn').textContent = t('save');
  // API
  $('t-api-endpoints').textContent = t('apiEndpoints');
  $('t-api-desc').innerHTML = t('apiEndpointsDesc');
  // Logs
  $('t-logs').textContent = t('logs');
  $('t-logs-desc').textContent = t('logsDesc');
  $('t-logs-toggle').textContent = $('logs-card').open ? t('logsToggleExpanded') : t('logsToggleCollapsed');
  $('logs-level-info').textContent = t('logsLevelInfo');
  $('logs-level-warn').textContent = t('logsLevelWarn');
  $('logs-level-error').textContent = t('logsLevelError');
  $('logs-level-debug').textContent = t('logsLevelDebug');
  $('logs-search').placeholder = t('logsSearchPh');
  $('logs-pause-btn').textContent = Logs.paused ? t('logsResume') : t('logsPause');
  $('logs-clear-btn').textContent = t('logsClear');
  $('logs-stream-dot').title = Logs.streaming ? t('logsStreamOn') : t('logsStreamOff');
  if (Logs.entries.length === 0 && $('logs-body').children.length === 0) {
    $('logs-body').innerHTML = '<div class="logs-empty">'+esc(t('logsEmpty'))+'</div>';
  }
  updateLogsCounter();
  // Footer
  $('footer-license-1').innerHTML = t('footerLicense1');
  $('footer-license-2').textContent = t('footerLicense2');
  // Re-render dynamic content with new language
  renderEndpoints();
  if (S.lastHealth) renderStatus(S.lastHealth, S.lastModels, S.lastCreds);
  if (S.lastCreds) renderCreds({ credentials: S.lastCreds.credentials || S.credentials });
  if (S.lastQuotas) renderQuotas(S.lastQuotas);
}

$('lang-btn').onclick = () => {
  S.lang = S.lang === 'en' ? 'zh' : 'en';
  localStorage.setItem(LANG_KEY, S.lang);
  applyLang();
};

/* ── Auth ── */
async function showApp() {
  // Pre-load data before switching screens so the spinner stays visible
  await boot();
  $('auth-screen').style.display = 'none';
  $('app').style.display = 'block';
}

async function tryAuth(token) {
  const r = await fetch('/v1/auth/check', {
    headers: { 'Authorization': 'Bearer ' + token },
  });
  return r.ok;
}

$('auth-submit').onclick = async () => {
  const token = $('token-input').value.trim();
  if (!token) { $('auth-error').textContent = t('authEmpty'); return; }
  const btn = $('auth-submit');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>' + t('authSigningIn');
  $('auth-error').textContent = '';
  try {
    if (await tryAuth(token)) {
      S.token = token;
      localStorage.setItem(TOKEN_KEY, token);
      $('auth-error').textContent = '';
      await showApp();
    } else {
      $('auth-error').textContent = t('authInvalid');
    }
  } catch (e) {
    $('auth-error').textContent = t('authConnErr') + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
};

$('token-input').onkeydown = e => { if (e.key === 'Enter') $('auth-submit').click(); };

// Shared between logout and change-token so every token transition fully
// tears down the SSE connection + cached entries tied to the old session.
function resetLogsSession() {
  try { stopLogsStream(); } catch {}
  Logs.entries = [];
  Logs.lastId = 0;
  const card = $('logs-card');
  if (card && card.open) card.open = false;
  const body = $('logs-body');
  if (body) body.innerHTML = '';
}

$('logout-btn').onclick = () => {
  // Tear down the log stream first so the now-invalidated token stops
  // riding on an open SSE connection, and clear any cached entries so a
  // subsequent re-login doesn't surface the previous session's logs.
  resetLogsSession();
  // Same idea for the ACP poll loop — no point firing 5s 401s after
  // logout, and we want a clean slate for the next session.
  try { stopAcpAutoRefresh(); } catch {}

  S.token = '';
  S.loginId = null;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(LOGIN_ID_KEY);
  $('app').style.display = 'none';
  $('auth-screen').style.display = 'flex';
  $('token-input').value = '';
  $('auth-error').textContent = '';
};

/* ── API Helper ── */
async function api(path, opts = {}) {
  const r = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + S.token,
      ...(opts.headers || {}),
    },
    ...opts,
  });
  if (r.status === 401) {
    $('logout-btn').click();
    throw new Error(t('sessionExpired'));
  }
  const text = await r.text();
  // Reverse proxies (nginx, Cloudflare, GFE...) hand back HTML error
  // pages on 5xx/504. Blindly JSON.parse'ing a "<!DOCTYPE html>" body
  // throws "Unexpected token '<'" which makes the real cause invisible
  // to the user. Sniff the content type first and translate any
  // non-JSON response into a status-code message, falling back to a
  // truncated snippet of the body for diagnostics.
  const contentType = (r.headers.get('content-type') || '').toLowerCase();
  const looksLikeJson =
    contentType.includes('json') ||
    (text.length > 0 && (text[0] === '{' || text[0] === '['));
  if (!looksLikeJson) {
    if (!r.ok) {
      // Common upstream error pages: 502 Bad Gateway, 504 Gateway
      // Timeout, 521/522/524 from Cloudflare. Build a message that
      // points at the layer that's actually failing rather than the
      // JSON parse symptom.
      const upstream = /cloudflare/i.test(r.headers.get('server') || '')
        ? 'Cloudflare'
        : /nginx/i.test(r.headers.get('server') || '')
        ? 'nginx'
        : 'upstream proxy';
      const hint =
        r.status === 504 || r.status === 522 || r.status === 524
          ? ' — request likely exceeded the proxy timeout (cold-start / long generation).'
          : r.status === 502 || r.status === 521 || r.status === 523
          ? ' — backend unreachable.'
          : '';
      throw new Error(
        upstream + ' returned HTTP ' + r.status + ' (non-JSON body)' + hint,
      );
    }
    // 2xx with HTML is unusual but possible (e.g., a misrouted /manage
    // request). Return null so the caller's optional-chaining still
    // works without blowing up.
    return null;
  }
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (parseErr) {
    // JSON-shaped content that didn't parse — surface a short snippet
    // instead of the cryptic SyntaxError from JSON.parse.
    const snippet = text.length > 80 ? text.slice(0, 80) + '...' : text;
    throw new Error('Bad JSON response (HTTP ' + r.status + '): ' + snippet);
  }
  if (!r.ok) throw new Error(body?.error || r.statusText || 'Request failed');
  return body;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setNotice(msg, type) {
  const el = $('notice');
  el.classList.remove('visible','notice-ok');
  if (!msg) { el.textContent = ''; return; }
  el.textContent = msg;
  if (type === 'ok') el.classList.add('notice-ok');
  el.classList.add('visible');
  // 成功提示 5 秒后自动消失
  if (type === 'ok') setTimeout(() => { el.classList.remove('visible','notice-ok'); }, 5000);
}

/* ── Render: Status Bar ── */
function renderStatus(health, models, creds) {
  S.lastHealth = health; S.lastModels = models; S.lastCreds = creds;
  const items = [
    { l: t('health'), v: health.ok ? t('ok') : t('error'), d: health.ok ? 'ok' : 'err' },
    { l: t('cli'), v: health.cliBuilt ? t('built') : t('notBuilt'), d: health.cliBuilt ? 'ok' : 'err' },
    { l: t('model'), v: models.currentModel?.label || t('unknown'), d: 'warn' },
    { l: t('credential'), v: creds.currentCredentialId ? t('active') : t('none'), d: creds.currentCredentialId ? 'ok' : 'warn' },
  ];
  $('status-bar').innerHTML = items.map(i =>
    '<div class="pill"><span class="dot dot-'+i.d+'"></span><strong>'+esc(i.l)+'</strong>&nbsp;'+esc(i.v)+'</div>'
  ).join('');
}

/* ── Render: Credentials ── */
// Format a duration in seconds as a compact "Xh Ym" / "Xm Ys" /
// "Xs" string for cooldown countdowns. Tracks gcli2api's display
// idiom — operators glance at the card and immediately see when the
// quota window flips.
function fmtCooldownRemaining(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return s + 's';
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return m + 'm' + (remS > 0 ? remS + 's' : '');
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h < 24) return h + 'h' + (remM > 0 ? remM + 'm' : '');
  const d = Math.floor(h / 24);
  const remH = h % 24;
  return d + 'd' + (remH > 0 ? remH + 'h' : '');
}

// Render the per-(credential × model) cooldown chips inside a cred
// card. Two visual modes:
//   - model = '*'  → big red "auth failed, re-login" badge
//   - per-model    → orange "⏰ <model>: 3h12m" countdown chip
// We compute "now" client-side so a stale list (e.g. tab in
// background) doesn't show artificially-large remaining times.
function renderCredCooldowns(cooldowns) {
  if (!Array.isArray(cooldowns) || cooldowns.length === 0) return '';
  const now = Date.now();
  const items = [];
  for (const c of cooldowns) {
    const remainingMs = c.expiresAt ? c.expiresAt - now : c.secondsRemaining * 1000;
    if (remainingMs <= 0) continue; // already expired client-side
    const remainingSec = Math.ceil(remainingMs / 1000);
    if (c.model === '*') {
      items.push(
        '<span class="cred-cooldown cred-cooldown-auth" title="'+esc(t('credCooldownAuthHint'))+'">' +
        '⚠️ ' + esc(t('credCooldownAuth')) + ' — ' + esc(fmtCooldownRemaining(remainingSec)) +
        '</span>'
      );
    } else {
      items.push(
        '<span class="cred-cooldown cred-cooldown-model" title="' + esc(t('credCooldownQuotaHint')) + '">' +
        '⏰ ' + esc(c.model) + ': ' + esc(fmtCooldownRemaining(remainingSec)) +
        '</span>'
      );
    }
  }
  if (items.length === 0) return '';
  return '<div class="cred-cooldowns">' + items.join('') + '</div>';
}

function renderCreds(payload) {
  S.credentials = payload.credentials || [];
  if (!S.credentials.length) {
    $('cred-list').innerHTML = '<div class="empty">'+esc(t('noCreds'))+'</div>';
    return;
  }
  $('cred-list').innerHTML = S.credentials.map(c => {
    const badge = c.isCurrent
      ? '<span class="badge badge-active">'+esc(t('active'))+'</span>'
      : '<span class="badge badge-stored">'+esc(t('stored'))+'</span>';
    return '<div class="cred-card'+(c.isCurrent?' active':'')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
        '<div><div class="cred-name">'+esc(c.label)+'</div>'+
        '<div class="cred-email">'+(c.email?esc(c.email):esc(t('notLoggedIn')))+'</div>'+
        '<div class="cred-id">'+esc(c.id)+'</div></div>'+
        badge+
      '</div>'+
      renderCredCooldowns(c.cooldowns)+
      '<div class="cred-actions">'+
        '<button class="btn btn-ghost btn-sm" data-a="switch" data-id="'+esc(c.id)+'">'+esc(t('setActive'))+'</button>'+
        '<button class="btn btn-outline btn-sm" data-a="test" data-id="'+esc(c.id)+'" title="'+esc(t('testCredTip'))+'">'+esc(t('testCredBtn'))+'</button>'+
        '<button class="btn btn-outline btn-sm" data-a="test-message" data-id="'+esc(c.id)+'" title="'+esc(t('msgTestTip'))+'">'+esc(t('msgTestBtn'))+'</button>'+
        '<button class="btn btn-outline btn-sm" data-a="quota" data-id="'+esc(c.id)+'">'+esc(t('viewQuota'))+'</button>'+
        '<button class="btn btn-danger btn-sm" data-a="delete" data-id="'+esc(c.id)+'">'+esc(t('delete'))+'</button>'+
      '</div>'+
      '<div class="cred-test-result" id="cred-test-'+esc(c.id)+'"></div>'+
      '</div>';
  }).join('');
}

/* ── Render: Quotas ── */
function renderQuotas(payload) {
  S.lastQuotas = payload;
  const quotas = payload.quotas || [];
  if (!quotas.length) {
    $('quota-list').innerHTML = '<div class="empty">'+esc(t('noQuota'))+'</div>';
    return;
  }
  $('quota-list').innerHTML = quotas.map(e => {
    const tot = e.quotaSummary?.totals || {};
    const models = e.quotaSummary?.models || [];
    const plan = e.userTierName || e.userTier || '--';
    const statusBadge = e.status === 'ok'
      ? '<span class="badge badge-active">'+esc(t('statusOk'))+'</span>'
      : '<span class="badge badge-stored">'+esc(localeStatus(e.status))+'</span>';
    const modelSection = e.status === 'ok' ? renderModelQuotaSection(models) : '';
    return '<div class="quota-card">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
        '<div><strong>'+esc(e.credential.label)+'</strong>'+
        '<div style="color:var(--text3);font-size:12px">'+esc(e.credential.email||e.credential.id)+'</div></div>'+
        statusBadge+
      '</div>'+
      '<div class="metric-grid">'+
        metric(t('remaining'), fmtFraction(tot))+
        metric(t('numeric'), fmtCount(tot))+
        metric(t('plan'), plan)+
        metric(t('credits'), fmtCredits(e))+
        metric(t('reset'), fmtDate(tot.resetTime))+
        metric(t('models'), String(tot.modelCount??models.length??'--'))+
      '</div>'+
      modelSection+
      (e.error?'<div style="margin-top:8px;color:var(--red);font-size:12px">'+esc(e.error)+'</div>':'')+
    '</div>';
  }).join('');
}

/* Render per-model quota rows. Each row shows model name, numeric
   remaining/limit, a fill bar for remainingPercent, and reset time. */
function renderModelQuotaSection(models) {
  if (!Array.isArray(models) || !models.length) {
    return '<div class="model-quota-section"><div class="model-quota-title">'+esc(t('modelQuotas'))+'</div>'+
      '<div class="empty" style="padding:10px">'+esc(t('modelQuotasEmpty'))+'</div></div>';
  }
  const rows = models.map(m => {
    const pct = typeof m.remainingPercent === 'number' ? m.remainingPercent : null;
    const barClass = pct===null ? '' : (pct<=10 ? ' low' : (pct<=25 ? ' warn' : ''));
    const barWidth = pct===null ? 0 : pct;
    const barHtml = '<div class="model-quota-bar" title="'+(pct===null?'--':pct+'%')+'">'+
      '<div class="model-quota-bar-fill'+barClass+'" style="width:'+barWidth+'%"></div></div>';
    const tokenTypeLabel = m.tokenType ? '<small>'+esc(String(m.tokenType))+'</small>' : '';
    const nameCell = '<div class="model-quota-name">'+esc(m.label||m.id)+tokenTypeLabel+'</div>';
    const numCell = '<div class="model-quota-num">'+esc(fmtModelCount(m))+'</div>';
    const resetCell = '<div class="model-quota-reset">'+esc(fmtDate(m.resetTime))+'</div>';
    return '<div class="model-quota-row">'+nameCell+numCell+barHtml+resetCell+'</div>';
  }).join('');
  return '<div class="model-quota-section">'+
    '<div class="model-quota-title">'+esc(t('modelQuotas'))+'</div>'+
    rows+
  '</div>';
}

function fmtModelCount(m) {
  if (typeof m.remaining === 'number' && typeof m.limit === 'number' && m.limit > 0) {
    return m.remaining + ' / ' + m.limit;
  }
  if (typeof m.remaining === 'number') return String(m.remaining);
  if (typeof m.remainingPercent === 'number') return m.remainingPercent + '%';
  return '--';
}

function metric(label, value) {
  return '<div class="metric"><div class="metric-label">'+esc(label)+'</div><div class="metric-value" style="'+(String(value).length>10?'font-size:14px':'')+'">'+esc(value)+'</div></div>';
}

function fmtFraction(tot) {
  if (typeof tot.minRemainingFractionPercent !== 'number') return '--';
  if (tot.allModelsFull) return '100%';
  if (typeof tot.maxRemainingFractionPercent === 'number' && tot.maxRemainingFractionPercent !== tot.minRemainingFractionPercent) {
    return tot.minRemainingFractionPercent+'% - '+tot.maxRemainingFractionPercent+'%';
  }
  return tot.minRemainingFractionPercent + '%';
}

function fmtCount(tot) {
  if (typeof tot.remaining === 'number' && typeof tot.limit === 'number' && tot.limit > 0) return tot.remaining+' / '+tot.limit;
  if (typeof tot.remaining === 'number') return String(tot.remaining);
  return '--';
}

function fmtCredits(e) {
  if (typeof e.creditBalance === 'number' && Number.isFinite(e.creditBalance) && e.creditBalance > 0) return String(e.creditBalance);
  return '--';
}

function fmtDate(v) {
  if (!v) return '--';
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  const loc = S.lang === 'zh' ? 'zh-CN' : 'en-US';
  return new Intl.DateTimeFormat(loc,{dateStyle:'medium',timeStyle:'short'}).format(d);
}

function localeStatus(s) {
  if (s==='ok') return t('statusOk');
  if (s==='not_logged_in') return t('statusNotLoggedIn');
  if (s==='error') return t('statusError');
  return s;
}

/* ── Render: Models ── */
function renderModels(payload) {
  const cur = payload.currentModel?.id;
  const opts = [
    ...(payload.models||[]),
    ...(payload.aliases||[]).map(a=>({id:a.id,label:a.label+' -> '+a.targetId})),
  ];
  $('model-select').innerHTML = opts.map(m=>
    '<option value="'+esc(m.id)+'"'+(m.id===cur?' selected':'')+'>'+esc(m.label||m.id)+'</option>'
  ).join('');
}

/* ── Render: Endpoints ── */
function renderEndpoints() {
  const eps = [
    ['POST','/v1/gemini/generateContent',t('epGeminiGen')],
    ['POST','/v1/gemini/streamGenerateContent',t('epGeminiStream')],
    ['POST','/v1/openai/chat/completions',t('epOpenai')],
    ['GET','/v1/models',t('epModels')],
    ['GET','/v1/models/current',t('epModelsCur')],
    ['PUT','/v1/models/current',t('epModelsSet')],
    ['GET','/v1/credentials',t('epCreds')],
    ['GET','/v1/credentials/current',t('epCredsCur')],
    ['PUT','/v1/credentials/current',t('epCredsSet')],
    ['DELETE','/v1/credentials',t('epCredsDel')],
    ['DELETE','/v1/credentials/:id',t('epCredDel')],
    ['POST','/v1/credentials/login',t('epLogin')],
    ['GET','/v1/credentials/login/:id',t('epLoginStatus')],
    ['POST','/v1/credentials/login/:id/complete',t('epLoginComplete')],
    ['GET','/v1/quotas',t('epQuotas')],
    ['GET','/v1/quotas/:credentialId',t('epQuota')],
    ['GET','/v1/health',t('epHealth')],
  ];
  const methodClass = {GET:'ep-get',POST:'ep-post',PUT:'ep-put',DELETE:'ep-delete'};
  $('ep-list').innerHTML = eps.map(([m,p,d])=>
    '<div class="ep-item"><span class="ep-method '+(methodClass[m]||'')+'">'+m+'</span>'+
    '<span class="ep-path">'+esc(p)+'</span>'+
    '<div class="ep-desc">'+esc(d)+'</div></div>'
  ).join('');
}

/* ── Data Loading ── */
async function refreshHealth() {
  const [health,models,creds] = await Promise.all([
    api('/v1/health'), api('/v1/models'), api('/v1/credentials'),
  ]);
  renderStatus(health, models, creds);
  renderModels(models);
  renderCreds(creds);
}

async function refreshQuotas() {
  setNotice('');
  renderQuotas(await api('/v1/quotas'));
}

async function refreshAll() {
  await Promise.all([refreshHealth(), refreshQuotas()]);
}

/* ── Actions ── */
$('refresh-all-btn').onclick = () => refreshAll().catch(showErr);
$('refresh-creds-btn').onclick = () => refreshHealth().catch(showErr);
$('refresh-quotas-btn').onclick = () => refreshQuotas().catch(showErr);

$('start-login-btn').onclick = async () => {
  const btn = $('start-login-btn');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:4px"></span>' + t('startingLogin');
  try {
    setNotice('');
    const p = await api('/v1/credentials/login',{
      method:'POST',
      body:JSON.stringify({label:$('login-label').value.trim()||undefined, flow:'manual_code'}),
    });
    S.loginId = p.login.loginId;
    sessionStorage.setItem(LOGIN_ID_KEY, S.loginId);
    $('auth-url').value = p.login.authUrl||'';
    $('redirect-uri').value = p.login.redirectUri||'';
    $('login-meta').textContent = t('loginStarted')+p.credential.id;
    $('open-auth-btn').disabled = !p.login.authUrl;
    $('login-output').style.display = 'block';
    $('login-output').textContent = JSON.stringify(p, null, 2);
    await refreshHealth();
  } catch(e) { showErr(e); } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
};

$('open-auth-btn').onclick = () => {
  const u = $('auth-url').value;
  if (u) window.open(u, '_blank', 'noopener,noreferrer');
};

$('complete-login-btn').onclick = async () => {
  const btn = $('complete-login-btn');
  const origText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:4px"></span>' + t('completingLogin');
  try {
    setNotice('');
    if (!S.loginId) throw new Error(t('startFirst'));
    const p = await api('/v1/credentials/login/'+S.loginId+'/complete',{
      method:'POST',
      body:JSON.stringify({authorizationCode:$('callback-url').value.trim()}),
    });
    S.loginId = null;
    sessionStorage.removeItem(LOGIN_ID_KEY);
    $('login-meta').textContent = t('loginCompleted');
    $('login-output').style.display = 'block';
    $('login-output').textContent = JSON.stringify(p, null, 2);
    await refreshAll();
  } catch(e) { showErr(e); } finally {
    btn.disabled = false;
    btn.textContent = origText;
  }
};

$('check-status-btn').onclick = async () => {
  try {
    setNotice('');
    if (!S.loginId) throw new Error(t('noLoginFlow'));
    const p = await api('/v1/credentials/login/'+S.loginId);
    $('login-output').style.display = 'block';
    $('login-output').textContent = JSON.stringify(p, null, 2);
  } catch(e) { showErr(e); }
};

$('save-model-btn').onclick = async () => {
  try {
    setNotice('');
    const p = await api('/v1/models/current',{
      method:'PUT',
      body:JSON.stringify({model:$('model-select').value}),
    });
    $('model-meta').textContent = t('saved')+p.currentModel.label;
    await refreshHealth();
  } catch(e) { showErr(e); }
};

$('delete-all-btn').onclick = async () => {
  if (!confirm(t('confirmDeleteAll'))) return;
  try {
    setNotice('');
    await api('/v1/credentials',{method:'DELETE'});
    S.loginId = null;
    sessionStorage.removeItem(LOGIN_ID_KEY);
    $('auth-url').value = '';
    $('redirect-uri').value = '';
    $('callback-url').value = '';
    $('login-meta').textContent = '';
    $('login-output').style.display = 'none';
    $('quota-detail').textContent = '';
    $('quota-detail-meta').textContent = '';
    await refreshAll();
  } catch(e) { showErr(e); }
};

/* ── Credential Card Actions (delegation) ── */
$('cred-list').onclick = e => {
  const btn = e.target.closest('button[data-a]');
  if (!btn) return;
  const action = btn.dataset.a;
  const id = btn.dataset.id;
  if (!action || !id) return;

  if (action === 'switch') {
    api('/v1/credentials/current',{method:'PUT',body:JSON.stringify({credentialId:id})})
      .then(()=>refreshAll()).catch(showErr);
  } else if (action === 'quota') {
    $('quota-detail-meta').textContent = t('loadingQuota') + id + '...';
    api('/v1/quotas/'+id).then(p => {
      $('quota-detail-meta').textContent = t('credentialColon') + id;
      $('quota-detail').textContent = JSON.stringify(p, null, 2);
    }).catch(showErr);
  } else if (action === 'test') {
    testCredential(id, 'auth');
  } else if (action === 'test-message') {
    testCredential(id, 'message');
  } else if (action === 'delete') {
    if (!confirm(t('confirmDelete')+id)) return;
    api('/v1/credentials/'+id,{method:'DELETE'}).then(()=>refreshAll()).catch(showErr);
  }
};

/* ── Test a credential ──
 * mode='auth'    → POST /test         (lightweight setupUser check)
 * mode='message' → POST /test-message (real generateContent probe)
 * Both write to the same per-credential result line; only one
 * probe should be in-flight at a time per credential, so the
 * sibling button is disabled while the other is running.
 */
async function testCredential(credentialId, mode) {
  const isMsg = mode === 'message';
  const btnSelector = isMsg ? 'test-message' : 'test';
  const otherSelector = isMsg ? 'test' : 'test-message';
  const path = isMsg ? '/test-message' : '/test';
  const labelKey = isMsg ? 'msgTestBtn' : 'testCredBtn';
  const inflightKey = isMsg ? 'msgTesting' : 'testing';
  const btn = document.querySelector('button[data-a="'+btnSelector+'"][data-id="'+credentialId+'"]');
  const otherBtn = document.querySelector('button[data-a="'+otherSelector+'"][data-id="'+credentialId+'"]');
  const resultEl = $('cred-test-'+credentialId);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:4px"></span>' + t(inflightKey); }
  if (otherBtn) { otherBtn.disabled = true; }
  if (resultEl) { resultEl.className = 'cred-test-result'; resultEl.textContent = ''; }
  try {
    // Use the dedicated per-credential health-check endpoints. Unlike
    // /v1/openai/chat/completions, these:
    //   - Test THIS credential only (no silent failover to other
    //     credentials, which would make a broken credential appear
    //     to "work").
    //   - Don't retry, so a slow-failing credential won't stack
    //     up four 25 s attempts and trip Cloudflare's 100 s timeout
    //     (the "Cloudflare returned HTTP 524" bug).
    //   - Have a server-side cap (15 s); the response always comes
    //     back well inside any proxy timeout.
    // The response always has shape { ok, durationMs, reply | error }
    // and HTTP status is 200 for credential faults — only true
    // transport problems surface as exceptions here.
    const r = await api('/v1/credentials/' + encodeURIComponent(credentialId) + path, {
      method: 'POST',
    });
    if (resultEl) {
      if (r && r.ok) {
        resultEl.className = 'cred-test-result test-ok';
        const reply = (r.reply || '').trim();
        const dur = typeof r.durationMs === 'number' ? ' (' + (r.durationMs / 1000).toFixed(1) + 's)' : '';
        resultEl.textContent = t('testSuccess') + dur + (reply ? ' — ' + reply.slice(0, 80) : '');
      } else {
        resultEl.className = 'cred-test-result test-err';
        const dur = r && typeof r.durationMs === 'number' ? ' (' + (r.durationMs / 1000).toFixed(1) + 's)' : '';
        resultEl.textContent = (r && r.error ? r.error : 'Test failed') + dur;
      }
    }
  } catch(e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (resultEl) {
      resultEl.className = 'cred-test-result test-err';
      resultEl.textContent = msg;
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t(labelKey); }
    if (otherBtn) { otherBtn.disabled = false; }
  }
}

/* ── Token Management ── */
$('change-token-btn').onclick = async () => {
  const newToken = $('new-token-input').value.trim();
  if (!newToken) { setNotice(t('tokenEmpty')); return; }
  try {
    await api('/v1/auth/token',{method:'PUT',body:JSON.stringify({token:newToken})});
    // Tear down any SSE connection tied to the previous token's ticket
    // before we swap — otherwise the old stream keeps receiving logs on
    // a credential the user has just revoked.
    resetLogsSession();
    // Update local state and re-login with new token
    S.token = newToken;
    localStorage.setItem(TOKEN_KEY, newToken);
    $('new-token-input').value = '';
    $('token-meta').textContent = t('tokenChanged');
    // Re-enter the app with the new token
    $('auth-screen').style.display = 'flex';
    $('app').style.display = 'none';
    tryAuth(newToken).then(async ok => {
      if (ok) await showApp();
    });
  } catch(e) { showErr(e); }
};

$('save-open-api-btn').onclick = async () => {
  try {
    await api('/v1/auth/open-api',{method:'PUT',body:JSON.stringify({enabled:$('open-api-toggle').checked})});
    $('open-api-meta').textContent = t('openApiSaved');
    setTimeout(() => { $('open-api-meta').textContent = ''; }, 3000);
  } catch(e) { showErr(e); }
};

/* ── Request Settings ── */
$('retry-toggle').onchange = () => {
  $('retry-count-row').style.display = $('retry-toggle').checked ? '' : 'none';
};
$('save-settings-btn').onclick = async () => {
  try {
    const timeoutSec = parseFloat($('timeout-input').value) || 0;
    // Idle timeout: 0 means "never timeout" — keep it distinct from an empty
    // input. Only fall back to default (0) when the value is missing or
    // negative; a user-entered "0" must round-trip as 0.
    const acpIdleRaw = parseFloat($('acp-idle-input').value);
    const acpIdleMs =
      Number.isFinite(acpIdleRaw) && acpIdleRaw >= 0
        ? Math.floor(acpIdleRaw * 1000)
        : 0;
    // Keepalive: same "0 = disabled" semantics — coerce explicitly so
    // an empty/invalid input doesn't silently re-enable a default.
    const keepaliveRaw = parseFloat($('acp-keepalive-input').value);
    const acpKeepaliveMs =
      Number.isFinite(keepaliveRaw) && keepaliveRaw >= 0
        ? Math.floor(keepaliveRaw * 1000)
        : 0;
    const p = await api('/v1/settings',{
      method:'PUT',
      body:JSON.stringify({
        rotationEnabled: $('rotation-toggle').checked,
        retryEnabled: $('retry-toggle').checked,
        retryCount: parseInt($('retry-count-select').value, 10),
        timeoutMs: Math.floor(timeoutSec * 1000),
        mcpEnabled: $('mcp-toggle').checked,
        extensionsEnabled: $('extensions-toggle').checked,
        skillsEnabled: $('skills-toggle').checked,
        proxyUrl: $('proxy-input').value.trim(),
        maxWorkers: parseInt($('max-workers-input').value, 10) || 0,
        failoverWorkers: parseInt($('failover-workers-input').value, 10) || 0,
        acpIdleTimeoutMs: acpIdleMs,
        acpKeepaliveIntervalMs: acpKeepaliveMs,
      }),
    });
    $('settings-meta').textContent = t('settingsSaved');
    setTimeout(() => { $('settings-meta').textContent = ''; }, 3000);
  } catch(e) { showErr(e); }
};

async function loadSettings() {
  try {
    const [p, oa] = await Promise.all([api('/v1/settings'), api('/v1/auth/open-api')]);
    const s = p.settings || {};
    S.lastSettings = s;
    $('rotation-toggle').checked = !!s.rotationEnabled;
    $('retry-toggle').checked = !!s.retryEnabled;
    $('retry-count-select').value = String(s.retryCount || 3);
    $('retry-count-row').style.display = s.retryEnabled ? '' : 'none';
    $('mcp-toggle').checked = !!s.mcpEnabled;
    $('extensions-toggle').checked = !!s.extensionsEnabled;
    $('skills-toggle').checked = !!s.skillsEnabled;
    $('proxy-input').value = s.proxyUrl || '';
    $('max-workers-input').value = String(s.maxWorkers || 0);
    $('failover-workers-input').value = String(s.failoverWorkers || 0);
    // Use a typeof check instead of "||" so a stored value of 0
    // ("never timeout") displays as 0 in the input instead of being
    // silently replaced with the old default.
    const acpIdleMsStored =
      typeof s.acpIdleTimeoutMs === 'number' ? s.acpIdleTimeoutMs : 0;
    $('acp-idle-input').value = String(acpIdleMsStored / 1000);
    // Same typeof guard for the keepalive interval — fall back to the
    // server's recommended 9-minute default only when the field is
    // genuinely missing from the response (older server, fresh DB).
    const keepaliveStored =
      typeof s.acpKeepaliveIntervalMs === 'number'
        ? s.acpKeepaliveIntervalMs
        : 540_000;
    const keepaliveInputEl = $('acp-keepalive-input');
    if (keepaliveInputEl) {
      keepaliveInputEl.value = String(keepaliveStored / 1000);
    }
    const timeoutSec = (s.timeoutMs || 0) / 1000;
    $('timeout-input').value = timeoutSec > 0 ? String(timeoutSec) : '0';
    const defSec = p.defaultTimeoutMs ? (p.defaultTimeoutMs / 1000) : 600;
    $('t-timeout-hint').textContent = t('timeoutHint') + ' (' + defSec + 's)';
    $('open-api-toggle').checked = !!oa.openApiEnabled;
    // First call gives the panel something to show; the polling loop
    // started right after keeps it fresh while the user has the page
    // open. Both are idempotent — safe to call from any settings load.
    loadAcpStatus();
    if (AcpUI.autoRefresh) startAcpAutoRefresh();
  } catch(e) {}
}

/* ── ACP Session Management ── */
// Track which workers are expanded so the per-worker details survive
// across poll-driven re-renders. The list can shrink (worker died) or
// reorder freely; we just key by credentialId.
const AcpUI = {
  poll: 0,                    // setInterval handle (0 = not running)
  POLL_MS: 5000,              // refresh cadence while panel is in foreground
  autoRefresh: true,          // mirrors the toolbar checkbox
  lastUpdatedAt: 0,           // ms timestamp of last successful fetch
  lastWorkers: [],            // last-known workers payload for diff/render
  expanded: new Set(),        // credentialIds currently open
  detailCache: new Map(),     // credentialId → { quota, prompts, fetchedAt }
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRelative(ms, nowMs) {
  // Human-friendly delta for a past timestamp. Returns "just now",
  // "12s", "3m", "1h", "2d". The caller appends t('acpAgo') if it
  // wants "5m ago"-style phrasing.
  const delta = Math.max(0, (nowMs || Date.now()) - ms);
  const sec = Math.floor(delta / 1000);
  if (sec < 2) return 'just now';
  if (sec < 60) return sec + 's';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + 'm';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + 'h';
  const day = Math.floor(hr / 24);
  return day + 'd';
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + 's';
}

function renderAcpWorker(w, nowMs) {
  // Build one collapsible <details> entry. The summary shows the
  // info we always have from /v1/acp/status; the body is a host
  // div whose inner HTML is filled in lazily when the user expands
  // the row (see ensureWorkerDetail).
  const credShort = w.credentialId.slice(0, 8);
  const stateClass = 's-' + (w.state || 'unknown');
  const isOpen = AcpUI.expanded.has(w.credentialId);
  const lastAct = w.lastActivity
    ? formatRelative(w.lastActivity, nowMs) + t('acpAgo')
    : '—';
  const recentLabel = (w.recentPromptCount || 0) + ' ' + t('acpRecentPrompts').toLowerCase();
  return (
    '<details class="acp-worker"' + (isOpen ? ' open' : '') +
    ' data-cred="' + escapeHtml(w.credentialId) + '">' +
      '<summary class="acp-worker-summary">' +
        '<span class="acp-worker-cred">' + escapeHtml(credShort) + '</span>' +
        '<span class="acp-worker-state ' + stateClass + '">' + escapeHtml(w.state || '') + '</span>' +
        '<span class="acp-worker-meta">' + (w.sessionCount || 0) + ' ' + t('acpSessions2') + '</span>' +
        '<span class="acp-worker-meta">' + escapeHtml(recentLabel) + '</span>' +
        '<span class="acp-worker-meta">' + escapeHtml(lastAct) + '</span>' +
        '<span class="acp-worker-spacer"></span>' +
        '<button class="btn btn-outline btn-sm" style="font-size:11px;color:var(--red);border-color:var(--red)" ' +
          'onclick="event.preventDefault();event.stopPropagation();killAcpWorker(&quot;' + escapeHtml(w.credentialId) + '&quot;)">' +
          t('acpKillWorker') + '</button>' +
      '</summary>' +
      '<div class="acp-worker-body" data-detail-host>' +
        '<div class="acp-section-title">' + t('acpQuotaSection') + '</div>' +
        '<div class="acp-quota-mini" data-quota-host>' +
          '<span class="acp-empty-mini">' + t('acpQuotaLoading') + '</span>' +
        '</div>' +
        '<div class="acp-section-title">' + t('acpRecentPrompts') + '</div>' +
        '<div data-prompts-host>' +
          '<div class="acp-empty-mini">' + t('acpRecentLoading') + '</div>' +
        '</div>' +
      '</div>' +
    '</details>'
  );
}

function renderAcpQuotaMini(payload) {
  // Summarize the quota response into a compact pill row. The full
  // /v1/quotas already surfaces details; here we just want to show
  // "is this credential healthy and approximately how much is left".
  if (!payload) {
    return '<span class="acp-empty-mini">' + t('acpQuotaError') + '</span>';
  }
  const parts = [];
  if (payload.plan) parts.push('<span class="acp-quota-pill">' + escapeHtml(String(payload.plan)) + '</span>');
  if (payload.userTier) parts.push('<span class="acp-quota-pill">' + escapeHtml(String(payload.userTier)) + '</span>');
  if (typeof payload.remainingRatio === 'number') {
    parts.push('<span class="acp-quota-pill">' + Math.round(payload.remainingRatio * 100) + '% ' + t('remaining') + '</span>');
  }
  if (Array.isArray(payload.buckets)) {
    let lowest = null;
    for (const b of payload.buckets) {
      if (typeof b.remaining === 'number' && typeof b.limit === 'number' && b.limit > 0) {
        const ratio = b.remaining / b.limit;
        if (lowest == null || ratio < lowest.ratio) {
          lowest = { ratio, name: b.modelId || b.id || '', remaining: b.remaining, limit: b.limit };
        }
      }
    }
    if (lowest) {
      parts.push('<span class="acp-quota-pill">' + Math.round(lowest.ratio * 100) + '% ' + escapeHtml(String(lowest.name || '')) + '</span>');
    }
  }
  if (parts.length === 0) {
    return '<span class="acp-empty-mini">' + t('noQuota') + '</span>';
  }
  return parts.join('');
}

function renderAcpPrompt(p, nowMs) {
  const statusKey = 'acpPromptStatus' + (p.status || 'completed').replace(/^./, c => c.toUpperCase());
  const statusLabel = t(statusKey) || p.status || '';
  const truncatedIn = p.promptCharCount > p.promptSummary.length;
  const truncatedOut = p.responseCharCount > p.responseSummary.length;
  const started = p.startedAt ? formatRelative(p.startedAt, nowMs) + t('acpAgo') : '';
  const tokenChips = [];
  if (typeof p.inputTokens === 'number') tokenChips.push('<span>in ' + p.inputTokens + '</span>');
  if (typeof p.outputTokens === 'number') tokenChips.push('<span>out ' + p.outputTokens + '</span>');
  if (typeof p.totalTokens === 'number') tokenChips.push('<span>tot ' + p.totalTokens + '</span>');
  if (typeof p.cachedTokens === 'number' && p.cachedTokens > 0) tokenChips.push('<span>cached ' + p.cachedTokens + '</span>');

  // NOTE: do NOT put a literal newline-escape inside these strings.
  // This whole function lives inside an outer template literal in the
  // file body, and inside a template literal a backslash-n decays to
  // an actual newline character. That would split the JS single-quoted
  // string across two lines in the served HTML and crash with
  // "Uncaught SyntaxError: Invalid or unexpected token". Use a "br"
  // tag (or no separator) instead — the host element is rendered via
  // innerHTML so HTML markup is the right tool anyway.
  const promptText = p.promptSummary
    ? '<span class="acp-prompt-text">' + escapeHtml(p.promptSummary) +
      (truncatedIn ? '<br><small>… +' + (p.promptCharCount - p.promptSummary.length) + ' ' + t('acpPromptCharsTruncated') + '</small>' : '') +
      '</span>'
    : '<span class="acp-prompt-text empty">∅</span>';
  const responseText = p.responseSummary
    ? '<span class="acp-prompt-text">' + escapeHtml(p.responseSummary) +
      (truncatedOut ? '<br><small>… +' + (p.responseCharCount - p.responseSummary.length) + ' ' + t('acpPromptCharsTruncated') + '</small>' : '') +
      '</span>'
    : (p.status === 'in_progress'
        ? '<span class="acp-prompt-text empty">…</span>'
        : '<span class="acp-prompt-text empty">∅</span>');

  return (
    '<div class="acp-prompt-row">' +
      '<div class="acp-prompt-head">' +
        '<span class="acp-prompt-id">' + escapeHtml(p.id || '') + '</span>' +
        '<span class="acp-prompt-status st-' + escapeHtml(p.status || '') + '">' + escapeHtml(statusLabel) + '</span>' +
        (started ? '<span class="acp-prompt-meta">' + escapeHtml(started) + '</span>' : '') +
        (typeof p.durationMs === 'number'
          ? '<span class="acp-prompt-meta">' + t('acpPromptDuration') + ' ' + escapeHtml(formatDuration(p.durationMs)) + '</span>'
          : '') +
        (tokenChips.length ? '<span class="acp-prompt-tokens">' + tokenChips.join('') + '</span>' : '') +
      '</div>' +
      (p.errorMessage
        ? '<div class="acp-prompt-error">' + escapeHtml(p.errorMessage) + '</div>'
        : '') +
      '<div class="acp-prompt-content">' +
        '<span class="acp-prompt-label">' + t('acpPromptUser') + '</span>' +
        promptText +
      '</div>' +
      '<div class="acp-prompt-content">' +
        '<span class="acp-prompt-label">' + t('acpPromptAgent') + '</span>' +
        responseText +
      '</div>' +
    '</div>'
  );
}

function renderAcpPromptList(prompts, nowMs) {
  if (!Array.isArray(prompts) || prompts.length === 0) {
    return '<div class="acp-empty-mini">' + t('acpNoRecentPrompts') + '</div>';
  }
  // Newest first in the UI; backend stores newest-last.
  const ordered = prompts.slice().reverse();
  return ordered.map(p => renderAcpPrompt(p, nowMs)).join('');
}

// Quota refetch interval. Quota changes slowly (per-minute / per-day
// counters) and Google's quota API can be flaky for exhausted accounts
// — so we don't tie this to the 5 s status poll. Re-fetch only on
// expand and at most once per QUOTA_REFRESH_MS even then.
const QUOTA_REFRESH_MS = 60_000;

// Per-card detail state. Keyed by credentialId, mirrors AcpUI.expanded
// for the cards that have ever been opened in this session.
const AcpDetail = {
  // credentialId → {
  //   quota, quotaFetchedAt, quotaError,
  //   promptsHash, lastPromptCount, prompts,
  //   inFlight: Promise | null
  // }
  state: new Map(),
};

function getDetailState(credentialId) {
  let s = AcpDetail.state.get(credentialId);
  if (!s) {
    s = {
      quota: undefined,
      quotaFetchedAt: 0,
      quotaError: null,
      promptsHash: '',
      lastPromptCount: -1,
      prompts: null,
      inFlightQuota: null,
      inFlightPrompts: null,
    };
    AcpDetail.state.set(credentialId, s);
  }
  return s;
}

function quotaIsStale(s) {
  return Date.now() - s.quotaFetchedAt > QUOTA_REFRESH_MS;
}

function paintQuota(card, s) {
  const host = card.querySelector('[data-quota-host]');
  if (!host) return;
  // Three display states, in order of preference:
  //   1. We have quota data (possibly stale) → render it. If stale-
  //      after-error, append a small "(stale)" hint so the operator
  //      knows the displayed numbers may be out of date.
  //   2. We have no data ever and the last fetch errored → show the
  //      error message (e.g. "Resource has been exhausted").
  //   3. We have no data and no error yet → loading placeholder.
  let html;
  if (s.quota) {
    html = renderAcpQuotaMini(s.quota);
    if (s.quotaError) {
      html += ' <span class="acp-empty-mini" style="display:inline-block;padding:0 8px;font-size:11px;font-style:italic">stale: ' + escapeHtml(s.quotaError) + '</span>';
    }
  } else if (s.quotaError) {
    html = '<span class="acp-empty-mini" style="color:var(--red)">' + escapeHtml(s.quotaError) + '</span>';
  } else {
    html = '<span class="acp-empty-mini">' + t('acpQuotaLoading') + '</span>';
  }
  // Idempotent write: skip the DOM mutation if the rendered HTML
  // hasn't changed. Eliminates the "every-5-second flicker" the user
  // sees on cards whose quota fetch is failing repeatedly.
  if (host.innerHTML !== html) host.innerHTML = html;
}

function paintPrompts(card, s, nowMs) {
  const host = card.querySelector('[data-prompts-host]');
  if (!host) return;
  let html;
  if (s.prompts && s.prompts.length > 0) {
    html = renderAcpPromptList(s.prompts, nowMs);
  } else if (s.prompts !== null) {
    // Empty array — worker has no recent prompts.
    html = '<div class="acp-empty-mini">' + t('acpNoRecentPrompts') + '</div>';
  } else {
    // null = haven't fetched yet (first paint after expand).
    html = '<div class="acp-empty-mini">' + t('acpRecentLoading') + '</div>';
  }
  if (host.innerHTML !== html) host.innerHTML = html;
}

async function fetchQuotaIfStale(credentialId, force) {
  const s = getDetailState(credentialId);
  if (!force && !quotaIsStale(s)) return;
  if (s.inFlightQuota) return s.inFlightQuota; // de-dupe concurrent fetches
  s.inFlightQuota = (async () => {
    try {
      const q = await api('/v1/quotas/' + encodeURIComponent(credentialId));
      s.quota = q;
      s.quotaError = null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      s.quotaError = msg;
      // Intentionally do NOT clear s.quota — keeping the last
      // known-good payload prevents the empty-state flicker the
      // user reported when Google's quota API rejects exhausted
      // accounts every poll.
    } finally {
      s.quotaFetchedAt = Date.now();
      s.inFlightQuota = null;
    }
  })();
  return s.inFlightQuota;
}

async function fetchPromptsIfChanged(credentialId, expectedCount) {
  const s = getDetailState(credentialId);
  // Only refetch if the worker's recent-prompt count changed since
  // the last successful fetch. This is what makes the "live
  // streaming reply" visible without thrashing the DOM every 5 s.
  if (
    typeof expectedCount === 'number' &&
    expectedCount === s.lastPromptCount
  ) {
    return;
  }
  if (s.inFlightPrompts) return s.inFlightPrompts;
  s.inFlightPrompts = (async () => {
    try {
      const r = await api('/v1/acp/workers/' + encodeURIComponent(credentialId) + '/recent');
      const prompts = r && Array.isArray(r.prompts) ? r.prompts : [];
      s.prompts = prompts;
      if (typeof expectedCount === 'number') {
        s.lastPromptCount = expectedCount;
      } else {
        s.lastPromptCount = prompts.length;
      }
    } catch {
      // Keep stale prompts on error; next poll will retry.
    } finally {
      s.inFlightPrompts = null;
    }
  })();
  return s.inFlightPrompts;
}

async function refreshAcpWorkerDetailDom(credentialId, opts) {
  // Repaint the detail body for one open worker. Called on:
  //   - card expand (force = true)              → fetch both
  //   - polled status update (force = false)    → fetch only what changed
  // The cheapest possible idle case (worker open, no new prompts,
  // quota fresh) does ZERO network I/O and leaves the DOM untouched.
  const card = document.querySelector('details.acp-worker[data-cred="' + cssEscape(credentialId) + '"]');
  if (!card) return;
  const force = !!(opts && opts.force);
  const expectedPromptCount = opts && typeof opts.expectedPromptCount === 'number'
    ? opts.expectedPromptCount
    : undefined;

  const s = getDetailState(credentialId);

  // Initial paint right away from cached state — no waiting for
  // network I/O.
  paintQuota(card, s);
  paintPrompts(card, s, Date.now());

  // Fire fetches in parallel; each one calls its paint function on
  // success so the visible state stays in sync without us blocking.
  const tasks = [];
  if (force || quotaIsStale(s)) {
    tasks.push(fetchQuotaIfStale(credentialId, force).then(() => paintQuota(card, s)));
  }
  if (force || (expectedPromptCount !== undefined && expectedPromptCount !== s.lastPromptCount)) {
    tasks.push(
      fetchPromptsIfChanged(credentialId, expectedPromptCount).then(() =>
        paintPrompts(card, s, Date.now()),
      ),
    );
  }
  await Promise.allSettled(tasks);
}

// Lightweight CSS.escape polyfill — older browsers may not have it.
// Note the four-backslash quartet below: this whole script lives inside
// an outer template literal in the file body, where backslash-escapes
// are halved on expansion. Writing two backslashes here would surface
// as one backslash in the served HTML, where it would then escape the
// closing quote and break the script. Four backslashes round-trip to
// the two backslashes the browser needs to see.
function cssEscape(s) {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(s);
  }
  return String(s).replace(/[^a-zA-Z0-9_-]/g, ch => '\\\\' + ch);
}

function updateAcpStatusText() {
  const el = $('acp-status-text');
  if (!el) return;
  if (!AcpUI.lastUpdatedAt) {
    el.textContent = '';
    return;
  }
  el.textContent = t('acpLastUpdated') + ' ' + formatRelative(AcpUI.lastUpdatedAt) + t('acpAgo');
}

function setAcpLiveDot(on) {
  const dot = $('acp-live-dot');
  if (!dot) return;
  dot.classList.toggle('off', !on);
}

// Update one worker card's summary fields in place without touching
// its <details>.open state or its body. This is what makes auto-poll
// flicker-free: the DOM nodes the user is interacting with (expanded
// cards, scroll positions, focus) survive the refresh.
function updateAcpWorkerSummaryInPlace(card, w, nowMs) {
  const stateEl = card.querySelector('.acp-worker-state');
  if (stateEl) {
    stateEl.className = 'acp-worker-state s-' + (w.state || 'unknown');
    stateEl.textContent = w.state || '';
  }
  // The three meta spans appear in a fixed order in the rendered
  // template: sessions, recent prompts, last-activity. We rely on
  // that ordering rather than per-element data-attrs to keep the
  // template tiny.
  const metas = card.querySelectorAll('.acp-worker-summary > .acp-worker-meta');
  if (metas[0]) {
    metas[0].textContent = (w.sessionCount || 0) + ' ' + t('acpSessions2');
  }
  if (metas[1]) {
    const recentLabel = (w.recentPromptCount || 0) + ' ' + t('acpRecentPrompts').toLowerCase();
    metas[1].textContent = recentLabel;
  }
  if (metas[2]) {
    const lastAct = w.lastActivity
      ? formatRelative(w.lastActivity, nowMs) + t('acpAgo')
      : '—';
    metas[2].textContent = lastAct;
  }
}

// Reconcile the current worker list against fresh data from
// /v1/acp/status. Adds new cards, removes gone ones, and updates
// summaries on the rest — all without touching the body of any
// expanded card. The body content is owned by
// refreshAcpWorkerDetailDom which fires independently.
function reconcileAcpWorkerList(workers, nowMs) {
  const list = $('acp-sessions-list');
  if (!list) return;

  if (workers.length === 0) {
    list.innerHTML = '<div class="acp-empty-mini">' + t('acpNoWorkers') + '</div>';
    return;
  }

  // If the previous render was an empty-state placeholder (or anything
  // other than worker cards), wipe and start clean. Otherwise diff in
  // place.
  const placeholder = list.querySelector('.acp-empty-mini');
  if (placeholder) placeholder.remove();

  // Index existing cards by credentialId so we can match them to the
  // incoming worker list in one pass.
  const existing = new Map();
  for (const card of list.querySelectorAll('details.acp-worker')) {
    const cred = card.getAttribute('data-cred');
    if (cred) existing.set(cred, card);
  }

  const seen = new Set();
  for (const w of workers) {
    seen.add(w.credentialId);
    const old = existing.get(w.credentialId);
    if (old) {
      updateAcpWorkerSummaryInPlace(old, w, nowMs);
    } else {
      // New worker — append a freshly rendered card. Use a template
      // shell so we get the actual <details> element rather than a
      // string fragment that needs further parsing.
      const tmp = document.createElement('div');
      tmp.innerHTML = renderAcpWorker(w, nowMs);
      const newCard = tmp.firstElementChild;
      if (newCard) list.appendChild(newCard);
    }
  }

  // Drop cards whose worker is gone (credential deleted, idle-evicted).
  for (const [cred, card] of existing) {
    if (!seen.has(cred)) card.remove();
  }
}

async function loadAcpStatus() {
  try {
    const st = await api('/v1/acp/status');
    AcpUI.lastWorkers = Array.isArray(st.workers) ? st.workers : [];
    AcpUI.lastUpdatedAt = Date.now();

    // Drop "expanded" entries for workers that no longer exist so the
    // open-set doesn't grow unboundedly across worker churn.
    const live = new Set(AcpUI.lastWorkers.map(w => w.credentialId));
    for (const id of AcpUI.expanded) {
      if (!live.has(id)) AcpUI.expanded.delete(id);
    }
    for (const id of Array.from(AcpUI.detailCache.keys())) {
      if (!live.has(id)) AcpUI.detailCache.delete(id);
    }
    for (const id of Array.from(AcpDetail.state.keys())) {
      if (!live.has(id)) AcpDetail.state.delete(id);
    }

    const nowMs = Date.now();
    reconcileAcpWorkerList(AcpUI.lastWorkers, nowMs);
    updateAcpStatusText();

    // After the DOM is updated, refresh details for every still-open
    // worker — but pass each worker's *current* recentPromptCount so
    // refreshAcpWorkerDetailDom can skip the prompts fetch when
    // nothing actually changed. Quota refetches at most every
    // QUOTA_REFRESH_MS regardless. The two together kill the
    // "every-5-seconds flicker" and the wasted /v1/quotas calls
    // against exhausted credentials.
    const workerByCred = new Map();
    for (const w of AcpUI.lastWorkers) workerByCred.set(w.credentialId, w);
    for (const credentialId of AcpUI.expanded) {
      const w = workerByCred.get(credentialId);
      void refreshAcpWorkerDetailDom(credentialId, {
        force: false,
        expectedPromptCount: w ? w.recentPromptCount || 0 : undefined,
      });
    }
  } catch (e) {
    // Network blip — keep the UI quiet (the dot reflects connectivity
    // already) and try again on the next tick.
    setAcpLiveDot(false);
    return;
  }
  if (AcpUI.autoRefresh) setAcpLiveDot(true);
}

function startAcpAutoRefresh() {
  if (AcpUI.poll) return;
  AcpUI.poll = setInterval(() => {
    // Skip ticks while the page is hidden — saves token churn and
    // browser CPU. We'll catch up on the next tick after focus.
    if (document.visibilityState !== 'visible') return;
    if (!AcpUI.autoRefresh) return;
    void loadAcpStatus();
  }, AcpUI.POLL_MS);
  setAcpLiveDot(true);
}

function stopAcpAutoRefresh() {
  if (AcpUI.poll) {
    clearInterval(AcpUI.poll);
    AcpUI.poll = 0;
  }
  setAcpLiveDot(false);
}

window.killAcpWorker = async function(credentialId) {
  try {
    // The DELETE /v1/acp/workers endpoint kills all workers; this
    // matches the server-side handler today (no per-credential
    // route exists). We surface the per-row Kill button anyway so
    // the user can act on the worker they're inspecting.
    await api('/v1/acp/workers',{method:'DELETE'});
    AcpUI.expanded.delete(credentialId);
    AcpUI.detailCache.delete(credentialId);
    await loadAcpStatus();
  } catch(e) { showErr(e); }
};

$('refresh-acp-btn').onclick = () => loadAcpStatus();
$('kill-all-acp-btn').onclick = async () => {
  try {
    await api('/v1/acp/workers',{method:'DELETE'});
    AcpUI.expanded.clear();
    AcpUI.detailCache.clear();
    await loadAcpStatus();
  } catch(e) { showErr(e); }
};

const acpAutoToggle = $('acp-auto-refresh-toggle');
if (acpAutoToggle) {
  acpAutoToggle.onchange = () => {
    AcpUI.autoRefresh = !!acpAutoToggle.checked;
    if (AcpUI.autoRefresh) {
      startAcpAutoRefresh();
      void loadAcpStatus();
    } else {
      stopAcpAutoRefresh();
    }
  };
}

// Use the bubbling 'toggle' event from <details> elements to track
// expand/collapse without binding a listener per card. Caveat:
// 'toggle' does not bubble in some older browsers — so we delegate
// at the click level too as a fallback.
document.addEventListener('toggle', (ev) => {
  const target = ev.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains('acp-worker')) return;
  const cred = target.getAttribute('data-cred');
  if (!cred) return;
  if (target.hasAttribute('open')) {
    AcpUI.expanded.add(cred);
    // First open: force fetch of both quota and prompts. Subsequent
    // poll-driven refreshes will skip whatever hasn't changed.
    void refreshAcpWorkerDetailDom(cred, { force: true });
  } else {
    AcpUI.expanded.delete(cred);
  }
}, true);

// Resume / pause polling with tab visibility — avoids both wasted
// background polls and a stale UI when the user comes back.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && AcpUI.autoRefresh) {
    void loadAcpStatus();
  }
});

// The polling loop is started inside loadSettings() (after auth)
// rather than at module load — see startAcpAutoRefresh call in
// loadSettings to avoid 5s 401 spam before the user signs in.

function showErr(e) {
  setNotice(e instanceof Error ? e.message : String(e));
}

/* ── Logs Panel ── */
const LOG_LEVEL_RANK = { debug:0, info:1, warn:2, error:3 };
const Logs = {
  entries: [],            // newest at the end, capped at MAX_CLIENT
  MAX_CLIENT: 1000,       // client-side buffer cap (indep. of server ring)
  lastId: 0,              // highest entry id we've seen
  paused: false,          // when true, new entries are buffered but not rendered
  streaming: false,       // SSE open?
  es: null,               // EventSource handle
  esReconnectTimer: 0,    // scheduled reconnect
  minLevel: 'info',       // server-side level filter
  keyword: '',            // client-side substring filter (case-insensitive)
  autoScroll: true,       // flip off if the user scrolls away from bottom
  renderPending: false,   // rAF batching
};

function fmtLogTs(ms) {
  const d = new Date(ms);
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds())+'.'+pad(d.getMilliseconds(), 3);
}

function logMatchesFilter(entry) {
  if (LOG_LEVEL_RANK[entry.level] < LOG_LEVEL_RANK[Logs.minLevel]) return false;
  if (Logs.keyword && entry.message.toLowerCase().indexOf(Logs.keyword) < 0) return false;
  return true;
}

function renderLogRow(entry) {
  const row = document.createElement('div');
  row.className = 'log-row lv-' + entry.level;
  row.dataset.id = String(entry.id);
  const ts = document.createElement('span'); ts.className = 'log-ts'; ts.textContent = fmtLogTs(entry.ts);
  const lv = document.createElement('span'); lv.className = 'log-lv'; lv.textContent = entry.level;
  const msg = document.createElement('span'); msg.className = 'log-msg'; msg.textContent = entry.message;
  if (entry.rest && Object.keys(entry.rest).length > 0) {
    const rest = document.createElement('span');
    rest.className = 'log-rest';
    try { rest.textContent = JSON.stringify(entry.rest); } catch { rest.textContent = '[unserializable]'; }
    msg.appendChild(rest);
  }
  row.appendChild(ts); row.appendChild(lv); row.appendChild(msg);
  return row;
}

function scheduleLogsRender() {
  if (Logs.renderPending) return;
  Logs.renderPending = true;
  requestAnimationFrame(() => {
    Logs.renderPending = false;
    renderLogsBody();
  });
}

function renderLogsBody() {
  const body = $('logs-body');
  if (!body) return;
  body.innerHTML = '';
  const visible = Logs.entries.filter(logMatchesFilter);
  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'logs-empty';
    empty.textContent = t('logsEmpty');
    body.appendChild(empty);
    updateLogsCounter();
    return;
  }
  const frag = document.createDocumentFragment();
  for (const e of visible) frag.appendChild(renderLogRow(e));
  body.appendChild(frag);
  if (Logs.autoScroll) body.scrollTop = body.scrollHeight;
  updateLogsCounter();
}

function updateLogsCounter() {
  const counter = $('logs-counter');
  if (!counter) return;
  const visibleCount = Logs.entries.filter(logMatchesFilter).length;
  const suffix = S.lang === 'zh' ? ' '+t('logsCounter') : ' '+t('logsCounter');
  counter.textContent = visibleCount + '/' + Logs.entries.length + suffix;
}

function pushLogEntry(entry) {
  if (entry.id <= Logs.lastId) return; // dedup
  Logs.lastId = entry.id;
  Logs.entries.push(entry);
  if (Logs.entries.length > Logs.MAX_CLIENT) {
    Logs.entries.splice(0, Logs.entries.length - Logs.MAX_CLIENT);
  }
  if (!Logs.paused && logMatchesFilter(entry)) {
    scheduleLogsRender();
  }
}

async function fetchLogsHistory() {
  setNotice('');
  try {
    const r = await api('/v1/logs?level=' + encodeURIComponent(Logs.minLevel) + '&limit=500');
    const entries = (r && r.entries) || [];
    Logs.entries = entries.slice(-Logs.MAX_CLIENT);
    // Track the highest id seen so live SSE pushes can skip duplicates
    // (the server replays entries that may overlap with the snapshot).
    Logs.lastId = Logs.entries.length > 0 ? Logs.entries[Logs.entries.length-1].id : 0;
    renderLogsBody();
  } catch (e) { showErr(e); }
}

// Fetch a single-use ticket for the SSE stream; the Bearer token stays in
// the Authorization header (POST body), never in a URL.
async function requestLogsStreamTicket() {
  try {
    const r = await api('/v1/logs/stream-ticket', { method: 'POST' });
    return (r && r.ticket) || '';
  } catch (e) {
    showErr(e);
    return '';
  }
}

async function startLogsStream() {
  // Guard both on the streaming flag AND on an already-live EventSource —
  // between calling "new EventSource()" and onopen firing, streaming is
  // still false, so relying on the flag alone can spawn duplicate streams.
  if (Logs.streaming || Logs.es || !S.token) return;
  const dot = $('logs-stream-dot');
  const ticket = await requestLogsStreamTicket();
  if (!ticket) {
    if (dot) { dot.classList.add('off'); dot.title = t('logsStreamOff'); }
    return;
  }
  // Race check: panel may have been closed while we awaited the ticket.
  if (!$('logs-card') || !$('logs-card').open) return;
  try {
    // Pass the highest id we've already seen via ?afterId so the server can
    // replay anything produced between "fetch history" and "SSE connected".
    // On reconnect the browser additionally supplies Last-Event-ID; server
    // prefers that header over this query.
    const url =
      '/v1/logs/stream?ticket=' + encodeURIComponent(ticket) +
      (Logs.lastId > 0 ? '&afterId=' + Logs.lastId : '');
    const es = new EventSource(url);
    Logs.es = es;
    es.onopen = () => {
      Logs.streaming = true;
      if (dot) { dot.classList.remove('off'); dot.title = t('logsStreamOn'); }
    };
    es.onmessage = (ev) => {
      try {
        const entry = JSON.parse(ev.data);
        // Dedup against snapshot + earlier stream entries (server replay).
        if (entry && typeof entry.id === 'number' && entry.id <= Logs.lastId) return;
        pushLogEntry(entry);
      } catch { /* ignore malformed */ }
    };
    // Server emits an "event: gap" when the resume point is older than the
    // buffer's earliest entry. Surface this so the user knows some history
    // is permanently lost (not just pending).
    es.addEventListener('gap', (ev) => {
      try {
        const info = JSON.parse(ev.data);
        setNotice(
          (S.lang === 'zh' ? '日志 ' : 'Logs ') +
          (info && info.lost ? info.lost : '?') +
          (S.lang === 'zh' ? ' 条丢失（缓冲已溢出）' : ' entries dropped (buffer overflow)'),
        );
      } catch { /* ignore malformed */ }
    });
    es.onerror = () => {
      Logs.streaming = false;
      if (dot) { dot.classList.add('off'); dot.title = t('logsStreamOff'); }
      try { es.close(); } catch {}
      Logs.es = null;
      // Auto-reconnect while panel is open. EventSource will resend the
      // last event id via Last-Event-ID on reconnect, so the server can
      // replay any entries produced during the downtime.
      if ($('logs-card') && $('logs-card').open && !Logs.esReconnectTimer) {
        Logs.esReconnectTimer = setTimeout(() => {
          Logs.esReconnectTimer = 0;
          startLogsStream().catch(() => {});
        }, 3000);
      }
    };
  } catch (e) {
    Logs.streaming = false;
    if (dot) dot.classList.add('off');
  }
}

function stopLogsStream() {
  if (Logs.esReconnectTimer) { clearTimeout(Logs.esReconnectTimer); Logs.esReconnectTimer = 0; }
  if (Logs.es) { try { Logs.es.close(); } catch {} Logs.es = null; }
  Logs.streaming = false;
  const dot = $('logs-stream-dot');
  if (dot) { dot.classList.add('off'); dot.title = t('logsStreamOff'); }
}

let _logsPanelBound = false;
function bindLogsPanel() {
  // Idempotent: showApp/boot may run more than once per page load (login,
  // lang switch, etc.) — never attach the same handlers twice.
  if (_logsPanelBound) return;
  const card = $('logs-card');
  const body = $('logs-body');
  if (!card || !body) return;
  _logsPanelBound = true;

  card.addEventListener('toggle', () => {
    $('t-logs-toggle').textContent = card.open ? t('logsToggleExpanded') : t('logsToggleCollapsed');
    if (card.open) {
      fetchLogsHistory()
        .then(() => startLogsStream())
        .catch(() => { /* errors already surfaced by showErr */ });
    } else {
      stopLogsStream();
    }
  });

  $('logs-level').addEventListener('change', async (ev) => {
    Logs.minLevel = ev.target.value;
    await fetchLogsHistory();
  });

  $('logs-search').addEventListener('input', (ev) => {
    Logs.keyword = (ev.target.value || '').toLowerCase();
    renderLogsBody();
  });

  $('logs-pause-btn').addEventListener('click', () => {
    Logs.paused = !Logs.paused;
    $('logs-pause-btn').textContent = Logs.paused ? t('logsResume') : t('logsPause');
    if (Logs.paused) {
      body.classList.add('paused');
    } else {
      body.classList.remove('paused');
      renderLogsBody();
    }
  });

  $('logs-clear-btn').addEventListener('click', () => {
    Logs.entries = [];
    renderLogsBody();
  });

  body.addEventListener('scroll', () => {
    // Turn off auto-scroll if user scrolls up; re-enable when they scroll back to bottom.
    const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 24;
    Logs.autoScroll = atBottom;
  });
}

/* ── Boot ── */
async function boot() {
  applyLang();
  // Wire up the logs panel FIRST so it remains available as a diagnostic tool
  // even if loadSettings/refreshAll fail. bindLogsPanel is internally
  // idempotent (re-entry safe after repeated logins).
  try { bindLogsPanel(); } catch(e) { showErr(e); }
  try {
    await loadSettings();
    await refreshAll();
  } catch(e) { showErr(e); }
}

// Apply language on load (before auth)
applyLang();

// Auto-login if token exists in localStorage
if (S.token) {
  const btn = $('auth-submit');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>' + t('authSigningIn');
  tryAuth(S.token).then(async ok => {
    if (ok) { await showApp(); }
    else {
      localStorage.removeItem(TOKEN_KEY);
      S.token = '';
    }
  }).catch(() => {}).finally(() => {
    btn.disabled = false;
    btn.textContent = t('authSignIn');
  });
}
</script>
</body>
</html>`;
}
