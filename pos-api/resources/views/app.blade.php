<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Dashflow POS</title>
  <meta name="description" content="Manage and monitor your business from your phone." />

  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#008963" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Dashflow" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

  <style>
    :root {
      /* Precisely matches the Next.js web app's own light-mode tokens (converted
         from its oklch values) — white surfaces, the same green brand color,
         so the phone app and desktop app read as the same product. Everything
         below this — shadows, gradients, radii — is this same palette executed
         with more considered depth and polish, not a different color identity. */
      --bg: #f2f5f3;
      --panel: #ffffff;
      --panel-2: #edf1ee;
      --border: #e2e7e3;
      --border-strong: #d3dad4;
      --text: #101924;
      --muted: #616a75;
      --muted-2: #8790994d;
      --brand: #008963;
      --brand-dark: #00714f;
      --brand-light: #00a476;
      --brand-fg: #f6fefa;
      --brand-tint: #d9f2e7;
      --accent: #1d64c2;
      --accent-tint: #dbeafe;
      --violet: #6d28d9;
      --violet-tint: #ede9fe;
      --danger: #da283c;
      --danger-bg: #fce8ea;
      --success: #0f7a48;
      --success-bg: #e3f6ec;
      --warning: #92620a;
      --warning-bg: #fbeed7;

      /* Elevation scale — soft, layered, diffused shadows read as "designed"; a
         single flat 1px shadow (the old value everywhere here) reads as a
         template default. Each step layers a tight neutral contact shadow under a
         wider ambient one, and the ambient layer carries a faint brand-green tint
         rather than plain slate — the same trick premium light-theme apps use so
         shadows read as "this surface belongs to this product," not a generic
         card. A thin inset top highlight on the smallest step suggests a soft
         light source, the way a subtly embossed surface catches the eye. */
      --shadow-xs: 0 1px 2px rgba(16,24,40,0.06);
      --shadow-sm: 0 1px 2px rgba(16,24,40,0.05), 0 3px 10px rgba(0,110,80,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
      --shadow-md: 0 2px 6px rgba(16,24,40,0.06), 0 10px 26px rgba(0,110,80,0.09);
      --shadow-lg: 0 8px 16px rgba(16,24,40,0.07), 0 20px 46px rgba(0,110,80,0.13);
      --shadow-brand: 0 6px 18px rgba(0,137,99,0.32);

      --radius-sm: 10px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --ease: cubic-bezier(0.4, 0, 0.2, 1);
    }

    /*
     * Dark mode — same token names as :root above, so every component that already
     * reads var(--bg)/var(--panel)/etc. re-themes for free with zero per-component
     * changes. Set via [data-theme="dark"] on <html>, toggled from Settings and
     * persisted to localStorage (read by the inline script at the top of <head>,
     * before the stylesheet loads, so there's no flash of the light theme).
     * Deliberately near-black + one vivid lime accent, matching a specific reference
     * (glossy black fintech cards, single bright-green accent everywhere) rather than
     * a generic muted dark-navy palette.
     */
    [data-theme="dark"] {
      /* Near-black surfaces with a vivid lime accent — matches the reference fintech
         screens exactly (glossy black cards, one bright green used everywhere) rather
         than the softer dark-navy/teal draft this replaced. */
      --bg: #07080a;
      --panel: #101310;
      --panel-2: #1a1f18;
      --border: rgba(255,255,255,0.08);
      --border-strong: rgba(255,255,255,0.16);
      --text: #f4f7f0;
      --muted: #93a08d;
      --muted-2: rgba(147,160,141,0.35);
      --brand: #a6e22e;
      --brand-dark: #6f9c22;
      --brand-light: #c6f166;
      --brand-fg: #091306;
      --brand-tint: rgba(166,226,46,0.16);
      --accent: #5b9df9;
      --accent-tint: rgba(91,157,249,0.16);
      --violet: #b794f6;
      --violet-tint: rgba(183,148,246,0.16);
      --danger: #f87171;
      --danger-bg: rgba(248,113,113,0.15);
      --success: #a6e22e;
      --success-bg: rgba(166,226,46,0.15);
      --warning: #fbbf24;
      --warning-bg: rgba(251,191,36,0.15);

      --shadow-xs: 0 1px 2px rgba(0,0,0,0.4);
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.35), 0 2px 12px rgba(0,0,0,0.3);
      --shadow-md: 0 2px 10px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.35);
      --shadow-lg: 0 12px 24px rgba(0,0,0,0.42), 0 24px 56px rgba(0,0,0,0.45);
      --shadow-brand: 0 6px 22px rgba(166,226,46,0.4);
    }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0;
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      -webkit-tap-highlight-color: transparent;
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.011em;
    }
    input, select, button, textarea { font: inherit; letter-spacing: inherit; }
    /* A faint brand-tinted glow instead of a flat fill — the same low-opacity green wash used behind the login hero, just subtle enough here to read as texture rather than a visible gradient. Works unchanged in dark mode too, where it becomes a soft ambient glow against the near-black surface. */
    #app { max-width: 480px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; background: radial-gradient(140% 90% at 15% -12%, rgba(0,137,99,0.06), transparent 55%), var(--bg); position: relative; }
    .hidden { display: none !important; }

    /*
     * Desktop/tablet preview: below this width #app just fills the real device
     * screen edge-to-edge like a normal installed PWA — nothing here ever runs
     * on an actual phone. Above it, every "position: fixed" element in this
     * file (sidebar drawer, modal sheets, toasts, the bottom tab bar) is a
     * descendant of #app, and fixed positioning always resolves against the
     * nearest ancestor that establishes a containing block (a transform does
     * that) — so giving #app a transform and a real height turns it into a
     * self-contained phone screen instead of those elements escaping to the
     * edges of the browser window.
     *
     * #app itself must NOT also be the scrolling element: a transformed
     * ancestor that scrolls drags its "fixed" descendants along with the
     * scroll instead of keeping them pinned (exactly the bug where the
     * bottom tab bar drifted up on scroll) — because once a transform makes
     * it their containing block, they're positioned relative to that box's
     * content, not the visible viewport. So #app stays static (overflow:
     * hidden, just for the rounded corners) and <main> — the actual
     * scrollable panel content, sitting between the fixed header and the
     * fixed tab bar — is the one that scrolls internally instead.
     */
    @media (min-width: 600px) {
      body {
        display: flex; align-items: center; justify-content: center; padding: 32px 16px;
        background: radial-gradient(120% 120% at 50% -12%, #eef3f0 0%, #dde2e8 55%, #d1d7de 100%);
      }
      #app {
        width: 412px; height: min(860px, calc(100vh - 64px)); min-height: 0; margin: 0;
        border-radius: 44px; border: 10px solid #14181d;
        box-shadow: 0 32px 64px -16px rgba(16,24,40,0.38), 0 0 0 1px rgba(16,24,40,0.06);
        overflow: hidden;
        transform: translateZ(0);
      }
      #main-screen { min-height: 0; }
      #main-screen > main { flex: 1; min-height: 0; overflow-y: auto; }
      #main-screen > main::-webkit-scrollbar, .auth-form-area::-webkit-scrollbar { width: 0; height: 0; }
    }

    /* Tactile feedback — every primary interactive surface dips slightly on
       press, the single cheapest thing that makes a touch UI feel real
       instead of a static mockup. */
    button, .sidebar-link, .bottom-tab, .list-row[style*="cursor:pointer"], .category-pill, .pos-product-card, .payment-tile {
      transition: transform 0.12s var(--ease), background-color 0.15s var(--ease), border-color 0.15s var(--ease), box-shadow 0.15s var(--ease), opacity 0.15s var(--ease);
    }
    button:active { transform: scale(0.97); }
    .pos-product-card:active, .category-pill:active, .payment-tile:active { transform: scale(0.96); }

    /* --- Login / signup: green hexagon hero on top, white form sheet below —
       the same two-tone brand language as the web app's split auth screen,
       stacked vertically instead of side-by-side for a phone-width viewport. --- */
    #login-screen { flex: 1; display: flex; flex-direction: column; }
    .auth-hero {
      position: relative; overflow: hidden; color: #fff;
      background:
        radial-gradient(120% 140% at 15% -10%, rgba(255,255,255,0.16), transparent 55%),
        linear-gradient(160deg, var(--brand-light) 0%, var(--brand) 45%, var(--brand-dark) 100%);
      padding: 44px 24px 52px; flex-shrink: 0;
    }
    .hex-field { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.35; }
    .auth-hero-content { position: relative; }
    .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
    .brand-mark { width: 30px; height: 30px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.15)); }
    .brand-name { font-size: 1.12rem; font-weight: 800; letter-spacing: -0.02em; }
    .auth-hero-text { font-size: 0.95rem; line-height: 1.55; color: rgba(255,255,255,0.94); max-width: 300px; }
    .auth-form-area {
      flex: 1; background: var(--panel); border-radius: var(--radius-lg) var(--radius-lg) 0 0; margin-top: -22px;
      position: relative; z-index: 2; padding: 28px 24px 24px; overflow-y: auto;
      box-shadow: 0 -8px 24px rgba(16,25,36,0.08);
    }
    .auth-form-header { margin-bottom: 22px; }
    .auth-form-header h2 { margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .tagline { color: var(--muted); font-size: 0.85rem; margin-top: 2px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 0.8rem; color: var(--muted); font-weight: 500; }
    input[type=email], input[type=password], input[type=text], input[type=number], select, textarea {
      background: var(--panel); border: 1.5px solid var(--border); color: var(--text);
      border-radius: var(--radius-sm); padding: 12px 14px; font-size: 0.95rem; width: 100%;
      transition: border-color 0.15s var(--ease), box-shadow 0.15s var(--ease);
    }
    input:focus, select:focus, textarea:focus {
      outline: none; border-color: var(--brand); box-shadow: 0 0 0 3.5px var(--brand-tint);
    }
    textarea { resize: vertical; min-height: 72px; }
    .input-icon { position: relative; }
    .input-icon svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--muted); pointer-events: none; }
    .input-icon input { padding-left: 38px; }
    button { cursor: pointer; border: none; border-radius: var(--radius-sm); font-weight: 600; }
    .btn-primary {
      background: linear-gradient(180deg, var(--brand-light), var(--brand) 60%, var(--brand-dark));
      color: var(--brand-fg); padding: 13px; font-size: 0.95rem;
      box-shadow: var(--shadow-brand), inset 0 1px 0 rgba(255,255,255,0.16);
    }
    .btn-primary:active { box-shadow: 0 2px 6px rgba(0,137,99,0.25), inset 0 1px 0 rgba(255,255,255,0.1); }
    .btn-primary:disabled { opacity: 0.55; box-shadow: none; }
    .btn-secondary { background: var(--panel); color: var(--text); border: 1.5px solid var(--border); padding: 10px 14px; font-size: 0.85rem; box-shadow: var(--shadow-xs); }
    .btn-secondary:active { background: var(--panel-2); }
    .btn-secondary.active { background: var(--brand); color: var(--brand-fg); border-color: var(--brand); box-shadow: var(--shadow-brand); }
    .btn-danger { background: var(--danger-bg); color: var(--danger); padding: 8px 12px; font-size: 0.8rem; }
    .btn-success { background: var(--success-bg); color: var(--success); padding: 8px 12px; font-size: 0.8rem; }
    .error { color: var(--danger); font-size: 0.85rem; min-height: 1.1em; }
    .auth-switch { margin-top: 20px; text-align: center; font-size: 0.85rem; color: var(--muted); }
    .auth-switch a { color: var(--brand); font-weight: 700; text-decoration: none; }
    .install-hint { text-align: center; color: var(--muted); font-size: 0.78rem; margin-top: 20px; }

    /* --- App shell --- */
    #main-screen { flex: 1; display: flex; flex-direction: column; position: relative; }
    header.topbar {
      padding: 13px 16px; display: flex; align-items: center; gap: 10px;
      background: var(--panel); border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 15; box-shadow: var(--shadow-xs);
    }
    .icon-btn { background: none; color: var(--text); padding: 6px; flex-shrink: 0; display: flex; border-radius: 10px; }
    .icon-btn:active { background: var(--panel-2); }
    .icon-btn svg { width: 22px; height: 22px; }
    .notif-badge {
      position: absolute; top: 2px; right: 2px; min-width: 16px; height: 16px; padding: 0 3px;
      border-radius: 999px; background: var(--danger); color: #fff; font-size: 0.62rem; font-weight: 700;
      line-height: 16px; text-align: center; box-shadow: 0 0 0 2px var(--panel);
    }
    .topbar-title { flex: 1; min-width: 0; }
    header.topbar .biz-name { font-weight: 800; font-size: 1.03rem; letter-spacing: -0.02em; }
    header.topbar .biz-sub { color: var(--muted); font-size: 0.78rem; margin-top: 2px; font-weight: 500; }
    .branch-select {
      margin-top: 4px; padding: 4px 10px; font-size: 0.78rem; font-weight: 700; color: var(--brand);
      background: var(--brand-tint); border: 1px solid rgba(0,137,99,0.14); border-radius: 8px; max-width: 100%;
    }
    #logout-btn { flex-shrink: 0; }
    main { flex: 1; overflow-y: auto; padding: 16px 16px 90px; }
    .card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow-sm); }

    .greeting-row { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; gap: 12px; }
    .greeting { margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.025em; }
    .greeting-sub { margin: 3px 0 0; color: var(--muted); font-size: 0.83rem; }
    .greeting-clock { text-align: right; flex-shrink: 0; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; box-shadow: var(--shadow-xs); }
    .greeting-time { font-size: 1.1rem; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
    .greeting-date { color: var(--muted); font-size: 0.72rem; margin-top: 1px; }

    /*
     * Overview hero — same gradient recipe as the login screen's .auth-hero, reused
     * here so the very first thing a signed-in user sees still feels like a
     * considered, designed product rather than a flat white admin list. Everything
     * below it (stat card tints) stays in the app's established light theme; this is
     * the one deliberately bold, saturated surface on the page.
     */
    .overview-hero {
      position: relative; overflow: hidden; border-radius: var(--radius-lg);
      padding: 20px 18px; margin-bottom: 18px; box-shadow: var(--shadow-brand);
      background:
        radial-gradient(120% 140% at 88% -20%, rgba(255,255,255,0.22), transparent 55%),
        linear-gradient(155deg, var(--brand-light) 0%, var(--brand) 55%, var(--brand-dark) 100%);
    }
    .overview-hero::after {
      content: ""; position: absolute; inset: 0; pointer-events: none;
      background-image: radial-gradient(circle at 92% 15%, rgba(255,255,255,0.16), transparent 42%);
    }
    .overview-hero .greeting-row { position: relative; z-index: 1; margin-bottom: 0; }
    .overview-hero .greeting { color: #fff; }
    .overview-hero .greeting-sub { color: rgba(255,255,255,0.86); }
    .overview-hero .greeting-clock { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.28); backdrop-filter: blur(6px); box-shadow: none; }
    .overview-hero .greeting-time { color: #fff; }
    .overview-hero .greeting-date { color: rgba(255,255,255,0.78); }

    /* Soft colour wash per stat, matching that card's own icon hue — turns four identical white tiles into a set that reads at a glance. Each also gets a faint glow in the same hue, the light-theme equivalent of the reference's glowing dark tiles. */
    .stat-tint-revenue { background: linear-gradient(160deg, var(--panel) 45%, var(--brand-tint)); border-color: rgba(0,137,99,0.16); box-shadow: 0 10px 22px -12px rgba(0,137,99,0.35), var(--shadow-sm); }
    .stat-tint-receipts { background: linear-gradient(160deg, var(--panel) 45%, var(--accent-tint)); border-color: rgba(29,100,194,0.16); box-shadow: 0 10px 22px -12px rgba(29,100,194,0.32), var(--shadow-sm); }
    .stat-tint-stock { background: linear-gradient(160deg, var(--panel) 45%, var(--warning-bg)); border-color: rgba(146,98,10,0.16); box-shadow: 0 10px 22px -12px rgba(146,98,10,0.3), var(--shadow-sm); }
    .stat-tint-customers { background: linear-gradient(160deg, var(--panel) 45%, var(--violet-tint)); border-color: rgba(109,40,217,0.16); box-shadow: 0 10px 22px -12px rgba(109,40,217,0.32), var(--shadow-sm); }

    /*
     * Today-vs-average gauge — the one borrowed "instrument panel" piece from the
     * dark-dial reference, rebuilt as a real light-theme SVG ring rather than copying
     * its dark styling. The percentage is genuine (today's revenue over this week's
     * daily average, both already fetched for the bar chart below), not decorative.
     */
    .gauge-card { display: flex; align-items: center; gap: 16px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm); }
    .gauge-ring-wrap { position: relative; width: 100px; height: 100px; flex-shrink: 0; filter: drop-shadow(0 0 12px rgba(0,137,99,0.3)); }
    .gauge-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
    .gauge-track { fill: none; stroke: var(--panel-2); stroke-width: 10; }
    .gauge-fill { fill: none; stroke: url(#gaugeGradient); stroke-width: 10; stroke-linecap: round; stroke-dasharray: 0 326.73; transition: stroke-dasharray 0.7s var(--ease); }
    .gauge-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .gauge-value { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }
    .gauge-value-label { font-size: 0.6rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 1px; }
    .gauge-info-title { font-size: 0.86rem; font-weight: 700; }
    .gauge-info-sub { font-size: 0.76rem; color: var(--muted); margin-top: 3px; line-height: 1.4; }

    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .stat-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat-grid-3 .stat { padding: 10px; gap: 2px; }
    .stat-grid-3 .stat .label { font-size: 0.62rem; }
    .stat-grid-3 .stat .value { font-size: 0.92rem; }
    .stat-grid-3 .stat .hint { font-size: 0.65rem; }
    .stat { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 10px; }
    .stat-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); }
    .stat-icon svg { width: 17px; height: 17px; }
    .stat-icon-revenue { background: linear-gradient(155deg, #e4f8ef, var(--brand-tint)); color: var(--brand); }
    .stat-icon-receipts { background: linear-gradient(155deg, #eaf2ff, var(--accent-tint)); color: var(--accent); }
    .stat-icon-stock { background: linear-gradient(155deg, #fdf3e2, var(--warning-bg)); color: var(--warning); }
    .stat-icon-customers { background: linear-gradient(155deg, #f2eefc, var(--violet-tint)); color: var(--violet); }
    .stat .label { color: var(--muted); font-size: 0.71rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.045em; }
    .stat .value { font-size: 1.22rem; font-weight: 800; margin-top: 3px; line-height: 1.15; letter-spacing: -0.02em; }
    .stat .hint { font-size: 0.72rem; color: var(--muted); margin-top: 3px; min-height: 1em; }
    .stat .hint.up { color: var(--success); font-weight: 600; }
    .stat .hint.down { color: var(--danger); font-weight: 600; }

    .section-title { font-size: 0.97rem; font-weight: 700; margin: 20px 0 10px; letter-spacing: -0.01em; }
    .section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .section-value { font-weight: 700; font-size: 0.95rem; }

    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 6px; }
    .bar-col .bar { width: 100%; max-width: 26px; background: linear-gradient(180deg, var(--brand-tint), #c7ecdc); border-radius: 6px 6px 3px 3px; min-height: 3px; transition: height 0.4s var(--ease); }
    .bar-col.today .bar { background: linear-gradient(180deg, var(--brand-light), var(--brand-dark)); box-shadow: 0 2px 8px rgba(0,137,99,0.25); }
    .bar-col .bar-day { font-size: 0.68rem; color: var(--muted); font-weight: 500; }

    /* --- Payment mix donut (pure CSS, zero-dependency conic-gradient) --- */
    .donut-chart { width: 140px; height: 140px; border-radius: 50%; margin: 4px auto 14px; position: relative; flex-shrink: 0; box-shadow: var(--shadow-sm); }
    .donut-chart::after { content: ""; position: absolute; inset: 24px; border-radius: 50%; background: var(--panel); box-shadow: inset 0 1px 3px rgba(16,24,40,0.06); }
    .donut-legend { display: flex; flex-direction: column; gap: 8px; }
    .donut-legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
    .donut-legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .list-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); gap: 10px; }
    .list-row:last-child { border-bottom: none; }
    .list-row .name { font-size: 0.9rem; font-weight: 500; }
    .list-row .meta { color: var(--muted); font-size: 0.76rem; margin-top: 2px; }
    .list-row .amount { font-weight: 700; font-size: 0.9rem; white-space: nowrap; }

    /* --- Ranked bar list (branch/product revenue breakdowns) --- */
    .rank-list { display: flex; flex-direction: column; gap: 12px; }
    .rank-row-top { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 5px; font-size: 0.85rem; }
    .rank-row-name { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rank-row-value { color: var(--muted); font-weight: 600; white-space: nowrap; }
    .rank-bar-track { height: 8px; border-radius: 5px; background: var(--panel-2); overflow: hidden; }
    .rank-bar-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--brand-light), var(--brand)); transition: width 0.4s var(--ease); }

    .pill { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 0.7rem; font-weight: 700; letter-spacing: -0.01em; }
    .pill-warn { background: var(--warning-bg); color: var(--warning); }
    .pill-ok { background: var(--success-bg); color: var(--success); }
    .pill-danger { background: var(--danger-bg); color: var(--danger); }
    .empty { color: var(--muted); font-size: 0.85rem; text-align: center; padding: 28px 0; }
    .search-row { margin-bottom: 12px; }
    .subtabs { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .subtabs button { flex: 1; }

    /* --- Loading feedback: every async panel load shows this immediately,
       so a several-second wait never looks like a frozen/broken screen. --- */
    .loading-row { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 28px 0; color: var(--muted); font-size: 0.85rem; }
    .spinner { width: 17px; height: 17px; border: 2.5px solid var(--border); border-top-color: var(--brand); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    button .spinner { border-color: rgba(255,255,255,0.4); border-top-color: #fff; }
    .btn-secondary .spinner, .btn-danger .spinner, .btn-success .spinner { border-color: var(--border); border-top-color: currentColor; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; animation: fade-in 0.2s var(--ease); }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .toast {
      position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: var(--text); color: var(--panel);
      padding: 11px 18px; border-radius: 999px; font-size: 0.85rem; font-weight: 500; z-index: 50; max-width: 90%;
      text-align: center; box-shadow: var(--shadow-lg); animation: toast-in 0.2s var(--ease);
    }
    .toast.error { background: var(--danger); color: #fff; }
    .toast.success { background: var(--success); color: #fff; }

    /* --- Sales terminal (New Sale) --- */
    .warning-banner {
      display: flex; align-items: center; gap: 10px; background: var(--warning-bg); color: var(--warning);
      border-radius: 10px; padding: 10px 12px; font-size: 0.82rem; margin-bottom: 12px;
    }
    .warning-banner svg { width: 17px; height: 17px; flex-shrink: 0; }
    .category-pills { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; margin-bottom: 12px; }
    .category-pill {
      flex-shrink: 0; background: var(--panel); border: 1px solid var(--border); color: var(--muted);
      padding: 6px 14px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; white-space: nowrap;
    }
    .category-pill.active { background: var(--brand); border-color: var(--brand); color: var(--brand-fg); box-shadow: var(--shadow-brand); }
    .pos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .pos-product-card {
      background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px;
      text-align: left; box-shadow: var(--shadow-sm);
    }
    .pos-product-card:disabled { opacity: 0.45; }
    .pos-product-card .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
    .pos-product-card .pname { font-size: 0.85rem; font-weight: 600; line-height: 1.25; }
    .pos-product-card .pcat { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }
    .pos-product-card .pprice { font-size: 1rem; font-weight: 700; margin-top: 10px; color: var(--brand); }
    .pos-product-card .pstock { font-size: 0.68rem; padding: 1px 6px; border-radius: 999px; background: var(--panel-2); color: var(--muted); flex-shrink: 0; }
    .pos-product-card .pstock.low { background: var(--warning-bg); color: var(--warning); }

    .cart-count-badge { background: var(--panel-2); color: var(--muted); font-size: 0.72rem; padding: 2px 10px; border-radius: 999px; }
    .cart-line { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); gap: 8px; }
    .cart-line:last-child { border-bottom: none; }
    .cart-line .cname { font-size: 0.87rem; font-weight: 500; }
    .cart-line .cmeta { font-size: 0.74rem; color: var(--muted); margin-top: 1px; }
    .qty-stepper { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .qty-stepper button { width: 26px; height: 26px; border-radius: 8px; background: var(--panel-2); color: var(--text); padding: 0; display: flex; align-items: center; justify-content: center; }
    .qty-stepper button svg { width: 13px; height: 13px; }
    .qty-stepper span { min-width: 18px; text-align: center; font-size: 0.85rem; font-weight: 600; }

    .totals-list { margin: 14px 0 0; padding-top: 12px; border-top: 1px solid var(--border); }
    .totals-row { display: flex; justify-content: space-between; font-size: 0.87rem; color: var(--muted); padding: 3px 0; }
    .totals-row-final { border-top: 1px solid var(--border); margin-top: 6px; padding-top: 8px; font-size: 1.05rem; font-weight: 700; color: var(--text); }

    .payment-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
    .payment-tile {
      display: flex; flex-direction: column; align-items: center; gap: 5px; background: var(--panel);
      border: 1px solid var(--border); border-radius: 12px; padding: 10px 4px; font-size: 0.72rem; font-weight: 600; color: var(--muted);
    }
    .payment-tile svg { width: 17px; height: 17px; }
    .payment-tile.active { border-color: var(--brand); background: var(--brand-tint); color: var(--brand); }

    .badge { position: absolute; top: -6px; right: -6px; background: var(--brand); color: var(--brand-fg); font-size: 0.65rem; font-weight: 700; min-width: 16px; height: 16px; border-radius: 999px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(9,16,24,0.5); backdrop-filter: blur(1.5px); z-index: 45; animation: fade-in 0.18s var(--ease); }
    .modal-sheet {
      position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; max-width: 480px;
      background: var(--panel); border-radius: var(--radius-lg) var(--radius-lg) 0 0; z-index: 46; max-height: 70vh; display: flex; flex-direction: column;
      box-shadow: var(--shadow-lg); animation: sheet-up 0.22s var(--ease);
    }
    .modal-sheet::before {
      content: ""; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
      width: 36px; height: 4px; border-radius: 999px; background: var(--border-strong);
    }
    @keyframes sheet-up { from { transform: translate(-50%, 16px); opacity: 0.7; } to { transform: translateX(-50%); opacity: 1; } }
    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 18px 16px; border-bottom: 1px solid var(--border); }
    #held-sales-list { overflow-y: auto; padding: 8px 18px 18px; }

    /* Printing a receipt shows only the receipt content — everything else on the page is hidden. */
    #receipt-print-area { display: none; }
    @media print {
      body.printing-receipt > *:not(#receipt-print-area) { display: none !important; }
      body.printing-receipt #receipt-print-area { display: block !important; padding: 24px; }
    }

    /* Same pattern for printing a payslip. */
    #payslip-print-area { display: none; }
    @media print {
      body.printing-payslip > *:not(#payslip-print-area) { display: none !important; }
      body.printing-payslip #payslip-print-area { display: block !important; padding: 24px; }
    }

    /* --- QR Scanner --- */
    .qr-frame {
      width: 100%; max-width: 280px; aspect-ratio: 1/1; margin: 0 auto; border-radius: 16px;
      background: var(--panel-2); border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center;
      position: relative;
    }
    #qr-camera-on { border: 2px solid var(--brand); background: #000; }
    .qr-viewfinder { position: absolute; inset: 20px; border: 2px dashed rgba(255,255,255,0.8); border-radius: 12px; pointer-events: none; }
    .scan-unsupported-icon {
      width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 14px; background: var(--panel-2);
      display: flex; align-items: center; justify-content: center; color: var(--muted);
    }
    .scan-unsupported-icon svg { width: 26px; height: 26px; }
    .qr-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 4px; }

    /* --- Sidebar: slides in from the left, one entry per subscribed module. --- */
    .sidebar-backdrop { position: fixed; inset: 0; background: rgba(9,16,24,0.5); backdrop-filter: blur(1.5px); z-index: 40; animation: fade-in 0.18s var(--ease); }
    .sidebar {
      position: fixed; top: 0; bottom: 0; left: 0; width: 80%; max-width: 300px; background: var(--panel);
      z-index: 41; transform: translateX(-100%); transition: transform 0.28s var(--ease); display: flex; flex-direction: column;
      box-shadow: var(--shadow-lg);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-header {
      display: flex; align-items: center; gap: 10px; padding: 22px 18px; flex-shrink: 0;
      background: linear-gradient(155deg, var(--brand-light), var(--brand) 70%, var(--brand-dark)); color: #fff;
    }
    .sidebar-header .brand-mark { width: 28px; height: 28px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.15)); }
    .sidebar-header .brand-name { color: #fff !important; }
    .sidebar-nav { flex: 1; overflow-y: auto; padding: 12px 10px; }
    .sidebar-group-label {
      font-size: 0.68rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em;
      padding: 14px 12px 6px;
    }
    .sidebar-group-label:first-child { padding-top: 6px; }
    .sidebar-link {
      width: 100%; display: flex; align-items: center; gap: 12px; background: none; color: var(--text);
      padding: 11px 12px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500; text-align: left; margin-bottom: 2px;
    }
    .sidebar-link:active { background: var(--panel-2); }
    .sidebar-link svg { width: 19px; height: 19px; color: var(--muted); flex-shrink: 0; }
    .sidebar-link.active { background: var(--brand-tint); color: var(--brand); font-weight: 700; }
    .sidebar-link.active svg { color: var(--brand); }

    .back-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .back-row strong { font-size: 1.08rem; font-weight: 800; letter-spacing: -0.02em; }

    .attendance-status { text-align: center; padding: 10px 0 4px; }
    .attendance-status .big-pill { display: inline-block; padding: 6px 16px; border-radius: 999px; font-weight: 700; font-size: 0.9rem; margin-bottom: 14px; }

    /* --- Bottom tab bar: 4 quick-access destinations; everything else lives behind Menu. --- */
    nav.tabbar {
      position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 100%; max-width: 480px; background: var(--panel);
      border-top: 1px solid var(--border); display: flex; padding: 7px 6px calc(7px + env(safe-area-inset-bottom));
      box-shadow: 0 -4px 16px rgba(16,25,36,0.06); z-index: 20;
    }
    .bottom-tab { flex: 1; background: none; color: var(--muted); font-size: 0.67rem; font-weight: 600; padding: 7px 2px; display: flex; flex-direction: column; align-items: center; gap: 3px; border-radius: 12px; }
    .bottom-tab.active { color: var(--brand); background: var(--brand-tint); }
    .bottom-tab svg { width: 20px; height: 20px; transition: transform 0.15s var(--ease); }
    .bottom-tab.active svg { transform: translateY(-1px); }

    /* --- Settings / Profile --- */
    .profile-row { display: flex; align-items: center; gap: 14px; }
    .profile-avatar {
      width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(155deg, var(--brand-light), var(--brand-dark));
      color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.05rem;
      flex-shrink: 0; box-shadow: var(--shadow-brand);
    }
    .profile-name { font-weight: 800; font-size: 1.03rem; letter-spacing: -0.01em; }
    .profile-meta { color: var(--muted); font-size: 0.8rem; margin-top: 2px; }
    input:disabled { opacity: 0.6; }
  </style>
</head>
<body>
  <div id="app">

    <!-- ============== LOGIN / SIGNUP ============== -->
    <section id="login-screen">
      <div class="auth-hero">
        <svg class="hex-field" id="hex-field" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid slice"></svg>
        <div class="auth-hero-content">
          <div class="brand">
            <svg class="brand-mark" viewBox="0 0 40 40" fill="none">
              <polygon points="20.00,2.00 35.59,11.00 35.59,29.00 20.00,38.00 4.41,29.00 4.41,11.00" stroke="#ffffff" stroke-width="1.75" stroke-linejoin="round"/>
              <polygon points="20.00,11.50 27.36,15.75 27.36,24.25 20.00,28.50 12.64,24.25 12.64,15.75" fill="#ffffff"/>
            </svg>
            <span class="brand-name">Dashflow POS</span>
          </div>
          <p class="auth-hero-text" id="auth-hero-text">Run every branch from your phone — sales, stock, staff and expenses, in real time.</p>
        </div>
      </div>

      <div class="auth-form-area">
        <!-- Login -->
        <div id="login-form-wrap">
          <div class="auth-form-header">
            <h2>Welcome back</h2>
            <p class="tagline">Secure login portal</p>
          </div>

          <form id="login-form">
            <div class="field">
              <label for="login-email">Email</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                <input type="email" id="login-email" autocomplete="username" placeholder="you@business.co.ke" required />
              </div>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="login-password">Password</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
                <input type="password" id="login-password" autocomplete="current-password" placeholder="••••••••" required />
              </div>
            </div>
            <p class="error" id="login-error"></p>
            <button type="submit" class="btn-primary" id="login-submit" style="width:100%;margin-top:6px;">Log in</button>
          </form>

          <p class="auth-switch">Don't have an account? <a href="#" data-show-signup>Sign up here</a></p>
        </div>

        <!-- Signup -->
        <div id="signup-form-wrap" class="hidden">
          <div class="auth-form-header">
            <h2>Create an account</h2>
            <p class="tagline">Set up your business in minutes</p>
          </div>

          <form id="signup-form">
            <div class="field">
              <label for="signup-username">Username</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1"/></svg>
                <input type="text" id="signup-username" placeholder="e.g. jkariuki" required />
              </div>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="signup-email">Email</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                <input type="email" id="signup-email" placeholder="you@business.co.ke" required />
              </div>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="signup-phone">Phone</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <input type="text" id="signup-phone" placeholder="0712 345 678" required />
              </div>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="signup-business">Business name</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="7" width="16" height="13" rx="1"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
                <input type="text" id="signup-business" placeholder="e.g. Meridian Traders Ltd" required />
              </div>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="signup-role">Your role at this business</label>
              <select id="signup-role">
                <option value="admin">Admin (owner)</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="signup-password">Password</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
                <input type="password" id="signup-password" placeholder="At least 8 characters" minlength="8" required />
              </div>
            </div>
            <div class="field" style="margin-top:12px;">
              <label for="signup-confirm">Confirm password</label>
              <div class="input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>
                <input type="password" id="signup-confirm" placeholder="••••••••" minlength="8" required />
              </div>
            </div>
            <p class="error" id="signup-error"></p>
            <button type="submit" class="btn-primary" id="signup-submit" style="width:100%;margin-top:10px;">Create account</button>
          </form>

          <p class="auth-switch">Already have an account? <a href="#" data-show-login>Sign in</a></p>
        </div>

        <p class="install-hint" id="install-hint">
          Tip: use your browser menu → <strong>Add to Home screen</strong> to install this app.
        </p>
        <button id="install-btn" class="btn-secondary hidden" style="margin-top:4px;">Install app</button>
      </div>
    </section>

    <!-- ============== MAIN APP ============== -->
    <section id="main-screen" class="hidden">
      <header class="topbar">
        <div class="topbar-title">
          <div class="biz-name" id="biz-name">—</div>
          <select id="branch-select" class="branch-select hidden"></select>
          <div class="biz-sub hidden" id="biz-sub">—</div>
        </div>
        <button type="button" class="icon-btn" id="notif-bell-btn" style="position:relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/></svg>
          <span id="notif-bell-badge" class="notif-badge hidden">0</span>
        </button>
      </header>

      <div id="sidebar-backdrop" class="sidebar-backdrop hidden"></div>
      <aside id="sidebar" class="sidebar">
        <div class="sidebar-header">
          <svg class="brand-mark" viewBox="0 0 40 40" fill="none">
            <polygon points="20.00,2.00 35.59,11.00 35.59,29.00 20.00,38.00 4.41,29.00 4.41,11.00" stroke="#00b388" stroke-width="1.75" stroke-linejoin="round"/>
            <polygon points="20.00,11.50 27.36,15.75 27.36,24.25 20.00,28.50 12.64,24.25 12.64,15.75" fill="#00b388"/>
          </svg>
          <span class="brand-name" style="color:var(--text);">Dashflow POS</span>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav"></nav>
      </aside>

      <main>
        <!-- Overview -->
        <div class="tab-panel active" data-panel="overview">
          <div class="overview-hero">
            <div class="greeting-row">
              <div>
                <h2 class="greeting" id="greeting-text">Hello</h2>
                <p class="greeting-sub" id="greeting-sub">—</p>
              </div>
              <div class="greeting-clock" id="greeting-clock">
                <div class="greeting-time" id="greeting-time">--:--</div>
                <div class="greeting-date" id="greeting-date">—</div>
              </div>
            </div>
          </div>

          <div class="gauge-card">
            <div class="gauge-ring-wrap">
              <svg viewBox="0 0 120 120" class="gauge-ring">
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--brand-light)"/>
                    <stop offset="100%" stop-color="var(--brand-dark)"/>
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" class="gauge-track"/>
                <circle cx="60" cy="60" r="52" class="gauge-fill" id="gauge-fill-circle"/>
              </svg>
              <div class="gauge-center">
                <div class="gauge-value" id="gauge-pct">—</div>
                <div class="gauge-value-label">of avg day</div>
              </div>
            </div>
            <div>
              <div class="gauge-info-title">Today vs your weekly average</div>
              <div class="gauge-info-sub" id="gauge-info-sub">Loading…</div>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat stat-tint-revenue">
              <div class="stat-icon stat-icon-revenue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 6v.01M18 18v.01"/></svg>
              </div>
              <div class="stat-body">
                <div class="label">Revenue today</div>
                <div class="value" id="stat-sales-total">—</div>
                <div class="hint" id="stat-sales-delta"></div>
              </div>
            </div>
            <div class="stat stat-tint-receipts">
              <div class="stat-icon stat-icon-receipts">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 3h16v18l-3-2-2 2-2-2-2 2-2-2-2 2-3-2z"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>
              </div>
              <div class="stat-body">
                <div class="label">Receipts today</div>
                <div class="value" id="stat-sales-count">—</div>
                <div class="hint" id="stat-avg-basket"></div>
              </div>
            </div>
            <div class="stat stat-tint-stock">
              <div class="stat-icon stat-icon-stock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
              <div class="stat-body">
                <div class="label">Stock value</div>
                <div class="value" id="stat-stock-value">—</div>
                <div class="hint" id="stat-low-stock-hint"></div>
              </div>
            </div>
            <div class="stat stat-tint-customers">
              <div class="stat-icon stat-icon-customers">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
              <div class="stat-body">
                <div class="label">Customers</div>
                <div class="value" id="stat-customers">—</div>
                <div class="hint">on account</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="section-title-row">
              <div class="section-title" style="margin:0;">Revenue this week</div>
              <div class="section-value" id="week-revenue">—</div>
            </div>
            <div class="bar-chart" id="revenue-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;display:flex;align-items:center;gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="width:16px;height:16px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
              Low stock alerts
            </div>
            <div id="low-stock-list"><p class="empty">Loading…</p></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Recent sales</div>
            <div id="overview-recent-sales"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- Products -->
        <div class="tab-panel" data-panel="products">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Stock</strong></div>

          <div class="stat-grid">
            <div class="stat">
              <div class="label">Stock value</div>
              <div class="value" id="products-stat-value">—</div>
              <div class="hint">at buying price</div>
            </div>
            <div class="stat">
              <div class="label">Low stock</div>
              <div class="value" id="products-stat-low">—</div>
              <div class="hint" id="products-stat-total"></div>
            </div>
          </div>

          <button type="button" class="btn-primary" id="product-add-btn" style="width:100%;margin-bottom:12px;">+ Add product</button>
          <div class="search-row"><input type="text" id="product-search" placeholder="Search products" /></div>
          <div class="card"><div id="products-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- Add / edit product sheet -->
        <div id="product-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="product-modal" class="modal-sheet hidden" style="max-height:85vh;">
          <div class="modal-header">
            <strong id="product-modal-title">Add product</strong>
            <button type="button" class="icon-btn" id="product-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="product-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <input type="hidden" id="product-id" />
            <div class="field"><label for="product-name">Product name</label><input type="text" id="product-name" required /></div>
            <div class="field" style="margin-top:10px;">
              <label for="product-category">Category</label>
              <input type="text" id="product-category" list="product-category-options" placeholder="e.g. Beverages" />
              <datalist id="product-category-options"></datalist>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="product-selling-price">Selling price</label><input type="number" id="product-selling-price" min="0.01" step="0.01" required /></div>
              <div class="field"><label for="product-buying-price">Buying price</label><input type="number" id="product-buying-price" min="0" step="0.01" /></div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="product-stock">Stock</label><input type="number" id="product-stock" min="0" step="1" /></div>
              <div class="field"><label for="product-low-stock">Low stock at</label><input type="number" id="product-low-stock" min="0" step="1" placeholder="12" /></div>
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="product-branch">Branch</label>
              <select id="product-branch"><option value="">Unassigned</option></select>
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="product-expiry">Expiry date <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
              <input type="date" id="product-expiry" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="product-image-file">Product image <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
              <img id="product-image-preview" style="display:none;width:64px;height:64px;object-fit:cover;border-radius:10px;border:1px solid var(--border);margin-bottom:6px;" />
              <input type="file" id="product-image-file" accept="image/*" />
              <button type="button" class="btn-secondary" id="product-image-remove-btn" style="display:none;margin-top:6px;">Remove image</button>
            </div>
            <p class="error" id="product-form-error"></p>
            <button type="submit" class="btn-primary" id="product-form-submit" style="width:100%;margin-top:10px;">Save product</button>
            <button type="button" class="btn-danger" id="product-delete-btn" style="width:100%;margin-top:8px;display:none;">Delete product</button>
          </form>
        </div>

        <!-- Inventory dashboard -->
        <div class="tab-panel" data-panel="inventory">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Inventory</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;" id="inv-subtitle">Business-wide stock summary</p>

          <div class="stat-grid">
            <div class="stat">
              <div class="label">Stock value</div>
              <div class="value" id="inv-stat-cost">—</div>
              <div class="hint">at buying price</div>
            </div>
            <div class="stat">
              <div class="label">Retail value</div>
              <div class="value" id="inv-stat-retail">—</div>
              <div class="hint">at selling price</div>
            </div>
          </div>
          <div class="stat-grid-3">
            <div class="stat">
              <div class="label">SKUs</div>
              <div class="value" id="inv-stat-skus">—</div>
            </div>
            <div class="stat">
              <div class="label">Stock units</div>
              <div class="value" id="inv-stat-units">—</div>
            </div>
            <div class="stat">
              <div class="label">Low stock</div>
              <div class="value" id="inv-stat-low">—</div>
            </div>
          </div>

          <button type="button" class="btn-primary" id="inv-add-product-btn" style="width:100%;margin-top:6px;">+ Add product</button>

          <div class="card" style="margin-top:14px;">
            <div class="section-title" style="margin-top:0;">Stock level analytics</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Every product, by stock status</p>
            <div id="inv-levels-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Top movers</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Best sellers by revenue, last 30 days</p>
            <div class="rank-list" id="inv-movers-list"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Stock by branch</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Value per branch, at cost</p>
            <div class="rank-list" id="inv-branch-list"></div>
          </div>

          <div class="card">
            <div class="section-title-row" style="margin-top:0;">
              <div class="section-title" style="margin:0;display:flex;align-items:center;gap:6px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="width:16px;height:16px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
                Low stock alerts
              </div>
            </div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Products at or below their reorder point</p>
            <div id="inv-low-stock-list"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- Expiry tracking -->
        <div class="tab-panel" data-panel="expiry">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Expiry Tracking</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Products expiring within the next 30 days</p>

          <div class="stat-grid">
            <div class="stat">
              <div class="label">Expiring soon</div>
              <div class="value" id="expiry-stat-count">—</div>
            </div>
            <div class="stat">
              <div class="label">Alert window</div>
              <div class="value">30 days</div>
            </div>
          </div>

          <div class="card"><div id="expiry-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- Sales -->
        <div class="tab-panel" data-panel="sales">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Sales</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Last 30 days, vs the 30 days before</p>

          <div class="stat-grid" id="sales-stat-grid" style="margin:0 0 4px;">
            <div class="loading-row"><div class="spinner"></div> Loading…</div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Sales over time</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Daily revenue, last 14 days</p>
            <div class="bar-chart" id="sales-trend-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Sales by category</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Revenue share, last 30 days</p>
            <div id="sales-category-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Sales by branch</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Revenue by location, last 30 days</p>
            <div class="rank-list" id="sales-branch-list"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Top 5 products</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">By revenue, last 30 days</p>
            <div class="rank-list" id="sales-products-list"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Orders by payment mode</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Share of receipts, last 30 days</p>
            <div id="sales-payment-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Sales vs profit</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Daily, last 14 days</p>
            <div class="bar-chart" id="sales-vs-profit-chart"></div>
            <div class="donut-legend" style="flex-direction:row;gap:16px;margin-top:10px;justify-content:center;">
              <div class="donut-legend-item"><span class="donut-legend-dot" style="background:var(--brand);"></span>Sales</div>
              <div class="donut-legend-item"><span class="donut-legend-dot" style="background:var(--accent);"></span>Profit</div>
            </div>
          </div>

          <div class="card">
            <div class="section-title-row">
              <div class="section-title" style="margin:0;">Receipt history</div>
              <button type="button" class="btn-secondary" id="sales-export-btn">Export CSV</button>
            </div>
            <div class="search-row">
              <input type="text" id="sales-search" placeholder="Search customer or receipt no." />
            </div>
            <div class="subtabs" id="sales-status-filter">
              <button type="button" class="btn-secondary active" data-status="all">All</button>
              <button type="button" class="btn-secondary" data-status="paid">Paid</button>
              <button type="button" class="btn-secondary" data-status="pending">Pending</button>
              <button type="button" class="btn-secondary" data-status="refunded">Refunded</button>
            </div>
            <div id="sales-list"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- Orders -->
        <div class="tab-panel" data-panel="orders">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Remote Orders</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Orders placed through the online storefront</p>

          <div class="stat-grid">
            <div class="stat">
              <div class="stat-icon stat-icon-stock">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              </div>
              <div class="stat-body">
                <div class="label">Pending orders</div>
                <div class="value" id="orders-stat-pending">—</div>
                <div class="hint">awaiting fulfilment</div>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon stat-icon-revenue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div class="stat-body">
                <div class="label">Finished orders</div>
                <div class="value" id="orders-stat-finished">—</div>
                <div class="hint">completed</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">All remote orders</div>
            <div class="search-row">
              <input type="text" id="orders-search" placeholder="Search customer" />
            </div>
            <div class="subtabs" id="orders-status-filter">
              <button type="button" class="btn-secondary active" data-status="all">All</button>
              <button type="button" class="btn-secondary" data-status="pending">Pending</button>
              <button type="button" class="btn-secondary" data-status="finished">Finished</button>
              <button type="button" class="btn-secondary" data-status="cancelled">Cancelled</button>
            </div>
            <div id="orders-list"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- Order items sheet -->
        <div id="order-items-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="order-items-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong id="order-items-title">Order</strong>
            <button type="button" class="icon-btn" id="order-items-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="order-items-list" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Receipt sheet -->
        <div id="receipt-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="receipt-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong>Receipt</strong>
            <button type="button" class="icon-btn" id="receipt-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="receipt-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- QR Scanner -->
        <div class="tab-panel" data-panel="qr-scanner">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>QR Scanner</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Complete remote orders at pickup</p>

          <div class="card" style="text-align:center;">
            <div id="qr-camera-off" class="qr-frame">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;color:var(--muted);"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>
            </div>
            <div id="qr-camera-on" class="qr-frame hidden" style="padding:0; overflow:hidden;">
              <video id="qr-video" muted playsinline autoplay style="width:100%; height:100%; object-fit:cover;"></video>
              <div class="qr-viewfinder"></div>
            </div>

            <p class="tagline" id="qr-hint" style="margin-top:12px;">Scan with a camera, or enter the order reference below</p>

            <button type="button" class="btn-primary" id="qr-camera-toggle" style="margin-top:4px;">Scan with camera</button>
            <p class="error" id="qr-camera-error"></p>

            <form id="qr-manual-form" style="display:flex; gap:8px; margin-top:14px;">
              <input type="text" id="qr-manual-ref" placeholder="Or type/scan order reference" style="flex:1;" autocomplete="off" />
              <button type="submit" class="btn-secondary">Look up</button>
            </form>
            <p class="error" id="qr-not-found"></p>
          </div>

          <div class="card" id="qr-order-details" style="display:none;">
            <div class="section-title" style="margin-top:0;">Order details</div>
            <div class="qr-field-grid">
              <div><div class="cmeta">Order Reference</div><div class="cname" id="qr-d-ref">—</div></div>
              <div><div class="cmeta">Branch</div><div class="cname" id="qr-d-branch">—</div></div>
              <div><div class="cmeta">Customer Name</div><div class="cname" id="qr-d-customer">—</div></div>
              <div><div class="cmeta">Customer Phone</div><div class="cname" id="qr-d-phone">—</div></div>
              <div><div class="cmeta">Expected Amount</div><div class="cname" id="qr-d-amount">—</div></div>
              <div><div class="cmeta">Order Date</div><div class="cname" id="qr-d-date">—</div></div>
            </div>

            <div class="section-title">Order items</div>
            <div id="qr-order-items"></div>

            <div id="qr-complete-area" style="margin-top:14px;"></div>

            <button type="button" class="btn-secondary" id="qr-reset-btn" style="width:100%; margin-top:10px;">Scan another code</button>
          </div>
        </div>

        <!-- Payment Proofs -->
        <div class="tab-panel" data-panel="payment-proofs">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Payment Proofs</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Verify mobile money payments for remote orders</p>

          <button type="button" class="btn-primary" id="proof-add-btn" style="width:100%;margin-bottom:14px;">+ Log payment proof</button>

          <div class="subtabs" id="proof-method-tabs">
            <button type="button" class="btn-secondary active" data-method-tab="MTN Merchant">MTN Mobile Money</button>
            <button type="button" class="btn-secondary" data-method-tab="Airtel Merchant">Airtel Money</button>
          </div>
          <div class="subtabs" id="proof-status-filter">
            <button type="button" class="btn-secondary active" data-status="all">All</button>
            <button type="button" class="btn-secondary" data-status="Pending">Pending</button>
            <button type="button" class="btn-secondary" data-status="Verified">Verified</button>
            <button type="button" class="btn-secondary" data-status="Rejected">Rejected</button>
          </div>

          <div class="card">
            <div id="proofs-list"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- Log payment proof sheet -->
        <div id="proof-add-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="proof-add-modal" class="modal-sheet hidden" style="max-height:85vh;">
          <div class="modal-header">
            <strong>Log a payment proof</strong>
            <button type="button" class="icon-btn" id="proof-add-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="proof-add-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <div class="field"><label for="proof-reference">Order reference</label><input type="text" id="proof-reference" placeholder="e.g. RO-1234" required /></div>
            <div class="field" style="margin-top:10px;"><label for="proof-customer">Customer name</label><input type="text" id="proof-customer" required /></div>
            <div class="field" style="margin-top:10px;"><label for="proof-phone">Phone</label><input type="text" id="proof-phone" placeholder="0772 345 678" /></div>
            <div class="field" style="margin-top:10px;"><label for="proof-location">Delivery location</label><input type="text" id="proof-location" /></div>
            <div class="field" style="margin-top:10px;">
              <label for="proof-branch">Branch</label>
              <select id="proof-branch"><option value="">—</option></select>
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="proof-method">Payment method</label>
              <select id="proof-method">
                <option value="mtn_merchant">MTN Mobile Money</option>
                <option value="airtel_merchant">Airtel Money</option>
              </select>
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="proof-file">Screenshot</label>
              <input type="file" id="proof-file" accept="image/*" />
              <p class="cmeta" id="proof-file-name"></p>
            </div>
            <p class="error" id="proof-add-error"></p>
            <button type="submit" class="btn-primary" id="proof-add-submit" style="width:100%;margin-top:10px;">Log for review</button>
          </form>
        </div>

        <!-- Screenshot viewer sheet -->
        <div id="proof-image-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="proof-image-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong id="proof-image-title">Screenshot</strong>
            <button type="button" class="icon-btn" id="proof-image-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style="padding:12px 18px 18px; overflow-y:auto;">
            <img id="proof-image-el" style="width:100%; border-radius:10px; display:block;" alt="Payment screenshot" />
          </div>
        </div>

        <!-- Till Management -->
        <div class="tab-panel" data-panel="till">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Till Management</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Create tills, assign staff and manage safe removals</p>

          <div class="stat-grid-3">
            <div class="stat"><div class="label">Active tills</div><div class="value" id="till-stat-count">—</div><div class="hint">across branches</div></div>
            <div class="stat"><div class="label">Total balance</div><div class="value" id="till-stat-balance">—</div><div class="hint">current tills</div></div>
            <div class="stat"><div class="label">Removals</div><div class="value" id="till-stat-removals">—</div><div class="hint">this week</div></div>
          </div>

          <div class="subtabs" id="till-tabs">
            <button type="button" class="btn-secondary active" data-till-tab="create">Create</button>
            <button type="button" class="btn-secondary" data-till-tab="manage">Manage</button>
            <button type="button" class="btn-secondary" data-till-tab="safes">Safes</button>
          </div>

          <div class="card" id="till-tab-create">
            <div class="section-title" style="margin-top:0;">Create &amp; assign till</div>
            <form id="till-create-form">
              <div class="field"><label for="till-name">Till name</label><input type="text" id="till-name" placeholder="e.g. Till 05" required /></div>
              <div class="field" style="margin-top:10px;">
                <label for="till-branch">Branch</label>
                <select id="till-branch"><option value="">—</option></select>
              </div>
              <div class="field" style="margin-top:10px;">
                <label for="till-staff">Staff member</label>
                <select id="till-staff"><option value="">Unassigned</option></select>
              </div>
              <div class="field" style="margin-top:10px;"><label for="till-phone">Phone number</label><input type="text" id="till-phone" placeholder="07XX XXX XXX" /></div>
              <p class="error" id="till-create-error"></p>
              <button type="submit" class="btn-primary" id="till-create-submit" style="width:100%;margin-top:10px;">Create till</button>
            </form>
          </div>

          <div class="card hidden" id="till-tab-manage">
            <div class="section-title" style="margin-top:0;">Manage tills</div>
            <div id="tills-list"><p class="empty">Loading…</p></div>
          </div>

          <div class="card hidden" id="till-tab-safes">
            <div class="section-title" style="margin-top:0;">Remove cash to safe</div>
            <div class="field">
              <label for="safe-till">Till</label>
              <select id="safe-till"><option value="">Select till</option></select>
            </div>
            <div class="field" style="margin-top:10px;"><label for="safe-amount">Amount</label><input type="number" id="safe-amount" min="0.01" step="0.01" placeholder="0.00" /></div>
            <p class="error" id="safe-error"></p>
            <button type="button" class="btn-primary" id="safe-submit" style="width:100%;margin-top:10px;">Record removal</button>

            <div class="section-title">Removal history</div>
            <div id="till-removals-list"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- New sale -->
        <div class="tab-panel" data-panel="new-sale">
          <div class="warning-banner hidden" id="pos-clock-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
            <span id="pos-clock-warning-text"></span>
          </div>

          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <div class="input-icon" style="flex:1;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" id="pos-search" placeholder="Search product" />
            </div>
            <button type="button" class="btn-secondary" id="pos-scan-btn" title="Scan barcode">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M3 5v14M8 5v14M6 5v14M12 5v14M14 5v14M18 5v14M21 5v14"/></svg>
            </button>
            <button type="button" class="btn-secondary" id="pos-hold-btn" title="Hold sale">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><path d="M10 15V9M14 15V9"/></svg>
            </button>
            <button type="button" class="btn-secondary" id="pos-held-btn" title="Held sales" style="position:relative;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
              <span class="badge hidden" id="pos-held-count">0</span>
            </button>
          </div>

          <div class="category-pills" id="pos-categories"></div>

          <div class="pos-grid" id="pos-product-grid"><div class="loading-row"><div class="spinner"></div> Loading…</div></div>

          <div class="card" id="pos-cart-card">
            <div class="section-title-row">
              <div class="section-title" style="margin:0;">Current sale</div>
              <span class="cart-count-badge" id="pos-cart-count">0 items</span>
            </div>

            <select id="pos-customer" style="margin-bottom:12px;">
              <option value="">Walk-in (no account)</option>
            </select>

            <div id="pos-cart-lines"><p class="empty">Tap a product to start a sale</p></div>

            <dl class="totals-list">
              <div class="totals-row"><dt>Subtotal</dt><dd id="pos-subtotal">0</dd></div>
              <div class="totals-row"><dt>VAT (16%)</dt><dd id="pos-tax">0</dd></div>
              <div class="totals-row totals-row-final"><dt>Total</dt><dd id="pos-total">0</dd></div>
            </dl>

            <div class="payment-tiles" id="pos-payment-tiles">
              <button type="button" class="payment-tile active" data-method="cash">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
                Cash
              </button>
              <button type="button" class="payment-tile" data-method="mpesa">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                Mobile Money
              </button>
              <button type="button" class="payment-tile" data-method="card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                Card
              </button>
            </div>

            <p class="error" id="pos-error"></p>
            <button type="button" class="btn-primary" id="pos-charge-btn" style="width:100%;margin-top:6px;" disabled>Charge</button>
          </div>
        </div>

        <!-- Held sales sheet -->
        <div id="held-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="held-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong>Held sales</strong>
            <button type="button" class="icon-btn" id="held-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="held-sales-list"></div>
        </div>

        <!-- Scan barcode sheet -->
        <div id="scan-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="scan-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong>Scan barcode</strong>
            <button type="button" class="icon-btn" id="scan-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style="text-align:center; overflow-y:auto; padding:16px 18px 18px;">
            <div id="scan-camera-area">
              <div id="scan-camera-off" class="qr-frame">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:64px;height:64px;color:var(--muted);"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M3 12h18"/></svg>
              </div>
              <div id="scan-camera-on" class="qr-frame hidden" style="padding:0; overflow:hidden;">
                <video id="scan-video" muted playsinline autoplay style="width:100%; height:100%; object-fit:cover;"></video>
                <div class="qr-viewfinder"></div>
              </div>

              <p class="tagline" id="scan-hint" style="margin-top:12px;">Hold a product's barcode up to the camera — items add to the cart automatically</p>

              <button type="button" class="btn-primary" id="scan-camera-toggle" style="margin-top:4px;">Scan with camera</button>
              <p class="error" id="scan-camera-error"></p>
            </div>

            <!-- Shown instead of the camera area on browsers without BarcodeDetector (notably
                 Safari/iOS) — a dashed empty camera box with no button under it read as broken,
                 so this is a purpose-built empty state that hands off cleanly to the manual field. -->
            <div id="scan-camera-unsupported" class="hidden">
              <div class="scan-unsupported-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/></svg>
              </div>
              <p style="font-weight:700; margin:0;">Camera scanning isn't available here</p>
              <p class="tagline" style="margin:4px 0 0;">This browser doesn't support live barcode scanning. Type a SKU below, or use a handheld scanner — it types straight into the field.</p>
            </div>

            <form id="scan-manual-form" style="display:flex; gap:8px; margin-top:16px;">
              <input type="text" id="scan-manual-code" placeholder="Type or scan SKU" style="flex:1;" autocomplete="off" />
              <button type="submit" class="btn-secondary">Add</button>
            </form>
          </div>
        </div>

        <!-- Suppliers (procurement) -->
        <div class="tab-panel" data-panel="suppliers">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Suppliers</strong></div>
          <p class="tagline" id="suppliers-subtitle" style="text-align:left;margin:-6px 0 12px;">Loading…</p>

          <div style="display:flex; gap:8px; margin-bottom:12px;">
            <button type="button" class="btn-primary" id="supplier-add-btn" style="flex:1;">+ Add supplier</button>
            <button type="button" class="btn-secondary" id="po-add-btn" style="flex:1;">+ New order</button>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Suppliers &amp; payables</div>
            <div id="suppliers-list"><p class="empty">Loading…</p></div>
          </div>
          <div class="card">
            <div class="section-title" style="margin-top:0;">Purchase orders</div>
            <div id="purchase-orders-list"><p class="empty">Loading…</p></div>
          </div>
        </div>

        <!-- Add / edit supplier sheet -->
        <div id="supplier-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="supplier-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong id="supplier-modal-title">Add supplier</strong>
            <button type="button" class="icon-btn" id="supplier-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="supplier-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <input type="hidden" id="supplier-id" />
            <div class="field"><label for="supplier-name">Supplier name</label><input type="text" id="supplier-name" required /></div>
            <div class="field" style="margin-top:10px;">
              <label for="supplier-category">Supplies</label>
              <select id="supplier-category"><option value="">General</option></select>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="supplier-contact-person">Contact person</label><input type="text" id="supplier-contact-person" /></div>
              <div class="field"><label for="supplier-contact">Phone</label><input type="text" id="supplier-contact" placeholder="0712 345 678" /></div>
            </div>
            <div class="field" style="margin-top:10px;"><label for="supplier-email">Email</label><input type="email" id="supplier-email" /></div>
            <div class="field" style="margin-top:10px;"><label for="supplier-address">Address</label><input type="text" id="supplier-address" /></div>
            <div class="field" style="margin-top:10px;"><label for="supplier-terms">Payment terms</label><input type="text" id="supplier-terms" placeholder="e.g. Net 30, Cash on delivery" /></div>

            <div id="supplier-payable-row" class="card" style="margin-top:14px;display:none;">
              <div class="section-title" style="margin-top:0;">Payable</div>
              <div class="amount" id="supplier-payable-amount" style="font-size:1.2rem;">—</div>
              <button type="button" class="btn-secondary" id="supplier-pay-toggle-btn" style="width:100%;margin-top:10px;">Pay supplier</button>
              <div id="supplier-pay-area" style="display:none;margin-top:10px;">
                <div class="qr-field-grid">
                  <div class="field"><label for="supplier-pay-amount">Amount</label><input type="number" id="supplier-pay-amount" min="0.01" step="0.01" /></div>
                  <div class="field">
                    <label for="supplier-pay-method">Method</label>
                    <select id="supplier-pay-method"><option value="cash">Cash</option><option value="bank">Bank</option></select>
                  </div>
                </div>
                <button type="button" class="btn-primary" id="supplier-pay-submit-btn" style="width:100%;margin-top:8px;">Record payment</button>
              </div>
            </div>

            <p class="error" id="supplier-form-error"></p>
            <button type="submit" class="btn-primary" id="supplier-form-submit" style="width:100%;margin-top:10px;">Save supplier</button>
            <button type="button" class="btn-danger" id="supplier-delete-btn" style="width:100%;margin-top:8px;display:none;">Delete supplier</button>
          </form>
        </div>

        <!-- New purchase order sheet -->
        <div id="po-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="po-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong>New purchase order</strong>
            <button type="button" class="icon-btn" id="po-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="po-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <div class="field">
              <label for="po-supplier">Supplier <span style="font-weight:400;color:var(--muted);">(optional)</span></label>
              <select id="po-supplier"><option value="">No supplier</option></select>
            </div>

            <div class="section-title">Items</div>
            <div id="po-items"></div>
            <button type="button" class="btn-secondary" id="po-add-line-btn" style="width:100%;margin-top:6px;">+ Add item</button>

            <div class="field" style="margin-top:10px;"><label for="po-notes">Notes</label><input type="text" id="po-notes" /></div>

            <div class="section-title-row" style="margin-top:14px;">
              <div class="section-title" style="margin:0;">Total</div>
              <div class="section-value" id="po-total">—</div>
            </div>

            <p class="error" id="po-form-error"></p>
            <button type="submit" class="btn-primary" id="po-form-submit" style="width:100%;margin-top:10px;">Create purchase order</button>
          </form>
        </div>

        <!-- Purchase order detail sheet -->
        <div id="po-detail-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="po-detail-modal" class="modal-sheet hidden" style="max-height:85vh;">
          <div class="modal-header">
            <strong id="po-detail-title">Purchase order</strong>
            <button type="button" class="icon-btn" id="po-detail-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="po-detail-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Customers (customers module: customers + debtors) -->
        <div class="tab-panel" data-panel="customers">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Customers</strong></div>
          <div class="subtabs">
            <button class="btn-secondary active" data-customer-subtab="customers">Customers</button>
            <button class="btn-secondary" data-customer-subtab="debtors">Debtors</button>
          </div>
          <div id="customers-sub-customers">
            <p class="tagline" id="customers-subtitle" style="text-align:left;margin:0 0 10px;">Loading…</p>
            <button type="button" class="btn-primary" id="customer-add-btn" style="width:100%;margin-bottom:10px;">+ Add customer</button>
            <div class="search-row"><input type="text" id="customer-search" placeholder="Search customers" /></div>
            <div class="card"><div id="customers-list"><p class="empty">Loading…</p></div></div>
          </div>
          <div class="hidden" id="customers-sub-debtors">
            <div class="stat-grid" style="margin-bottom:12px;">
              <div class="stat">
                <div class="label">Active debtors</div>
                <div class="value" id="debtors-stat-count">—</div>
              </div>
              <div class="stat">
                <div class="label">Total outstanding</div>
                <div class="value" id="debtors-stat-outstanding">—</div>
              </div>
            </div>
            <button type="button" class="btn-primary" id="debtor-add-btn" style="width:100%;margin-bottom:10px;">+ Add debtor</button>
            <div class="card"><div id="debtors-list"><p class="empty">Loading…</p></div></div>
          </div>
        </div>

        <!-- Add debtor sheet -->
        <div id="debtor-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="debtor-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong>Add debtor</strong>
            <button type="button" class="icon-btn" id="debtor-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="debtor-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <div class="field"><label for="debtor-name">Debtor name</label><input type="text" id="debtor-name" required /></div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="debtor-phone">Phone</label><input type="text" id="debtor-phone" placeholder="0712 345 678" /></div>
              <div class="field">
                <label for="debtor-branch">Branch</label>
                <select id="debtor-branch"><option value="">Unassigned</option></select>
              </div>
            </div>
            <div class="field" style="margin-top:10px;"><label for="debtor-item">Item taken</label><input type="text" id="debtor-item" placeholder="e.g. Cooking oil, sugar" /></div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="debtor-quantity">Quantity</label><input type="number" id="debtor-quantity" min="0" step="1" value="1" /></div>
              <div class="field"><label for="debtor-due-date">Due date</label><input type="date" id="debtor-due-date" /></div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="debtor-amount-paid">Paid so far</label><input type="number" id="debtor-amount-paid" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="debtor-balance">Balance owed</label><input type="number" id="debtor-balance" min="0" step="0.01" required /></div>
            </div>
            <p class="error" id="debtor-form-error"></p>
            <button type="submit" class="btn-primary" id="debtor-form-submit" style="width:100%;margin-top:10px;">Save debtor</button>
          </form>
        </div>

        <!-- Record debtor payment sheet -->
        <div id="debtor-pay-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="debtor-pay-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong id="debtor-pay-title">Record payment</strong>
            <button type="button" class="icon-btn" id="debtor-pay-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style="padding:6px 18px 18px;">
            <p class="tagline" id="debtor-pay-balance" style="text-align:left;margin:0 0 10px;"></p>
            <div class="field"><label for="debtor-pay-amount">Amount</label><input type="number" id="debtor-pay-amount" min="0.01" step="0.01" /></div>
            <p class="error" id="debtor-pay-error"></p>
            <button type="button" class="btn-primary" id="debtor-pay-submit-btn" style="width:100%;margin-top:10px;">Record payment</button>
          </div>
        </div>

        <!-- Debtor payment history sheet -->
        <div id="debtor-history-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="debtor-history-modal" class="modal-sheet hidden" style="max-height:75vh;">
          <div class="modal-header">
            <strong id="debtor-history-title">Payment history</strong>
            <button type="button" class="icon-btn" id="debtor-history-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="debtor-history-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Customer file sheet -->
        <div id="customer-file-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="customer-file-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong id="customer-file-title">Customer file</strong>
            <div style="display:flex;gap:6px;align-items:center;">
              <button type="button" class="icon-btn" id="customer-file-edit-btn" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="icon-btn" id="customer-file-modal-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div id="customer-file-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Add / edit customer sheet -->
        <div id="customer-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="customer-modal" class="modal-sheet hidden" style="max-height:85vh;">
          <div class="modal-header">
            <strong id="customer-modal-title">Add customer</strong>
            <button type="button" class="icon-btn" id="customer-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="customer-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <input type="hidden" id="customer-id" />
            <div class="field"><label for="customer-name">Customer name</label><input type="text" id="customer-name" required /></div>
            <div class="field" style="margin-top:10px;">
              <label for="customer-type">Type</label>
              <select id="customer-type"><option value="retail">Retail</option><option value="wholesale">Wholesale</option></select>
            </div>
            <div class="field" style="margin-top:10px;"><label for="customer-contact">Contact</label><input type="text" id="customer-contact" placeholder="0712 345 678" /></div>
            <div class="field" style="margin-top:10px;"><label for="customer-email">Email</label><input type="email" id="customer-email" /></div>
            <div class="field" style="margin-top:10px;"><label for="customer-payment-method">Preferred payment method</label><input type="text" id="customer-payment-method" placeholder="e.g. Mobile Money, Invoice" /></div>
            <p class="error" id="customer-form-error"></p>
            <button type="submit" class="btn-primary" id="customer-form-submit" style="width:100%;margin-top:10px;">Save customer</button>
            <button type="button" class="btn-danger" id="customer-delete-btn" style="width:100%;margin-top:8px;display:none;">Delete customer</button>
          </form>
        </div>

        <!-- Employees (hr) -->
        <div class="tab-panel" data-panel="employees">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Employees</strong></div>
          <p class="tagline" id="employees-subtitle" style="text-align:left;margin:-6px 0 12px;">Loading…</p>

          <div class="stat-grid" style="margin-bottom:12px;">
            <div class="stat">
              <div class="label">Total employees</div>
              <div class="value" id="emp-stat-total">—</div>
              <div class="hint" id="emp-stat-active-hint"></div>
            </div>
            <div class="stat">
              <div class="label">Combined base salary</div>
              <div class="value" id="emp-stat-salary">—</div>
              <div class="hint">per month</div>
            </div>
          </div>

          <button type="button" class="btn-primary" id="employee-add-btn" style="width:100%;margin-bottom:10px;">+ Add employee</button>
          <div class="card"><div id="employees-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- Employee record sheet -->
        <div id="employee-record-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="employee-record-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong id="employee-record-title">Employee record</strong>
            <div style="display:flex;gap:6px;align-items:center;">
              <button type="button" class="icon-btn" id="employee-record-edit-btn" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="icon-btn" id="employee-record-modal-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div id="employee-record-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Add / edit employee sheet -->
        <div id="employee-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="employee-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong id="employee-modal-title">Add employee</strong>
            <button type="button" class="icon-btn" id="employee-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="employee-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <input type="hidden" id="employee-id" />
            <div class="field"><label for="employee-name">Full name</label><input type="text" id="employee-name" required /></div>
            <div class="field" style="margin-top:10px;"><label for="employee-position">Position</label><input type="text" id="employee-position" required /></div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="employee-email">Email</label><input type="email" id="employee-email" /></div>
              <div class="field"><label for="employee-phone">Phone</label><input type="text" id="employee-phone" /></div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field">
                <label for="employee-branch">Branch</label>
                <select id="employee-branch"><option value="">Unassigned</option></select>
              </div>
              <div class="field">
                <label for="employee-status">Status</label>
                <select id="employee-status"><option value="active">Active</option><option value="inactive">Inactive</option></select>
              </div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="employee-salary">Base salary</label><input type="number" id="employee-salary" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="employee-hire-date">Hire date</label><input type="date" id="employee-hire-date" /></div>
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="employee-login">System login</label>
              <select id="employee-login"><option value="">No login</option></select>
              <p class="cmeta" style="margin-top:4px;">Only logins not already linked to another employee are listed. Creating a brand-new login isn't supported from the app yet — use the web app for that.</p>
            </div>
            <p class="error" id="employee-form-error"></p>
            <button type="submit" class="btn-primary" id="employee-form-submit" style="width:100%;margin-top:10px;">Save employee</button>
            <button type="button" class="btn-danger" id="employee-delete-btn" style="width:100%;margin-top:8px;display:none;">Delete employee</button>
          </form>
        </div>

        <!-- Attendance -->
        <div class="tab-panel" data-panel="attendance">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Attendance</strong></div>
          <div class="card">
            <div class="attendance-status">
              <div id="attendance-pill" class="big-pill pill-warn">Loading…</div>
              <p class="empty hidden" id="attendance-unavailable">Attendance clock-in is for staff with an employee record. As an owner/admin, you can review it from the Employees section instead.</p>
              <p class="error" id="attendance-error"></p>
              <div id="attendance-buttons" style="display:flex; gap:10px;">
                <button class="btn-primary" id="clock-in-btn" style="flex:1;">Clock in</button>
                <button class="btn-danger" id="clock-out-btn" style="flex:1;">Clock out</button>
              </div>
            </div>
          </div>

          <div class="subtabs" style="margin-top:14px;">
            <button class="btn-secondary active" data-att-subtab="board" id="att-board-tab-btn">Today's board</button>
            <button class="btn-secondary" data-att-subtab="kiosk">Team check-in</button>
            <button class="btn-secondary" data-att-subtab="history">History</button>
          </div>

          <div id="att-sub-board">
            <div class="stat-grid-3" style="margin:12px 0;">
              <div class="stat"><div class="label">On time</div><div class="value" id="att-stat-present">—</div></div>
              <div class="stat"><div class="label">Late</div><div class="value" id="att-stat-late">—</div></div>
              <div class="stat"><div class="label">Not yet in</div><div class="value" id="att-stat-notyet">—</div></div>
            </div>
            <div class="card"><div id="attendance-board-list"><p class="empty">Loading…</p></div></div>
          </div>

          <div class="hidden" id="att-sub-kiosk">
            <div class="card" style="margin-top:12px;">
              <div class="section-title" style="margin-top:0;">PIN pad</div>
              <div class="field"><label for="kiosk-employee">Name</label><select id="kiosk-employee"><option value="">Select your name</option></select></div>
              <div class="field" style="margin-top:10px;"><label for="kiosk-pin">PIN</label><input type="password" inputmode="numeric" id="kiosk-pin" maxlength="6" placeholder="4–6 digits" /></div>
              <p class="error" id="kiosk-error"></p>
              <button type="button" class="btn-primary" id="kiosk-submit-btn" style="width:100%;margin-top:10px;">Clock in / out</button>
            </div>
          </div>

          <div class="hidden" id="att-sub-history">
            <div class="field" style="margin:12px 0;">
              <label for="history-employee-filter">Employee</label>
              <select id="history-employee-filter"><option value="">All employees</option></select>
            </div>
            <div class="card"><div id="attendance-history-list"><p class="empty">Loading…</p></div></div>
          </div>
        </div>

        <!-- Manage employee attendance sheet -->
        <div id="att-manage-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="att-manage-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong id="att-manage-title">Manage</strong>
            <button type="button" class="icon-btn" id="att-manage-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div style="overflow-y:auto; padding:6px 18px 18px;">
            <div class="section-title" style="margin-top:0;">Kiosk PIN</div>
            <p class="tagline" id="att-manage-pin-status" style="text-align:left;margin:0 0 8px;"></p>
            <div style="display:flex; gap:8px;">
              <input type="text" id="att-manage-pin-input" inputmode="numeric" maxlength="6" placeholder="4–6 digits" style="flex:1;" />
              <button type="button" class="btn-secondary" id="att-manage-pin-btn">Set</button>
            </div>
            <p class="error" id="att-manage-pin-error"></p>

            <div class="section-title">Manual correction</div>
            <div class="field"><label for="att-correction-date">Date</label><input type="date" id="att-correction-date" /></div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="att-correction-in">Clock in</label><input type="time" id="att-correction-in" /></div>
              <div class="field"><label for="att-correction-out">Clock out</label><input type="time" id="att-correction-out" /></div>
            </div>
            <div class="field" style="margin-top:10px;"><label for="att-correction-note">Reason (optional)</label><input type="text" id="att-correction-note" placeholder="e.g. forgot to tap out" /></div>
            <p class="error" id="att-correction-error"></p>
            <button type="button" class="btn-primary" id="att-correction-submit-btn" style="width:100%;margin-top:10px;">Save correction</button>
          </div>
        </div>

        <!-- Payroll -->
        <div class="tab-panel" data-panel="payroll">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong id="payroll-title">Payroll</strong></div>

          <div id="payroll-manager-area" class="hidden">
            <div class="field" style="margin-bottom:12px;">
              <label for="payroll-month">Pay period</label>
              <input type="month" id="payroll-month" />
            </div>
            <div class="stat-grid-3" style="margin-bottom:12px;">
              <div class="stat"><div class="label">Total gross</div><div class="value" id="payroll-stat-gross">—</div></div>
              <div class="stat"><div class="label">Total net</div><div class="value" id="payroll-stat-net">—</div></div>
              <div class="stat"><div class="label">Records</div><div class="value" id="payroll-stat-count">—</div></div>
            </div>
            <button type="button" class="btn-primary" id="payroll-generate-btn" style="width:100%;margin-bottom:8px;">Generate payroll for this month</button>
            <button type="button" class="btn-secondary" id="payroll-add-btn" style="width:100%;margin-bottom:10px;">+ Add / update record</button>
          </div>

          <div class="card"><div id="payroll-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- Add / update payroll record sheet -->
        <div id="payroll-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="payroll-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong>Add / update payroll record</strong>
            <button type="button" class="icon-btn" id="payroll-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="payroll-form" style="overflow-y:auto; padding:6px 18px 18px;">
            <div class="field">
              <label for="payroll-employee">Employee</label>
              <select id="payroll-employee" required><option value="">Select employee</option></select>
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="payroll-record-month">Month</label>
              <input type="month" id="payroll-record-month" required />
            </div>
            <p class="cmeta" id="payroll-base-salary-hint" style="margin-top:6px;"></p>
            <p class="cmeta">Saving again for the same employee and month updates that record instead of duplicating it.</p>

            <div class="section-title">Allowances</div>
            <div class="qr-field-grid">
              <div class="field"><label for="payroll-transport">Transport</label><input type="number" id="payroll-transport" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="payroll-housing">Housing</label><input type="number" id="payroll-housing" min="0" step="0.01" value="0" /></div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="payroll-medical">Medical</label><input type="number" id="payroll-medical" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="payroll-overtime">Overtime</label><input type="number" id="payroll-overtime" min="0" step="0.01" value="0" /></div>
            </div>

            <div class="section-title">Deductions</div>
            <div class="qr-field-grid">
              <div class="field"><label for="payroll-nssf">NSSF</label><input type="number" id="payroll-nssf" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="payroll-tax">Tax (PAYE)</label><input type="number" id="payroll-tax" min="0" step="0.01" value="0" /></div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="payroll-loan">Loan</label><input type="number" id="payroll-loan" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="payroll-other">Other</label><input type="number" id="payroll-other" min="0" step="0.01" value="0" /></div>
            </div>

            <p class="error" id="payroll-form-error"></p>
            <button type="submit" class="btn-primary" id="payroll-form-submit" style="width:100%;margin-top:10px;">Save record</button>
          </form>
        </div>

        <!-- Payslip sheet -->
        <div id="payslip-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="payslip-modal" class="modal-sheet hidden" style="max-height:88vh;">
          <div class="modal-header">
            <strong id="payslip-title">Payslip</strong>
            <button type="button" class="icon-btn" id="payslip-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="payslip-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Accounting -->
        <div class="tab-panel" data-panel="accounting">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Accounting</strong></div>

          <div class="subtabs">
            <button class="btn-secondary active" data-acc-subtab="transactions">Transactions</button>
            <button class="btn-secondary" data-acc-subtab="cashbook">Cash Book</button>
            <button class="btn-secondary" data-acc-subtab="expenses">Expenses</button>
            <button class="btn-secondary" data-acc-subtab="reports">Reports</button>
            <button class="btn-secondary" data-acc-subtab="accounts">Accounts</button>
          </div>

          <div id="acc-sub-transactions">
            <button type="button" class="btn-primary" id="transaction-add-btn" style="width:100%;margin:12px 0 10px;">+ Add transaction</button>
            <div class="card"><div id="transactions-list"><p class="empty">Loading…</p></div></div>
          </div>

          <div class="hidden" id="acc-sub-cashbook">
            <div class="stat-grid" style="margin:12px 0;">
              <div class="stat"><div class="label">Cash balance</div><div class="value" id="cashbook-stat-cash">—</div></div>
              <div class="stat"><div class="label">Bank balance</div><div class="value" id="cashbook-stat-bank">—</div></div>
            </div>
            <button type="button" class="btn-primary" id="cashbook-add-btn" style="width:100%;margin-bottom:10px;">+ Add cash book entry</button>
            <div class="card"><div id="cashbook-list"><p class="empty">Loading…</p></div></div>
          </div>

          <div class="hidden" id="acc-sub-expenses">
            <div class="card" style="margin-top:12px;">
              <div class="section-title" style="margin-top:0;">Record an expense</div>
              <div class="field"><label for="expense-label">What was it for?</label><input type="text" id="expense-label" placeholder="e.g. Fuel, delivery tip" /></div>
              <div class="field" style="margin-top:10px;"><label for="expense-category">Category</label><input type="text" id="expense-category" placeholder="e.g. Logistics" /></div>
              <div class="field" style="margin-top:10px;"><label for="expense-amount">Amount</label><input type="number" id="expense-amount" min="0.01" step="0.01" /></div>
              <p class="error" id="expense-error"></p>
              <button type="button" class="btn-primary" id="submit-expense" style="width:100%;margin-top:10px;">Record expense</button>
            </div>
            <div class="card">
              <div class="section-title" style="margin-top:0;">Recent expenses</div>
              <div id="expenses-list"><p class="empty">Loading…</p></div>
            </div>
          </div>

          <div class="hidden" id="acc-sub-reports">
            <div class="subtabs" style="margin:12px 0;">
              <button class="btn-secondary active" data-report-tab="trial-balance">Trial Balance</button>
              <button class="btn-secondary" data-report-tab="balance-sheet">Balance Sheet</button>
              <button class="btn-secondary" data-report-tab="income-statement">Income Statement</button>
            </div>
            <div class="card"><div id="report-body"><p class="empty">Loading…</p></div></div>
          </div>

          <div class="hidden" id="acc-sub-accounts">
            <button type="button" class="btn-primary" id="account-add-btn" style="width:100%;margin:12px 0 10px;">+ Add account</button>
            <div class="card"><div id="accounts-list"><p class="empty">Loading…</p></div></div>
          </div>
        </div>

        <!-- Add account sheet -->
        <div id="account-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="account-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong>Add account</strong>
            <button type="button" class="icon-btn" id="account-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="account-form" style="padding:6px 18px 18px;">
            <div class="field"><label for="account-name">Account name</label><input type="text" id="account-name" required /></div>
            <div class="field" style="margin-top:10px;">
              <label for="account-type">Type</label>
              <select id="account-type">
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <p class="error" id="account-form-error"></p>
            <button type="submit" class="btn-primary" id="account-form-submit" style="width:100%;margin-top:10px;">Save account</button>
          </form>
        </div>

        <!-- Ledger sheet -->
        <div id="ledger-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="ledger-modal" class="modal-sheet hidden" style="max-height:85vh;">
          <div class="modal-header">
            <strong id="ledger-title">Ledger</strong>
            <button type="button" class="icon-btn" id="ledger-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div id="ledger-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Add transaction sheet -->
        <div id="transaction-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="transaction-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong>Add transaction</strong>
            <button type="button" class="icon-btn" id="transaction-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="transaction-form" style="padding:6px 18px 18px;">
            <div class="field">
              <label for="transaction-type">Type</label>
              <select id="transaction-type"><option value="income">Income</option><option value="expense">Expense</option></select>
            </div>
            <div class="field" style="margin-top:10px;"><label for="transaction-description">Description</label><input type="text" id="transaction-description" required /></div>
            <div class="field" style="margin-top:10px;"><label for="transaction-amount">Amount</label><input type="number" id="transaction-amount" min="0.01" step="0.01" required /></div>
            <p class="error" id="transaction-form-error"></p>
            <button type="submit" class="btn-primary" id="transaction-form-submit" style="width:100%;margin-top:10px;">Save transaction</button>
          </form>
        </div>

        <!-- Add cash book entry sheet -->
        <div id="cashbook-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="cashbook-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong>Add cash book entry</strong>
            <button type="button" class="icon-btn" id="cashbook-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="cashbook-form" style="padding:6px 18px 18px;">
            <div class="field"><label for="cashbook-particulars">Particulars</label><input type="text" id="cashbook-particulars" required /></div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="cashbook-cash-in">Cash in</label><input type="number" id="cashbook-cash-in" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="cashbook-bank-in">Bank in</label><input type="number" id="cashbook-bank-in" min="0" step="0.01" value="0" /></div>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="cashbook-cash-out">Cash out</label><input type="number" id="cashbook-cash-out" min="0" step="0.01" value="0" /></div>
              <div class="field"><label for="cashbook-bank-out">Bank out</label><input type="number" id="cashbook-bank-out" min="0" step="0.01" value="0" /></div>
            </div>
            <p class="error" id="cashbook-form-error"></p>
            <button type="submit" class="btn-primary" id="cashbook-form-submit" style="width:100%;margin-top:10px;">Save entry</button>
          </form>
        </div>

        <!-- Branches -->
        <div class="tab-panel" data-panel="branches">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Branches</strong></div>
          <p class="tagline" id="branches-subtitle" style="text-align:left;margin:-6px 0 12px;">Loading…</p>
          <button type="button" class="btn-primary" id="branch-add-btn" style="width:100%;margin-bottom:10px;">+ Add branch</button>
          <div class="card"><div id="branches-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- Branch dashboard sheet -->
        <div id="branch-dash-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="branch-dash-modal" class="modal-sheet hidden" style="max-height:90vh;">
          <div class="modal-header">
            <strong id="branch-dash-title">Branch</strong>
            <div style="display:flex;gap:6px;align-items:center;">
              <button type="button" class="icon-btn" id="branch-dash-edit-btn" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="icon-btn" id="branch-dash-modal-close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div id="branch-dash-body" style="overflow-y:auto; padding:8px 18px 18px;"></div>
        </div>

        <!-- Add / edit branch sheet -->
        <div id="branch-modal-backdrop" class="modal-backdrop hidden"></div>
        <div id="branch-modal" class="modal-sheet hidden">
          <div class="modal-header">
            <strong id="branch-modal-title">Add branch</strong>
            <button type="button" class="icon-btn" id="branch-modal-close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="branch-form" style="padding:6px 18px 18px;">
            <input type="hidden" id="branch-id" />
            <div class="field"><label for="branch-name">Branch name</label><input type="text" id="branch-name" placeholder="e.g. Eldoret — Town Centre" required /></div>
            <div class="field" style="margin-top:10px;"><label for="branch-location">Location</label><input type="text" id="branch-location" placeholder="e.g. Uganda Rd, Eldoret" /></div>
            <div class="field" style="margin-top:10px;"><label for="branch-contact">Contact</label><input type="text" id="branch-contact" placeholder="0712 345 678" /></div>
            <div class="field" style="margin-top:10px;"><label for="branch-manager">Manager</label><input type="text" id="branch-manager" placeholder="Assigned later if left blank" /></div>
            <p class="error" id="branch-form-error"></p>
            <button type="submit" class="btn-primary" id="branch-form-submit" style="width:100%;margin-top:10px;">Save branch</button>
          </form>
        </div>

        <!-- Manager view -->
        <div class="tab-panel" data-panel="manager-view">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong id="mgrview-title">Manager view</strong></div>
          <p class="tagline" id="mgrview-subtitle" style="text-align:left;margin:-6px 0 12px;">Manager dashboard</p>

          <div class="stat-grid">
            <div class="stat"><div class="label">Sales today</div><div class="value" id="mgrview-stat-sales">—</div><div class="hint">Across your branches</div></div>
            <div class="stat"><div class="label">Expenses today</div><div class="value" id="mgrview-stat-expenses">—</div><div class="hint">Across your branches</div></div>
            <div class="stat"><div class="label">Total products</div><div class="value" id="mgrview-stat-products">—</div><div class="hint" id="mgrview-stat-lowstock-hint">—</div></div>
            <div class="stat"><div class="label">Total staff</div><div class="value" id="mgrview-stat-staff">—</div><div class="hint">On payroll</div></div>
          </div>

          <div class="section-title" style="margin-top:0;">Recent sales</div>
          <p class="tagline" id="mgrview-sales-desc" style="text-align:left;margin:-10px 0 10px;">Loading…</p>
          <div class="field hidden" id="mgrview-branch-filter-wrap" style="margin-bottom:10px;">
            <select id="mgrview-branch-filter">
              <option value="all">All branches</option>
            </select>
          </div>
          <div class="card"><div id="mgrview-sales-list"></div></div>
        </div>

        <!-- Staff view -->
        <div class="tab-panel" data-panel="staff-view">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong id="staffview-title">Welcome</strong></div>
          <p class="tagline" id="staffview-subtitle" style="text-align:left;margin:-6px 0 12px;">Staff dashboard</p>

          <button type="button" class="btn-secondary" id="staffview-pos-btn" style="width:100%;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:6px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><path d="M7 12h10"/></svg>
            Open sales terminal
          </button>

          <div class="card" id="staffview-attendance-card">
            <div class="section-title" style="margin-top:0;">Your attendance today</div>
            <p class="tagline" id="staffview-att-status" style="text-align:left;margin:0 0 10px;">Loading…</p>
            <button type="button" class="btn-primary" id="staffview-clock-btn" style="width:100%;">Clock in</button>
            <div class="hidden" id="staffview-att-unavailable" style="border-left:4px solid var(--warning); display:flex; gap:10px; align-items:flex-start; margin-top:10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
              <p style="font-size:13px;color:var(--muted);margin:0;">Your account isn't linked to an employee record, so there's nothing here to clock in or out — ask a manager to link it from Employees.</p>
            </div>
          </div>

          <div class="stat-grid-3">
            <div class="stat"><div class="label">My sales today</div><div class="value" id="staffview-stat-revenue">—</div><div class="hint" id="staffview-stat-revenue-hint">—</div></div>
            <div class="stat"><div class="label">Items sold today</div><div class="value" id="staffview-stat-items">—</div><div class="hint">Across all products</div></div>
            <div class="stat"><div class="label">Receipts issued</div><div class="value" id="staffview-stat-receipts">—</div><div class="hint">Today</div></div>
          </div>

          <div class="section-title" style="margin-top:0;">My sales today</div>
          <p class="tagline" style="text-align:left;margin:-10px 0 10px;">Every receipt you've rung up today, most recent first</p>
          <div class="card"><div id="staffview-sales-list"></div></div>
        </div>

        <!-- Reports -->
        <div class="tab-panel" data-panel="reports">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Reports</strong></div>
          <p class="tagline" id="reports-subtitle" style="text-align:left;margin:-6px 0 12px;">Loading…</p>
          <button type="button" class="btn-secondary" id="reports-print-btn" style="width:100%;margin-bottom:14px;">Download PDF</button>

          <div class="stat-grid" id="reports-stat-grid" style="margin:0 0 4px;">
            <div class="loading-row"><div class="spinner"></div> Loading…</div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Revenue trend</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Monthly, last 6 months</p>
            <div class="bar-chart" id="reports-trend-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Sales by category</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Revenue share, last 30 days</p>
            <div id="reports-category-chart"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Revenue by branch</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Last 30 days</p>
            <div class="rank-list" id="reports-branch-list"></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Top products</div>
            <p class="tagline" style="text-align:left;margin:-8px 0 10px;">By revenue, last 30 days</p>
            <div class="rank-list" id="reports-products-list"></div>
          </div>

          <div class="hidden" id="reports-pl-section">
            <div class="card">
              <div class="section-title" style="margin-top:0;">Expense breakdown</div>
              <p class="tagline" style="text-align:left;margin:-8px 0 10px;">By category, last 30 days</p>
              <div id="reports-expense-chart"></div>
            </div>

            <div class="card">
              <div class="section-title" style="margin-top:0;">Profit &amp; loss summary</div>
              <p class="tagline" style="text-align:left;margin:-8px 0 10px;">Last 30 days</p>
              <div id="reports-pl-list"></div>
            </div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Report builder</div>
            <div class="field">
              <label for="report-type">Report type</label>
              <select id="report-type">
                <option value="sales">Sales</option>
                <option value="expenses">Expenses</option>
                <option value="total_expenses">Total expenses (by day)</option>
                <option value="debtors">Debtors</option>
                <option value="payment_analysis">Payment analysis</option>
                <option value="product_summary">Product summary</option>
                <option value="branch_performance">Branch performance</option>
              </select>
            </div>
            <div class="qr-field-grid" style="margin-top:10px;">
              <div class="field"><label for="report-from">From</label><input type="date" id="report-from" /></div>
              <div class="field"><label for="report-to">To</label><input type="date" id="report-to" /></div>
            </div>
            <p class="error" id="report-form-error"></p>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button type="button" class="btn-primary" id="report-generate-btn" style="flex:1;">Generate</button>
              <button type="button" class="btn-secondary" id="report-export-btn" style="flex:1;" disabled>Export CSV</button>
            </div>
          </div>

          <div class="card">
            <div id="report-results"><p class="empty">Choose a report type and tap Generate.</p></div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="tab-panel" data-panel="notifications">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Notifications</strong></div>
          <p class="tagline" id="notif-subtitle" style="text-align:left;margin:-6px 0 12px;">Loading…</p>

          <div class="stat-grid-3">
            <div class="stat"><div class="label">Overdue shop debtors</div><div class="value" id="notif-stat-shop">—</div><div class="hint">pending settlement</div></div>
            <div class="stat"><div class="label">Overdue customers</div><div class="value" id="notif-stat-customer">—</div><div class="hint">pending settlement</div></div>
            <div class="stat"><div class="label">Low stock items</div><div class="value" id="notif-stat-lowstock">—</div><div class="hint">below 10 units</div></div>
          </div>

          <div class="section-title" style="margin-top:0;">Shop debtors (overdue)</div>
          <div class="card"><div id="notif-shop-debtors-list"><p class="empty">Loading…</p></div></div>

          <div class="section-title">Customer debtors (overdue)</div>
          <div class="card"><div id="notif-customer-debtors-list"><p class="empty">Loading…</p></div></div>

          <div class="section-title">Low stock products</div>
          <div class="card"><div id="notif-low-stock-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- Order alerts -->
        <div class="tab-panel" data-panel="order-alerts">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>Order Alerts</strong></div>
          <p class="tagline" id="order-alerts-subtitle" style="text-align:left;margin:-6px 0 12px;">Loading…</p>

          <div class="stat-grid">
            <div class="stat"><div class="label">Pending orders</div><div class="value" id="oa-stat-count">—</div><div class="hint">awaiting pickup or delivery</div></div>
            <div class="stat"><div class="label">Value pending</div><div class="value" id="oa-stat-value">—</div><div class="hint">not yet in the till</div></div>
          </div>

          <div class="section-title" style="margin-top:0;">Remote orders</div>
          <div class="card"><div id="order-alerts-list"><p class="empty">Loading…</p></div></div>
        </div>

        <!-- SMS centre -->
        <div class="tab-panel" data-panel="sms">
          <div class="back-row"><button data-back class="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button><strong>SMS alerts</strong></div>
          <p class="tagline" style="text-align:left;margin:-6px 0 12px;">Send batch messages via the AlieSMS gateway</p>

          <div class="card hidden" id="sms-warning-banner" style="border-left:4px solid var(--warning); display:flex; flex-direction:row; align-items:flex-start; gap:10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" style="width:18px;height:18px;flex-shrink:0;margin-top:1px;"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>
            <p style="font-size:13px;color:var(--muted);margin:0;">AlieSMS isn't connected yet — messages will be logged as failed until an administrator adds <code style="background:var(--bg);padding:1px 5px;border-radius:4px;font-size:12px;">ALIESMS_EMAIL</code> and <code style="background:var(--bg);padding:1px 5px;border-radius:4px;font-size:12px;">ALIESMS_PASSWORD</code>.</p>
          </div>

          <div class="stat-grid-3">
            <div class="stat"><div class="label">Sent</div><div class="value" id="sms-stat-sent">—</div><div class="hint">all time</div></div>
            <div class="stat"><div class="label">Failed</div><div class="value" id="sms-stat-failed">—</div><div class="hint">needs retry</div></div>
            <div class="stat"><div class="label">Queued</div><div class="value" id="sms-stat-queued">—</div><div class="hint">pending dispatch</div></div>
          </div>

          <div class="card">
            <div class="field"><label for="sms-recipients">Recipient(s)</label><input type="text" id="sms-recipients" placeholder="07xx xxx xxx, 07xx xxx xxx" /></div>
            <div class="field" style="margin-top:10px;"><label for="sms-message">Message</label><textarea id="sms-message" placeholder="Message text" rows="3"></textarea></div>
            <button type="button" class="btn-primary" id="sms-send-btn" style="width:100%;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9 22 2z"/></svg>
              <span id="sms-send-btn-label">Send SMS</span>
            </button>
          </div>

          <div class="section-title" style="margin-top:0;">Delivery log</div>
          <p class="tagline" style="text-align:left;margin:-10px 0 10px;">Most recent first</p>
          <div class="card"><div id="sms-log-list"></div></div>
        </div>

        <!-- Settings -->
        <div class="tab-panel" data-panel="settings">
          <div class="section-title" style="margin-top:0;">Settings</div>

          <div class="card">
            <div class="profile-row">
              <div class="profile-avatar" id="profile-avatar">—</div>
              <div>
                <div class="profile-name" id="profile-name">—</div>
                <div class="profile-meta" id="profile-meta">—</div>
                <div class="profile-meta hidden" id="profile-hiredate"></div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Edit profile</div>
            <div class="field">
              <label for="settings-name">Full name</label>
              <input type="text" id="settings-name" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="settings-phone">Phone</label>
              <input type="text" id="settings-phone" placeholder="0712 345 678" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label>Email</label>
              <input type="text" id="settings-email" disabled />
            </div>
            <p class="error" id="settings-error"></p>
            <button type="button" class="btn-primary" id="save-profile" style="width:100%;margin-top:10px;">Update Profile</button>
            <p class="tagline" style="text-align:left;margin:8px 0 0;">Changes apply to your account only.</p>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Appearance</div>
            <p class="tagline" style="text-align:left;margin:-6px 0 10px;">Choose how Dashflow looks on this device.</p>
            <div class="subtabs" id="theme-toggle">
              <button type="button" class="btn-secondary" data-theme-choice="light" style="display:flex;align-items:center;justify-content:center;gap:6px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                Light
              </button>
              <button type="button" class="btn-secondary" data-theme-choice="dark" style="display:flex;align-items:center;justify-content:center;gap:6px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                Dark
              </button>
            </div>
          </div>

          <!-- Business (read-only for manager/staff) -->
          <div class="card hidden" id="biz-readonly-card">
            <div class="section-title" style="margin-top:0;">Business</div>
            <div class="list-row"><div class="name">Business</div><div class="meta" id="settings-biz-name">—</div></div>
            <div class="list-row"><div class="name">Currency</div><div class="meta" id="settings-currency">—</div></div>
          </div>

          <!-- Business settings (admin/super only, real editable form) -->
          <div class="card hidden" id="biz-edit-card">
            <div class="section-title" style="margin-top:0;">Business profile</div>
            <div class="field">
              <label for="biz-name">Business name</label>
              <input type="text" id="biz-name" required />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="biz-tagline">Tagline</label>
              <input type="text" id="biz-tagline" placeholder="e.g. Quality groceries, every branch" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="biz-phone">Phone</label>
              <input type="text" id="biz-phone" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="biz-address">Address</label>
              <input type="text" id="biz-address" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="biz-taxpin">Tax PIN</label>
              <input type="text" id="biz-taxpin" placeholder="Printed on invoices and receipts" />
            </div>
            <div class="field" style="margin-top:10px;">
              <label for="biz-currency">Display currency</label>
              <select id="biz-currency"></select>
              <p class="tagline" style="text-align:left;margin-top:2px;">Every amount across the dashboard, receipts and reports switches to this currency once saved.</p>
            </div>
            <p class="error" id="biz-settings-error"></p>
            <button type="button" class="btn-primary" id="save-biz-settings" style="width:100%;margin-top:10px;">Save changes</button>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Subscription</div>
            <div id="subscription-body"><p class="empty">Loading…</p></div>
          </div>

          <div class="card">
            <div class="section-title" style="margin-top:0;">Receipt printer</div>
            <div id="printer-body"></div>
          </div>

          <button class="btn-danger" id="logout-btn" style="width:100%;">Log out</button>
        </div>
      </main>

      <nav class="tabbar">
        <button class="bottom-tab active" data-tab="overview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
          Overview
        </button>
        <button class="bottom-tab" data-tab="new-sale">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New Sale
        </button>
        <button class="bottom-tab" id="menu-tab-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          Menu
        </button>
        <button class="bottom-tab" data-tab="settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Settings
        </button>
      </nav>
    </section>
  </div>

  <div id="receipt-print-area"></div>
  <div id="payslip-print-area"></div>

  <script>
    const API = "/api";
    let TOKEN = localStorage.getItem("dashflow_token");
    let PRODUCTS = [];
    let CURRENCY = "KES";
    let ACTIVE_MODULES = [];
    let FIRST_NAME = "";
    let BUSINESS_NAME = "";
    let USER_ROLE = "";
    let SELECTED_BRANCH_ID = null;
    let BRANCH_LOCKED = false;
    // Package-tier gating, same rules as the web app's meetsPlanTier(): PLAN_KEY is
    // null for a super account or a business paying à la carte (never restricted by
    // minPlan there), and HAS_MULTIPLE_BRANCHES is a real branch-count check, not an
    // assumption from the plan alone.
    let PLAN_KEY = null;
    let HAS_MULTIPLE_BRANCHES = false;
    // Bumped on every login/logout so a slow request from a previous session
    // (this API can take several seconds per call) can detect it's stale and
    // discard its result instead of overwriting state the new session already set.
    let SESSION_GEN = 0;

    function money(n) {
      return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + " " + CURRENCY;
    }

    function toast(message, kind) {
      const el = document.createElement("div");
      el.className = "toast" + (kind ? " " + kind : "");
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }

    /**
     * Every panel that fetches a list shows this the instant it starts
     * loading — requests to this API commonly take several seconds, and
     * without an immediate loading state the screen just looks frozen.
     */
    function showLoading(elementId) {
      const el = document.getElementById(elementId);
      if (el) el.innerHTML = '<div class="loading-row"><div class="spinner"></div> Loading…</div>';
    }

    async function api(path, options = {}) {
      // Auto-attach the admin/super branch filter to every call (as a query
      // param — Laravel reads it from there for POSTs too) — endpoints that
      // don't accept branch_id simply ignore the extra param.
      if (SELECTED_BRANCH_ID) {
        path += (path.includes("?") ? "&" : "?") + "branch_id=" + SELECTED_BRANCH_ID;
      }
      const res = await fetch(API + path, {
        ...options,
        // This is a shared-device app — staff log in and out of the same browser all
        // shift long, so every request must hit the network fresh rather than risk the
        // browser serving a cached response captured under a different user's token.
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(TOKEN ? { Authorization: "Bearer " + TOKEN } : {}),
          ...(options.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.message || (data.errors && Object.values(data.errors)[0]?.[0]) || "Something went wrong.";
        const error = new Error(message);
        error.fields = data.errors ? Object.keys(data.errors) : [];
        throw error;
      }
      return data;
    }

    /* ---------------- Login ---------------- */
    const loginScreen = document.getElementById("login-screen");
    const mainScreen = document.getElementById("main-screen");

    async function tryResumeSession() {
      if (!TOKEN) return showLogin();
      try {
        const me = await api("/me");
        applyTheme(me.theme || "light");
        showApp();
      } catch {
        localStorage.removeItem("dashflow_token");
        TOKEN = null;
        showLogin();
      }
    }

    function showLogin() {
      SESSION_GEN++;
      SELECTED_BRANCH_ID = null;
      BRANCH_LOCKED = false;
      FIRST_NAME = "";
      BUSINESS_NAME = "";
      USER_ROLE = "";
      clearInterval(clockTimer);
      loginScreen.classList.remove("hidden");
      mainScreen.classList.add("hidden");
      document.getElementById("signup-form-wrap").classList.add("hidden");
      document.getElementById("login-form-wrap").classList.remove("hidden");
      document.getElementById("auth-hero-text").textContent = LOGIN_HERO_TEXT;

      // This is a shared device — staff log in and out of the same browser all shift
      // long. Logout is SPA-style (no page reload), so without this reset the next
      // person to log in could briefly see whatever panel and profile data the
      // previous user last had on screen before that panel's own loader refreshes it.
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      document.querySelector('.tab-panel[data-panel="overview"]').classList.add("active");
      document.querySelectorAll(".bottom-tab[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === "overview"));
      document.getElementById("profile-name").textContent = "—";
      document.getElementById("profile-avatar").textContent = "—";
      document.getElementById("profile-meta").textContent = "—";
      document.getElementById("profile-hiredate").classList.add("hidden");
      document.getElementById("biz-readonly-card").classList.add("hidden");
      document.getElementById("biz-edit-card").classList.add("hidden");
      // Same reasoning as the reset above: theme is per-account, so the login
      // screen must never carry over the last signed-in user's dark mode.
      applyTheme("light");
    }

    async function showApp() {
      SESSION_GEN++;
      loginScreen.classList.add("hidden");
      mainScreen.classList.remove("hidden");
      // Sequential on purpose: PHP's built-in dev server handles one request
      // at a time, so firing these together just queues them behind each
      // other anyway — doing it explicitly avoids relying on that ordering.
      await loadOverview();
      await loadModules();
      await loadBranches();
      refreshNotifBadge();
    }

    /** Only meaningful for admin/super with more than one branch — a locked account has nothing to pick. */
    async function loadBranches() {
      const gen = SESSION_GEN;
      const select = document.getElementById("branch-select");
      const sub = document.getElementById("biz-sub");
      if (BRANCH_LOCKED) {
        select.classList.add("hidden");
        sub.classList.remove("hidden");
        return;
      }
      try {
        const branches = await api("/branches");
        if (gen !== SESSION_GEN) return;
        if (branches.length <= 1) {
          select.classList.add("hidden");
          sub.classList.remove("hidden");
          return;
        }
        select.innerHTML = '<option value="">All branches</option>' + branches.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
        select.value = SELECTED_BRANCH_ID || "";
        select.classList.remove("hidden");
        sub.classList.add("hidden");
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("branch-select").addEventListener("change", (e) => {
      SELECTED_BRANCH_ID = e.target.value || null;
      const activePanel = document.querySelector(".tab-panel.active");
      const panel = activePanel ? activePanel.dataset.panel : "overview";
      openPanel(panel);
    });

    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const btn = document.getElementById("login-submit");
      const errorEl = document.getElementById("login-error");
      errorEl.textContent = "";
      btn.disabled = true;
      btn.textContent = "Logging in…";
      try {
        const data = await api("/login", { method: "POST", body: JSON.stringify({ email, password }) });
        TOKEN = data.token;
        localStorage.setItem("dashflow_token", TOKEN);
        applyTheme(data.user?.theme || "light");
        showApp();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Log in";
      }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("dashflow_token");
      TOKEN = null;
      showLogin();
    });

    /* ---------------- Signup ---------------- */
    const loginFormWrap = document.getElementById("login-form-wrap");
    const signupFormWrap = document.getElementById("signup-form-wrap");
    const authHeroText = document.getElementById("auth-hero-text");
    const LOGIN_HERO_TEXT = "Run every branch from your phone — sales, stock, staff and expenses, in real time.";
    const SIGNUP_HERO_TEXT = "Set up your business in minutes, then manage and monitor it from anywhere.";

    document.querySelector("[data-show-signup]").addEventListener("click", (e) => {
      e.preventDefault();
      loginFormWrap.classList.add("hidden");
      signupFormWrap.classList.remove("hidden");
      authHeroText.textContent = SIGNUP_HERO_TEXT;
    });
    document.querySelector("[data-show-login]").addEventListener("click", (e) => {
      e.preventDefault();
      signupFormWrap.classList.add("hidden");
      loginFormWrap.classList.remove("hidden");
      authHeroText.textContent = LOGIN_HERO_TEXT;
    });

    document.getElementById("signup-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("signup-error");
      errorEl.textContent = "";

      const password = document.getElementById("signup-password").value;
      const confirm = document.getElementById("signup-confirm").value;
      if (password !== confirm) {
        errorEl.textContent = "Passwords do not match.";
        return;
      }
      if (password.length < 8) {
        errorEl.textContent = "Password must be at least 8 characters.";
        return;
      }

      const btn = document.getElementById("signup-submit");
      btn.disabled = true;
      btn.textContent = "Creating account…";
      try {
        const data = await api("/signup", {
          method: "POST",
          body: JSON.stringify({
            username: document.getElementById("signup-username").value,
            email: document.getElementById("signup-email").value,
            phone: document.getElementById("signup-phone").value,
            business_name: document.getElementById("signup-business").value,
            role: document.getElementById("signup-role").value,
            password,
          }),
        });
        TOKEN = data.token;
        localStorage.setItem("dashflow_token", TOKEN);
        showApp();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Create account";
      }
    });

    /* ---------------- Hex field (matches the web app's honeycomb hero) ---------------- */
    (function buildHexField() {
      const svg = document.getElementById("hex-field");
      const R = 22;
      const colStep = Math.sqrt(3) * R;
      const rowStep = 1.5 * R;
      const cols = 8;
      const rows = 6;
      const weight = (col, row) => ((col * 7 + row * 13) * 2654435761) % 100;

      const hexPoints = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 180) * (60 * i - 90);
        return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
      }).join(" ");

      let markup = "";
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * colStep + (row % 2 ? colStep / 2 : 0);
          const cy = row * rowStep;
          const w = weight(col, row);
          const depth = 1 - (row / rows) * 0.5 - (col / cols) * 0.2;
          let fill = "none";
          if (w > 90) fill = `rgba(255,255,255,${(0.18 * depth).toFixed(3)})`;
          else if (w > 75) fill = `rgba(255,255,255,${(0.08 * depth).toFixed(3)})`;
          markup += `<polygon points="${hexPoints(cx, cy, R - 2)}" fill="${fill}" stroke="rgba(255,255,255,${(0.2 * depth).toFixed(3)})" stroke-width="1.25" stroke-linejoin="round"/>`;
        }
      }
      svg.setAttribute("viewBox", `${-R} ${-R} ${cols * colStep + R * 2} ${rows * rowStep + R * 2}`);
      svg.innerHTML = markup;
    })();

    /* ---------------- Sidebar navigation ---------------- */
    // One entry per module — Overview is always available; everything else only
    // shows once the business has actually subscribed to that module. Each entry
    // is a full section for that module (e.g. Customers bundles debtors, Accounting
    // bundles expenses + the money-movement feed), not a single narrow screen.
    const NAV_ITEMS = [
      { key: null, panel: "overview", label: "Overview", loader: loadOverview, icon: '<path d="M3 12l9-9 9 9M5 10v10h14V10"/>', hideFromSidebar: true },
      { key: "pos", panel: "new-sale", label: "New Sale", loader: loadNewSale, icon: '<path d="M12 5v14M5 12h14"/>', hideFromSidebar: true },
      { key: "inventory", panel: "products", label: "Stock", loader: loadProducts, group: "Inventory", icon: '<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>' },
      { key: "inventory", panel: "inventory", label: "Inventory", loader: loadInventoryPanel, group: "Inventory", icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
      { key: "inventory", panel: "expiry", label: "Expiry Tracking", loader: loadExpiryPanel, group: "Inventory", icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 1h6"/>' },
      { key: "procurement", panel: "suppliers", label: "Procurement", loader: loadSuppliersPanel, group: "Inventory", icon: '<path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.2a2 2 0 002-1.6L21 8H6"/>' },
      { key: "sales", panel: "sales", label: "Sales", loader: loadSales, group: "Sales & till", icon: '<path d="M3 3v18h18M7 15l4-4 4 4 4-8"/>' },
      { key: "sales", panel: "orders", label: "Remote Orders", loader: loadOrders, group: "Sales & till", minPlan: "retail", icon: '<path d="M20 7H4l1.5 12h13L20 7zM8 7V5a4 4 0 018 0v2"/>' },
      { key: "pos", panel: "qr-scanner", label: "QR Scanner", loader: loadQrScannerPanel, group: "Sales & till", minPlan: "retail", icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/>' },
      { key: "sales", panel: "payment-proofs", label: "Payment Proofs", loader: loadPaymentProofsPanel, group: "Sales & till", minPlan: "retail", icon: '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="m3 7 9 6 9-6"/>' },
      { key: "pos", panel: "till", label: "Till Management", loader: loadTillPanel, group: "Sales & till", minPlan: "retail", icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2H10a2 2 0 00-2 2v16"/>' },
      { key: "sales", panel: "order-alerts", label: "Order Alerts", loader: loadOrderAlertsPanel, group: "Sales & till", minPlan: "retail", icon: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><circle cx="18" cy="6" r="4" fill="var(--danger)" stroke="none"/>' },
      { key: "sales", panel: "reports", label: "Reports", loader: loadReportsPanel, roles: ["super", "admin", "manager"], group: "Sales & till", icon: '<path d="M18 20V10M12 20V4M6 20v-6"/>' },
      { key: "customers", panel: "customers", label: "Customers", loader: loadCustomersPanel, group: "People", icon: '<path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>' },
      { key: "hr", panel: "employees", label: "Employees", loader: loadEmployeesPanel, group: "People", icon: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
      { key: "attendance", panel: "attendance", label: "Attendance", loader: loadAttendancePanel, group: "People", icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>' },
      { key: "payroll", panel: "payroll", label: "Payroll", loader: loadPayrollPanel, group: "People", icon: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M8 15h.01M12 15h4"/>' },
      { key: "accounting", panel: "accounting", label: "Accounting", loader: loadAccountingPanel, group: "Finance", icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' },
      { key: null, panel: "branches", label: "Branches", loader: loadBranchesPanel, roles: ["super", "admin", "manager"], group: "Business", multiBranchOnly: true, icon: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>' },
      { key: null, panel: "manager-view", label: "Manager view", loader: loadManagerViewPanel, roles: ["super", "admin", "manager"], group: "Business", minPlan: "retail", icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>' },
      { key: null, panel: "staff-view", label: "Staff view", loader: loadStaffViewPanel, group: "Business", minPlan: "retail", icon: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 00-16 0"/>' },
      { key: null, panel: "notifications", label: "Notifications", loader: loadNotificationsPanel, group: "Business", icon: '<path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 003.4 0"/>' },
      { key: null, panel: "sms", label: "SMS centre", loader: loadSmsPanel, roles: ["super", "admin", "manager"], group: "Business", minPlan: "business", icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' },
    ];
    const PANEL_LOADERS = Object.fromEntries(NAV_ITEMS.map((n) => [n.panel, n.loader]));
    PANEL_LOADERS.settings = loadSettingsPanel;

    /** Grouped into labeled sections rather than one long undifferentiated list — a flat wall of 18+ items is exactly what reads as a generic template sidebar. */
    function renderSidebar() {
      const nav = document.getElementById("sidebar-nav");
      const items = NAV_ITEMS.filter((n) => !n.hideFromSidebar
        && (n.key === null || ACTIVE_MODULES.includes(n.key))
        && (!n.roles || n.roles.includes(USER_ROLE))
        && (!n.multiBranchOnly || HAS_MULTIPLE_BRANCHES)
        && (!n.minPlan || meetsPlanTier(PLAN_KEY, n.minPlan)));

      let html = "";
      let lastGroup = null;
      items.forEach((n) => {
        if (n.group !== lastGroup) {
          html += `<div class="sidebar-group-label">${n.group}</div>`;
          lastGroup = n.group;
        }
        html += `
          <button class="sidebar-link" data-panel-link="${n.panel}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${n.icon}</svg>
            ${n.label}
          </button>
        `;
      });
      nav.innerHTML = html;
      nav.querySelectorAll("[data-panel-link]").forEach((btn) => {
        btn.addEventListener("click", () => { openPanel(btn.dataset.panelLink); closeSidebar(); });
      });
    }

    /** Same tier order and "no plan = never restricted" rule as the web app's meetsPlanTier() in lib/plans.ts. */
    const PLAN_TIERS = ["starter", "retail", "business", "professional", "enterprise"];
    function meetsPlanTier(key, min) {
      if (!key) return true;
      return PLAN_TIERS.indexOf(key) >= PLAN_TIERS.indexOf(min);
    }

    async function loadModules() {
      const gen = SESSION_GEN;
      try {
        const data = await api("/modules");
        if (gen !== SESSION_GEN) return;
        ACTIVE_MODULES = data.active;
        PLAN_KEY = data.planKey;
        HAS_MULTIPLE_BRANCHES = data.hasMultipleBranches;
        renderSidebar();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /* ---------------- Navigation ---------------- */
    function openPanel(panel) {
      // The camera keeps running in the background otherwise — panels here are
      // just hidden, not unmounted like they would be navigating away in the web app.
      if (panel !== "qr-scanner" && QR_CAMERA_STREAM) {
        qrStopCamera();
      }
      if (SCAN_CAMERA_STREAM) closeScanModal();

      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      document.querySelector(`.tab-panel[data-panel="${panel}"]`).classList.add("active");

      document.querySelectorAll(".sidebar-link").forEach((b) => b.classList.remove("active"));
      const link = Array.from(document.querySelectorAll(".sidebar-link")).find((b) => b.dataset.panelLink === panel);
      if (link) link.classList.add("active");

      document.querySelectorAll(".bottom-tab[data-tab]").forEach((b) => b.classList.remove("active"));
      const bottomTab = document.querySelector(`.bottom-tab[data-tab="${panel}"]`);
      if (bottomTab) bottomTab.classList.add("active");

      if (PANEL_LOADERS[panel]) PANEL_LOADERS[panel]();
    }

    document.querySelectorAll(".bottom-tab[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => openPanel(btn.dataset.tab));
    });

    document.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => openSidebar());
    });

    function openSidebar() {
      document.getElementById("sidebar").classList.add("open");
      document.getElementById("sidebar-backdrop").classList.remove("hidden");
    }
    function closeSidebar() {
      document.getElementById("sidebar").classList.remove("open");
      document.getElementById("sidebar-backdrop").classList.add("hidden");
    }
    document.getElementById("menu-tab-btn").addEventListener("click", openSidebar);
    document.getElementById("sidebar-backdrop").addEventListener("click", closeSidebar);

    /* ---------------- Overview ---------------- */
    function greetingFor(hour) {
      if (hour < 12) return "Good morning";
      if (hour < 17) return "Good afternoon";
      return "Good evening";
    }

    let clockTimer;
    function startClock() {
      clearInterval(clockTimer);
      const tick = () => {
        const now = new Date();
        document.getElementById("greeting-text").textContent = `${greetingFor(now.getHours())}, ${FIRST_NAME}`;
        document.getElementById("greeting-time").textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        document.getElementById("greeting-date").textContent = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      };
      tick();
      clockTimer = setInterval(tick, 1000);
    }

    function renderBarChart(series, containerId) {
      const container = document.getElementById(containerId || "revenue-chart");
      const max = Math.max(1, ...series.map((d) => d.revenue));
      const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "short" });
      container.innerHTML = series.map((d) => `
        <div class="bar-col ${d.day === todayLabel ? "today" : ""}">
          <div class="bar" style="height:${Math.max(4, (d.revenue / max) * 100)}%" title="${money(d.revenue)}"></div>
          <div class="bar-day">${d.day}</div>
        </div>
      `).join("");
    }

    /** Today's revenue as a share of this week's daily average — real numbers already fetched for the bar chart above, just re-expressed as a ring. */
    function renderTodayGauge(todayRevenue, series) {
      const circumference = 2 * Math.PI * 52;
      const avg = series.length ? series.reduce((s, d) => s + d.revenue, 0) / series.length : 0;

      if (avg <= 0) {
        document.getElementById("gauge-fill-circle").style.strokeDasharray = `0 ${circumference}`;
        document.getElementById("gauge-pct").textContent = "—";
        document.getElementById("gauge-info-sub").textContent = todayRevenue > 0
          ? `${money(todayRevenue)} today — not enough history yet to compare.`
          : "No sales this week yet.";
        return;
      }

      const pct = Math.round((todayRevenue / avg) * 100);
      const filled = (Math.min(pct, 100) / 100) * circumference;
      document.getElementById("gauge-fill-circle").style.strokeDasharray = `${filled} ${circumference}`;
      document.getElementById("gauge-pct").textContent = `${pct}%`;
      document.getElementById("gauge-info-sub").textContent = `${money(todayRevenue)} today vs ${money(Math.round(avg))} average — ${pct >= 100 ? "ahead of" : "behind"} pace.`;
    }

    async function loadOverview() {
      const gen = SESSION_GEN;
      showLoading("overview-recent-sales");
      showLoading("low-stock-list");
      document.querySelectorAll(".stat .value").forEach((el) => { el.textContent = "—"; });
      try {
        const dash = await api("/dashboard");
        if (gen !== SESSION_GEN) return;
        CURRENCY = dash.business.currency;
        FIRST_NAME = dash.user.name.trim().split(/\s+/)[0] || dash.user.name;
        BUSINESS_NAME = dash.business.name;
        USER_ROLE = dash.user.role;
        startClock();

        BRANCH_LOCKED = dash.branchLocked;
        document.getElementById("biz-name").textContent = dash.business.name;
        document.getElementById("biz-sub").textContent = dash.branchName || "All branches";
        document.getElementById("greeting-sub").textContent = dash.branchName
          ? `Here's what's happening at ${dash.branchName} today.`
          : "Here's what's happening across all branches today.";

        document.getElementById("stat-sales-total").textContent = money(dash.today.salesTotal);
        const deltaEl = document.getElementById("stat-sales-delta");
        if (dash.today.salesTotal === 0) {
          deltaEl.textContent = "no sales yet today";
          deltaEl.className = "hint";
        } else if (dash.today.revenueDeltaPct === null) {
          deltaEl.textContent = "no sales yesterday";
          deltaEl.className = "hint";
        } else {
          const pct = dash.today.revenueDeltaPct;
          deltaEl.textContent = `${pct >= 0 ? "+" : ""}${pct}% vs yesterday`;
          deltaEl.className = "hint " + (pct >= 0 ? "up" : "down");
        }

        document.getElementById("stat-sales-count").textContent = dash.today.salesCount;
        document.getElementById("stat-avg-basket").textContent = dash.today.salesCount ? `avg ${money(dash.today.averageBasket)}` : "no receipts yet";

        document.getElementById("stat-stock-value").textContent = money(dash.stockValue);
        const lowHint = document.getElementById("stat-low-stock-hint");
        lowHint.textContent = `${dash.lowStockCount} item${dash.lowStockCount === 1 ? "" : "s"} low`;
        lowHint.className = "hint " + (dash.lowStockCount > 0 ? "down" : "");

        document.getElementById("stat-customers").textContent = dash.customerCount;

        document.getElementById("week-revenue").textContent = money(dash.weekRevenue);
        renderBarChart(dash.revenueSeries);
        renderTodayGauge(dash.today.salesTotal, dash.revenueSeries);

        const sales = await api("/sales");
        if (gen !== SESSION_GEN) return;
        const container = document.getElementById("overview-recent-sales");
        const recent = sales.slice(0, 5);
        container.innerHTML = recent.length
          ? recent.map(rowSale).join("")
          : '<p class="empty">No sales yet.</p>';

        const lowStockProducts = await api("/products?low_stock=1");
        if (gen !== SESSION_GEN) return;
        const lowStockContainer = document.getElementById("low-stock-list");
        lowStockContainer.innerHTML = lowStockProducts.length
          ? lowStockProducts.slice(0, 6).map((p) => `<div class="list-row">
              <div><div class="name">${p.name}</div><div class="meta">${p.category || "Uncategorised"} · ${p.sku}</div></div>
              <span class="pill pill-warn">${p.stock} left</span>
            </div>`).join("")
          : '<p class="empty">Nothing is low on stock right now.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function rowSale(s) {
      return `<div class="list-row">
        <div><div class="name">${s.customer}</div><div class="meta">${s.reference} · ${s.method}</div></div>
        <div class="amount">${money(s.total)}</div>
      </div>`;
    }

    /* ---------------- Products ---------------- */
    let ALL_PRODUCTS = [];
    let PRODUCT_SEARCH = "";

    async function loadProducts(search) {
      if (search !== undefined) PRODUCT_SEARCH = search;
      showLoading("products-list");
      document.getElementById("products-stat-value").textContent = "—";
      document.getElementById("products-stat-low").textContent = "—";
      try {
        const q = PRODUCT_SEARCH ? `?search=${encodeURIComponent(PRODUCT_SEARCH)}` : "";
        ALL_PRODUCTS = await api("/products" + q);
        renderProductsList();

        const stockValue = ALL_PRODUCTS.reduce((s, p) => s + p.buyingPrice * p.stock, 0);
        const lowCount = ALL_PRODUCTS.filter((p) => p.lowStock).length;
        document.getElementById("products-stat-value").textContent = money(stockValue);
        document.getElementById("products-stat-low").textContent = lowCount;
        document.getElementById("products-stat-total").textContent = `${ALL_PRODUCTS.length} SKU${ALL_PRODUCTS.length === 1 ? "" : "s"}`;
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderProductsList() {
      document.getElementById("products-list").innerHTML = ALL_PRODUCTS.length
        ? ALL_PRODUCTS.map((p) => `<div class="list-row" data-product-id="${p.id}" style="cursor:pointer;">
            <div><div class="name">${p.name}</div><div class="meta">${p.category || "Uncategorised"} · ${p.branch || "Unassigned"} · ${p.sku}</div></div>
            <div style="text-align:right;">
              <div class="amount">${money(p.price)}</div>
              <span class="pill ${p.lowStock ? "pill-warn" : "pill-ok"}">${p.stock} in stock</span>
            </div>
          </div>`).join("")
        : '<p class="empty">No products found.</p>';
    }

    document.getElementById("products-list").addEventListener("click", (e) => {
      const row = e.target.closest(".list-row[data-product-id]");
      if (!row) return;
      const product = ALL_PRODUCTS.find((p) => p.id === Number(row.dataset.productId));
      if (product) openProductModal(product);
    });

    let searchTimer;
    document.getElementById("product-search").addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadProducts(e.target.value), 300);
    });

    /* ---- Add / edit product ---- */
    let PRODUCT_IMAGE_DATA_URL = null;
    let PRODUCT_REMOVE_IMAGE = false;

    document.getElementById("product-image-file").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast("Image is too large — keep it under 2MB.", "error");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        PRODUCT_IMAGE_DATA_URL = String(reader.result);
        PRODUCT_REMOVE_IMAGE = false;
        const preview = document.getElementById("product-image-preview");
        preview.src = PRODUCT_IMAGE_DATA_URL;
        preview.style.display = "block";
        document.getElementById("product-image-remove-btn").style.display = "inline-block";
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("product-image-remove-btn").addEventListener("click", () => {
      PRODUCT_IMAGE_DATA_URL = null;
      PRODUCT_REMOVE_IMAGE = true;
      document.getElementById("product-image-file").value = "";
      document.getElementById("product-image-preview").style.display = "none";
      document.getElementById("product-image-remove-btn").style.display = "none";
    });

    async function ensureProductFormOptions() {
      try {
        const [categories, branches] = await Promise.all([api("/categories"), api("/branches")]);
        document.getElementById("product-category-options").innerHTML = categories.map((c) => `<option value="${c}"></option>`).join("");
        document.getElementById("product-branch").innerHTML = '<option value="">Unassigned</option>'
          + branches.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
      } catch (err) {
        toast(err.message, "error");
      }
    }

    async function openProductModal(product) {
      document.getElementById("product-form-error").textContent = "";
      document.getElementById("product-form").reset();
      PRODUCT_IMAGE_DATA_URL = null;
      PRODUCT_REMOVE_IMAGE = false;
      await ensureProductFormOptions();

      const isEdit = !!product;
      document.getElementById("product-modal-title").textContent = isEdit ? "Edit product" : "Add product";
      document.getElementById("product-delete-btn").style.display = isEdit ? "block" : "none";
      document.getElementById("product-id").value = isEdit ? product.id : "";
      document.getElementById("product-name").value = isEdit ? product.name : "";
      document.getElementById("product-category").value = isEdit ? (product.category || "") : "";
      document.getElementById("product-selling-price").value = isEdit ? product.price : "";
      document.getElementById("product-buying-price").value = isEdit ? product.buyingPrice : "";
      document.getElementById("product-stock").value = isEdit ? product.stock : "0";
      document.getElementById("product-low-stock").value = isEdit ? product.lowStockThreshold : "12";
      document.getElementById("product-branch").value = isEdit && product.branchId ? String(product.branchId) : "";
      document.getElementById("product-expiry").value = isEdit && product.expiryDate ? product.expiryDate : "";

      const preview = document.getElementById("product-image-preview");
      const removeBtn = document.getElementById("product-image-remove-btn");
      if (isEdit && product.imagePath) {
        preview.src = product.imagePath;
        preview.style.display = "block";
        removeBtn.style.display = "inline-block";
      } else {
        preview.style.display = "none";
        removeBtn.style.display = "none";
      }

      document.getElementById("product-modal-backdrop").classList.remove("hidden");
      document.getElementById("product-modal").classList.remove("hidden");
    }

    function closeProductModal() {
      document.getElementById("product-modal").classList.add("hidden");
      document.getElementById("product-modal-backdrop").classList.add("hidden");
    }

    document.getElementById("product-add-btn").addEventListener("click", () => openProductModal(null));
    document.getElementById("product-modal-close").addEventListener("click", closeProductModal);
    document.getElementById("product-modal-backdrop").addEventListener("click", closeProductModal);

    document.getElementById("product-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("product-form-error");
      errorEl.textContent = "";
      const id = document.getElementById("product-id").value;
      const payload = {
        name: document.getElementById("product-name").value.trim(),
        category: document.getElementById("product-category").value.trim() || null,
        selling_price: Number(document.getElementById("product-selling-price").value) || 0,
        buying_price: Number(document.getElementById("product-buying-price").value) || 0,
        stock: Number(document.getElementById("product-stock").value) || 0,
        low_stock_threshold: Number(document.getElementById("product-low-stock").value) || 12,
        branch_id: document.getElementById("product-branch").value ? Number(document.getElementById("product-branch").value) : null,
        expiry_date: document.getElementById("product-expiry").value || null,
      };
      if (PRODUCT_IMAGE_DATA_URL) payload.image_data_url = PRODUCT_IMAGE_DATA_URL;
      if (PRODUCT_REMOVE_IMAGE) payload.remove_image = true;

      const btn = document.getElementById("product-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        if (id) {
          await api(`/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
          toast("Product updated.", "success");
        } else {
          await api("/products", { method: "POST", body: JSON.stringify(payload) });
          toast("Product added.", "success");
        }
        closeProductModal();
        loadProducts();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    document.getElementById("product-delete-btn").addEventListener("click", async () => {
      const id = document.getElementById("product-id").value;
      if (!id || !confirm("Delete this product? This cannot be undone.")) return;
      const btn = document.getElementById("product-delete-btn");
      btn.disabled = true;
      try {
        const res = await api(`/products/${id}`, { method: "DELETE" });
        toast(res.message, "success");
        closeProductModal();
        loadProducts();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });

    /* ---------------- Inventory dashboard ---------------- */
    async function loadInventoryPanel() {
      ["inv-stat-cost", "inv-stat-retail", "inv-stat-skus", "inv-stat-units", "inv-stat-low"].forEach((id) => {
        document.getElementById(id).textContent = "—";
      });
      document.getElementById("inv-subtitle").textContent = BRANCH_LOCKED
        ? "Business-wide stock summary"
        : (SELECTED_BRANCH_ID ? "Stock summary for the selected branch" : "Stock summary across all branches");
      showLoading("inv-low-stock-list");
      try {
        const [s, analytics, lowStock] = await Promise.all([
          api("/products/summary"),
          api("/products/analytics"),
          api("/products?low_stock=1"),
        ]);
        document.getElementById("inv-stat-cost").textContent = money(s.costValue);
        document.getElementById("inv-stat-retail").textContent = money(s.retailValue);
        document.getElementById("inv-stat-skus").textContent = s.skuCount;
        document.getElementById("inv-stat-units").textContent = s.stockUnits;
        document.getElementById("inv-stat-low").textContent = s.lowStock;

        renderStockLevelsDonut(analytics.levels);
        renderRankedBars("inv-movers-list", analytics.topMovers);
        renderRankedBars("inv-branch-list", analytics.byBranch.map((b) => ({ name: b.name, revenue: b.value })));

        document.getElementById("inv-low-stock-list").innerHTML = lowStock.length
          ? lowStock.slice(0, 20).map((p) => `
              <div class="list-row">
                <div>
                  <div class="name">${p.name}</div>
                  <div class="meta">${p.category || "Uncategorised"} · ${p.sku || "—"}</div>
                </div>
                <span class="pill pill-warn">${p.stock} left</span>
              </div>
            `).join("")
          : '<p class="empty">Nothing is low on stock right now.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /** Fixed three-way health split (in stock / low / out) — same semantic colours as the web app's status pills, not the generic per-item palette the other donuts use. */
    function renderStockLevelsDonut(levels) {
      const container = document.getElementById("inv-levels-chart");
      const data = [
        { name: "In stock", value: levels.healthy, color: "var(--success)" },
        { name: "Low stock", value: levels.low, color: "var(--warning)" },
        { name: "Out of stock", value: levels.out, color: "var(--danger)" },
      ];
      const total = data.reduce((s, d) => s + d.value, 0);
      if (!total) {
        container.innerHTML = '<p class="empty">No products yet.</p>';
        return;
      }
      let cumulative = 0;
      const stops = data.map((d) => {
        const start = cumulative;
        cumulative += (d.value / total) * 100;
        return `${d.color} ${start}% ${cumulative}%`;
      }).join(", ");
      const legend = data.map((d) => `
        <div class="donut-legend-item">
          <span class="donut-legend-dot" style="background:${d.color};"></span>
          <span style="flex:1;">${d.name}</span>
          <span style="font-weight:600;">${d.value}</span>
        </div>
      `).join("");
      container.innerHTML = `
        <div class="donut-chart" style="background:conic-gradient(${stops});"></div>
        <div class="donut-legend">${legend}</div>
      `;
    }

    document.getElementById("inv-add-product-btn").addEventListener("click", () => {
      openPanel("products");
      openProductModal(null);
    });

    /* ---------------- Expiry tracking ---------------- */
    async function loadExpiryPanel() {
      showLoading("expiry-list");
      document.getElementById("expiry-stat-count").textContent = "—";
      try {
        const products = await api("/products/expiring");
        document.getElementById("expiry-stat-count").textContent = products.length;
        document.getElementById("expiry-list").innerHTML = products.length
          ? products.map((p) => {
              const daysLeft = Math.ceil((new Date(p.expiryDate) - new Date()) / 86400000);
              const pillClass = daysLeft <= 3 ? "pill-danger" : "pill-warn";
              return `<div class="list-row">
                <div><div class="name">${p.name}</div><div class="meta">${p.branch || "Unassigned"} · ${p.stock} in stock</div></div>
                <div style="text-align:right;">
                  <div class="amount">${new Date(p.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  <span class="pill ${pillClass}">${daysLeft <= 0 ? "Expired" : daysLeft + "d left"}</span>
                </div>
              </div>`;
            }).join("")
          : '<p class="empty">Nothing expiring in the next 30 days.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /* ---------------- Sales ---------------- */
    let ALL_SALES = [];
    let SALES_STATUS_FILTER = "all";
    let SALES_SEARCH = "";

    function statusPillClass(status) {
      return status === "paid" ? "pill-ok" : status === "pending" ? "pill-warn" : "pill-danger";
    }

    /** Full 30-day visual dashboard, ported to match the web app's own Sales page. */
    async function loadSales() {
      showLoading("sales-stat-grid");
      showLoading("sales-list");
      try {
        const [stats, analytics] = await Promise.all([api("/sales/stats"), api("/sales/analytics")]);
        renderSalesStatCards(stats);
        renderBarChart(analytics.profitSeries.map((d) => ({ day: d.day.split(" ")[0], revenue: d.revenue })), "sales-trend-chart");
        renderReportDonut("sales-category-chart", analytics.byCategory);
        renderRankedBars("sales-branch-list", analytics.byBranch);
        renderRankedBars("sales-products-list", analytics.topProducts);
        document.getElementById("sales-payment-chart").innerHTML = renderPaymentMixDonut(analytics.paymentBreakdown);
        renderSalesVsProfitChart(analytics.profitSeries);

        ALL_SALES = await api("/sales");
        renderSalesList();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /** Same six stats, same order, as the web app's Sales page: gross, receipts, customers, average order value, profit, refunds. */
    function renderSalesStatCards(stats) {
      const deltaHint = (label, delta, suffix) => {
        if (delta === null) return { hint: suffix, hintClass: "" };
        return { hint: `${delta >= 0 ? "+" : ""}${delta}% ${suffix}`, hintClass: delta >= 0 ? "up" : "down" };
      };

      const cards = [
        { label: "Gross sales", value: money(stats.gross), ...deltaHint("gross", stats.grossDeltaPct, "vs previous 30 days") },
        { label: "Receipts issued", value: String(stats.receipts), ...deltaHint("receipts", stats.receiptsDeltaPct, "vs previous 30 days") },
        { label: "Customers served", value: String(stats.customers), ...deltaHint("customers", stats.customersDeltaPct, "vs previous 30 days") },
        { label: "Avg order value", value: money(stats.averageOrderValue), hint: "per receipt, last 30 days" },
        { label: "Profit", value: money(stats.profit), ...deltaHint("profit", stats.profitDeltaPct, "vs previous 30 days, est.") },
        { label: "Refunds", value: money(stats.refunds), hint: `${stats.refundCount} receipt${stats.refundCount === 1 ? "" : "s"} · ${stats.pending} pending` },
      ];

      document.getElementById("sales-stat-grid").innerHTML = cards.map((c) => `
        <div class="stat">
          <div class="label">${c.label}</div>
          <div class="value">${c.value}</div>
          <div class="hint ${c.hintClass || ""}">${c.hint}</div>
        </div>
      `).join("");
    }

    /** Two thinner bars per day (sales + profit) inside the same bar-chart columns used everywhere else in this app — the mobile equivalent of the web app's combined bar+line chart. */
    function renderSalesVsProfitChart(series) {
      const container = document.getElementById("sales-vs-profit-chart");
      if (!series.length) {
        container.innerHTML = '<p class="empty">No data yet.</p>';
        return;
      }
      const max = Math.max(1, ...series.map((d) => Math.max(d.revenue, d.profit)));
      container.innerHTML = series.map((d) => `
        <div class="bar-col">
          <div style="display:flex;align-items:flex-end;gap:2px;height:100%;width:100%;justify-content:center;">
            <div class="bar" style="height:${Math.max(4, (d.revenue / max) * 100)}%;max-width:9px;" title="Sales: ${money(d.revenue)}"></div>
            <div class="bar" style="height:${Math.max(4, (d.profit / max) * 100)}%;max-width:9px;background:var(--accent);" title="Profit: ${money(d.profit)}"></div>
          </div>
          <div class="bar-day">${d.day.split(" ")[0]}</div>
        </div>
      `).join("");
    }

    function renderSalesList() {
      const q = SALES_SEARCH.toLowerCase();
      const rows = ALL_SALES.filter((s) =>
        (SALES_STATUS_FILTER === "all" || s.status === SALES_STATUS_FILTER) &&
        (q === "" || s.customer.toLowerCase().includes(q) || s.reference.toLowerCase().includes(q)));

      document.getElementById("sales-list").innerHTML = rows.length
        ? rows.map((s) => `<div class="list-row" data-ref="${s.reference}" style="cursor:pointer;">
            <div>
              <div class="name">${s.customer}</div>
              <div class="meta">${s.reference} · ${s.branch || "—"} · ${s.items} item${s.items === 1 ? "" : "s"} · ${s.method} · ${s.time}</div>
            </div>
            <div style="text-align:right;">
              <div class="amount">${money(s.total)}</div>
              <span class="pill ${statusPillClass(s.status)}">${s.status}</span>
            </div>
          </div>`).join("")
        : '<p class="empty">No receipts match.</p>';
    }

    document.getElementById("sales-list").addEventListener("click", (e) => {
      const row = e.target.closest(".list-row[data-ref]");
      if (row) openReceipt(row.dataset.ref);
    });

    document.getElementById("sales-search").addEventListener("input", (e) => {
      SALES_SEARCH = e.target.value;
      renderSalesList();
    });
    document.querySelectorAll("#sales-status-filter button").forEach((btn) => {
      btn.addEventListener("click", () => {
        SALES_STATUS_FILTER = btn.dataset.status;
        document.querySelectorAll("#sales-status-filter button").forEach((b) => b.classList.toggle("active", b === btn));
        renderSalesList();
      });
    });

    /** Zero-dependency CSV export — same Blob + <a download> approach the web app's report builder uses. */
    document.getElementById("sales-export-btn").addEventListener("click", () => {
      if (ALL_SALES.length === 0) {
        toast("Nothing to export yet.", "error");
        return;
      }
      const header = ["Receipt", "Customer", "Branch", "Items", "Method", "Status", "Time", "Amount"];
      const rows = ALL_SALES.map((s) => [s.reference, s.customer, s.branch || "", s.items, s.method, s.status, s.time, s.total]);
      const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    /* ---------------- Orders ---------------- */
    let ALL_ORDERS = [];
    let ORDERS_STATUS_FILTER = "all";
    let ORDERS_SEARCH = "";

    async function loadOrders() {
      showLoading("orders-list");
      document.getElementById("orders-stat-pending").textContent = "—";
      document.getElementById("orders-stat-finished").textContent = "—";
      try {
        ALL_ORDERS = await api("/remote-orders");
        document.getElementById("orders-stat-pending").textContent = ALL_ORDERS.filter((o) => o.status === "pending").length;
        document.getElementById("orders-stat-finished").textContent = ALL_ORDERS.filter((o) => o.status === "finished").length;
        renderOrdersList();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function orderStatusPillClass(status) {
      return status === "finished" ? "pill-ok" : status === "pending" ? "pill-warn" : "pill-danger";
    }

    function renderOrdersList() {
      const q = ORDERS_SEARCH.toLowerCase();
      const rows = ALL_ORDERS.filter((o) =>
        (ORDERS_STATUS_FILTER === "all" || o.status === ORDERS_STATUS_FILTER) &&
        (q === "" || o.customer.toLowerCase().includes(q)));

      const container = document.getElementById("orders-list");
      container.innerHTML = rows.length ? rows.map((o) => `<div class="list-row">
          <div>
            <div class="name">${o.reference} — ${o.customer}</div>
            <div class="meta">${o.branch || "—"} · ${o.phone || "—"} · ${new Date(o.placedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
            <button type="button" class="btn-secondary" data-view-items="${o.id}" style="margin-top:6px;">View (${o.items.length})</button>
          </div>
          <div style="text-align:right;">
            <div class="amount" style="color:var(--success);">${money(o.amount)}</div>
            <span class="pill ${orderStatusPillClass(o.status)}" style="margin-top:4px;display:inline-block;">${o.status}</span>
            ${o.status === "pending" ? `<button type="button" class="btn-danger" data-cancel="${o.id}" style="margin-top:6px;display:block;">Cancel</button>` : ""}
          </div>
        </div>`).join("")
        : '<p class="empty">No orders match.</p>';

      container.querySelectorAll("[data-view-items]").forEach((btn) => {
        btn.addEventListener("click", () => openOrderItemsModal(Number(btn.dataset.viewItems)));
      });
      container.querySelectorAll("[data-cancel]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          btn.textContent = "…";
          try {
            const res = await api(`/remote-orders/${btn.dataset.cancel}/cancel`, { method: "POST" });
            toast(res.message, "success");
            loadOrders();
            loadOverview();
          } catch (err) {
            toast(err.message, "error");
            btn.disabled = false;
            btn.textContent = "Cancel";
          }
        });
      });
    }

    document.getElementById("orders-search").addEventListener("input", (e) => {
      ORDERS_SEARCH = e.target.value;
      renderOrdersList();
    });
    document.querySelectorAll("#orders-status-filter button").forEach((btn) => {
      btn.addEventListener("click", () => {
        ORDERS_STATUS_FILTER = btn.dataset.status;
        document.querySelectorAll("#orders-status-filter button").forEach((b) => b.classList.toggle("active", b === btn));
        renderOrdersList();
      });
    });

    function openOrderItemsModal(orderId) {
      const order = ALL_ORDERS.find((o) => o.id === orderId);
      if (!order) return;
      document.getElementById("order-items-title").textContent = order.reference;
      document.getElementById("order-items-list").innerHTML = order.items.map((i) => `
        <div class="list-row"><div class="name">${i.name} × ${i.qty}</div><div class="amount">${money(i.price * i.qty)}</div></div>
      `).join("");
      document.getElementById("order-items-modal").classList.remove("hidden");
      document.getElementById("order-items-modal-backdrop").classList.remove("hidden");
    }
    function closeOrderItemsModal() {
      document.getElementById("order-items-modal").classList.add("hidden");
      document.getElementById("order-items-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("order-items-modal-close").addEventListener("click", closeOrderItemsModal);
    document.getElementById("order-items-modal-backdrop").addEventListener("click", closeOrderItemsModal);

    /* ---------------- Receipt preview ---------------- */
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

    async function openReceipt(reference) {
      document.getElementById("receipt-modal-backdrop").classList.remove("hidden");
      document.getElementById("receipt-modal").classList.remove("hidden");
      document.getElementById("receipt-body").innerHTML = '<p class="empty">Loading…</p>';
      try {
        const qs = reference ? `?reference=${encodeURIComponent(reference)}` : "";
        const r = await api(`/sales/receipt${qs}`);
        renderReceipt(r);
      } catch (err) {
        document.getElementById("receipt-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function receiptHtml(r, withPrintButton) {
      const isInvoice = r.method === "invoice";
      const dateStr = new Date(r.date).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const dueDateStr = r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

      const billTo = isInvoice ? `
        <div style="margin-top:12px; font-size:14px;">
          <div style="color:var(--muted); font-size:11px; text-transform:uppercase;">Bill to</div>
          <p style="margin-top:2px;">${r.customerName}</p>
          ${r.customerContact ? `<p style="color:var(--muted);">${r.customerContact}</p>` : ""}
          ${r.customerEmail ? `<p style="color:var(--muted);">${r.customerEmail}</p>` : ""}
        </div>
      ` : `
        <div style="margin-top:12px; font-size:14px;">
          <p><span style="color:var(--muted);">Customer:</span> ${r.customerName}</p>
          <p><span style="color:var(--muted);">Cashier:</span> ${r.cashier}</p>
          <p><span style="color:var(--muted);">Payment method:</span> ${cap(r.method)}</p>
        </div>
      `;

      return `
        <div style="display:flex; align-items:flex-start; justify-content:space-between; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <div>
            <div style="font-weight:600;">${r.businessName || BUSINESS_NAME || "Your business"}</div>
            <div style="color:var(--muted); font-size:12px;">${isInvoice ? "Invoice" : "Receipt"}${r.branch ? " · " + r.branch : ""}</div>
          </div>
          <div style="text-align:right; color:var(--muted); font-size:12px;">
            <div>${isInvoice ? "Invoice" : "Ref"}: <span style="color:var(--text); font-weight:500;">${r.reference}</span></div>
            <div>${dateStr}</div>
            ${dueDateStr ? `<div style="color:var(--danger);">Due ${dueDateStr}</div>` : ""}
          </div>
        </div>
        ${billTo}
        <table style="width:100%; margin-top:12px; font-size:14px; border-collapse:collapse;">
          <thead><tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left; padding:6px 0; font-size:11px; text-transform:uppercase; color:var(--muted);">Item</th>
            <th style="text-align:left; font-size:11px; text-transform:uppercase; color:var(--muted);">Qty</th>
            <th style="text-align:right; font-size:11px; text-transform:uppercase; color:var(--muted);">Unit</th>
            <th style="text-align:right; font-size:11px; text-transform:uppercase; color:var(--muted);">Subtotal</th>
          </tr></thead>
          <tbody>
            ${r.items.map((i) => `<tr style="border-bottom:1px solid var(--border);">
              <td style="padding:6px 0;">${i.name}</td><td>${i.qty}</td>
              <td style="text-align:right;">${money(i.price)}</td>
              <td style="text-align:right; font-weight:500;">${money(i.qty * i.price)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
        <div style="margin-top:12px; border-top:1px solid var(--border); padding-top:12px; font-size:14px;">
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--muted);">Subtotal</span><span>${money(r.subtotal)}</span></div>
          <div style="display:flex; justify-content:space-between;"><span style="color:var(--muted);">Tax (${r.taxRate}%)</span><span>${money(r.tax)}</span></div>
          <div style="display:flex; justify-content:space-between; font-weight:600;"><span>Total</span><span>${money(r.total)}</span></div>
          <div style="display:flex; justify-content:space-between; margin-top:6px;"><span style="color:var(--muted);">Paid</span><span>${money(r.amountPaid)}</span></div>
          <div style="display:flex; justify-content:space-between; font-weight:600;${r.balance > 0 ? " color:var(--danger);" : ""}"><span>${isInvoice ? "Balance due" : "Balance"}</span><span>${money(r.balance)}</span></div>
        </div>
        ${withPrintButton ? `<button type="button" class="btn-primary" id="receipt-print-btn" style="width:100%; margin-top:16px;">${isInvoice ? "Print invoice" : "Print receipt"}</button>` : ""}
      `;
    }

    function renderReceipt(r) {
      document.querySelector("#receipt-modal .modal-header strong").textContent = r.method === "invoice" ? "Invoice" : "Receipt";
      document.getElementById("receipt-body").innerHTML = receiptHtml(r, true);
      document.getElementById("receipt-print-area").innerHTML = receiptHtml(r, false);
      document.getElementById("receipt-print-btn").addEventListener("click", printReceipt);
    }

    function printReceipt() {
      document.body.classList.add("printing-receipt");
      window.print();
    }
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-receipt"));

    function closeReceiptModal() {
      document.getElementById("receipt-modal").classList.add("hidden");
      document.getElementById("receipt-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("receipt-modal-close").addEventListener("click", closeReceiptModal);
    document.getElementById("receipt-modal-backdrop").addEventListener("click", closeReceiptModal);

    /* ---------------- QR Scanner ---------------- */
    let QR_ORDERS = [];
    let QR_SCANNED = null;
    let QR_METHOD = "cash";
    let QR_CAMERA_STREAM = null;
    let QR_CAMERA_RAF = null;
    let QR_PRELOAD_REF = null;

    function qrCameraSupported() {
      return typeof window !== "undefined" && "BarcodeDetector" in window;
    }

    async function loadQrScannerPanel() {
      if (!qrCameraSupported()) {
        document.getElementById("qr-camera-toggle").classList.add("hidden");
        document.getElementById("qr-hint").textContent = "Camera scanning isn't supported in this browser — try Chrome, or use a handheld QR scanner (it types into the field below like a keyboard).";
      }
      try {
        QR_ORDERS = await api("/remote-orders");
        // Order Alerts' "Complete" button jumps here with a reference pre-filled — mirrors the web app's /qr-scanner?ref=... deep link.
        if (QR_PRELOAD_REF) {
          qrLookup(QR_PRELOAD_REF);
          QR_PRELOAD_REF = null;
        }
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function qrLookup(reference) {
      const ref = reference.trim();
      if (!ref) return;
      const order = QR_ORDERS.find((o) => o.reference.toLowerCase() === ref.toLowerCase());
      document.getElementById("qr-not-found").textContent = "";
      if (!order) {
        document.getElementById("qr-not-found").textContent = `No order found matching "${ref}".`;
        QR_SCANNED = null;
        document.getElementById("qr-order-details").style.display = "none";
        return;
      }
      QR_SCANNED = order;
      document.getElementById("qr-manual-ref").value = "";
      renderQrOrder();
    }

    function renderQrOrder() {
      const order = QR_SCANNED;
      if (!order) return;
      document.getElementById("qr-order-details").style.display = "block";
      document.getElementById("qr-d-ref").textContent = order.reference;
      document.getElementById("qr-d-branch").textContent = order.branch || "—";
      document.getElementById("qr-d-customer").textContent = order.customer;
      document.getElementById("qr-d-phone").textContent = order.phone || "—";
      document.getElementById("qr-d-amount").textContent = money(order.amount);
      document.getElementById("qr-d-date").textContent = new Date(order.placedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

      document.getElementById("qr-order-items").innerHTML = order.items.map((i) => `
        <div class="list-row"><div class="name">${i.name} × ${i.qty}</div><div class="amount">${money(i.price * i.qty)}</div></div>
      `).join("");

      const area = document.getElementById("qr-complete-area");
      if (order.status !== "pending") {
        area.innerHTML = `<p class="empty">This order is already ${order.status} — nothing to complete.</p>`;
        return;
      }
      area.innerHTML = `
        <select id="qr-method-select" style="margin-bottom:10px;">
          <option value="cash">Cash</option>
          <option value="mpesa">Mobile Money</option>
          <option value="card">Card</option>
          <option value="bank">Bank</option>
        </select>
        <button type="button" class="btn-primary" id="qr-complete-btn" style="width:100%;">Complete order</button>
      `;
      document.getElementById("qr-method-select").addEventListener("change", (e) => { QR_METHOD = e.target.value; });
      document.getElementById("qr-complete-btn").addEventListener("click", qrCompleteOrder);
    }

    async function qrCompleteOrder() {
      if (!QR_SCANNED) return;
      const btn = document.getElementById("qr-complete-btn");
      btn.disabled = true;
      btn.textContent = "Completing…";
      try {
        const res = await api("/remote-orders/complete", {
          method: "POST",
          body: JSON.stringify({ reference: QR_SCANNED.reference, method: QR_METHOD }),
        });
        toast(res.message, "success");
        document.getElementById("qr-complete-area").innerHTML = `
          <div class="empty" style="color:var(--success);">Sale recorded successfully. Receipt no. ${res.receiptReference}</div>
          <button type="button" class="btn-secondary" id="qr-view-receipt-btn" style="width:100%;margin-top:10px;">View receipt</button>
        `;
        document.getElementById("qr-view-receipt-btn").addEventListener("click", () => openReceipt(res.receiptReference));
        QR_ORDERS = await api("/remote-orders");
        loadOverview();
        refreshNotifBadge();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = "Complete order";
      }
    }

    document.getElementById("qr-reset-btn").addEventListener("click", () => {
      QR_SCANNED = null;
      document.getElementById("qr-order-details").style.display = "none";
      document.getElementById("qr-not-found").textContent = "";
    });

    document.getElementById("qr-manual-form").addEventListener("submit", (e) => {
      e.preventDefault();
      qrLookup(document.getElementById("qr-manual-ref").value);
    });

    function qrStopCamera() {
      if (QR_CAMERA_RAF) cancelAnimationFrame(QR_CAMERA_RAF);
      QR_CAMERA_RAF = null;
      QR_CAMERA_STREAM?.getTracks().forEach((t) => t.stop());
      QR_CAMERA_STREAM = null;
      document.getElementById("qr-camera-on").classList.add("hidden");
      document.getElementById("qr-camera-off").classList.remove("hidden");
      document.getElementById("qr-camera-toggle").textContent = "Scan with camera";
    }

    async function qrStartCamera() {
      document.getElementById("qr-camera-error").textContent = "";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        QR_CAMERA_STREAM = stream;
        const video = document.getElementById("qr-video");
        video.srcObject = stream;
        await video.play();
        document.getElementById("qr-camera-off").classList.add("hidden");
        document.getElementById("qr-camera-on").classList.remove("hidden");
        document.getElementById("qr-camera-toggle").textContent = "Stop camera";

        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (!video || video.readyState < 2) {
            QR_CAMERA_RAF = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) {
              const value = codes[0].rawValue;
              qrStopCamera();
              qrLookup(value);
              return;
            }
          } catch {
            // A single failed frame isn't worth surfacing — keep scanning.
          }
          QR_CAMERA_RAF = requestAnimationFrame(tick);
        };
        QR_CAMERA_RAF = requestAnimationFrame(tick);
      } catch {
        document.getElementById("qr-camera-error").textContent = "Couldn't access the camera. Check the browser's camera permission and try again.";
      }
    }

    document.getElementById("qr-camera-toggle").addEventListener("click", () => {
      if (QR_CAMERA_STREAM) qrStopCamera();
      else qrStartCamera();
    });

    /* ---------------- Payment Proofs ---------------- */
    let ALL_PROOFS = [];
    let PROOF_METHOD_TAB = "MTN Merchant";
    let PROOF_STATUS_FILTER = "all";
    let PROOF_IMAGE_DATA_URL = null;

    function proofStatusPillClass(status) {
      return status === "Verified" ? "pill-ok" : status === "Pending" ? "pill-warn" : "pill-danger";
    }

    async function loadPaymentProofsPanel() {
      showLoading("proofs-list");
      try {
        ALL_PROOFS = await api("/payment-proofs");
        renderProofsList();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderProofsList() {
      const rows = ALL_PROOFS.filter((p) =>
        p.method === PROOF_METHOD_TAB && (PROOF_STATUS_FILTER === "all" || p.status === PROOF_STATUS_FILTER));

      const container = document.getElementById("proofs-list");
      container.innerHTML = rows.length ? rows.map((p) => `
        <div class="list-row">
          <div>
            <div class="name">${p.ref} — ${p.customer}</div>
            <div class="meta">${p.branch || "—"} · ${p.phone || "—"} · ${p.location || "—"}</div>
            <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
              ${p.imagePath ? `<button type="button" class="btn-secondary" data-view-proof="${p.id}">View screenshot</button>` : '<span class="cmeta">No image</span>'}
              ${p.status === "Pending" ? `
                <button type="button" class="btn-success" data-verify="${p.id}">Verify</button>
                <button type="button" class="btn-danger" data-reject="${p.id}">Reject</button>
              ` : ""}
            </div>
          </div>
          <span class="pill ${proofStatusPillClass(p.status)}">${p.status}</span>
        </div>
      `).join("") : '<p class="empty">No payment proofs match.</p>';

      container.querySelectorAll("[data-view-proof]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const proof = ALL_PROOFS.find((p) => p.id === Number(btn.dataset.viewProof));
          if (!proof) return;
          document.getElementById("proof-image-title").textContent = `${proof.ref} — ${proof.customer}`;
          document.getElementById("proof-image-el").src = proof.imagePath;
          document.getElementById("proof-image-modal").classList.remove("hidden");
          document.getElementById("proof-image-modal-backdrop").classList.remove("hidden");
        });
      });
      container.querySelectorAll("[data-verify], [data-reject]").forEach((btn) => {
        btn.addEventListener("click", () => reviewProof(btn));
      });
    }

    async function reviewProof(btn) {
      const id = btn.dataset.verify || btn.dataset.reject;
      const status = btn.dataset.verify ? "verified" : "rejected";
      btn.disabled = true;
      try {
        const res = await api(`/payment-proofs/${id}/review`, { method: "POST", body: JSON.stringify({ status }) });
        toast(res.message, "success");
        loadPaymentProofsPanel();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
      }
    }

    document.querySelectorAll("#proof-method-tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        PROOF_METHOD_TAB = btn.dataset.methodTab;
        document.querySelectorAll("#proof-method-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
        renderProofsList();
      });
    });
    document.querySelectorAll("#proof-status-filter button").forEach((btn) => {
      btn.addEventListener("click", () => {
        PROOF_STATUS_FILTER = btn.dataset.status;
        document.querySelectorAll("#proof-status-filter button").forEach((b) => b.classList.toggle("active", b === btn));
        renderProofsList();
      });
    });

    function closeProofImageModal() {
      document.getElementById("proof-image-modal").classList.add("hidden");
      document.getElementById("proof-image-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("proof-image-modal-close").addEventListener("click", closeProofImageModal);
    document.getElementById("proof-image-modal-backdrop").addEventListener("click", closeProofImageModal);

    async function openProofAddModal() {
      document.getElementById("proof-add-form").reset();
      document.getElementById("proof-file-name").textContent = "";
      document.getElementById("proof-add-error").textContent = "";
      PROOF_IMAGE_DATA_URL = null;
      try {
        const branches = await api("/branches");
        document.getElementById("proof-branch").innerHTML = '<option value="">—</option>' + branches.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
      } catch {
        // Non-fatal — branch is optional on the proof.
      }
      document.getElementById("proof-add-modal").classList.remove("hidden");
      document.getElementById("proof-add-modal-backdrop").classList.remove("hidden");
    }
    function closeProofAddModal() {
      document.getElementById("proof-add-modal").classList.add("hidden");
      document.getElementById("proof-add-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("proof-add-btn").addEventListener("click", openProofAddModal);
    document.getElementById("proof-add-modal-close").addEventListener("click", closeProofAddModal);
    document.getElementById("proof-add-modal-backdrop").addEventListener("click", closeProofAddModal);

    document.getElementById("proof-file").addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) { PROOF_IMAGE_DATA_URL = null; return; }
      if (file.size > 2 * 1024 * 1024) {
        toast("Image is too large — keep it under 2MB.", "error");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        PROOF_IMAGE_DATA_URL = String(reader.result);
        document.getElementById("proof-file-name").textContent = `Attached: ${file.name}`;
      };
      reader.readAsDataURL(file);
    });

    document.getElementById("proof-add-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("proof-add-error");
      errorEl.textContent = "";
      if (!PROOF_IMAGE_DATA_URL) {
        errorEl.textContent = "Attach a screenshot image.";
        return;
      }
      const btn = document.getElementById("proof-add-submit");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        await api("/payment-proofs", {
          method: "POST",
          body: JSON.stringify({
            reference: document.getElementById("proof-reference").value,
            customer_name: document.getElementById("proof-customer").value,
            phone: document.getElementById("proof-phone").value,
            location: document.getElementById("proof-location").value,
            branch_id: document.getElementById("proof-branch").value || null,
            method: document.getElementById("proof-method").value,
            image_data_url: PROOF_IMAGE_DATA_URL,
          }),
        });
        toast("Payment proof logged for review.", "success");
        closeProofAddModal();
        loadPaymentProofsPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Log for review";
      }
    });

    /* ---------------- Till Management ---------------- */
    let ALL_TILLS = [];
    let ALL_TILL_REMOVALS = [];

    async function loadTillPanel() {
      showLoading("tills-list");
      showLoading("till-removals-list");
      try {
        const [tills, removals, branches, employees] = [
          await api("/tills"),
          await api("/till-removals"),
          await api("/branches"),
          await api("/employees").catch(() => []),
        ];
        ALL_TILLS = tills;
        ALL_TILL_REMOVALS = removals;

        document.getElementById("till-stat-count").textContent = tills.length;
        document.getElementById("till-stat-balance").textContent = money(tills.reduce((s, t) => s + t.balance, 0));
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        document.getElementById("till-stat-removals").textContent = removals.filter((r) => new Date(r.date).getTime() >= weekAgo).length;

        document.getElementById("till-branch").innerHTML = '<option value="">—</option>' + branches.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
        document.getElementById("till-staff").innerHTML = '<option value="">Unassigned</option>' + employees.map((e) => `<option value="${e.id}">${e.name} — ${e.position}</option>`).join("");
        document.getElementById("safe-till").innerHTML = '<option value="">Select till</option>' + tills.map((t) => `<option value="${t.id}">${t.name} · ${t.branch} (bal. ${money(t.balance)})</option>`).join("");

        renderTillsList();
        renderTillRemovalsList();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderTillsList() {
      document.getElementById("tills-list").innerHTML = ALL_TILLS.length ? ALL_TILLS.map((t) => `
        <div class="list-row">
          <div>
            <div class="name">${t.name}</div>
            <div class="meta">${t.branch} · ${t.staff} · ${t.phone || "—"}</div>
          </div>
          <div class="amount">${money(t.balance)}</div>
        </div>
      `).join("") : '<p class="empty">No tills yet.</p>';
    }

    function renderTillRemovalsList() {
      document.getElementById("till-removals-list").innerHTML = ALL_TILL_REMOVALS.length ? ALL_TILL_REMOVALS.map((r) => `
        <div class="list-row">
          <div>
            <div class="name">${r.till}</div>
            <div class="meta">${r.approvedBy || "—"} · ${new Date(r.date).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div style="text-align:right;">
            <div class="amount">${money(r.amount)}</div>
            <div class="cmeta">bal. ${money(r.balanceAfter)}</div>
          </div>
        </div>
      `).join("") : '<p class="empty">No removals recorded yet.</p>';
    }

    document.querySelectorAll("#till-tabs button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#till-tabs button").forEach((b) => b.classList.toggle("active", b === btn));
        document.querySelectorAll("#till-tab-create, #till-tab-manage, #till-tab-safes").forEach((el) => el.classList.add("hidden"));
        document.getElementById(`till-tab-${btn.dataset.tillTab}`).classList.remove("hidden");
      });
    });

    document.getElementById("till-create-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("till-create-error");
      errorEl.textContent = "";
      const btn = document.getElementById("till-create-submit");
      btn.disabled = true;
      btn.textContent = "Creating…";
      try {
        const res = await api("/tills", {
          method: "POST",
          body: JSON.stringify({
            name: document.getElementById("till-name").value,
            branch_id: document.getElementById("till-branch").value || null,
            employee_id: document.getElementById("till-staff").value || null,
            phone: document.getElementById("till-phone").value,
          }),
        });
        toast(res.message, "success");
        document.getElementById("till-create-form").reset();
        loadTillPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Create till";
      }
    });

    document.getElementById("safe-submit").addEventListener("click", async () => {
      const errorEl = document.getElementById("safe-error");
      errorEl.textContent = "";
      const tillId = document.getElementById("safe-till").value;
      const amount = Number(document.getElementById("safe-amount").value);
      if (!tillId || !amount) {
        errorEl.textContent = "Please select a till and enter a valid amount.";
        return;
      }
      const btn = document.getElementById("safe-submit");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const res = await api("/tills/remove-cash", { method: "POST", body: JSON.stringify({ till_id: tillId, amount }) });
        toast(res.message, "success");
        document.getElementById("safe-amount").value = "";
        document.getElementById("safe-till").value = "";
        loadTillPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Record removal";
      }
    });

    /* ---------------- New sale (sales terminal) ---------------- */
    let POS_CATEGORY = "All";
    let POS_SEARCH = "";
    let POS_METHOD = "cash";
    let CART = {}; // productId -> qty
    let HELD_SALES = []; // [{ id, cart, heldAt }]

    async function loadNewSale() {
      const gen = SESSION_GEN;
      try {
        const [products, categories, customers] = [
          await api("/products"),
          await api("/categories"),
          await api("/customers").catch(() => []),
        ];
        if (gen !== SESSION_GEN) return;
        PRODUCTS = products;

        document.getElementById("pos-categories").innerHTML = ["All", ...categories].map((c) => `
          <button type="button" class="category-pill ${c === POS_CATEGORY ? "active" : ""}" data-category="${c}">${c}</button>
        `).join("");
        document.querySelectorAll("[data-category]").forEach((btn) => {
          btn.addEventListener("click", () => {
            POS_CATEGORY = btn.dataset.category;
            document.querySelectorAll("[data-category]").forEach((b) => b.classList.toggle("active", b.dataset.category === POS_CATEGORY));
            renderPosProducts();
          });
        });

        const customerSelect = document.getElementById("pos-customer");
        customerSelect.innerHTML = '<option value="">Walk-in (no account)</option>' + customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");

        renderPosProducts();
        renderCart();
        refreshClockGate();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /** Mirrors the web terminal's own clock-in gate: only warns/blocks when it's actually relevant to this account. */
    async function refreshClockGate() {
      const banner = document.getElementById("pos-clock-warning");
      const chargeBtn = document.getElementById("pos-charge-btn");
      try {
        const status = await api("/attendance/today");
        if (!status.clockedIn && !status.clockedOut) {
          banner.classList.remove("hidden");
          document.getElementById("pos-clock-warning-text").textContent = "Clock in on the Attendance page before making a sale.";
          chargeBtn.dataset.clockBlocked = "1";
        } else if (status.clockedOut) {
          banner.classList.remove("hidden");
          document.getElementById("pos-clock-warning-text").textContent = "You're clocked out for today — clock in again to keep selling.";
          chargeBtn.dataset.clockBlocked = "1";
        } else {
          banner.classList.add("hidden");
          delete chargeBtn.dataset.clockBlocked;
        }
      } catch {
        // No employee record linked (owner/admin) or attendance module inactive — never gates in that case.
        banner.classList.add("hidden");
        delete chargeBtn.dataset.clockBlocked;
      }
      updateCartTotals();
    }

    document.getElementById("pos-search").addEventListener("input", (e) => {
      POS_SEARCH = e.target.value.toLowerCase();
      renderPosProducts();
    });

    // A handheld USB/Bluetooth scanner acts like a keyboard: it types the code into
    // whatever's focused, then fires Enter. If the search box happens to be focused
    // (the natural place a cashier's cursor sits) and the code exactly matches a
    // product's SKU, treat it as a scan — add to cart and clear the field for the
    // next item — rather than leaving it as a live filter with only one result.
    document.getElementById("pos-search").addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const value = e.target.value.trim();
      if (!value) return;
      const product = PRODUCTS.find((p) => (p.sku || "").toLowerCase() === value.toLowerCase());
      if (product) {
        e.preventDefault();
        posScanLookup(value);
        document.getElementById("pos-search").value = "";
        POS_SEARCH = "";
        renderPosProducts();
      }
    });

    function renderPosProducts() {
      const grid = document.getElementById("pos-product-grid");
      const list = PRODUCTS.filter((p) =>
        (POS_CATEGORY === "All" || p.category === POS_CATEGORY) &&
        (POS_SEARCH === "" || p.name.toLowerCase().includes(POS_SEARCH) || (p.sku || "").toLowerCase().includes(POS_SEARCH)));

      grid.innerHTML = list.length ? list.map((p) => `
        <button type="button" class="pos-product-card" data-add="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>
          <div class="row">
            <div class="pname">${p.name}</div>
            <span class="pstock ${p.lowStock ? "low" : ""}">${p.stock}</span>
          </div>
          <div class="pcat">${p.category || "Uncategorised"}</div>
          <div class="pprice">${money(p.price)}</div>
        </button>
      `).join("") : `<p class="empty" style="grid-column:1/-1;">No products match "${POS_SEARCH}".</p>`;

      grid.querySelectorAll("[data-add]").forEach((btn) => {
        btn.addEventListener("click", () => bumpCart(Number(btn.dataset.add), 1));
      });
    }

    function bumpCart(productId, delta) {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) return;
      const next = Math.min(product.stock, (CART[productId] || 0) + delta);
      if (next <= 0) {
        delete CART[productId];
      } else {
        CART[productId] = next;
      }
      renderCart();
    }

    function renderCart() {
      const lines = Object.entries(CART).map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id)), qty })).filter((l) => l.product);
      const container = document.getElementById("pos-cart-lines");
      document.getElementById("pos-cart-count").textContent = `${lines.length} item${lines.length === 1 ? "" : "s"}`;

      container.innerHTML = lines.length ? lines.map(({ product, qty }) => `
        <div class="cart-line">
          <div>
            <div class="cname">${product.name}</div>
            <div class="cmeta">${qty} × ${money(product.price)}</div>
          </div>
          <div class="qty-stepper">
            <button type="button" data-dec="${product.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/></svg></button>
            <span>${qty}</span>
            <button type="button" data-inc="${product.id}" ${qty >= product.stock ? "disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg></button>
          </div>
        </div>
      `).join("") : '<p class="empty">Tap a product to start a sale</p>';

      container.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => bumpCart(Number(b.dataset.inc), 1)));
      container.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => bumpCart(Number(b.dataset.dec), -1)));

      updateCartTotals();
    }

    function updateCartTotals() {
      const lines = Object.entries(CART).map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === Number(id)), qty })).filter((l) => l.product);
      const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
      const tax = Math.round(subtotal * 0.16);
      const total = subtotal + tax;

      document.getElementById("pos-subtotal").textContent = money(subtotal);
      document.getElementById("pos-tax").textContent = money(tax);
      document.getElementById("pos-total").textContent = money(total);

      const chargeBtn = document.getElementById("pos-charge-btn");
      const blocked = chargeBtn.dataset.clockBlocked === "1";
      chargeBtn.disabled = lines.length === 0 || blocked;
      chargeBtn.textContent = blocked ? "Clock in to charge" : lines.length === 0 ? "Charge" : `Charge ${money(total)}`;
    }

    document.querySelectorAll(".payment-tile").forEach((btn) => {
      btn.addEventListener("click", () => {
        POS_METHOD = btn.dataset.method;
        document.querySelectorAll(".payment-tile").forEach((b) => b.classList.toggle("active", b === btn));
      });
    });

    document.getElementById("pos-charge-btn").addEventListener("click", async () => {
      const errorEl = document.getElementById("pos-error");
      errorEl.textContent = "";
      const items = Object.entries(CART).map(([id, qty]) => ({ product_id: Number(id), quantity: qty }));
      if (items.length === 0) return;

      const btn = document.getElementById("pos-charge-btn");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Charging…";
      try {
        const customerId = document.getElementById("pos-customer").value;
        const sale = await api("/sales", {
          method: "POST",
          body: JSON.stringify({
            items,
            method: POS_METHOD,
            customer_id: customerId || null,
          }),
        });
        toast(`Sale ${sale.reference} charged — ${money(sale.total)}`, "success");
        CART = {};
        document.getElementById("pos-customer").value = "";
        PRODUCTS = await api("/products");
        renderPosProducts();
        renderCart();
        loadOverview();
        openReceipt(sale.reference);
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
        updateCartTotals();
      }
    });

    /* ---- Hold / resume sales (client-side only, same as the web terminal) ---- */
    document.getElementById("pos-hold-btn").addEventListener("click", () => {
      if (Object.keys(CART).length === 0) {
        toast("Nothing in the cart to hold.", "error");
        return;
      }
      HELD_SALES.unshift({ id: Date.now(), cart: CART, heldAt: Date.now() });
      CART = {};
      renderCart();
      updateHeldBadge();
      toast("Sale held. Resume it any time before closing out.", "success");
    });

    function updateHeldBadge() {
      const badge = document.getElementById("pos-held-count");
      badge.textContent = HELD_SALES.length;
      badge.classList.toggle("hidden", HELD_SALES.length === 0);
    }

    function renderHeldModal() {
      const list = document.getElementById("held-sales-list");
      list.innerHTML = HELD_SALES.length ? HELD_SALES.map((h) => {
        const entries = Object.entries(h.cart);
        const count = entries.reduce((s, [, qty]) => s + qty, 0);
        const total = entries.reduce((s, [id, qty]) => s + (PRODUCTS.find((p) => p.id === Number(id))?.price || 0) * qty, 0);
        return `<div class="list-row">
          <div><div class="name">${count} item${count === 1 ? "" : "s"} · ${money(total)}</div><div class="meta">Held ${new Date(h.heldAt).toLocaleTimeString()}</div></div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-success" data-resume="${h.id}">Resume</button>
            <button type="button" class="btn-danger" data-discard="${h.id}">✕</button>
          </div>
        </div>`;
      }).join("") : '<p class="empty">No sales on hold.</p>';

      list.querySelectorAll("[data-resume]").forEach((b) => b.addEventListener("click", () => {
        const id = Number(b.dataset.resume);
        const held = HELD_SALES.find((h) => h.id === id);
        if (!held) return;
        if (Object.keys(CART).length > 0) {
          HELD_SALES.push({ id: Date.now(), cart: CART, heldAt: Date.now() });
        }
        HELD_SALES = HELD_SALES.filter((h) => h.id !== id);
        CART = held.cart;
        renderCart();
        updateHeldBadge();
        closeHeldModal();
      }));
      list.querySelectorAll("[data-discard]").forEach((b) => b.addEventListener("click", () => {
        HELD_SALES = HELD_SALES.filter((h) => h.id !== Number(b.dataset.discard));
        updateHeldBadge();
        renderHeldModal();
      }));
    }

    function openHeldModal() {
      renderHeldModal();
      document.getElementById("held-modal").classList.remove("hidden");
      document.getElementById("held-modal-backdrop").classList.remove("hidden");
    }
    function closeHeldModal() {
      document.getElementById("held-modal").classList.add("hidden");
      document.getElementById("held-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("pos-held-btn").addEventListener("click", openHeldModal);
    document.getElementById("held-modal-close").addEventListener("click", closeHeldModal);
    document.getElementById("held-modal-backdrop").addEventListener("click", closeHeldModal);

    /*
     * ---- Barcode scanner (New Sale) ----
     * Same two input paths as the web terminal's own scanner: a live camera reading
     * real barcode formats via the browser's BarcodeDetector API, and a manual/
     * keyboard-wedge field a handheld USB or Bluetooth scanner types straight into.
     * Matches against each product's SKU (the code actually printed on its shelf
     * label), not the internal numeric product id used to key the cart.
     */
    const SCAN_BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"];
    let SCAN_CAMERA_STREAM = null;
    let SCAN_CAMERA_RAF = null;
    let SCAN_LAST = { code: null, at: 0 };

    function scanCameraSupported() {
      return typeof window !== "undefined" && "BarcodeDetector" in window;
    }

    /** Adds the matched product to the cart — used by both the camera loop and the manual/keyboard-wedge field. */
    function posScanLookup(code) {
      const value = (code || "").trim();
      if (!value) return false;
      const product = PRODUCTS.find((p) => (p.sku || "").toLowerCase() === value.toLowerCase());
      if (!product) {
        toast(`No product matches code "${value}".`, "error");
        return false;
      }
      if (product.stock <= 0) {
        toast("Out of stock.", "error");
        return false;
      }
      bumpCart(product.id, 1);
      toast(`${product.name} — ${money(product.price)}`, "success");
      return true;
    }

    function scanStopCamera() {
      if (SCAN_CAMERA_RAF) cancelAnimationFrame(SCAN_CAMERA_RAF);
      SCAN_CAMERA_RAF = null;
      SCAN_CAMERA_STREAM?.getTracks().forEach((t) => t.stop());
      SCAN_CAMERA_STREAM = null;
      document.getElementById("scan-camera-on").classList.add("hidden");
      document.getElementById("scan-camera-off").classList.remove("hidden");
      document.getElementById("scan-camera-toggle").textContent = "Scan with camera";
    }

    async function scanStartCamera() {
      document.getElementById("scan-camera-error").textContent = "";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        SCAN_CAMERA_STREAM = stream;
        const video = document.getElementById("scan-video");
        video.srcObject = stream;
        await video.play();
        document.getElementById("scan-camera-off").classList.add("hidden");
        document.getElementById("scan-camera-on").classList.remove("hidden");
        document.getElementById("scan-camera-toggle").textContent = "Stop camera";

        const detector = new window.BarcodeDetector({ formats: SCAN_BARCODE_FORMATS });
        const tick = async () => {
          if (!video || video.readyState < 2) {
            SCAN_CAMERA_RAF = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0) {
              const value = codes[0].rawValue;
              const now = Date.now();
              // A held-up product stays in frame for many video frames — this stops
              // the same code being re-scanned and re-added every ~16ms.
              if (!(SCAN_LAST.code === value && now - SCAN_LAST.at < 1500)) {
                SCAN_LAST = { code: value, at: now };
                posScanLookup(value);
              }
            }
          } catch {
            // A single failed frame isn't worth surfacing — keep scanning.
          }
          SCAN_CAMERA_RAF = requestAnimationFrame(tick);
        };
        SCAN_CAMERA_RAF = requestAnimationFrame(tick);
      } catch {
        document.getElementById("scan-camera-error").textContent = "Couldn't access the camera. Check the browser's camera permission and try again.";
      }
    }

    function openScanModal() {
      document.getElementById("scan-camera-area").classList.toggle("hidden", !scanCameraSupported());
      document.getElementById("scan-camera-unsupported").classList.toggle("hidden", scanCameraSupported());
      document.getElementById("scan-modal").classList.remove("hidden");
      document.getElementById("scan-modal-backdrop").classList.remove("hidden");
      document.getElementById("scan-manual-code").focus();
    }
    function closeScanModal() {
      scanStopCamera();
      document.getElementById("scan-modal").classList.add("hidden");
      document.getElementById("scan-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("pos-scan-btn").addEventListener("click", openScanModal);
    document.getElementById("scan-modal-close").addEventListener("click", closeScanModal);
    document.getElementById("scan-modal-backdrop").addEventListener("click", closeScanModal);
    document.getElementById("scan-camera-toggle").addEventListener("click", () => {
      if (SCAN_CAMERA_STREAM) scanStopCamera();
      else scanStartCamera();
    });
    document.getElementById("scan-manual-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("scan-manual-code");
      if (posScanLookup(input.value)) input.value = "";
    });

    /* ---------------- Suppliers / Procurement ---------------- */
    let ALL_SUPPLIERS = [];
    let ALL_PURCHASE_ORDERS = [];

    function poPillClass(status) {
      return status === "received" ? "pill-ok" : status === "pending" ? "pill-warn" : "pill-danger";
    }

    async function loadSuppliersPanel() {
      showLoading("suppliers-list");
      showLoading("purchase-orders-list");
      document.getElementById("suppliers-subtitle").textContent = "Loading…";
      try {
        ALL_SUPPLIERS = await api("/suppliers");
        ALL_PURCHASE_ORDERS = await api("/purchase-orders");
        renderSuppliersList();
        renderPurchaseOrdersList();

        const totalPayable = ALL_SUPPLIERS.reduce((s, sup) => s + sup.payable, 0);
        document.getElementById("suppliers-subtitle").textContent =
          `${ALL_SUPPLIERS.length} active supplier${ALL_SUPPLIERS.length === 1 ? "" : "s"} · ${money(totalPayable)} payable`;
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderSuppliersList() {
      document.getElementById("suppliers-list").innerHTML = ALL_SUPPLIERS.length
        ? ALL_SUPPLIERS.map((s) => `<div class="list-row" data-supplier-id="${s.id}" style="cursor:pointer;">
            <div><div class="name">${s.name}</div><div class="meta">${s.category} · ${s.contactPerson || "—"}</div></div>
            <div class="amount" style="${s.payable > 0 ? "color:var(--danger);" : ""}">${s.payable > 0 ? money(s.payable) + " owed" : "Paid up"}</div>
          </div>`).join("")
        : '<p class="empty">No suppliers yet.</p>';
    }

    function renderPurchaseOrdersList() {
      document.getElementById("purchase-orders-list").innerHTML = ALL_PURCHASE_ORDERS.length
        ? ALL_PURCHASE_ORDERS.slice(0, 20).map((o) => `<div class="list-row" data-po-id="${o.id}" style="cursor:pointer;">
            <div><div class="name">${o.reference} — ${o.supplier}</div><div class="meta">${o.items.map((i) => i.name + " ×" + i.qty).join(", ")}</div></div>
            <div style="text-align:right;">
              <div class="amount">${money(o.totalCost)}</div>
              <span class="pill ${poPillClass(o.status)}">${o.status}</span>
            </div>
          </div>`).join("")
        : '<p class="empty">No purchase orders yet.</p>';
    }

    document.getElementById("suppliers-list").addEventListener("click", (e) => {
      const row = e.target.closest(".list-row[data-supplier-id]");
      if (!row) return;
      const supplier = ALL_SUPPLIERS.find((s) => s.id === Number(row.dataset.supplierId));
      if (supplier) openSupplierModal(supplier);
    });

    document.getElementById("purchase-orders-list").addEventListener("click", (e) => {
      const row = e.target.closest(".list-row[data-po-id]");
      if (!row) return;
      const order = ALL_PURCHASE_ORDERS.find((o) => o.id === Number(row.dataset.poId));
      if (order) openPoDetailModal(order);
    });

    /* ---- Add / edit supplier ---- */
    async function ensureSupplierCategoryOptions() {
      try {
        const categories = await api("/categories?full=1");
        document.getElementById("supplier-category").innerHTML = '<option value="">General</option>'
          + categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
      } catch (err) {
        toast(err.message, "error");
      }
    }

    async function openSupplierModal(supplier) {
      document.getElementById("supplier-form-error").textContent = "";
      document.getElementById("supplier-form").reset();
      document.getElementById("supplier-pay-area").style.display = "none";
      await ensureSupplierCategoryOptions();

      const isEdit = !!supplier;
      document.getElementById("supplier-modal-title").textContent = isEdit ? "Edit supplier" : "Add supplier";
      document.getElementById("supplier-id").value = isEdit ? supplier.id : "";
      document.getElementById("supplier-name").value = isEdit ? supplier.name : "";
      document.getElementById("supplier-category").value = isEdit && supplier.categoryId ? String(supplier.categoryId) : "";
      document.getElementById("supplier-contact-person").value = isEdit ? (supplier.contactPerson || "") : "";
      document.getElementById("supplier-contact").value = isEdit ? (supplier.contact || "") : "";
      document.getElementById("supplier-email").value = isEdit ? (supplier.email || "") : "";
      document.getElementById("supplier-address").value = isEdit ? (supplier.address || "") : "";
      document.getElementById("supplier-terms").value = isEdit ? (supplier.paymentTerms || "") : "";

      const payableRow = document.getElementById("supplier-payable-row");
      if (isEdit) {
        payableRow.style.display = "block";
        document.getElementById("supplier-payable-amount").textContent = money(supplier.payable);
        document.getElementById("supplier-payable-amount").style.color = supplier.payable > 0 ? "var(--danger)" : "var(--success)";
        document.getElementById("supplier-pay-toggle-btn").style.display = supplier.payable > 0 ? "block" : "none";
      } else {
        payableRow.style.display = "none";
      }

      const deleteBtn = document.getElementById("supplier-delete-btn");
      deleteBtn.style.display = isEdit && ["super", "admin"].includes(USER_ROLE) ? "block" : "none";

      document.getElementById("supplier-modal-backdrop").classList.remove("hidden");
      document.getElementById("supplier-modal").classList.remove("hidden");
    }

    function closeSupplierModal() {
      document.getElementById("supplier-modal").classList.add("hidden");
      document.getElementById("supplier-modal-backdrop").classList.add("hidden");
    }

    document.getElementById("supplier-add-btn").addEventListener("click", () => openSupplierModal(null));
    document.getElementById("supplier-modal-close").addEventListener("click", closeSupplierModal);
    document.getElementById("supplier-modal-backdrop").addEventListener("click", closeSupplierModal);

    document.getElementById("supplier-pay-toggle-btn").addEventListener("click", () => {
      const area = document.getElementById("supplier-pay-area");
      area.style.display = area.style.display === "none" ? "block" : "none";
    });

    document.getElementById("supplier-pay-submit-btn").addEventListener("click", async () => {
      const id = document.getElementById("supplier-id").value;
      const amount = Number(document.getElementById("supplier-pay-amount").value);
      const method = document.getElementById("supplier-pay-method").value;
      const errorEl = document.getElementById("supplier-form-error");
      errorEl.textContent = "";
      if (!amount || amount <= 0) { errorEl.textContent = "Enter a valid amount."; return; }

      const btn = document.getElementById("supplier-pay-submit-btn");
      btn.disabled = true;
      try {
        const res = await api(`/suppliers/${id}/pay`, { method: "POST", body: JSON.stringify({ amount, method }) });
        toast(res.message, "success");
        closeSupplierModal();
        loadSuppliersPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });

    document.getElementById("supplier-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("supplier-form-error");
      errorEl.textContent = "";
      const id = document.getElementById("supplier-id").value;
      const payload = {
        name: document.getElementById("supplier-name").value.trim(),
        contact_person: document.getElementById("supplier-contact-person").value.trim() || null,
        contact: document.getElementById("supplier-contact").value.trim() || null,
        email: document.getElementById("supplier-email").value.trim() || null,
        address: document.getElementById("supplier-address").value.trim() || null,
        payment_terms: document.getElementById("supplier-terms").value.trim() || null,
      };
      const categoryId = document.getElementById("supplier-category").value;
      payload.category_id = categoryId ? Number(categoryId) : null;

      const btn = document.getElementById("supplier-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        if (id) {
          await api(`/suppliers/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
          toast("Supplier updated.", "success");
        } else {
          await api("/suppliers", { method: "POST", body: JSON.stringify(payload) });
          toast("Supplier added.", "success");
        }
        closeSupplierModal();
        loadSuppliersPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    document.getElementById("supplier-delete-btn").addEventListener("click", async () => {
      const id = document.getElementById("supplier-id").value;
      if (!id || !confirm("Remove this supplier? This cannot be undone.")) return;
      const btn = document.getElementById("supplier-delete-btn");
      btn.disabled = true;
      try {
        const res = await api(`/suppliers/${id}`, { method: "DELETE" });
        toast(res.message, "success");
        closeSupplierModal();
        loadSuppliersPanel();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });

    /* ---- New purchase order ---- */
    let PO_LINES = [];
    let PO_PRODUCTS = [];

    async function openPoModal() {
      document.getElementById("po-form-error").textContent = "";
      document.getElementById("po-notes").value = "";
      PO_LINES = [{ product_id: "", quantity: 1, unit_cost: 0 }];
      try {
        const [suppliers, products] = await Promise.all([api("/suppliers"), api("/products")]);
        PO_PRODUCTS = products;
        document.getElementById("po-supplier").innerHTML = '<option value="">No supplier</option>'
          + suppliers.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
      } catch (err) {
        toast(err.message, "error");
      }
      renderPoLines();
      document.getElementById("po-modal-backdrop").classList.remove("hidden");
      document.getElementById("po-modal").classList.remove("hidden");
    }

    function closePoModal() {
      document.getElementById("po-modal").classList.add("hidden");
      document.getElementById("po-modal-backdrop").classList.add("hidden");
    }

    function renderPoLines() {
      document.getElementById("po-items").innerHTML = PO_LINES.map((line, idx) => `
        <div class="card" style="margin-top:8px;padding:10px;">
          <select data-line="${idx}" data-field="product_id" style="margin-bottom:6px;">
            <option value="">Select product</option>
            ${PO_PRODUCTS.map((p) => `<option value="${p.id}" ${Number(line.product_id) === p.id ? "selected" : ""}>${p.name}</option>`).join("")}
          </select>
          <div class="qr-field-grid">
            <div class="field"><label>Qty</label><input type="number" min="1" step="1" data-line="${idx}" data-field="quantity" value="${line.quantity}" /></div>
            <div class="field"><label>Unit cost</label><input type="number" min="0" step="0.01" data-line="${idx}" data-field="unit_cost" value="${line.unit_cost}" /></div>
          </div>
          ${PO_LINES.length > 1 ? `<button type="button" class="btn-secondary" data-remove-line="${idx}" style="width:100%;margin-top:6px;">Remove item</button>` : ""}
        </div>
      `).join("");
      updatePoTotal();
    }

    document.getElementById("po-items").addEventListener("input", (e) => {
      const idx = e.target.dataset.line;
      const field = e.target.dataset.field;
      if (idx === undefined) return;
      if (field === "product_id") {
        PO_LINES[idx].product_id = e.target.value;
        const product = PO_PRODUCTS.find((p) => p.id === Number(e.target.value));
        if (product) {
          PO_LINES[idx].unit_cost = product.buyingPrice || 0;
          renderPoLines();
          return;
        }
      } else if (field === "quantity") {
        PO_LINES[idx].quantity = Number(e.target.value) || 0;
      } else if (field === "unit_cost") {
        PO_LINES[idx].unit_cost = Number(e.target.value) || 0;
      }
      updatePoTotal();
    });

    document.getElementById("po-items").addEventListener("change", (e) => {
      if (e.target.dataset.field === "product_id") {
        const idx = e.target.dataset.line;
        PO_LINES[idx].product_id = e.target.value;
        const product = PO_PRODUCTS.find((p) => p.id === Number(e.target.value));
        if (product) PO_LINES[idx].unit_cost = product.buyingPrice || 0;
        renderPoLines();
      }
    });

    document.getElementById("po-items").addEventListener("click", (e) => {
      const idx = e.target.dataset.removeLine;
      if (idx === undefined) return;
      PO_LINES.splice(Number(idx), 1);
      renderPoLines();
    });

    function updatePoTotal() {
      const total = PO_LINES.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0), 0);
      document.getElementById("po-total").textContent = money(total);
    }

    document.getElementById("po-add-btn").addEventListener("click", openPoModal);
    document.getElementById("po-add-line-btn").addEventListener("click", () => {
      PO_LINES.push({ product_id: "", quantity: 1, unit_cost: 0 });
      renderPoLines();
    });
    document.getElementById("po-modal-close").addEventListener("click", closePoModal);
    document.getElementById("po-modal-backdrop").addEventListener("click", closePoModal);

    document.getElementById("po-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("po-form-error");
      errorEl.textContent = "";

      const items = PO_LINES
        .filter((l) => l.product_id && Number(l.quantity) > 0)
        .map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity), unit_cost: Number(l.unit_cost) || 0 }));
      if (items.length === 0) { errorEl.textContent = "Add at least one item with a quantity greater than zero."; return; }

      const payload = {
        supplier_id: document.getElementById("po-supplier").value ? Number(document.getElementById("po-supplier").value) : null,
        notes: document.getElementById("po-notes").value.trim() || null,
        items,
      };

      const btn = document.getElementById("po-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Creating…";
      try {
        const res = await api("/purchase-orders", { method: "POST", body: JSON.stringify(payload) });
        toast(res.message, "success");
        closePoModal();
        loadSuppliersPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    /* ---- Purchase order detail / receive / cancel ---- */
    async function openPoDetailModal(order) {
      document.getElementById("po-detail-title").textContent = order.reference;
      document.getElementById("po-detail-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("po-detail-modal-backdrop").classList.remove("hidden");
      document.getElementById("po-detail-modal").classList.remove("hidden");

      try {
        const items = await api(`/purchase-orders/${order.id}/items`);
        const itemsHtml = items.map((i) => `<div class="list-row">
            <div><div class="name">${i.name}</div><div class="meta">${i.qty} × ${money(i.unitCost)}</div></div>
            <div class="amount">${money(i.subtotal)}</div>
          </div>`).join("");

        let actionsHtml = "";
        if (order.status === "pending") {
          actionsHtml = `
            <div class="field" style="margin-top:14px;">
              <label for="po-receive-method">Payment method</label>
              <select id="po-receive-method">
                <option value="credit">Credit (adds to supplier balance)</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            <button type="button" class="btn-primary" id="po-receive-btn" style="width:100%;margin-top:8px;">Receive order</button>
            <button type="button" class="btn-danger" id="po-cancel-btn" style="width:100%;margin-top:8px;">Cancel order</button>
          `;
        }

        document.getElementById("po-detail-body").innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div class="cname">${order.supplier}</div>
              <div class="cmeta">Ordered ${new Date(order.orderedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
            </div>
            <span class="pill ${poPillClass(order.status)}">${order.status}</span>
          </div>
          ${order.notes ? `<p class="tagline" style="text-align:left;margin:10px 0 0;">${order.notes}</p>` : ""}
          <div class="section-title">Items</div>
          ${itemsHtml || '<p class="empty">No items.</p>'}
          <div style="display:flex;justify-content:space-between;margin-top:10px;font-weight:600;">
            <span>Total</span><span>${money(order.totalCost)}</span>
          </div>
          ${actionsHtml}
        `;

        if (order.status === "pending") {
          document.getElementById("po-receive-btn").addEventListener("click", async () => {
            const method = document.getElementById("po-receive-method").value;
            const btn = document.getElementById("po-receive-btn");
            btn.disabled = true;
            try {
              const res = await api(`/purchase-orders/${order.id}/receive`, { method: "POST", body: JSON.stringify({ payment_method: method }) });
              toast(res.message, "success");
              closePoDetailModal();
              loadSuppliersPanel();
            } catch (err) {
              toast(err.message, "error");
              btn.disabled = false;
            }
          });
          document.getElementById("po-cancel-btn").addEventListener("click", async () => {
            if (!confirm("Cancel this purchase order?")) return;
            const btn = document.getElementById("po-cancel-btn");
            btn.disabled = true;
            try {
              const res = await api(`/purchase-orders/${order.id}/cancel`, { method: "POST" });
              toast(res.message, "success");
              closePoDetailModal();
              loadSuppliersPanel();
            } catch (err) {
              toast(err.message, "error");
              btn.disabled = false;
            }
          });
        }
      } catch (err) {
        document.getElementById("po-detail-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function closePoDetailModal() {
      document.getElementById("po-detail-modal").classList.add("hidden");
      document.getElementById("po-detail-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("po-detail-modal-close").addEventListener("click", closePoDetailModal);
    document.getElementById("po-detail-modal-backdrop").addEventListener("click", closePoDetailModal);

    /* ---------------- Customers / Debtors ---------------- */
    document.querySelectorAll("[data-customer-subtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-customer-subtab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("customers-sub-customers").classList.toggle("hidden", btn.dataset.customerSubtab !== "customers");
        document.getElementById("customers-sub-debtors").classList.toggle("hidden", btn.dataset.customerSubtab !== "debtors");
      });
    });

    let ALL_CUSTOMERS = [];
    let CUSTOMER_SEARCH = "";
    let CURRENT_FILE_CUSTOMER = null;

    async function loadCustomersPanel() {
      showLoading("customers-list");
      document.getElementById("customers-subtitle").textContent = "Loading…";
      try {
        ALL_CUSTOMERS = await api("/customers");
        renderCustomersList();
        const overdue = ALL_CUSTOMERS.filter((c) => c.balance > 0).length;
        document.getElementById("customers-subtitle").textContent =
          `${ALL_CUSTOMERS.length} account${ALL_CUSTOMERS.length === 1 ? "" : "s"} · ${overdue} with overdue balances`;
      } catch (err) {
        toast(err.message, "error");
      }
      await loadDebtors();
    }

    function renderCustomersList() {
      const q = CUSTOMER_SEARCH.toLowerCase();
      const rows = ALL_CUSTOMERS.filter((c) => q === "" || c.name.toLowerCase().includes(q));
      document.getElementById("customers-list").innerHTML = rows.length
        ? rows.map((c) => `<div class="list-row" data-customer-id="${c.id}" style="cursor:pointer;">
            <div><div class="name">${c.name}</div><div class="meta">${cap(c.type)} · ${c.orders} order${c.orders === 1 ? "" : "s"} · ${money(c.spend)} spent</div></div>
            <div class="amount" style="${c.balance > 0 ? "color:var(--danger);" : ""}">${c.balance > 0 ? money(c.balance) + " owed" : "—"}</div>
          </div>`).join("")
        : '<p class="empty">No customers match.</p>';
    }

    document.getElementById("customer-search").addEventListener("input", (e) => {
      CUSTOMER_SEARCH = e.target.value;
      renderCustomersList();
    });

    document.getElementById("customers-list").addEventListener("click", (e) => {
      const row = e.target.closest(".list-row[data-customer-id]");
      if (row) openCustomerFile(Number(row.dataset.customerId));
    });

    /* ---- Customer file ---- */
    async function openCustomerFile(id) {
      document.getElementById("customer-file-title").textContent = "Customer file";
      document.getElementById("customer-file-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("customer-file-modal-backdrop").classList.remove("hidden");
      document.getElementById("customer-file-modal").classList.remove("hidden");
      try {
        const data = await api(`/customers/${id}/file`);
        CURRENT_FILE_CUSTOMER = data.customer;
        renderCustomerFile(data);
      } catch (err) {
        document.getElementById("customer-file-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function renderCustomerFile(data) {
      const c = data.customer;
      document.getElementById("customer-file-title").textContent = c.name;
      const openingDate = c.openingDate
        ? new Date(c.openingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—";
      const txHtml = data.transactions.map((t) => `<div class="list-row">
          <div><div class="name">${t.ref}</div><div class="meta">${new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${t.branch || "—"} · ${t.products || "—"}</div></div>
          <div style="text-align:right;">
            <div class="amount">${money(t.paid)}</div>
            <span class="pill ${t.status === "paid" ? "pill-ok" : "pill-warn"}">${t.status}</span>
          </div>
        </div>`).join("");

      document.getElementById("customer-file-body").innerHTML = `
        <div class="qr-field-grid">
          <div><div class="cmeta">Contact</div><div class="cname">${c.contact || "—"}</div></div>
          <div><div class="cmeta">Email</div><div class="cname">${c.email || "—"}</div></div>
          <div><div class="cmeta">Payment method</div><div class="cname">${c.paymentMethod || "—"}</div></div>
          <div><div class="cmeta">Opening date</div><div class="cname">${openingDate}</div></div>
        </div>
        <div class="stat-grid" style="margin-top:14px;">
          <div class="stat"><div class="label">Account balance</div><div class="value">${money(c.accountBalance)}</div><div class="hint">outstanding — what they owe</div></div>
          <div class="stat"><div class="label">Amount credited</div><div class="value">${money(c.amountCredited)}</div><div class="hint">lifetime credit extended</div></div>
        </div>
        <div class="section-title">Recent transactions</div>
        ${txHtml || '<p class="empty">No sales linked to this customer yet.</p>'}
      `;
    }

    function closeCustomerFileModal() {
      document.getElementById("customer-file-modal").classList.add("hidden");
      document.getElementById("customer-file-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("customer-file-modal-close").addEventListener("click", closeCustomerFileModal);
    document.getElementById("customer-file-modal-backdrop").addEventListener("click", closeCustomerFileModal);
    document.getElementById("customer-file-edit-btn").addEventListener("click", () => {
      if (CURRENT_FILE_CUSTOMER) openCustomerModal(CURRENT_FILE_CUSTOMER);
    });

    /* ---- Add / edit customer ---- */
    function openCustomerModal(customer) {
      document.getElementById("customer-form-error").textContent = "";
      document.getElementById("customer-form").reset();
      const isEdit = !!customer;
      document.getElementById("customer-modal-title").textContent = isEdit ? "Edit customer" : "Add customer";
      document.getElementById("customer-id").value = isEdit ? customer.id : "";
      document.getElementById("customer-name").value = isEdit ? customer.name : "";
      document.getElementById("customer-type").value = isEdit ? customer.type : "retail";
      document.getElementById("customer-contact").value = isEdit ? (customer.contact || "") : "";
      document.getElementById("customer-email").value = isEdit ? (customer.email || "") : "";
      document.getElementById("customer-payment-method").value = isEdit ? (customer.paymentMethod || "") : "";
      document.getElementById("customer-delete-btn").style.display = isEdit && ["super", "admin"].includes(USER_ROLE) ? "block" : "none";

      document.getElementById("customer-modal-backdrop").classList.remove("hidden");
      document.getElementById("customer-modal").classList.remove("hidden");
    }

    function closeCustomerModal() {
      document.getElementById("customer-modal").classList.add("hidden");
      document.getElementById("customer-modal-backdrop").classList.add("hidden");
    }

    document.getElementById("customer-add-btn").addEventListener("click", () => openCustomerModal(null));
    document.getElementById("customer-modal-close").addEventListener("click", closeCustomerModal);
    document.getElementById("customer-modal-backdrop").addEventListener("click", closeCustomerModal);

    document.getElementById("customer-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("customer-form-error");
      errorEl.textContent = "";
      const id = document.getElementById("customer-id").value;
      const payload = {
        name: document.getElementById("customer-name").value.trim(),
        type: document.getElementById("customer-type").value,
        contact: document.getElementById("customer-contact").value.trim() || null,
        email: document.getElementById("customer-email").value.trim() || null,
        preferred_payment_method: document.getElementById("customer-payment-method").value.trim() || null,
      };

      const btn = document.getElementById("customer-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        if (id) {
          await api(`/customers/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
          toast("Customer updated.", "success");
        } else {
          await api("/customers", { method: "POST", body: JSON.stringify(payload) });
          toast("Customer added.", "success");
        }
        closeCustomerModal();
        closeCustomerFileModal();
        loadCustomersPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    document.getElementById("customer-delete-btn").addEventListener("click", async () => {
      const id = document.getElementById("customer-id").value;
      if (!id || !confirm("Remove this customer? Their past sales keep their history either way.")) return;
      const btn = document.getElementById("customer-delete-btn");
      btn.disabled = true;
      try {
        const res = await api(`/customers/${id}`, { method: "DELETE" });
        toast(res.message, "success");
        closeCustomerModal();
        closeCustomerFileModal();
        loadCustomersPanel();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });

    let ALL_DEBTORS = [];

    async function loadDebtors() {
      showLoading("debtors-list");
      document.getElementById("debtors-stat-count").textContent = "—";
      document.getElementById("debtors-stat-outstanding").textContent = "—";
      try {
        ALL_DEBTORS = await api("/debtors");
        renderDebtorsList();

        const outstanding = ALL_DEBTORS.reduce((s, d) => s + d.balance, 0);
        document.getElementById("debtors-stat-count").textContent = ALL_DEBTORS.length;
        document.getElementById("debtors-stat-outstanding").textContent = money(outstanding);
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderDebtorsList() {
      const canDelete = ["super", "admin"].includes(USER_ROLE);
      document.getElementById("debtors-list").innerHTML = ALL_DEBTORS.length
        ? ALL_DEBTORS.map((d) => `
          <div class="list-row" style="flex-direction:column;align-items:stretch;">
            <div style="display:flex;justify-content:space-between;gap:10px;">
              <div><div class="name">${d.name}</div><div class="meta">${d.phone || "—"} · ${d.itemTaken || "—"} · ${d.branch}</div></div>
              <div style="text-align:right;flex-shrink:0;">
                <div class="amount" style="${d.balance > 0 ? "color:var(--danger);" : ""}">${money(d.balance)}</div>
                <div class="meta">${money(d.amountPaid)} paid</div>
              </div>
            </div>
            <div style="display:flex;gap:6px;margin-top:8px;">
              ${d.balance > 0
                ? `<button type="button" class="btn-success" data-pay="${d.id}" style="flex:1;">Pay</button>`
                : '<span class="pill pill-ok" style="flex:1;text-align:center;padding:8px 0;">Settled</span>'}
              <button type="button" class="btn-secondary" data-history="${d.id}" style="flex:1;">History</button>
              ${canDelete ? `<button type="button" class="btn-danger" data-delete-debtor="${d.id}" style="flex:1;">Delete</button>` : ""}
            </div>
          </div>
        `).join("")
        : '<p class="empty">No debtors yet.</p>';
    }

    document.getElementById("debtors-list").addEventListener("click", (e) => {
      const payBtn = e.target.closest("[data-pay]");
      const historyBtn = e.target.closest("[data-history]");
      const deleteBtn = e.target.closest("[data-delete-debtor]");
      if (payBtn) openDebtorPayModal(Number(payBtn.dataset.pay));
      else if (historyBtn) openDebtorHistoryModal(Number(historyBtn.dataset.history));
      else if (deleteBtn) deleteDebtorRecord(Number(deleteBtn.dataset.deleteDebtor));
    });

    /* ---- Add debtor ---- */
    async function openDebtorModal() {
      document.getElementById("debtor-form-error").textContent = "";
      document.getElementById("debtor-form").reset();
      document.getElementById("debtor-amount-paid").value = "0";
      document.getElementById("debtor-quantity").value = "1";
      try {
        const branches = await api("/branches");
        document.getElementById("debtor-branch").innerHTML = '<option value="">Unassigned</option>'
          + branches.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");
      } catch (err) {
        toast(err.message, "error");
      }
      document.getElementById("debtor-modal-backdrop").classList.remove("hidden");
      document.getElementById("debtor-modal").classList.remove("hidden");
    }

    function closeDebtorModal() {
      document.getElementById("debtor-modal").classList.add("hidden");
      document.getElementById("debtor-modal-backdrop").classList.add("hidden");
    }

    document.getElementById("debtor-add-btn").addEventListener("click", openDebtorModal);
    document.getElementById("debtor-modal-close").addEventListener("click", closeDebtorModal);
    document.getElementById("debtor-modal-backdrop").addEventListener("click", closeDebtorModal);

    document.getElementById("debtor-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("debtor-form-error");
      errorEl.textContent = "";
      const payload = {
        name: document.getElementById("debtor-name").value.trim(),
        phone: document.getElementById("debtor-phone").value.trim() || null,
        branch_id: document.getElementById("debtor-branch").value ? Number(document.getElementById("debtor-branch").value) : null,
        item_taken: document.getElementById("debtor-item").value.trim() || null,
        quantity: Number(document.getElementById("debtor-quantity").value) || 0,
        amount_paid: Number(document.getElementById("debtor-amount-paid").value) || 0,
        balance: Number(document.getElementById("debtor-balance").value) || 0,
        due_date: document.getElementById("debtor-due-date").value || null,
      };

      const btn = document.getElementById("debtor-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        const res = await api("/debtors", { method: "POST", body: JSON.stringify(payload) });
        toast(res.message, "success");
        closeDebtorModal();
        loadDebtors();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    /* ---- Record payment ---- */
    function openDebtorPayModal(id) {
      const debtor = ALL_DEBTORS.find((d) => d.id === id);
      if (!debtor) return;
      document.getElementById("debtor-pay-error").textContent = "";
      document.getElementById("debtor-pay-amount").value = "";
      document.getElementById("debtor-pay-title").textContent = `Record payment — ${debtor.name}`;
      document.getElementById("debtor-pay-balance").textContent = `Outstanding balance: ${money(debtor.balance)}`;
      document.getElementById("debtor-pay-submit-btn").dataset.debtorId = id;
      document.getElementById("debtor-pay-modal-backdrop").classList.remove("hidden");
      document.getElementById("debtor-pay-modal").classList.remove("hidden");
    }

    function closeDebtorPayModal() {
      document.getElementById("debtor-pay-modal").classList.add("hidden");
      document.getElementById("debtor-pay-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("debtor-pay-modal-close").addEventListener("click", closeDebtorPayModal);
    document.getElementById("debtor-pay-modal-backdrop").addEventListener("click", closeDebtorPayModal);

    document.getElementById("debtor-pay-submit-btn").addEventListener("click", async function () {
      const errorEl = document.getElementById("debtor-pay-error");
      errorEl.textContent = "";
      const amount = Number(document.getElementById("debtor-pay-amount").value);
      if (!amount || amount <= 0) { errorEl.textContent = "Enter a valid amount."; return; }

      this.disabled = true;
      try {
        const res = await api(`/debtors/${this.dataset.debtorId}/pay`, { method: "POST", body: JSON.stringify({ amount }) });
        toast(res.message, "success");
        closeDebtorPayModal();
        loadDebtors();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        this.disabled = false;
      }
    });

    /* ---- Payment history ---- */
    async function openDebtorHistoryModal(id) {
      const debtor = ALL_DEBTORS.find((d) => d.id === id);
      document.getElementById("debtor-history-title").textContent = debtor ? `${debtor.name} — payment history` : "Payment history";
      document.getElementById("debtor-history-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("debtor-history-modal-backdrop").classList.remove("hidden");
      document.getElementById("debtor-history-modal").classList.remove("hidden");
      try {
        const payments = await api(`/debtors/${id}/payments`);
        document.getElementById("debtor-history-body").innerHTML = payments.length
          ? payments.map((p) => `<div class="list-row">
              <div><div class="name">${money(p.amount)}</div><div class="meta">${new Date(p.paidAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div></div>
              <div class="amount">bal. ${money(p.balanceAfter)}</div>
            </div>`).join("")
          : '<p class="empty">No payments recorded yet.</p>';
      } catch (err) {
        document.getElementById("debtor-history-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function closeDebtorHistoryModal() {
      document.getElementById("debtor-history-modal").classList.add("hidden");
      document.getElementById("debtor-history-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("debtor-history-modal-close").addEventListener("click", closeDebtorHistoryModal);
    document.getElementById("debtor-history-modal-backdrop").addEventListener("click", closeDebtorHistoryModal);

    /* ---- Delete ---- */
    async function deleteDebtorRecord(id) {
      const debtor = ALL_DEBTORS.find((d) => d.id === id);
      if (!debtor || !confirm(`Remove ${debtor.name}'s debtor record? This can't be undone.`)) return;
      try {
        const res = await api(`/debtors/${id}`, { method: "DELETE" });
        toast(res.message, "success");
        loadDebtors();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /* ---------------- Employees ---------------- */
    let ALL_EMPLOYEES = [];

    async function loadEmployeesPanel() {
      showLoading("employees-list");
      document.getElementById("employees-subtitle").textContent = "Loading…";
      ["emp-stat-total", "emp-stat-salary"].forEach((id) => { document.getElementById(id).textContent = "—"; });
      try {
        ALL_EMPLOYEES = await api("/employees");
        renderEmployeesList();

        const activeCount = ALL_EMPLOYEES.filter((e) => e.status === "active").length;
        const totalSalary = ALL_EMPLOYEES.reduce((s, e) => s + e.baseSalary, 0);
        document.getElementById("employees-subtitle").textContent = `${ALL_EMPLOYEES.length} on record · ${activeCount} active`;
        document.getElementById("emp-stat-total").textContent = ALL_EMPLOYEES.length;
        document.getElementById("emp-stat-active-hint").textContent = `${activeCount} active`;
        document.getElementById("emp-stat-salary").textContent = money(totalSalary);
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderEmployeesList() {
      document.getElementById("employees-list").innerHTML = ALL_EMPLOYEES.length
        ? ALL_EMPLOYEES.map((e) => `<div class="list-row" data-employee-id="${e.id}" style="cursor:pointer;">
            <div><div class="name">${e.name}</div><div class="meta">${e.position} · ${e.branch}</div></div>
            <span class="pill ${e.status === "active" ? "pill-ok" : "pill-danger"}">${e.status}</span>
          </div>`).join("")
        : '<p class="empty">No employees yet.</p>';
    }

    document.getElementById("employees-list").addEventListener("click", (e) => {
      const row = e.target.closest(".list-row[data-employee-id]");
      if (row) openEmployeeRecord(Number(row.dataset.employeeId));
    });

    /* ---- Employee record (detail) ---- */
    let CURRENT_RECORD_EMPLOYEE = null;

    async function openEmployeeRecord(id) {
      document.getElementById("employee-record-title").textContent = "Employee record";
      document.getElementById("employee-record-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("employee-record-modal-backdrop").classList.remove("hidden");
      document.getElementById("employee-record-modal").classList.remove("hidden");
      try {
        const e = await api(`/employees/${id}`);
        CURRENT_RECORD_EMPLOYEE = e;
        renderEmployeeRecord(e);
      } catch (err) {
        document.getElementById("employee-record-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function renderEmployeeRecord(e) {
      document.getElementById("employee-record-title").textContent = e.name;
      const hireDate = e.hireDate
        ? new Date(e.hireDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—";

      document.getElementById("employee-record-body").innerHTML = `
        <div class="qr-field-grid">
          <div><div class="cmeta">Email</div><div class="cname">${e.email || "—"}</div></div>
          <div><div class="cmeta">Phone</div><div class="cname">${e.phone || "—"}</div></div>
          <div><div class="cmeta">Branch</div><div class="cname">${e.branch}</div></div>
          <div><div class="cmeta">Hired</div><div class="cname">${hireDate}</div></div>
        </div>
        <div class="stat-grid" style="margin-top:14px;">
          <div class="stat"><div class="label">Base salary</div><div class="value">${money(e.baseSalary)}</div><div class="hint">${e.position}</div></div>
          <div class="stat"><div class="label">Status</div><div class="value" style="text-transform:capitalize;">${e.status}</div><div class="hint">${e.branch}</div></div>
        </div>
        <div class="section-title">System login</div>
        <div class="list-row" style="border-bottom:none;">
          <div>
            <div class="name">${e.linkedUserName || "No login linked"}</div>
            <div class="meta">${e.linkedUserEmail || "This employee can't sign in to the app"}</div>
          </div>
          <span class="pill ${e.hasPin ? "pill-ok" : "pill-warn"}">${e.hasPin ? "Kiosk PIN set" : "No kiosk PIN"}</span>
        </div>
      `;
    }

    function closeEmployeeRecordModal() {
      document.getElementById("employee-record-modal").classList.add("hidden");
      document.getElementById("employee-record-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("employee-record-modal-close").addEventListener("click", closeEmployeeRecordModal);
    document.getElementById("employee-record-modal-backdrop").addEventListener("click", closeEmployeeRecordModal);
    document.getElementById("employee-record-edit-btn").addEventListener("click", () => {
      if (CURRENT_RECORD_EMPLOYEE) openEmployeeModal(CURRENT_RECORD_EMPLOYEE);
    });

    /* ---- Add / edit employee ---- */
    async function ensureEmployeeFormOptions(currentEmployee) {
      try {
        const [branches, unlinked] = await Promise.all([api("/branches"), api("/employees/unlinked-users")]);
        document.getElementById("employee-branch").innerHTML = '<option value="">Unassigned</option>'
          + branches.map((b) => `<option value="${b.id}">${b.name}</option>`).join("");

        let loginOptions = unlinked.map((u) => `<option value="${u.id}">${u.name} (${u.email})</option>`).join("");
        if (currentEmployee?.userId) {
          loginOptions = `<option value="${currentEmployee.userId}">${currentEmployee.linkedUserName} (${currentEmployee.linkedUserEmail})</option>` + loginOptions;
        }
        document.getElementById("employee-login").innerHTML = '<option value="">No login</option>' + loginOptions;
      } catch (err) {
        toast(err.message, "error");
      }
    }

    async function openEmployeeModal(employee) {
      document.getElementById("employee-form-error").textContent = "";
      document.getElementById("employee-form").reset();
      await ensureEmployeeFormOptions(employee);

      const isEdit = !!employee;
      document.getElementById("employee-modal-title").textContent = isEdit ? "Edit employee" : "Add employee";
      document.getElementById("employee-id").value = isEdit ? employee.id : "";
      document.getElementById("employee-name").value = isEdit ? employee.name : "";
      document.getElementById("employee-position").value = isEdit ? employee.position : "";
      document.getElementById("employee-email").value = isEdit ? (employee.email || "") : "";
      document.getElementById("employee-phone").value = isEdit ? (employee.phone || "") : "";
      document.getElementById("employee-branch").value = isEdit && employee.branchId ? String(employee.branchId) : "";
      document.getElementById("employee-status").value = isEdit ? employee.status : "active";
      document.getElementById("employee-salary").value = isEdit ? employee.baseSalary : "0";
      document.getElementById("employee-hire-date").value = isEdit && employee.hireDate ? employee.hireDate : new Date().toISOString().slice(0, 10);
      document.getElementById("employee-login").value = isEdit && employee.userId ? employee.userId : "";
      document.getElementById("employee-delete-btn").style.display = isEdit && ["super", "admin"].includes(USER_ROLE) ? "block" : "none";

      document.getElementById("employee-modal-backdrop").classList.remove("hidden");
      document.getElementById("employee-modal").classList.remove("hidden");
    }

    function closeEmployeeModal() {
      document.getElementById("employee-modal").classList.add("hidden");
      document.getElementById("employee-modal-backdrop").classList.add("hidden");
    }

    document.getElementById("employee-add-btn").addEventListener("click", () => openEmployeeModal(null));
    document.getElementById("employee-modal-close").addEventListener("click", closeEmployeeModal);
    document.getElementById("employee-modal-backdrop").addEventListener("click", closeEmployeeModal);

    document.getElementById("employee-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("employee-form-error");
      errorEl.textContent = "";
      const id = document.getElementById("employee-id").value;
      const payload = {
        name: document.getElementById("employee-name").value.trim(),
        position: document.getElementById("employee-position").value.trim(),
        email: document.getElementById("employee-email").value.trim() || null,
        phone: document.getElementById("employee-phone").value.trim() || null,
        branch_id: document.getElementById("employee-branch").value ? Number(document.getElementById("employee-branch").value) : null,
        status: document.getElementById("employee-status").value,
        base_salary: Number(document.getElementById("employee-salary").value) || 0,
        hire_date: document.getElementById("employee-hire-date").value || null,
        user_id: document.getElementById("employee-login").value || null,
      };

      const btn = document.getElementById("employee-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        if (id) {
          await api(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
          toast("Employee updated.", "success");
        } else {
          await api("/employees", { method: "POST", body: JSON.stringify(payload) });
          toast("Employee added.", "success");
        }
        closeEmployeeModal();
        closeEmployeeRecordModal();
        loadEmployeesPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    document.getElementById("employee-delete-btn").addEventListener("click", async () => {
      const id = document.getElementById("employee-id").value;
      if (!id || !confirm("Remove this employee record? This cannot be undone.")) return;
      const btn = document.getElementById("employee-delete-btn");
      btn.disabled = true;
      try {
        const res = await api(`/employees/${id}`, { method: "DELETE" });
        toast(res.message, "success");
        closeEmployeeModal();
        closeEmployeeRecordModal();
        loadEmployeesPanel();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
      }
    });

    /* ---------------- Attendance ---------------- */
    async function refreshAttendanceStatus() {
      const pill = document.getElementById("attendance-pill");
      const errorEl = document.getElementById("attendance-error");
      const unavailableEl = document.getElementById("attendance-unavailable");
      const buttonsEl = document.getElementById("attendance-buttons");
      const inBtn = document.getElementById("clock-in-btn");
      const outBtn = document.getElementById("clock-out-btn");
      errorEl.textContent = "";
      unavailableEl.classList.add("hidden");
      buttonsEl.classList.remove("hidden");
      pill.textContent = "Loading…";
      pill.className = "big-pill pill-warn";
      inBtn.disabled = true; outBtn.disabled = true;
      try {
        const status = await api("/attendance/today");
        if (status.clockedOut) {
          pill.textContent = "Clocked out for today";
          pill.className = "big-pill pill-ok";
          inBtn.disabled = true; outBtn.disabled = true;
        } else if (status.clockedIn) {
          pill.textContent = "Clocked in";
          pill.className = "big-pill pill-warn";
          inBtn.disabled = true; outBtn.disabled = false;
        } else {
          pill.textContent = "Not clocked in";
          pill.className = "big-pill pill-danger";
          inBtn.disabled = false; outBtn.disabled = true;
        }
      } catch (err) {
        if (err.fields?.includes("employee")) {
          pill.textContent = "Not applicable to your account";
          pill.className = "big-pill pill-ok";
          buttonsEl.classList.add("hidden");
          unavailableEl.classList.remove("hidden");
        } else {
          pill.textContent = "Unavailable";
          pill.className = "big-pill pill-danger";
          errorEl.textContent = err.message;
          inBtn.disabled = true; outBtn.disabled = true;
        }
      }
    }

    let ALL_ATTENDANCE_ROWS = [];
    let ATT_KIOSK_LOADED = false;
    let ATT_HISTORY_LOADED = false;

    function loadAttendancePanel() {
      refreshAttendanceStatus();
      document.getElementById("att-board-tab-btn").textContent = USER_ROLE === "staff" ? "My record" : "Today's board";
      loadAttendanceBoard();
      ATT_KIOSK_LOADED = false;
      ATT_HISTORY_LOADED = false;
    }

    document.querySelectorAll("[data-att-subtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-att-subtab]").forEach((b) => b.classList.toggle("active", b === btn));
        const tab = btn.dataset.attSubtab;
        document.getElementById("att-sub-board").classList.toggle("hidden", tab !== "board");
        document.getElementById("att-sub-kiosk").classList.toggle("hidden", tab !== "kiosk");
        document.getElementById("att-sub-history").classList.toggle("hidden", tab !== "history");
        if (tab === "kiosk" && !ATT_KIOSK_LOADED) { ATT_KIOSK_LOADED = true; loadKioskRoster(); }
        if (tab === "history" && !ATT_HISTORY_LOADED) { ATT_HISTORY_LOADED = true; loadAttendanceHistory(); }
      });
    });

    const attStatusLabel = { present: "On time", late: "Late", not_yet: "Not yet in" };
    const attStatusPill = { present: "pill-ok", late: "pill-warn", not_yet: "pill-warn" };
    const attMethodLabel = { self: "Self", pin: "PIN", biometric: "Biometric", manual: "Manual" };
    const attTimeFmt = (iso) => iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : null;

    async function loadAttendanceBoard() {
      showLoading("attendance-board-list");
      ["att-stat-present", "att-stat-late", "att-stat-notyet"].forEach((id) => { document.getElementById(id).textContent = "—"; });
      try {
        const data = await api("/attendance/board");
        ALL_ATTENDANCE_ROWS = data.rows;
        document.getElementById("att-stat-present").textContent = data.summary.present;
        document.getElementById("att-stat-late").textContent = data.summary.late;
        document.getElementById("att-stat-notyet").textContent = data.summary.notYet;
        renderAttendanceBoard();
        populateHistoryEmployeeFilter();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderAttendanceBoard() {
      const canManage = ["super", "admin", "manager"].includes(USER_ROLE);
      document.getElementById("attendance-board-list").innerHTML = ALL_ATTENDANCE_ROWS.length
        ? ALL_ATTENDANCE_ROWS.map((r) => {
            const inTime = attTimeFmt(r.clockIn);
            const outTime = attTimeFmt(r.clockOut);
            return `<div class="list-row" ${canManage ? `data-manage-employee="${r.employeeId}" style="cursor:pointer;"` : ""}>
              <div>
                <div class="name">${r.name}</div>
                <div class="meta">${r.position || "—"} · ${r.branch || "Unassigned"}</div>
                <div class="meta">${inTime ? `In ${inTime}${r.clockInMethod ? " (" + attMethodLabel[r.clockInMethod] + ")" : ""}` : "—"}${outTime ? ` · Out ${outTime}${r.clockOutMethod ? " (" + attMethodLabel[r.clockOutMethod] + ")" : ""}` : ""}</div>
              </div>
              <span class="pill ${attStatusPill[r.status]}">${attStatusLabel[r.status]}</span>
            </div>`;
          }).join("")
        : '<p class="empty">No employees to show.</p>';
    }

    document.getElementById("attendance-board-list").addEventListener("click", (e) => {
      const row = e.target.closest("[data-manage-employee]");
      if (row) openManageModal(Number(row.dataset.manageEmployee));
    });

    /* ---- Manage: kiosk PIN + manual correction ---- */
    function openManageModal(employeeId) {
      const row = ALL_ATTENDANCE_ROWS.find((r) => r.employeeId === employeeId);
      if (!row) return;

      document.getElementById("att-manage-title").textContent = row.name;
      document.getElementById("att-manage-pin-status").textContent = row.hasPin ? "A kiosk PIN is already set." : "No kiosk PIN set yet.";
      document.getElementById("att-manage-pin-input").value = "";
      document.getElementById("att-manage-pin-btn").textContent = row.hasPin ? "Reset" : "Set";
      document.getElementById("att-manage-pin-btn").dataset.employeeId = employeeId;
      document.getElementById("att-manage-pin-error").textContent = "";

      document.getElementById("att-correction-date").value = new Date().toISOString().slice(0, 10);
      document.getElementById("att-correction-in").value = row.clockIn ? attTimeFmt(row.clockIn) : "";
      document.getElementById("att-correction-out").value = row.clockOut ? attTimeFmt(row.clockOut) : "";
      document.getElementById("att-correction-note").value = "";
      document.getElementById("att-correction-error").textContent = "";
      document.getElementById("att-correction-submit-btn").dataset.employeeId = employeeId;

      document.getElementById("att-manage-modal-backdrop").classList.remove("hidden");
      document.getElementById("att-manage-modal").classList.remove("hidden");
    }

    function closeManageModal() {
      document.getElementById("att-manage-modal").classList.add("hidden");
      document.getElementById("att-manage-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("att-manage-modal-close").addEventListener("click", closeManageModal);
    document.getElementById("att-manage-modal-backdrop").addEventListener("click", closeManageModal);

    document.getElementById("att-manage-pin-btn").addEventListener("click", async function () {
      const errorEl = document.getElementById("att-manage-pin-error");
      errorEl.textContent = "";
      const pin = document.getElementById("att-manage-pin-input").value.replace(/\D/g, "").slice(0, 6);
      if (!/^\d{4,6}$/.test(pin)) { errorEl.textContent = "PIN must be 4–6 digits."; return; }

      this.disabled = true;
      try {
        const res = await api(`/attendance/employees/${this.dataset.employeeId}/pin`, { method: "POST", body: JSON.stringify({ pin }) });
        toast(res.message, "success");
        closeManageModal();
        loadAttendanceBoard();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        this.disabled = false;
      }
    });

    document.getElementById("att-correction-submit-btn").addEventListener("click", async function () {
      const errorEl = document.getElementById("att-correction-error");
      errorEl.textContent = "";
      const payload = {
        employee_id: Number(this.dataset.employeeId),
        date: document.getElementById("att-correction-date").value,
        clock_in: document.getElementById("att-correction-in").value || null,
        clock_out: document.getElementById("att-correction-out").value || null,
        note: document.getElementById("att-correction-note").value.trim() || null,
      };
      if (!payload.date) { errorEl.textContent = "Pick a date."; return; }

      this.disabled = true;
      const original = this.textContent;
      this.textContent = "Saving…";
      try {
        const res = await api("/attendance/correction", { method: "POST", body: JSON.stringify(payload) });
        toast(res.message, "success");
        closeManageModal();
        loadAttendanceBoard();
        ATT_HISTORY_LOADED = false;
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        this.disabled = false;
        this.textContent = original;
      }
    });

    /* ---- Team check-in (kiosk PIN pad) ---- */
    async function loadKioskRoster() {
      const select = document.getElementById("kiosk-employee");
      select.innerHTML = '<option value="">Loading…</option>';
      try {
        const roster = await api("/attendance/roster");
        const eligible = roster.filter((r) => r.hasPin);
        select.innerHTML = eligible.length
          ? '<option value="">Select your name</option>' + eligible.map((r) => `<option value="${r.id}">${r.name}</option>`).join("")
          : '<option value="">No one has a PIN set yet</option>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("kiosk-submit-btn").addEventListener("click", async () => {
      const errorEl = document.getElementById("kiosk-error");
      errorEl.textContent = "";
      const employeeId = document.getElementById("kiosk-employee").value;
      const pin = document.getElementById("kiosk-pin").value.replace(/\D/g, "").slice(0, 6);
      if (!employeeId || !/^\d{4,6}$/.test(pin)) { errorEl.textContent = "Choose your name and enter your PIN."; return; }

      const btn = document.getElementById("kiosk-submit-btn");
      btn.disabled = true;
      try {
        const res = await api("/attendance/pin-clock", { method: "POST", body: JSON.stringify({ employee_id: Number(employeeId), pin }) });
        toast(res.message, "success");
        loadAttendanceBoard();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        document.getElementById("kiosk-pin").value = "";
        btn.disabled = false;
      }
    });

    /* ---- History ---- */
    function populateHistoryEmployeeFilter() {
      const select = document.getElementById("history-employee-filter");
      const current = select.value;
      const seen = new Map();
      ALL_ATTENDANCE_ROWS.forEach((r) => seen.set(r.employeeId, r.name));
      select.innerHTML = '<option value="">All employees</option>'
        + Array.from(seen.entries()).map(([id, name]) => `<option value="${id}">${name}</option>`).join("");
      select.value = current;
    }

    async function loadAttendanceHistory() {
      showLoading("attendance-history-list");
      try {
        const employeeId = document.getElementById("history-employee-filter").value;
        const q = employeeId ? `?employee_id=${employeeId}` : "";
        const records = await api("/attendance/history" + q);
        document.getElementById("attendance-history-list").innerHTML = records.length
          ? records.map((r) => `<div class="list-row">
              <div>
                <div class="name">${r.employeeName}</div>
                <div class="meta">${new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${attTimeFmt(r.clockIn) || "—"} – ${attTimeFmt(r.clockOut) || "—"}${r.note ? " · " + r.note : ""}</div>
              </div>
              <div class="amount">${r.hoursWorked !== null ? r.hoursWorked + "h" : "—"}</div>
            </div>`).join("")
          : '<p class="empty">No attendance records yet.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("history-employee-filter").addEventListener("change", loadAttendanceHistory);

    document.getElementById("clock-in-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Clocking in…";
      try {
        const res = await api("/attendance/clock-in", { method: "POST" });
        toast(res.message, "success");
        await refreshAttendanceStatus();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
      } finally {
        btn.textContent = original;
      }
    });
    document.getElementById("clock-out-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Clocking out…";
      try {
        const res = await api("/attendance/clock-out", { method: "POST" });
        toast(res.message, "success");
        await refreshAttendanceStatus();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
      } finally {
        btn.textContent = original;
      }
    });

    /* ---------------- Payroll ---------------- */
    let ALL_PAYROLL_RECORDS = [];
    let PAYROLL_SCOPE = "mine";
    let PAYROLL_MONTH = new Date().toISOString().slice(0, 7);

    async function loadPayrollPanel() {
      showLoading("payroll-list");
      try {
        const data = await api("/payroll");
        ALL_PAYROLL_RECORDS = data.records;
        PAYROLL_SCOPE = data.scope;
        document.getElementById("payroll-title").textContent = data.scope === "mine" ? "My payslips" : "Payroll";
        document.getElementById("payroll-manager-area").classList.toggle("hidden", data.scope !== "business");
        if (data.scope === "business") {
          const monthInput = document.getElementById("payroll-month");
          if (!monthInput.value) monthInput.value = PAYROLL_MONTH;
          else PAYROLL_MONTH = monthInput.value;
        }
        renderPayrollList();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderPayrollList() {
      const scoped = PAYROLL_SCOPE === "business"
        ? ALL_PAYROLL_RECORDS.filter((r) => r.month === PAYROLL_MONTH)
        : ALL_PAYROLL_RECORDS;

      if (PAYROLL_SCOPE === "business") {
        document.getElementById("payroll-stat-gross").textContent = money(scoped.reduce((s, r) => s + r.gross, 0));
        document.getElementById("payroll-stat-net").textContent = money(scoped.reduce((s, r) => s + r.net, 0));
        document.getElementById("payroll-stat-count").textContent = scoped.length;
      }

      document.getElementById("payroll-list").innerHTML = scoped.length
        ? scoped.map((r) => `<div class="list-row" style="flex-direction:column;align-items:stretch;">
            <div data-payroll-id="${r.id}" style="display:flex;justify-content:space-between;gap:10px;cursor:pointer;">
              <div><div class="name">${r.employee} — ${r.month}</div><div class="meta">Gross ${money(r.gross)}</div></div>
              <div style="text-align:right;">
                <div class="amount">${money(r.net)}</div>
                <span class="pill ${r.status === "paid" ? "pill-ok" : "pill-warn"}">${r.status}</span>
              </div>
            </div>
            ${PAYROLL_SCOPE === "business" ? `<div style="display:flex;gap:6px;margin-top:8px;">
              ${r.status !== "paid"
                ? `<button type="button" class="btn-success" data-mark-paid="${r.id}" style="flex:1;">Mark paid</button>`
                : '<span class="pill pill-ok" style="flex:1;text-align:center;padding:8px 0;">Paid</span>'}
              <button type="button" class="btn-secondary" data-edit-payroll="${r.id}" style="flex:1;">Edit</button>
            </div>` : ""}
          </div>`).join("")
        : '<p class="empty">No payroll records for this period.</p>';
    }

    document.getElementById("payroll-list").addEventListener("click", (e) => {
      const markBtn = e.target.closest("[data-mark-paid]");
      const editBtn = e.target.closest("[data-edit-payroll]");
      const viewEl = e.target.closest("[data-payroll-id]");
      if (markBtn) { markPayrollPaid(Number(markBtn.dataset.markPaid)); return; }
      if (editBtn) { openPayrollModal(Number(editBtn.dataset.editPayroll)); return; }
      if (viewEl) { openPayslip(Number(viewEl.dataset.payrollId)); }
    });

    async function markPayrollPaid(id) {
      try {
        const res = await api(`/payroll/${id}/mark-paid`, { method: "POST" });
        toast(res.message, "success");
        loadPayrollPanel();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("payroll-month").addEventListener("change", (e) => {
      PAYROLL_MONTH = e.target.value;
      renderPayrollList();
    });

    document.getElementById("payroll-generate-btn").addEventListener("click", async () => {
      const month = document.getElementById("payroll-month").value;
      if (!month) { toast("Pick a month first.", "error"); return; }
      const btn = document.getElementById("payroll-generate-btn");
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Generating…";
      try {
        const res = await api("/payroll/generate", { method: "POST", body: JSON.stringify({ month }) });
        toast(res.message, "success");
        loadPayrollPanel();
      } catch (err) {
        toast(err.message, "error");
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    /* ---- Add / update payroll record ---- */
    function updatePayrollBaseSalaryHint() {
      const select = document.getElementById("payroll-employee");
      const opt = select.options[select.selectedIndex];
      const base = opt ? Number(opt.dataset.baseSalary || 0) : 0;
      document.getElementById("payroll-base-salary-hint").textContent = select.value ? `Base salary: ${money(base)} (from employee record)` : "";
    }
    document.getElementById("payroll-employee").addEventListener("change", updatePayrollBaseSalaryHint);

    async function ensurePayrollEmployees() {
      const employees = await api("/employees");
      document.getElementById("payroll-employee").innerHTML = '<option value="">Select employee</option>'
        + employees.map((e) => `<option value="${e.id}" data-base-salary="${e.baseSalary}">${e.name} — ${money(e.baseSalary)}</option>`).join("");
    }

    async function openPayrollModal(recordId) {
      const errorEl = document.getElementById("payroll-form-error");
      errorEl.textContent = "";
      document.getElementById("payroll-form").reset();
      try {
        await ensurePayrollEmployees();
      } catch (err) {
        toast(err.message, "error");
      }

      const record = recordId ? ALL_PAYROLL_RECORDS.find((r) => r.id === recordId) : null;
      document.getElementById("payroll-employee").value = record ? String(record.employeeId) : "";
      document.getElementById("payroll-record-month").value = record ? record.month : PAYROLL_MONTH;
      updatePayrollBaseSalaryHint();

      const fields = ["transport", "housing", "medical", "overtime", "nssf", "tax", "loan", "other"];
      if (record) {
        try {
          const full = await api(`/payroll/${record.id}`);
          document.getElementById("payroll-transport").value = full.transport;
          document.getElementById("payroll-housing").value = full.housing;
          document.getElementById("payroll-medical").value = full.medical;
          document.getElementById("payroll-overtime").value = full.overtime;
          document.getElementById("payroll-nssf").value = full.nssf;
          document.getElementById("payroll-tax").value = full.tax;
          document.getElementById("payroll-loan").value = full.loan;
          document.getElementById("payroll-other").value = full.otherDeductions;
        } catch (err) {
          toast(err.message, "error");
        }
      } else {
        fields.forEach((f) => { document.getElementById(`payroll-${f}`).value = "0"; });
      }

      document.getElementById("payroll-modal-backdrop").classList.remove("hidden");
      document.getElementById("payroll-modal").classList.remove("hidden");
    }

    function closePayrollModal() {
      document.getElementById("payroll-modal").classList.add("hidden");
      document.getElementById("payroll-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("payroll-add-btn").addEventListener("click", () => openPayrollModal(null));
    document.getElementById("payroll-modal-close").addEventListener("click", closePayrollModal);
    document.getElementById("payroll-modal-backdrop").addEventListener("click", closePayrollModal);

    document.getElementById("payroll-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("payroll-form-error");
      errorEl.textContent = "";
      const employeeId = document.getElementById("payroll-employee").value;
      const month = document.getElementById("payroll-record-month").value;
      if (!employeeId) { errorEl.textContent = "Select an employee."; return; }
      if (!month) { errorEl.textContent = "Pick a month."; return; }

      const payload = {
        employee_id: Number(employeeId),
        month,
        transport: Number(document.getElementById("payroll-transport").value) || 0,
        housing: Number(document.getElementById("payroll-housing").value) || 0,
        medical: Number(document.getElementById("payroll-medical").value) || 0,
        overtime: Number(document.getElementById("payroll-overtime").value) || 0,
        nssf: Number(document.getElementById("payroll-nssf").value) || 0,
        tax: Number(document.getElementById("payroll-tax").value) || 0,
        loan: Number(document.getElementById("payroll-loan").value) || 0,
        other_deductions: Number(document.getElementById("payroll-other").value) || 0,
      };

      const btn = document.getElementById("payroll-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        const res = await api("/payroll", { method: "POST", body: JSON.stringify(payload) });
        toast(res.message, "success");
        closePayrollModal();
        loadPayrollPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    /* ---- Payslip ---- */
    async function openPayslip(id) {
      document.getElementById("payslip-title").textContent = "Payslip";
      document.getElementById("payslip-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("payslip-modal-backdrop").classList.remove("hidden");
      document.getElementById("payslip-modal").classList.remove("hidden");
      try {
        const p = await api(`/payroll/${id}`);
        renderPayslip(p);
      } catch (err) {
        document.getElementById("payslip-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function payslipHtml(p, withPrintButton) {
      return `
        <div style="border-bottom:1px solid var(--border);padding-bottom:12px;">
          <div style="font-weight:600;">${p.businessName || "Your business"}</div>
          <div style="color:var(--muted);font-size:12px;">Payslip · ${p.month}</div>
        </div>
        <div style="margin-top:12px;font-size:14px;">
          <p><span style="color:var(--muted);">Employee:</span> ${p.employee.name}</p>
          <p><span style="color:var(--muted);">Position:</span> ${p.employee.position || "—"}</p>
          <p><span style="color:var(--muted);">Branch:</span> ${p.employee.branch || "—"}</p>
          <p><span style="color:var(--muted);">Status:</span> <span class="pill ${p.status === "paid" ? "pill-ok" : "pill-warn"}">${p.status}</span></p>
        </div>
        <div class="section-title">Earnings</div>
        <div style="font-size:14px;">
          <div style="display:flex;justify-content:space-between;"><span>Base salary</span><span>${money(p.baseSalary)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Transport</span><span>${money(p.transport)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Housing</span><span>${money(p.housing)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Medical</span><span>${money(p.medical)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Overtime</span><span>${money(p.overtime)}</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Gross salary</span><span>${money(p.gross)}</span></div>
        </div>
        <div class="section-title">Deductions</div>
        <div style="font-size:14px;">
          <div style="display:flex;justify-content:space-between;"><span>NSSF</span><span>${money(p.nssf)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Tax (PAYE)</span><span>${money(p.tax)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Loan</span><span>${money(p.loan)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>Other</span><span>${money(p.otherDeductions)}</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Total deductions</span><span>${money(p.totalDeductions)}</span></div>
        </div>
        <div style="margin-top:14px;padding:14px;background:var(--brand-tint);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">Net salary</span><span style="font-weight:700;font-size:1.15rem;color:var(--brand);">${money(p.net)}</span>
        </div>
        ${withPrintButton ? '<button type="button" class="btn-primary" id="payslip-print-btn" style="width:100%;margin-top:16px;">Print payslip</button>' : ""}
      `;
    }

    function renderPayslip(p) {
      document.getElementById("payslip-title").textContent = `${p.employee.name} — ${p.month}`;
      document.getElementById("payslip-body").innerHTML = payslipHtml(p, true);
      document.getElementById("payslip-print-area").innerHTML = payslipHtml(p, false);
      document.getElementById("payslip-print-btn").addEventListener("click", printPayslip);
    }

    function printPayslip() {
      document.body.classList.add("printing-payslip");
      window.print();
    }
    window.addEventListener("afterprint", () => document.body.classList.remove("printing-payslip"));

    function closePayslipModal() {
      document.getElementById("payslip-modal").classList.add("hidden");
      document.getElementById("payslip-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("payslip-modal-close").addEventListener("click", closePayslipModal);
    document.getElementById("payslip-modal-backdrop").addEventListener("click", closePayslipModal);

    /* ---------------- Accounting ---------------- */
    let ACC_CASHBOOK_LOADED = false;
    let ACC_EXPENSES_LOADED = false;
    let ACC_REPORT_LOADED = false;
    let ACC_REPORT_TAB = "trial-balance";
    let ACC_ACCOUNTS_LOADED = false;
    let ALL_LEDGER_ACCOUNTS = [];

    function loadAccountingPanel() {
      loadTransactionsList();
      ACC_CASHBOOK_LOADED = false;
      ACC_EXPENSES_LOADED = false;
      ACC_REPORT_LOADED = false;
      ACC_ACCOUNTS_LOADED = false;
    }

    document.querySelectorAll("[data-acc-subtab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-acc-subtab]").forEach((b) => b.classList.toggle("active", b === btn));
        const tab = btn.dataset.accSubtab;
        document.getElementById("acc-sub-transactions").classList.toggle("hidden", tab !== "transactions");
        document.getElementById("acc-sub-cashbook").classList.toggle("hidden", tab !== "cashbook");
        document.getElementById("acc-sub-expenses").classList.toggle("hidden", tab !== "expenses");
        document.getElementById("acc-sub-reports").classList.toggle("hidden", tab !== "reports");
        document.getElementById("acc-sub-accounts").classList.toggle("hidden", tab !== "accounts");
        if (tab === "cashbook" && !ACC_CASHBOOK_LOADED) { ACC_CASHBOOK_LOADED = true; loadCashBook(); }
        if (tab === "expenses" && !ACC_EXPENSES_LOADED) { ACC_EXPENSES_LOADED = true; loadExpensesList(); }
        if (tab === "reports" && !ACC_REPORT_LOADED) { ACC_REPORT_LOADED = true; loadAccountingReport(); }
        if (tab === "accounts" && !ACC_ACCOUNTS_LOADED) { ACC_ACCOUNTS_LOADED = true; loadChartOfAccounts(); }
      });
    });

    /* ---- Transactions ---- */
    async function loadTransactionsList() {
      showLoading("transactions-list");
      try {
        const transactions = await api("/transactions");
        document.getElementById("transactions-list").innerHTML = transactions.length
          ? transactions.map((t) => `<div class="list-row">
              <div><div class="name">${t.description}</div><div class="meta">${t.date}${t.branch ? " · " + t.branch : ""}${t.handledBy ? " · " + t.handledBy : ""}</div></div>
              <div class="amount" style="color:${t.type === "income" ? "var(--success)" : "var(--danger)"}">${t.type === "income" ? "+" : "−"}${money(t.amount)}</div>
            </div>`).join("")
          : '<p class="empty">No transactions yet.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function closeTransactionModal() {
      document.getElementById("transaction-modal").classList.add("hidden");
      document.getElementById("transaction-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("transaction-add-btn").addEventListener("click", () => {
      document.getElementById("transaction-form-error").textContent = "";
      document.getElementById("transaction-form").reset();
      document.getElementById("transaction-modal-backdrop").classList.remove("hidden");
      document.getElementById("transaction-modal").classList.remove("hidden");
    });
    document.getElementById("transaction-modal-close").addEventListener("click", closeTransactionModal);
    document.getElementById("transaction-modal-backdrop").addEventListener("click", closeTransactionModal);

    document.getElementById("transaction-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("transaction-form-error");
      errorEl.textContent = "";
      const payload = {
        type: document.getElementById("transaction-type").value,
        description: document.getElementById("transaction-description").value.trim(),
        amount: Number(document.getElementById("transaction-amount").value) || 0,
      };
      const btn = document.getElementById("transaction-form-submit");
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Saving…";
      try {
        await api("/transactions", { method: "POST", body: JSON.stringify(payload) });
        toast("Transaction recorded.", "success");
        closeTransactionModal();
        loadTransactionsList();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    /* ---- Cash Book ---- */
    async function loadCashBook() {
      showLoading("cashbook-list");
      document.getElementById("cashbook-stat-cash").textContent = "—";
      document.getElementById("cashbook-stat-bank").textContent = "—";
      try {
        const entries = await api("/cash-book");
        const cashBalance = entries.reduce((s, e) => s + e.cashIn - e.cashOut, 0);
        const bankBalance = entries.reduce((s, e) => s + e.bankIn - e.bankOut, 0);
        document.getElementById("cashbook-stat-cash").textContent = money(cashBalance);
        document.getElementById("cashbook-stat-bank").textContent = money(bankBalance);
        document.getElementById("cashbook-list").innerHTML = entries.length
          ? entries.slice().reverse().map((e) => {
              const inAmt = e.cashIn + e.bankIn;
              const outAmt = e.cashOut + e.bankOut;
              return `<div class="list-row">
                <div><div class="name">${e.particulars}</div><div class="meta">${e.date} · ${e.source}</div></div>
                <div class="amount" style="color:${inAmt > 0 ? "var(--success)" : "var(--danger)"}">${inAmt > 0 ? "+" + money(inAmt) : "−" + money(outAmt)}</div>
              </div>`;
            }).join("")
          : '<p class="empty">No cash book entries yet.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function closeCashBookModal() {
      document.getElementById("cashbook-modal").classList.add("hidden");
      document.getElementById("cashbook-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("cashbook-add-btn").addEventListener("click", () => {
      document.getElementById("cashbook-form-error").textContent = "";
      document.getElementById("cashbook-form").reset();
      ["cashbook-cash-in", "cashbook-bank-in", "cashbook-cash-out", "cashbook-bank-out"].forEach((id) => { document.getElementById(id).value = "0"; });
      document.getElementById("cashbook-modal-backdrop").classList.remove("hidden");
      document.getElementById("cashbook-modal").classList.remove("hidden");
    });
    document.getElementById("cashbook-modal-close").addEventListener("click", closeCashBookModal);
    document.getElementById("cashbook-modal-backdrop").addEventListener("click", closeCashBookModal);

    document.getElementById("cashbook-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("cashbook-form-error");
      errorEl.textContent = "";
      const payload = {
        particulars: document.getElementById("cashbook-particulars").value.trim(),
        cash_in: Number(document.getElementById("cashbook-cash-in").value) || 0,
        bank_in: Number(document.getElementById("cashbook-bank-in").value) || 0,
        cash_out: Number(document.getElementById("cashbook-cash-out").value) || 0,
        bank_out: Number(document.getElementById("cashbook-bank-out").value) || 0,
      };
      const btn = document.getElementById("cashbook-form-submit");
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Saving…";
      try {
        await api("/cash-book", { method: "POST", body: JSON.stringify(payload) });
        toast("Cash book entry saved.", "success");
        closeCashBookModal();
        loadCashBook();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    /* ---- Expenses ---- */
    async function loadExpensesList() {
      showLoading("expenses-list");
      try {
        const expenses = await api("/expenses");
        document.getElementById("expenses-list").innerHTML = expenses.length
          ? expenses.map((e) => `<div class="list-row">
              <div><div class="name">${e.label}</div><div class="meta">${e.category} · ${e.incurredOn} · ${e.reference}</div></div>
              <div class="amount" style="color:var(--danger);">−${money(e.amount)}</div>
            </div>`).join("")
          : '<p class="empty">No expenses recorded yet.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("submit-expense").addEventListener("click", async () => {
      const errorEl = document.getElementById("expense-error");
      errorEl.textContent = "";
      const label = document.getElementById("expense-label").value;
      const category = document.getElementById("expense-category").value;
      const amount = Number(document.getElementById("expense-amount").value);

      const btn = document.getElementById("submit-expense");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const res = await api("/expenses", { method: "POST", body: JSON.stringify({ label, category, amount }) });
        toast(`Expense ${res.reference} recorded.`, "success");
        document.getElementById("expense-label").value = "";
        document.getElementById("expense-category").value = "";
        document.getElementById("expense-amount").value = "";
        ACC_EXPENSES_LOADED = true;
        loadExpensesList();
        loadTransactionsList();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Record expense";
      }
    });

    /* ---- Reports ---- */
    document.querySelectorAll("[data-report-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("[data-report-tab]").forEach((b) => b.classList.toggle("active", b === btn));
        ACC_REPORT_TAB = btn.dataset.reportTab;
        loadAccountingReport();
      });
    });

    async function loadAccountingReport() {
      showLoading("report-body");
      try {
        if (ACC_REPORT_TAB === "trial-balance") {
          renderTrialBalance(await api("/accounting/trial-balance"));
        } else if (ACC_REPORT_TAB === "balance-sheet") {
          renderBalanceSheet(await api("/accounting/balance-sheet"));
        } else {
          renderIncomeStatement(await api("/accounting/income-statement"));
        }
      } catch (err) {
        document.getElementById("report-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function renderTrialBalance(data) {
      const rows = data.accounts.map((a) => `<div class="list-row">
          <div><div class="name">${a.name}</div><div class="meta" style="text-transform:capitalize;">${a.type}</div></div>
          <div style="text-align:right;"><div class="amount">${money(a.debit)}</div><div class="meta">${money(a.credit)} cr</div></div>
        </div>`).join("");

      document.getElementById("report-body").innerHTML = `
        ${data.accounts.length ? rows : '<p class="empty">No ledger activity yet.</p>'}
        <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-weight:600;">
          <span>Total</span><span>${money(data.totalDebit)} / ${money(data.totalCredit)}</span>
        </div>
        <p class="tagline" style="text-align:left;margin-top:6px;color:${data.balanced ? "var(--success)" : "var(--danger)"};">${data.balanced ? "Balanced" : "Not balanced"}</p>
      `;
    }

    function renderBalanceSheet(data) {
      const section = (title, rows) => rows.length ? `
        <div class="section-title">${title}</div>
        ${rows.map((r) => `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;"><span>${r.name}</span><span>${money(r.balance)}</span></div>`).join("")}
      ` : `<div class="section-title">${title}</div><p class="empty">None yet.</p>`;

      document.getElementById("report-body").innerHTML = `
        ${section("Assets", data.assets)}
        <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Total assets</span><span>${money(data.totalAssets)}</span></div>
        ${section("Liabilities", data.liabilities)}
        <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Total liabilities</span><span>${money(data.totalLiabilities)}</span></div>
        ${section("Equity", data.equity)}
        <div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;"><span>Retained earnings (current)</span><span>${money(data.retainedEarnings)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Total equity</span><span>${money(data.totalEquity)}</span></div>
        <p class="tagline" style="text-align:left;margin-top:10px;color:${data.balanced ? "var(--success)" : "var(--danger)"};">${data.balanced ? "Balanced" : "Not balanced"}</p>
      `;
    }

    function renderIncomeStatement(data) {
      const expenseRows = data.expensesByCategory.map((e) => `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;"><span>${e.category}</span><span>${money(e.amount)}</span></div>`).join("");

      document.getElementById("report-body").innerHTML = `
        <p class="tagline" style="text-align:left;margin:0 0 10px;">Last ${data.days} days</p>
        <div style="display:flex;justify-content:space-between;font-size:14px;"><span>Revenue</span><span>${money(data.revenue)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:14px;"><span>Refunds</span><span>${money(data.refunds)}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:14px;"><span>Cost of sales</span><span>${money(data.costOfSales)}</span></div>
        <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Gross profit</span><span>${money(data.grossProfit)}</span></div>
        <div class="section-title">Expenses</div>
        ${expenseRows || '<p class="empty">No expenses in this period.</p>'}
        <div style="display:flex;justify-content:space-between;font-weight:600;border-top:1px solid var(--border);margin-top:6px;padding-top:6px;"><span>Total expenses</span><span>${money(data.totalExpenses)}</span></div>
        <div style="margin-top:14px;padding:14px;background:var(--brand-tint);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">Net profit</span><span style="font-weight:700;font-size:1.15rem;color:var(--brand);">${money(data.netProfit)}</span>
        </div>
      `;
    }

    /* ---- Chart of accounts + per-account ledger ---- */
    async function loadChartOfAccounts() {
      showLoading("accounts-list");
      try {
        ALL_LEDGER_ACCOUNTS = await api("/accounting/accounts");
        document.getElementById("accounts-list").innerHTML = ALL_LEDGER_ACCOUNTS.length
          ? ALL_LEDGER_ACCOUNTS.map((a) => `<div class="list-row" data-account-id="${a.id}" style="cursor:pointer;">
              <div><div class="name">${a.name}</div><div class="meta" style="text-transform:capitalize;">${a.type}</div></div>
              <div class="amount">${money(a.balance)}</div>
            </div>`).join("")
          : '<p class="empty">No accounts yet — they\'re created automatically as real activity happens, or add one below.</p>';
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("accounts-list").addEventListener("click", (e) => {
      const row = e.target.closest("[data-account-id]");
      if (row) openLedger(Number(row.dataset.accountId));
    });

    function closeAccountModal() {
      document.getElementById("account-modal").classList.add("hidden");
      document.getElementById("account-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("account-add-btn").addEventListener("click", () => {
      document.getElementById("account-form-error").textContent = "";
      document.getElementById("account-form").reset();
      document.getElementById("account-modal-backdrop").classList.remove("hidden");
      document.getElementById("account-modal").classList.remove("hidden");
    });
    document.getElementById("account-modal-close").addEventListener("click", closeAccountModal);
    document.getElementById("account-modal-backdrop").addEventListener("click", closeAccountModal);

    document.getElementById("account-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("account-form-error");
      errorEl.textContent = "";
      const payload = {
        name: document.getElementById("account-name").value.trim(),
        type: document.getElementById("account-type").value,
      };
      const btn = document.getElementById("account-form-submit");
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Saving…";
      try {
        await api("/accounting/accounts", { method: "POST", body: JSON.stringify(payload) });
        toast("Account added successfully!", "success");
        closeAccountModal();
        loadChartOfAccounts();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });

    async function openLedger(accountId) {
      const account = ALL_LEDGER_ACCOUNTS.find((a) => a.id === accountId);
      document.getElementById("ledger-title").textContent = account ? `Ledger — ${account.name}` : "Ledger";
      document.getElementById("ledger-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("ledger-modal-backdrop").classList.remove("hidden");
      document.getElementById("ledger-modal").classList.remove("hidden");
      try {
        const data = await api(`/accounting/accounts/${accountId}/ledger`);
        const rows = data.entries.map((e) => `<div class="list-row">
            <div><div class="name">${e.description}</div><div class="meta">${e.date}</div></div>
            <div style="text-align:right;">
              ${e.debit > 0 ? `<div class="amount">${money(e.debit)}</div><div class="meta">Dr</div>` : `<div class="amount">${money(e.credit)}</div><div class="meta">Cr</div>`}
            </div>
          </div>`).join("");

        document.getElementById("ledger-body").innerHTML = `
          ${rows || '<p class="empty">No entries yet for this account.</p>'}
          <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:14px;">
            <span>Totals</span><span>Dr ${money(data.totalDebit)} · Cr ${money(data.totalCredit)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-weight:600;">
            <span>Balance</span><span>${money(Math.abs(data.balance))} ${data.balance >= 0 ? "Dr" : "Cr"}</span>
          </div>
        `;
      } catch (err) {
        document.getElementById("ledger-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function closeLedgerModal() {
      document.getElementById("ledger-modal").classList.add("hidden");
      document.getElementById("ledger-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("ledger-modal-close").addEventListener("click", closeLedgerModal);
    document.getElementById("ledger-modal-backdrop").addEventListener("click", closeLedgerModal);

    /* ---------------- Branches ---------------- */
    let ALL_BRANCHES_LIST = [];
    let CURRENT_DASH_BRANCH = null;

    async function loadBranchesPanel() {
      showLoading("branches-list");
      document.getElementById("branches-subtitle").textContent = "Loading…";
      document.getElementById("branch-add-btn").style.display = ["super", "admin"].includes(USER_ROLE) ? "block" : "none";
      try {
        ALL_BRANCHES_LIST = await api("/branches/list");
        renderBranchesList();
        document.getElementById("branches-subtitle").textContent = `${ALL_BRANCHES_LIST.length} branch${ALL_BRANCHES_LIST.length === 1 ? "" : "es"} registered`;
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderBranchesList() {
      document.getElementById("branches-list").innerHTML = ALL_BRANCHES_LIST.length
        ? ALL_BRANCHES_LIST.map((b) => `<div class="list-row" data-branch-id="${b.id}" style="cursor:pointer;">
            <div>
              <div class="name">${b.name}</div>
              <div class="meta">${b.location || "—"} · ${b.managerName || "Unassigned"} · ${b.staffCount} staff</div>
            </div>
            <div style="text-align:right;">
              <div class="amount">${money(b.todaySales)}</div>
              <span class="pill ${b.status === "open" ? "pill-ok" : "pill-danger"}">${cap(b.status)}</span>
            </div>
          </div>`).join("")
        : '<p class="empty">No branches yet.</p>';
    }

    document.getElementById("branches-list").addEventListener("click", (e) => {
      const row = e.target.closest("[data-branch-id]");
      if (row) openBranchDashboard(Number(row.dataset.branchId));
    });

    /* ---- Add / edit branch ---- */
    function openBranchModal(branch) {
      document.getElementById("branch-form-error").textContent = "";
      document.getElementById("branch-form").reset();
      const isEdit = !!branch;
      document.getElementById("branch-modal-title").textContent = isEdit ? "Edit branch" : "Add branch";
      document.getElementById("branch-id").value = isEdit ? branch.id : "";
      document.getElementById("branch-name").value = isEdit ? branch.name : "";
      document.getElementById("branch-location").value = isEdit ? (branch.location || "") : "";
      document.getElementById("branch-contact").value = isEdit ? (branch.contact || "") : "";
      document.getElementById("branch-manager").value = isEdit ? (branch.managerName || "") : "";
      document.getElementById("branch-modal-backdrop").classList.remove("hidden");
      document.getElementById("branch-modal").classList.remove("hidden");
    }

    function closeBranchModal() {
      document.getElementById("branch-modal").classList.add("hidden");
      document.getElementById("branch-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("branch-add-btn").addEventListener("click", () => openBranchModal(null));
    document.getElementById("branch-modal-close").addEventListener("click", closeBranchModal);
    document.getElementById("branch-modal-backdrop").addEventListener("click", closeBranchModal);

    document.getElementById("branch-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById("branch-form-error");
      errorEl.textContent = "";
      const id = document.getElementById("branch-id").value;
      const payload = {
        name: document.getElementById("branch-name").value.trim(),
        location: document.getElementById("branch-location").value.trim() || null,
        contact: document.getElementById("branch-contact").value.trim() || null,
        manager_name: document.getElementById("branch-manager").value.trim() || null,
      };

      const btn = document.getElementById("branch-form-submit");
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = "Saving…";
      try {
        if (id) {
          const res = await api(`/branches/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
          toast(res.message, "success");
        } else {
          const res = await api("/branches", { method: "POST", body: JSON.stringify(payload) });
          toast(res.message, "success");
        }
        closeBranchModal();
        loadBranchesPanel();
        loadBranches();
        if (CURRENT_DASH_BRANCH) openBranchDashboard(CURRENT_DASH_BRANCH.branch.id);
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });

    /* ---- Branch dashboard ---- */
    async function openBranchDashboard(id) {
      document.getElementById("branch-dash-title").textContent = "Branch";
      document.getElementById("branch-dash-body").innerHTML = '<p class="empty">Loading…</p>';
      document.getElementById("branch-dash-modal-backdrop").classList.remove("hidden");
      document.getElementById("branch-dash-modal").classList.remove("hidden");
      try {
        const data = await api(`/branches/${id}/dashboard`);
        CURRENT_DASH_BRANCH = data;
        renderBranchDashboard(data);
      } catch (err) {
        document.getElementById("branch-dash-body").innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    const PAYMENT_MIX_COLORS = {
      cash: "#22c55e", mpesa: "#3b82f6", card: "#a855f7", bank: "#f59e0b", invoice: "#ef4444",
    };
    function paymentMixColor(method) { return PAYMENT_MIX_COLORS[method] || "#94a3b8"; }

    /** Pure-CSS conic-gradient donut — no charting library anywhere else in this app, so none here either. */
    function renderPaymentMixDonut(mix) {
      if (!mix.length) return '<p class="empty">No sales yet.</p>';

      const grandTotal = mix.reduce((s, m) => s + m.amount, 0) || 1;
      let cumulative = 0;
      const stops = mix.map((m) => {
        const start = cumulative;
        cumulative += (m.amount / grandTotal) * 100;
        return `${paymentMixColor(m.method)} ${start}% ${cumulative}%`;
      }).join(", ");

      const legend = mix.map((m) => `<div class="donut-legend-item">
          <span class="donut-legend-dot" style="background:${paymentMixColor(m.method)};"></span>
          <span style="flex:1;text-transform:capitalize;">${cap(m.method)}</span>
          <span style="color:var(--muted);">${m.percent}%</span>
          <span>${money(m.amount)}</span>
        </div>`).join("");

      return `
        <div class="donut-chart" style="background:conic-gradient(${stops});"></div>
        <div class="donut-legend">${legend}</div>
      `;
    }

    function renderBranchDashboard(data) {
      const b = data.branch;
      document.getElementById("branch-dash-title").textContent = b.name;

      const paymentMixHtml = renderPaymentMixDonut(data.paymentMix);

      const staffHtml = data.staff.length
        ? data.staff.map((s) => `<div class="list-row">
            <div><div class="name">${s.name}</div><div class="meta">${s.position} · ${cap(s.role)}</div></div>
            <div class="meta">${s.phone || "—"}</div>
          </div>`).join("")
        : '<p class="empty">No staff assigned.</p>';

      document.getElementById("branch-dash-body").innerHTML = `
        <div class="qr-field-grid">
          <div><div class="cmeta">Location</div><div class="cname">${b.location || "—"}</div></div>
          <div><div class="cmeta">Contact</div><div class="cname">${b.contact || "—"}</div></div>
          <div><div class="cmeta">Manager</div><div class="cname">${b.managerName || "Unassigned"}</div></div>
          <div><div class="cmeta">Status</div><div class="cname" style="text-transform:capitalize;">${b.status}</div></div>
        </div>
        <button type="button" class="btn-secondary" id="branch-status-toggle-btn" style="width:100%;margin-top:10px;">${b.status === "open" ? "Close this branch" : "Reopen this branch"}</button>

        <div class="stat-grid" style="margin-top:14px;">
          <div class="stat"><div class="label">Sales</div><div class="value">${money(data.financials.totalSales)}</div><div class="hint">All time</div></div>
          <div class="stat"><div class="label">Expenses</div><div class="value">${money(data.financials.totalExpenses)}</div><div class="hint">All time</div></div>
        </div>
        <div class="stat-grid" style="margin-top:10px;">
          <div class="stat"><div class="label">Profit</div><div class="value">${money(data.financials.profit)}</div><div class="hint">${data.financials.profit >= 0 ? "Profitable" : "Loss"}</div></div>
          <div class="stat"><div class="label">Staff</div><div class="value">${data.staff.length}</div><div class="hint">Assigned to branch</div></div>
        </div>

        <div class="card" style="margin-top:14px;">
          <div class="section-title-row" style="margin:0;">
            <div class="section-title" style="margin:0;">Revenue trend (7 days)</div>
          </div>
          <div class="bar-chart" id="branch-revenue-chart"></div>
        </div>

        <div class="section-title">Payment mix</div>
        ${paymentMixHtml}

        <div class="section-title">Stock</div>
        <div style="display:flex; justify-content:space-between; font-size:14px;">
          <span style="color:var(--muted);">${data.stock.count} product${data.stock.count === 1 ? "" : "s"}</span>
          <span>${money(data.stock.value)} at cost</span>
        </div>

        <div class="section-title">Branch staff</div>
        ${staffHtml}
      `;

      renderBarChart(data.revenueSeries, "branch-revenue-chart");

      document.getElementById("branch-status-toggle-btn").addEventListener("click", async function () {
        const newStatus = b.status === "open" ? "closed" : "open";
        this.disabled = true;
        try {
          const res = await api(`/branches/${b.id}/status`, { method: "POST", body: JSON.stringify({ status: newStatus }) });
          toast(res.message, "success");
          openBranchDashboard(b.id);
          loadBranchesPanel();
        } catch (err) {
          toast(err.message, "error");
          this.disabled = false;
        }
      });
    }

    function closeBranchDashModal() {
      document.getElementById("branch-dash-modal").classList.add("hidden");
      document.getElementById("branch-dash-modal-backdrop").classList.add("hidden");
    }
    document.getElementById("branch-dash-modal-close").addEventListener("click", closeBranchDashModal);
    document.getElementById("branch-dash-modal-backdrop").addEventListener("click", closeBranchDashModal);
    document.getElementById("branch-dash-edit-btn").addEventListener("click", () => {
      if (CURRENT_DASH_BRANCH) openBranchModal({ id: CURRENT_DASH_BRANCH.branch.id, name: CURRENT_DASH_BRANCH.branch.name, location: CURRENT_DASH_BRANCH.branch.location, contact: CURRENT_DASH_BRANCH.branch.contact, managerName: CURRENT_DASH_BRANCH.branch.managerName });
    });

    /* ---------------- Reports ---------------- */
    let REPORT_RESULT = null;
    const REPORT_CHART_COLORS = ["#008963", "#1d64c2", "#6d28d9", "#92620a", "#da283c"];

    /** Full 30-day visual dashboard, ported to match the web app's own /reports page. */
    async function loadReportsPanel() {
      showLoading("reports-stat-grid");
      document.getElementById("report-results").innerHTML = '<p class="empty">Choose a report type and tap Generate.</p>';
      REPORT_RESULT = null;
      document.getElementById("report-export-btn").disabled = true;
      document.getElementById("reports-subtitle").textContent =
        `Full business overview as of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
      // Branch performance compares across branches — meaningless (and blocked server-side) for an account locked to one branch.
      const branchPerfOption = document.querySelector('#report-type option[value="branch_performance"]');
      if (branchPerfOption) {
        branchPerfOption.hidden = BRANCH_LOCKED;
        if (BRANCH_LOCKED && document.getElementById("report-type").value === "branch_performance") {
          document.getElementById("report-type").value = "sales";
        }
      }
      try {
        const data = await api("/reports/summary");
        renderReportStatCards(data);
        renderReportsTrendChart(data.monthlyTrend);
        renderReportDonut("reports-category-chart", data.byCategory);
        renderRankedBars("reports-branch-list", data.byBranch);
        renderRankedBars("reports-products-list", data.topProducts);

        const plSection = document.getElementById("reports-pl-section");
        if (data.accountingEnabled && data.income) {
          plSection.classList.remove("hidden");
          renderReportDonut("reports-expense-chart", data.income.expenses.map((e) => ({ name: e.category, revenue: e.amount })));
          renderIncomeStatement(data.income);
        } else {
          plSection.classList.add("hidden");
        }
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /** Revenue / orders / growth / best-day — same stat set as the web app's /reports, swapping in Total expenses + Net profit instead of Gross margin once the accounting module is active. */
    function renderReportStatCards(data) {
      const cards = [{ label: "Revenue", value: money(data.revenue), hint: "last 30 days" }];

      if (data.accountingEnabled && data.income) {
        cards.push({ label: "Total expenses", value: money(data.income.totalExpenses), hint: "last 30 days" });
        cards.push({ label: "Net profit", value: money(data.income.netProfit), hint: "after expenses" });
      } else {
        cards.push({
          label: "Gross margin",
          value: `${data.marginPct}%`,
          hint: `${data.marginDeltaPct >= 0 ? "+" : ""}${data.marginDeltaPct}% vs prior 30 days`,
          hintClass: data.marginDeltaPct >= 0 ? "up" : "down",
        });
      }

      cards.push({ label: "Orders", value: String(data.orders), hint: `avg ${data.averagePerDay} / day` });

      const trend = data.monthlyTrend;
      const current = trend[trend.length - 1];
      const previous = trend[trend.length - 2];
      let growthValue = "—";
      if (current && previous && previous.revenue >= 1) {
        const growth = Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100);
        growthValue = `${growth >= 0 ? "+" : ""}${growth}%`;
      }
      cards.push({ label: "Revenue growth", value: growthValue, hint: "vs previous month" });
      cards.push({ label: "Best day", value: data.bestDay.day, hint: money(data.bestDay.revenue) });

      document.getElementById("reports-stat-grid").innerHTML = cards.map((c) => `
        <div class="stat">
          <div class="label">${c.label}</div>
          <div class="value">${c.value}</div>
          <div class="hint ${c.hintClass || ""}">${c.hint}</div>
        </div>
      `).join("");
    }

    function renderReportsTrendChart(monthlyTrend) {
      const container = document.getElementById("reports-trend-chart");
      if (!monthlyTrend.length) {
        container.innerHTML = '<p class="empty">No sales yet.</p>';
        return;
      }
      const max = Math.max(1, ...monthlyTrend.map((d) => d.revenue));
      container.innerHTML = monthlyTrend.map((d) => `
        <div class="bar-col">
          <div class="bar" style="height:${Math.max(4, (d.revenue / max) * 100)}%" title="${money(d.revenue)}"></div>
          <div class="bar-day">${d.month.split(" ")[0]}</div>
        </div>
      `).join("");
    }

    /** Pure-CSS conic-gradient donut, same zero-dependency approach as the payment mix chart — reused here for any {name, revenue}[] breakdown. */
    function renderReportDonut(containerId, data) {
      const container = document.getElementById(containerId);
      if (!data.length) {
        container.innerHTML = '<p class="empty">No data yet.</p>';
        return;
      }
      const total = data.reduce((s, d) => s + d.revenue, 0) || 1;
      let cumulative = 0;
      const stops = data.map((d, i) => {
        const start = cumulative;
        cumulative += (d.revenue / total) * 100;
        return `${REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length]} ${start}% ${cumulative}%`;
      }).join(", ");
      const legend = data.map((d, i) => `
        <div class="donut-legend-item">
          <span class="donut-legend-dot" style="background:${REPORT_CHART_COLORS[i % REPORT_CHART_COLORS.length]};"></span>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name}</span>
          <span>${money(d.revenue)}</span>
        </div>
      `).join("");
      container.innerHTML = `
        <div class="donut-chart" style="background:conic-gradient(${stops});"></div>
        <div class="donut-legend">${legend}</div>
      `;
    }

    /** Ranked, sized bars for a {name, revenue}[] breakdown — the mobile-friendly equivalent of the web app's horizontal bar charts. */
    function renderRankedBars(containerId, data) {
      const container = document.getElementById(containerId);
      if (!data.length) {
        container.innerHTML = '<p class="empty">No data yet.</p>';
        return;
      }
      const max = Math.max(1, ...data.map((d) => d.revenue));
      container.innerHTML = data.map((d) => `
        <div class="rank-row">
          <div class="rank-row-top"><span class="rank-row-name">${d.name}</span><span class="rank-row-value">${money(d.revenue)}</span></div>
          <div class="rank-bar-track"><div class="rank-bar-fill" style="width:${Math.max(4, (d.revenue / max) * 100)}%"></div></div>
        </div>
      `).join("");
    }

    function renderIncomeStatement(income) {
      document.getElementById("reports-pl-list").innerHTML = `
        <div class="list-row"><div class="name">Revenue</div><div class="amount">${money(income.revenue)}</div></div>
        <div class="list-row"><div class="name" style="color:var(--muted);">Cost of sales</div><div class="amount" style="color:var(--muted);">− ${money(income.costOfSales)}</div></div>
        <div class="list-row"><div class="name" style="font-weight:700;">Gross profit</div><div class="amount">${money(income.grossProfit)}</div></div>
        <div class="list-row"><div class="name" style="color:var(--muted);">Total expenses</div><div class="amount" style="color:var(--muted);">− ${money(income.totalExpenses)}</div></div>
        <div class="list-row" style="border-top:2px solid var(--border);padding-top:14px;">
          <div class="name" style="font-weight:800;font-size:1.05rem;">Net profit</div>
          <div class="amount" style="font-size:1.05rem;color:var(--brand-dark);">${money(income.netProfit)}</div>
        </div>
      `;
    }

    document.getElementById("reports-print-btn").addEventListener("click", () => window.print());

    async function generateReport() {
      const type = document.getElementById("report-type").value;
      const from = document.getElementById("report-from").value;
      const to = document.getElementById("report-to").value;
      const errorEl = document.getElementById("report-form-error");
      errorEl.textContent = "";
      if (from && to && from > to) {
        errorEl.textContent = "End date must be on or after the start date.";
        return;
      }
      const btn = document.getElementById("report-generate-btn");
      btn.disabled = true;
      showLoading("report-results");
      try {
        let path = `/reports/generate?type=${type}`;
        if (from) path += `&from=${from}`;
        if (to) path += `&to=${to}`;
        const data = await api(path);
        REPORT_RESULT = data;
        renderReportResults(data);
        document.getElementById("report-export-btn").disabled = data.rows.length === 0;
      } catch (err) {
        document.getElementById("report-results").innerHTML = "";
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    }

    /** Row-card layout rather than a wide table — the report builder's column set varies a lot by type, and a phone screen has no room for a scrolling table. */
    function renderReportResults(data) {
      const el = document.getElementById("report-results");
      if (!data.rows.length) {
        el.innerHTML = '<p class="empty">No records for this filter.</p>';
        return;
      }
      const moneyKeys = new Set(["amount", "total", "balance", "revenue"]);
      const [primary, ...rest] = data.columns;
      el.innerHTML = `
        <p class="tagline" style="text-align:left;margin:0 0 8px;">${data.rows.length} record${data.rows.length === 1 ? "" : "s"}</p>
        ${data.rows.map((r) => `
          <div class="list-row" style="flex-direction:column;align-items:stretch;">
            <div class="name">${r[primary.key] ?? "—"}</div>
            <div class="meta">${rest.map((c) => `${c.label}: ${moneyKeys.has(c.key) ? money(r[c.key]) : (r[c.key] ?? "—")}`).join(" · ")}</div>
          </div>
        `).join("")}
      `;
    }

    document.getElementById("report-generate-btn").addEventListener("click", generateReport);

    /** Same zero-dependency Blob + <a download> approach as the Sales panel's CSV export. */
    document.getElementById("report-export-btn").addEventListener("click", () => {
      if (!REPORT_RESULT || REPORT_RESULT.rows.length === 0) return;
      const header = REPORT_RESULT.columns.map((c) => c.label);
      const rows = REPORT_RESULT.rows.map((r) => REPORT_RESULT.columns.map((c) => r[c.key]));
      const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${REPORT_RESULT.type}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    /* ---------------- Notifications ---------------- */
    async function loadNotificationsPanel() {
      showLoading("notif-shop-debtors-list");
      showLoading("notif-customer-debtors-list");
      showLoading("notif-low-stock-list");
      try {
        const data = await api("/notifications");
        const total = data.shopDebtors.length + data.customerDebtors.length + data.lowStock.length;
        document.getElementById("notif-subtitle").textContent = `${total} items need your attention`;
        document.getElementById("notif-stat-shop").textContent = data.shopDebtors.length;
        document.getElementById("notif-stat-customer").textContent = data.customerDebtors.length;
        document.getElementById("notif-stat-lowstock").textContent = data.lowStock.length;

        renderDebtorAlerts("notif-shop-debtors-list", data.shopDebtors, "shop_debtor", true, "No overdue shop debtors.");
        renderDebtorAlerts("notif-customer-debtors-list", data.customerDebtors, "customer_debtor", false, "No overdue customer debtors.");
        renderLowStockAlerts(data.lowStock);
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function daysOverdue(dueIso) {
      if (!dueIso) return null;
      return Math.max(0, Math.floor((Date.now() - new Date(dueIso).getTime()) / 86400000));
    }

    function urgencyStyle(days) {
      if (days === null) return "border-color:var(--border);";
      if (days > 7) return "border-color:var(--danger);background:var(--danger-bg);";
      if (days > 3) return "border-color:var(--warning);background:var(--warning-bg);";
      return "border-color:var(--border);";
    }

    function fmtDate(iso) {
      return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
    }

    /** Same two actions the web app has — Snooze (1 day) and Clear — icon-only, matching its design exactly. */
    function renderDebtorAlerts(containerId, items, kind, showBranch, emptyText) {
      const container = document.getElementById(containerId);
      if (!items.length) {
        container.innerHTML = `<p class="empty">${emptyText}</p>`;
        return;
      }
      container.innerHTML = items.map((d) => {
        const days = daysOverdue(d.dueDate);
        const title = `${d.name} — overdue balance`;
        return `
        <div class="list-row" style="align-items:flex-start; border:1px solid var(--border); border-radius:10px; padding:11px 12px; margin-bottom:8px; ${urgencyStyle(days)}">
          <div>
            <div class="name">${d.name}${showBranch ? ` <span class="pill" style="background:var(--bg); color:var(--muted); font-weight:500;">${d.branch}</span>` : ""}</div>
            <div class="meta">Due ${fmtDate(d.dueDate)} · ${days === null ? "—" : `${days} day${days !== 1 ? "s" : ""} overdue`} · Balance ${money(d.balance)}</div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" class="icon-btn" style="border:1px solid var(--border); border-radius:8px;" data-notif-action="snooze" data-kind="${kind}" data-ref="${d.id}" data-title="${title.replace(/"/g, "&quot;")}" title="Snooze 1 day">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 1h6"/></svg>
            </button>
            <button type="button" class="icon-btn" style="border:1px solid var(--border); border-radius:8px;" data-notif-action="dismiss" data-kind="${kind}" data-ref="${d.id}" data-title="${title.replace(/"/g, "&quot;")}" title="Clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      `;
      }).join("");
      bindNotifActions(container);
    }

    /** Low stock rows are always warning-tinted (no urgency tiering) and dismiss is "Acknowledge", not "Clear" — matches the web app. */
    function renderLowStockAlerts(items) {
      const container = document.getElementById("notif-low-stock-list");
      if (!items.length) {
        container.innerHTML = '<p class="empty">No low stock alerts.</p>';
        return;
      }
      container.innerHTML = items.map((p) => {
        const title = `${p.name} — low stock`;
        return `
        <div class="list-row" style="align-items:flex-start; border:1px solid var(--warning); background:var(--warning-bg); border-radius:10px; padding:11px 12px; margin-bottom:8px;">
          <div>
            <div class="name">${p.name} <span class="pill" style="background:var(--bg); color:var(--muted); font-weight:500;">${p.branch}</span></div>
            <div class="meta">${p.stock} units left · ${money(p.price)}</div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" class="icon-btn" style="border:1px solid var(--border); border-radius:8px;" data-notif-action="snooze" data-kind="low_stock" data-ref="${p.id}" data-title="${title.replace(/"/g, "&quot;")}" title="Snooze 1 day">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 1h6"/></svg>
            </button>
            <button type="button" class="icon-btn" style="border:1px solid var(--border); border-radius:8px;" data-notif-action="dismiss" data-kind="low_stock" data-ref="${p.id}" data-title="${title.replace(/"/g, "&quot;")}" title="Acknowledge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M20 6 9 17l-5-5"/></svg>
            </button>
          </div>
        </div>
      `;
      }).join("");
      bindNotifActions(container);
    }

    function bindNotifActions(container) {
      container.querySelectorAll("[data-notif-action]").forEach((btn) => {
        btn.addEventListener("click", () => suppressNotification(btn, btn.dataset.notifAction));
      });
    }

    async function suppressNotification(btn, action) {
      btn.disabled = true;
      try {
        await api(`/notifications/${action}`, {
          method: "POST",
          body: JSON.stringify({ kind: btn.dataset.kind, reference_id: Number(btn.dataset.ref), title: btn.dataset.title }),
        });
        loadNotificationsPanel();
        refreshNotifBadge();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
      }
    }

    /** Feeds a real badge — the web app's header bell is a hardcoded dot with no query behind it at all. */
    async function refreshNotifBadge() {
      try {
        const data = await api("/notifications/count");
        const badge = document.getElementById("notif-bell-badge");
        if (data.total > 0) {
          badge.textContent = data.total > 99 ? "99+" : data.total;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      } catch {
        // Background refresh — not worth a toast if it fails.
      }
    }
    document.getElementById("notif-bell-btn").addEventListener("click", () => openPanel("notifications"));

    /* ---------------- Order alerts ---------------- */
    async function loadOrderAlertsPanel() {
      showLoading("order-alerts-list");
      try {
        const orders = await api("/remote-orders?status=pending");
        document.getElementById("order-alerts-subtitle").textContent = `${orders.length} remote orders waiting on you`;
        document.getElementById("oa-stat-count").textContent = orders.length;
        document.getElementById("oa-stat-value").textContent = money(orders.reduce((s, o) => s + o.amount, 0));
        renderOrderAlerts(orders);
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderOrderAlerts(orders) {
      const container = document.getElementById("order-alerts-list");
      if (!orders.length) {
        container.innerHTML = '<p class="empty">No pending remote orders — you\'re all caught up.</p>';
        return;
      }
      container.innerHTML = orders.map((o) => {
        const itemsCount = o.items.reduce((s, i) => s + i.qty, 0);
        return `
        <div class="list-row" style="align-items:flex-start; border:1px solid var(--warning); background:var(--warning-bg); border-radius:10px; padding:11px 12px; margin-bottom:8px;">
          <div style="min-width:0;">
            <div class="name">${o.customer} <span class="pill" style="background:var(--bg); color:var(--muted); font-weight:500;">${o.branch || "Unassigned"}</span></div>
            <div class="meta">${o.reference} · ${o.phone || "—"} · ${itemsCount} item${itemsCount === 1 ? "" : "s"} · ${money(o.amount)} · ${new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${new Date(o.placedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button type="button" class="btn-primary" data-alert-complete="${o.reference}" style="display:flex; align-items:center; gap:5px; white-space:nowrap;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><path d="M7 12h10"/></svg>
              Complete
            </button>
            <button type="button" class="icon-btn" style="border:1px solid var(--border); border-radius:8px; color:var(--danger);" data-alert-cancel="${o.id}" title="Cancel order">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      `;
      }).join("");

      container.querySelectorAll("[data-alert-complete]").forEach((btn) => {
        btn.addEventListener("click", () => {
          QR_PRELOAD_REF = btn.dataset.alertComplete;
          openPanel("qr-scanner");
        });
      });
      container.querySelectorAll("[data-alert-cancel]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          try {
            const res = await api(`/remote-orders/${btn.dataset.alertCancel}/cancel`, { method: "POST" });
            toast(res.message, "success");
            loadOrderAlertsPanel();
            refreshNotifBadge();
          } catch (err) {
            toast(err.message, "error");
            btn.disabled = false;
          }
        });
      });
    }

    /* ---------------- SMS centre ---------------- */
    async function loadSmsPanel() {
      document.getElementById("sms-log-list").innerHTML = '<div class="loading-row"><div class="spinner"></div> Loading…</div>';
      try {
        const data = await api("/sms");

        document.getElementById("sms-warning-banner").classList.toggle("hidden", data.configured);

        const sent = data.logs.filter((l) => l.status === "sent").length;
        const failed = data.logs.filter((l) => l.status === "failed").length;
        const queued = data.logs.filter((l) => l.status === "queued").length;
        document.getElementById("sms-stat-sent").textContent = sent;
        document.getElementById("sms-stat-failed").textContent = failed;
        document.getElementById("sms-stat-queued").textContent = queued;

        renderSmsLog(data.logs);
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function smsStatusPillClass(status) {
      return status === "sent" ? "pill-ok" : status === "queued" ? "pill-warn" : "pill-danger";
    }

    /** No empty-state message when there are zero rows — matches the web app's delivery log exactly (it renders nothing there either). */
    function renderSmsLog(logs) {
      document.getElementById("sms-log-list").innerHTML = logs.map((l) => `
        <div class="list-row">
          <div style="min-width:0;">
            <div class="name">${l.recipient}</div>
            <div class="meta" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px;">${l.message}</div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <span class="pill ${smsStatusPillClass(l.status)}">${cap(l.status)}</span>
            <div class="meta" style="margin-top:4px;">${new Date(l.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${new Date(l.sentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>
      `).join("");
    }

    document.getElementById("sms-send-btn").addEventListener("click", async () => {
      const recipients = document.getElementById("sms-recipients").value.split(/[,\n]/).map((r) => r.trim()).filter(Boolean);
      const message = document.getElementById("sms-message").value.trim();
      if (recipients.length === 0 || !message) return;

      const btn = document.getElementById("sms-send-btn");
      btn.disabled = true;
      document.getElementById("sms-send-btn-label").textContent = "Sending…";
      try {
        const res = await api("/sms/send", { method: "POST", body: JSON.stringify({ recipients, message }) });
        toast(res.message, "success");
        document.getElementById("sms-recipients").value = "";
        document.getElementById("sms-message").value = "";
        loadSmsPanel();
      } catch (err) {
        toast(err.message, "error");
        loadSmsPanel();
      } finally {
        btn.disabled = false;
        document.getElementById("sms-send-btn-label").textContent = "Send SMS";
      }
    });

    /* ---------------- Manager view ---------------- */
    let MGRVIEW_SALES = [];
    let MGRVIEW_BRANCH_FILTER = "all";

    async function loadManagerViewPanel() {
      document.getElementById("mgrview-title").textContent = FIRST_NAME ? `Welcome, ${FIRST_NAME}` : "Welcome";
      document.getElementById("mgrview-sales-desc").textContent = "Loading…";
      document.getElementById("mgrview-sales-list").innerHTML = '<div class="loading-row"><div class="spinner"></div> Loading…</div>';
      try {
        const [stats, branches, sales] = await Promise.all([
          api("/manager-dashboard"),
          api("/branches/list"),
          api("/sales"),
        ]);

        document.getElementById("mgrview-subtitle").textContent = `Manager dashboard${stats.branchName ? " · " + stats.branchName : ""}`;
        document.getElementById("mgrview-stat-sales").textContent = money(stats.salesToday);
        document.getElementById("mgrview-stat-expenses").textContent = money(stats.expensesToday);
        document.getElementById("mgrview-stat-products").textContent = stats.productCount;
        document.getElementById("mgrview-stat-lowstock-hint").textContent = `${stats.lowStock} low`;
        document.getElementById("mgrview-stat-staff").textContent = stats.totalStaff;

        MGRVIEW_SALES = sales.slice(0, 20);
        MGRVIEW_BRANCH_FILTER = "all";

        // Same web app behavior: the branch filter only appears at all once there's more than one branch to choose between.
        const filterWrap = document.getElementById("mgrview-branch-filter-wrap");
        if (branches.length > 1) {
          const select = document.getElementById("mgrview-branch-filter");
          select.innerHTML = '<option value="all">All branches</option>' + branches.map((b) => `<option value="${b.name}">${b.name}</option>`).join("");
          select.value = "all";
          filterWrap.classList.remove("hidden");
        } else {
          filterWrap.classList.add("hidden");
        }

        renderMgrviewSales();
      } catch (err) {
        toast(err.message, "error");
      }
    }

    /** Purely a client-side filter over the already-fetched 20 rows — no refetch, matching the web app's in-memory branch filter. */
    function renderMgrviewSales() {
      const rows = MGRVIEW_SALES.filter((s) => MGRVIEW_BRANCH_FILTER === "all" || s.branch === MGRVIEW_BRANCH_FILTER);
      document.getElementById("mgrview-sales-desc").textContent = `${rows.length} latest transaction${rows.length === 1 ? "" : "s"}`;

      const container = document.getElementById("mgrview-sales-list");
      if (!rows.length) {
        container.innerHTML = '<p class="empty">No sales recorded yet for this view.</p>';
        return;
      }
      container.innerHTML = rows.map((s) => `
        <div class="list-row">
          <div style="min-width:0;">
            <div class="name">${s.reference} — ${s.customer}</div>
            <div class="meta">${s.time} · ${s.items} item${s.items === 1 ? "" : "s"} · ${s.cashier || "—"}${s.branch ? " · " + s.branch : ""}</div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div class="amount">${money(s.total)}</div>
            <span class="pill ${statusPillClass(s.status)}" style="margin-top:4px;display:inline-block;">${cap(s.status)}</span>
          </div>
        </div>
      `).join("");
    }

    document.getElementById("mgrview-branch-filter").addEventListener("change", (e) => {
      MGRVIEW_BRANCH_FILTER = e.target.value;
      renderMgrviewSales();
    });

    /* ---------------- Staff view ---------------- */
    async function loadStaffViewPanel() {
      document.getElementById("staffview-title").textContent = FIRST_NAME ? `Welcome, ${FIRST_NAME}` : "Welcome";
      refreshStaffViewAttendance();
      document.getElementById("staffview-sales-list").innerHTML = '<div class="loading-row"><div class="spinner"></div> Loading…</div>';
      try {
        const data = await api("/staff-dashboard");
        document.getElementById("staffview-subtitle").textContent = `Staff dashboard${data.branchName ? " · " + data.branchName : ""}`;
        document.getElementById("staffview-stat-revenue").textContent = money(data.stats.revenue);
        document.getElementById("staffview-stat-revenue-hint").textContent = `${data.stats.receipts} receipt${data.stats.receipts === 1 ? "" : "s"}`;
        document.getElementById("staffview-stat-items").textContent = data.stats.items;
        document.getElementById("staffview-stat-receipts").textContent = data.stats.receipts;
        renderStaffViewSales(data.sales);
      } catch (err) {
        toast(err.message, "error");
      }
    }

    function renderStaffViewSales(sales) {
      const container = document.getElementById("staffview-sales-list");
      if (!sales.length) {
        container.innerHTML = '<p class="empty">Nothing yet — head to the <a href="#" id="staffview-empty-pos-link" style="color:var(--brand);font-weight:600;">sales terminal</a> to ring up your first sale today.</p>';
        document.getElementById("staffview-empty-pos-link").addEventListener("click", (e) => { e.preventDefault(); openPanel("new-sale"); });
        return;
      }
      container.innerHTML = sales.map((s) => `
        <div class="list-row">
          <div>
            <div class="name">${s.reference}</div>
            <div class="meta">${new Date(s.soldAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })} · ${cap(s.method)}</div>
          </div>
          <div style="text-align:right;">
            <div class="amount">${money(s.total)}</div>
            <div class="meta">${s.items} item${s.items === 1 ? "" : "s"}</div>
          </div>
        </div>
      `).join("");
    }

    document.getElementById("staffview-pos-btn").addEventListener("click", () => openPanel("new-sale"));

    /** Own compact copy matching the web app's shared "MyAttendanceCard" — reuses the same self clock-in/out endpoints already built for the Attendance panel. */
    async function refreshStaffViewAttendance() {
      const statusEl = document.getElementById("staffview-att-status");
      const btn = document.getElementById("staffview-clock-btn");
      const unavailableEl = document.getElementById("staffview-att-unavailable");
      statusEl.textContent = "Loading…";
      unavailableEl.classList.add("hidden");
      btn.classList.remove("hidden");
      btn.disabled = false;
      try {
        const status = await api("/attendance/today");
        const fmt = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
        if (status.clockedIn && status.clockedOut) {
          statusEl.textContent = `In ${fmt(status.clockIn)} · Out ${fmt(status.clockOut)}`;
          btn.textContent = "Done for today";
          btn.disabled = true;
          delete btn.dataset.action;
        } else if (status.clockedIn) {
          statusEl.textContent = `Clocked in at ${fmt(status.clockIn)}`;
          btn.textContent = "Clock out";
          btn.dataset.action = "out";
        } else {
          statusEl.textContent = "Not clocked in yet";
          btn.textContent = "Clock in";
          btn.dataset.action = "in";
        }
      } catch (err) {
        if (err.fields?.includes("employee")) {
          btn.classList.add("hidden");
          unavailableEl.classList.remove("hidden");
          statusEl.textContent = "";
        } else {
          statusEl.textContent = "Unavailable";
          toast(err.message, "error");
        }
      }
    }

    document.getElementById("staffview-clock-btn").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      const action = btn.dataset.action;
      if (!action) return;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const res = await api(`/attendance/clock-${action}`, { method: "POST" });
        toast(res.message, "success");
        refreshStaffViewAttendance();
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });

    /* ---------------- Settings ---------------- */
    async function loadSettingsPanel() {
      // Shared-device guard: if this fetch is still in flight when the user logs out
      // and someone else logs in, its (stale, wrong-account) response must never be
      // allowed to land — same SESSION_GEN pattern used by every other panel loader.
      const gen = SESSION_GEN;

      // Blank immediately rather than leaving whatever the last-loaded account's data
      // was on screen while this fetch is in flight — this view is one navigation away
      // from every other panel, so it can be reached again before its own refresh lands.
      document.getElementById("profile-avatar").textContent = "…";
      document.getElementById("profile-name").textContent = "Loading…";
      document.getElementById("profile-meta").textContent = "";
      document.getElementById("profile-hiredate").classList.add("hidden");
      document.getElementById("biz-readonly-card").classList.add("hidden");
      document.getElementById("biz-edit-card").classList.add("hidden");

      try {
        const me = await api("/me");
        if (gen !== SESSION_GEN) return;

        const initials = me.name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
        document.getElementById("profile-avatar").textContent = initials || "?";
        document.getElementById("profile-name").textContent = me.name;
        // Prefers the linked employee's job title over the raw account role, same precedence as the web app's profile page.
        document.getElementById("profile-meta").textContent = `${me.position || cap(me.role)} · ${me.branchName || "All branches"}`;
        const hireDateEl = document.getElementById("profile-hiredate");
        if (me.hireDate) {
          hireDateEl.textContent = `Member since ${new Date(me.hireDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;
          hireDateEl.classList.remove("hidden");
        } else {
          hireDateEl.classList.add("hidden");
        }
        document.getElementById("settings-name").value = me.name;
        document.getElementById("settings-phone").value = me.phone || "";
        document.getElementById("settings-email").value = me.email;
        document.getElementById("settings-biz-name").textContent = me.businessName || "—";
        document.getElementById("settings-currency").textContent = CURRENCY;

        // Admin/super get a real editable business form; manager and staff get the
        // read-only summary — the web app now shows business info to every role the
        // same way, just without edit access below admin.
        const isAdminUp = me.role === "super" || me.role === "admin";
        document.getElementById("biz-readonly-card").classList.toggle("hidden", isAdminUp);
        document.getElementById("biz-edit-card").classList.toggle("hidden", !isAdminUp);
        if (isAdminUp) loadBusinessSettings();
      } catch (err) {
        if (gen !== SESSION_GEN) return;
        toast(err.message, "error");
      }

      loadSubscriptionPanel();
      renderPrinterPanel();
      applyTheme(currentTheme());
    }

    /* ---------------- Appearance (light / dark) ----------------
     * Theme is a per-account preference, not a per-device one — this is a
     * shared POS terminal, and different staff log in and out of the same
     * browser all shift long. So the choice is saved to the signed-in user's
     * own account (PATCH /me/theme) and applied from server data (the /login
     * and /me responses' user.theme), never from localStorage — a
     * device-scoped value would leak one person's dark-mode choice into the
     * next different account that logs into this same phone or terminal.
     * The switch itself is still instant: every colour in this file is a CSS
     * custom property keyed off [data-theme], so setting the attribute here
     * is the whole visual change.
     */
    function currentTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }
    function applyTheme(mode) {
      if (mode === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      document.querySelectorAll("#theme-toggle [data-theme-choice]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.themeChoice === mode);
      });
    }
    async function chooseTheme(mode) {
      applyTheme(mode);
      try {
        await api("/me/theme", { method: "PATCH", body: JSON.stringify({ theme: mode }) });
      } catch (err) {
        toast(err.message, "error");
      }
    }
    document.querySelectorAll("#theme-toggle [data-theme-choice]").forEach((btn) => {
      btn.addEventListener("click", () => chooseTheme(btn.dataset.themeChoice));
    });
    applyTheme(currentTheme());

    document.getElementById("save-profile").addEventListener("click", async () => {
      const errorEl = document.getElementById("settings-error");
      errorEl.textContent = "";
      const btn = document.getElementById("save-profile");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        await api("/me", {
          method: "PATCH",
          body: JSON.stringify({
            name: document.getElementById("settings-name").value,
            phone: document.getElementById("settings-phone").value,
          }),
        });
        toast("Profile updated.", "success");
        loadSettingsPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Update Profile";
      }
    });

    /** Same field set and validation as the web app's /settings — admin/super only. */
    let BIZ_SETTINGS_LOADED = false;
    async function loadBusinessSettings() {
      const gen = SESSION_GEN;
      try {
        const biz = await api("/business-settings");
        if (gen !== SESSION_GEN) return;
        document.getElementById("biz-name").value = biz.name;
        document.getElementById("biz-tagline").value = biz.tagline;
        document.getElementById("biz-phone").value = biz.phone;
        document.getElementById("biz-address").value = biz.address;
        document.getElementById("biz-taxpin").value = biz.taxPin;
        if (!BIZ_SETTINGS_LOADED) {
          const select = document.getElementById("biz-currency");
          select.innerHTML = biz.currencies.map((c) => `<option value="${c.code}">${c.symbol} — ${c.name} (${c.code})</option>`).join("");
          BIZ_SETTINGS_LOADED = true;
        }
        document.getElementById("biz-currency").value = biz.currency;
      } catch (err) {
        toast(err.message, "error");
      }
    }

    document.getElementById("save-biz-settings").addEventListener("click", async () => {
      const errorEl = document.getElementById("biz-settings-error");
      errorEl.textContent = "";
      const btn = document.getElementById("save-biz-settings");
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const res = await api("/business-settings", {
          method: "PATCH",
          body: JSON.stringify({
            name: document.getElementById("biz-name").value,
            tagline: document.getElementById("biz-tagline").value,
            phone: document.getElementById("biz-phone").value,
            address: document.getElementById("biz-address").value,
            tax_pin: document.getElementById("biz-taxpin").value,
            currency: document.getElementById("biz-currency").value,
          }),
        });
        toast(res.message, "success");
        // Currency affects every money() call app-wide — update the global immediately rather than waiting for the next login, matching the web app's own "switches to this currency once saved" promise.
        CURRENCY = document.getElementById("biz-currency").value;
        loadSettingsPanel();
      } catch (err) {
        errorEl.textContent = err.message;
      } finally {
        btn.disabled = false;
        btn.textContent = "Save changes";
      }
    });

    /** Same package tier colours as the web app's marketing/checkout grid — kept distinct per module rather than the app's own accent tokens. */
    const MODULE_COLORS = {
      pos: "#2563eb", inventory: "#d97706", sales: "#059669", accounting: "#7c3aed",
      procurement: "#0891b2", customers: "#e11d48", hr: "#0d9488", attendance: "#4f46e5", payroll: "#65a30d",
    };

    /** Read-only for every role here — changing plan is a web-app-only flow (its own /subscribe checkout), not ported to the phone. */
    async function loadSubscriptionPanel() {
      const el = document.getElementById("subscription-body");
      el.innerHTML = '<div class="loading-row"><div class="spinner"></div> Loading…</div>';
      try {
        const data = await api("/subscription");
        renderSubscription(data);
      } catch (err) {
        el.innerHTML = `<p class="error">${err.message}</p>`;
      }
    }

    function subscriptionUsageBar(label, used, max) {
      const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
      return `
        <div style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;">
            <span style="color:var(--muted);">${label}</span>
            <span style="font-weight:600;">${used} ${max !== null ? `of ${max}` : "(unlimited)"}</span>
          </div>
          ${max !== null ? `<div class="rank-bar-track" style="margin-top:5px;"><div class="rank-bar-fill" style="width:${Math.max(pct, used > 0 ? 3 : 0)}%;${pct >= 100 ? "background:var(--danger);" : ""}"></div></div>` : ""}
        </div>
      `;
    }

    function renderSubscription(data) {
      const statusClass = data.status === "active" ? "pill-ok" : data.status === "pending" ? "pill-warn" : "pill-danger";
      const priceText = data.isCustomPricing ? "Custom pricing" : `${money(data.price)}${data.billingPeriod === "annual" ? "/yr" : "/mo"}`;
      const modulesHtml = data.modules.length
        ? data.modules.map((m) => `<span class="pill" style="background:${(MODULE_COLORS[m.key] || "#64748b")}1f;color:${MODULE_COLORS[m.key] || "#64748b"};">${m.label}</span>`).join(" ")
        : '<span class="tagline" style="margin:0;text-align:left;">No modules active.</span>';
      const dates = data.subscriptionStart || data.subscriptionEnd
        ? `<p class="tagline" style="margin:6px 0 0;text-align:left;">${data.subscriptionStart ? `Started ${data.subscriptionStart}` : ""}${data.subscriptionStart && data.subscriptionEnd ? " · " : ""}${data.subscriptionEnd ? `Renews ${data.subscriptionEnd}` : ""}</p>`
        : "";

      document.getElementById("subscription-body").innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <p style="font-size:1.05rem;font-weight:800;margin:0;">${data.planLabel ? `${data.planLabel} plan` : "Custom (à la carte modules)"}</p>
          <span class="pill ${statusClass}" style="text-transform:capitalize;">${data.status}</span>
        </div>
        <p style="margin:4px 0 0;color:var(--muted);font-size:0.9rem;">${priceText}</p>
        ${data.planTagline ? `<p class="tagline" style="margin:2px 0 0;text-align:left;">${data.planTagline}</p>` : ""}
        ${dates}
        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">${modulesHtml}</div>
        <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
          <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin:0;">Usage</p>
          ${subscriptionUsageBar("Users", data.usage.userCount, data.usage.maxUsers)}
          ${subscriptionUsageBar("Branches", data.usage.branchCount, data.usage.maxBranches)}
          ${!data.planKey ? `<p class="tagline" style="margin-top:10px;text-align:left;">No package selected — usage isn't capped, and you're billed per module active above.</p>` : ""}
        </div>
      `;
    }

    /* ---------------- Receipt printer (Web Bluetooth + ESC/POS) ----------------
     * Same transport and command-builder logic as the web app's
     * lib/printing/{bluetooth-printer,escpos}.ts, ported to vanilla JS since this
     * file has no bundler/React runtime — a global PRINTER object stands in for that
     * module's exported class instance, held for the life of the page like the web
     * app's PrinterProvider holds it for the life of the session. Web Bluetooth only
     * works in Chrome/Edge (desktop and Android) over HTTPS or localhost — never
     * Safari/Firefox, so `supported` gates the whole panel exactly like there.
     */
    const PRINTER_KNOWN_SERVICES = [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      "0000ff00-0000-1000-8000-00805f9b34fb",
      "0000ffe0-0000-1000-8000-00805f9b34fb",
    ];
    const PRINTER_CHUNK_SIZE = 180;
    const PRINTER_CHUNK_DELAY_MS = 20;

    const PRINTER = { status: "disconnected", device: null, characteristic: null, name: null, error: null, testing: false };

    function printerSupported() {
      return typeof navigator !== "undefined" && "bluetooth" in navigator;
    }

    async function printerFindWritableCharacteristic(server) {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        const writable = characteristics.find((c) => c.properties.write || c.properties.writeWithoutResponse);
        if (writable) return writable;
      }
      throw new Error("This device doesn't expose a printable Bluetooth service.");
    }

    const printerSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function printerWrite(data) {
      const withResponse = PRINTER.characteristic.properties.write;
      for (let offset = 0; offset < data.length; offset += PRINTER_CHUNK_SIZE) {
        const chunk = new Uint8Array(data.subarray(offset, offset + PRINTER_CHUNK_SIZE));
        if (withResponse) {
          await PRINTER.characteristic.writeValueWithResponse(chunk);
        } else {
          await PRINTER.characteristic.writeValueWithoutResponse(chunk);
        }
        if (offset + PRINTER_CHUNK_SIZE < data.length) await printerSleep(PRINTER_CHUNK_DELAY_MS);
      }
    }

    async function connectPrinter() {
      if (!navigator.bluetooth) {
        PRINTER.error = "This browser doesn't support Web Bluetooth. Try Chrome or Edge.";
        renderPrinterPanel();
        return;
      }
      PRINTER.error = null;
      PRINTER.status = "connecting";
      renderPrinterPanel();
      try {
        const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: PRINTER_KNOWN_SERVICES });
        if (!device.gatt) throw new Error("This device doesn't support GATT connections.");
        const server = await device.gatt.connect();
        const characteristic = await printerFindWritableCharacteristic(server);
        device.addEventListener("gattserverdisconnected", () => {
          PRINTER.status = "disconnected";
          PRINTER.device = null;
          PRINTER.characteristic = null;
          PRINTER.name = null;
          renderPrinterPanel();
        });
        PRINTER.device = device;
        PRINTER.characteristic = characteristic;
        PRINTER.name = device.name || "Unnamed printer";
        PRINTER.status = "connected";
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not connect to the printer.";
        if (!/cancelled|user gesture/i.test(message)) PRINTER.error = message;
        PRINTER.status = "disconnected";
      }
      renderPrinterPanel();
    }

    function disconnectPrinter() {
      PRINTER.device?.gatt?.disconnect();
      PRINTER.status = "disconnected";
      PRINTER.device = null;
      PRINTER.characteristic = null;
      PRINTER.name = null;
      renderPrinterPanel();
    }

    /** Minimal ESC/POS byte builder — same commands and 32-column layout as the web app's buildReceipt(), just for a test slip here rather than a real receipt. */
    function buildTestReceipt() {
      const ESC = 0x1b, GS = 0x1d;
      const WIDTH = 32;
      const out = [];
      const raw = (...cmd) => out.push(...cmd);
      const push = (s) => out.push(...Array.from(new TextEncoder().encode(s)));
      const line = (s) => push((s || "") + "\n");
      const center = (s) => { const pad = Math.max(0, Math.floor((WIDTH - s.length) / 2)); return " ".repeat(pad) + s; };

      raw(ESC, 0x40); // init
      raw(ESC, 0x61, 0x01, GS, 0x21, 0x11); // align center, double size
      line("Dashflow POS");
      raw(GS, 0x21, 0x00); // double off
      line("Test receipt");
      line("-".repeat(WIDTH));
      raw(ESC, 0x61, 0x00); // align left
      line("Ref:      TEST-0001");
      line("Date:     " + new Date().toLocaleString());
      line("Cashier:  Settings");
      line("-".repeat(WIDTH));
      line("Sample item");
      line("  1 x USh 100          USh 100");
      line("Second item");
      line("  2 x USh 250          USh 500");
      line("-".repeat(WIDTH));
      raw(ESC, 0x45, 0x01); // bold on
      line("TOTAL              USh 600");
      raw(ESC, 0x45, 0x00); // bold off
      line();
      raw(ESC, 0x61, 0x01);
      line("Printer connected successfully");
      line();
      line();
      line();
      raw(ESC, 0x64, 3, GS, 0x56, 0x00); // feed + cut
      return new Uint8Array(out);
    }

    async function testPrintReceipt() {
      if (!PRINTER.characteristic) return;
      PRINTER.testing = true;
      renderPrinterPanel();
      try {
        await printerWrite(buildTestReceipt());
        toast("Test receipt sent to the printer.", "success");
      } catch (err) {
        toast(err.message || "Could not print.", "error");
      } finally {
        PRINTER.testing = false;
        renderPrinterPanel();
      }
    }

    function renderPrinterPanel() {
      const el = document.getElementById("printer-body");
      if (!el) return;

      if (!printerSupported()) {
        el.innerHTML = `<p class="tagline" style="text-align:left;margin:0;">Bluetooth printing isn't supported in this browser. Use Chrome or Edge on desktop or Android to connect a printer.</p>`;
        return;
      }

      const connected = PRINTER.status === "connected";
      const iconBg = connected ? "background:var(--success-bg);color:var(--success);" : "background:var(--panel-2);color:var(--muted);";
      const statusText = connected ? PRINTER.name : PRINTER.status === "connecting" ? "Connecting…" : "No printer connected";
      const subText = connected ? "Ready to print receipts over Bluetooth." : "Pair a Bluetooth thermal receipt printer to print straight from the till.";

      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="width:40px;height:40px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;${iconBg}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M6.5 6.5 17.5 17.5M6.5 17.5 17.5 6.5M12 2v6.5M12 15.5V22"/></svg>
          </span>
          <div style="min-width:0;flex:1;">
            <p style="font-size:0.9rem;font-weight:600;margin:0;">${statusText}</p>
            <p class="tagline" style="margin:2px 0 0;text-align:left;">${subText}</p>
            ${PRINTER.error ? `<p class="error" style="margin-top:4px;">${PRINTER.error}</p>` : ""}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          ${connected
            ? `<button type="button" class="btn-secondary" id="printer-test-btn" style="flex:1;" ${PRINTER.testing ? "disabled" : ""}>${PRINTER.testing ? "Printing…" : "Print test receipt"}</button>
               <button type="button" class="btn-secondary" id="printer-disconnect-btn" style="flex:1;">Disconnect</button>`
            : `<button type="button" class="btn-primary" id="printer-connect-btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px;" ${PRINTER.status === "connecting" ? "disabled" : ""}>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M6.5 6.5 17.5 17.5M6.5 17.5 17.5 6.5M12 2v6.5M12 15.5V22"/></svg>
                 Connect Bluetooth printer
               </button>`}
        </div>
      `;

      document.getElementById("printer-connect-btn")?.addEventListener("click", connectPrinter);
      document.getElementById("printer-disconnect-btn")?.addEventListener("click", disconnectPrinter);
      document.getElementById("printer-test-btn")?.addEventListener("click", testPrintReceipt);
    }

    /* ---------------- Install prompt (Android/Chrome) ---------------- */
    let deferredPrompt;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      document.getElementById("install-btn").classList.remove("hidden");
      document.getElementById("install-hint").classList.add("hidden");
    });
    document.getElementById("install-btn").addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      document.getElementById("install-btn").classList.add("hidden");
    });

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
    }

    tryResumeSession();
  </script>
</body>
</html>
