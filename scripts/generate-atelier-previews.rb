#!/usr/bin/env ruby
# frozen_string_literal: true

# DEPRECATED — no forma parte del workflow de skills Atelier (Markdown-only).
# Las IAs implementan desde templates/**/*.md + PROTOCOL.md.
# Mantenido solo como utilidad humana opcional; no ejecutar desde skills ni dt-doctor.
#
# Genera previews HTML: homepage (marketing), pitch scroll (presentación), dashboard (app).
# Uso legacy: ruby scripts/generate-atelier-previews.rb

require "yaml"

ROOT = File.expand_path("..", __dir__)
REGISTRY = File.join(ROOT, "vitals/data/design/template-registry.yaml")
PLACEHOLDERS = File.join(ROOT, "vitals/data/design/template-placeholders.yaml")
PREVIEW_DIR = File.join(ROOT, ".cursor/skills/design/templates/preview/pages")

ph = YAML.load_file(PLACEHOLDERS)
registry = YAML.load_file(REGISTRY)
DASH = ph.fetch("dashboard", {})
DASH_LABEL = ph["dashboard_title"] || "Tu panel de control"
PITCH = ph.fetch("pitch", {})

SYSTEMS = {
  "material-design" => {
    label: "Material Design 3 Expressive",
    font_link: '<link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,400;8..144,500;8..144,600;8..144,700;8..144,800&display=swap" rel="stylesheet">',
    home_body: "m3-expressive",
    home_extra_css: "../shared/material-expressive.css",
    home_override: nil,
    tpl_body: nil
  },
  "apple-hig" => {
    label: "Apple HIG",
    font_link: "",
    home_body: "tpl apple-home",
    home_extra_css: "../shared/surfaces.css",
    home_override: "../shared/overrides/apple-hig-home.css",
    tpl_body: "tpl"
  },
  "fluent-design" => {
    label: "Fluent Design 2",
    font_link: "",
    home_body: "tpl fluent-home",
    home_extra_css: "../shared/surfaces.css",
    home_override: "../shared/overrides/fluent-design.css",
    tpl_body: "tpl"
  },
  "carbon-design" => {
    label: "IBM Carbon",
    font_link: '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">',
    home_body: "tpl carbon-home",
    home_extra_css: "../shared/surfaces.css",
    home_override: "../shared/overrides/carbon-design-home.css",
    tpl_body: "tpl"
  },
  "polaris-design" => {
    label: "Shopify Polaris",
    font_link: "",
    home_body: "tpl polaris-home",
    home_extra_css: "../shared/surfaces.css",
    home_override: "../shared/overrides/polaris-design-home.css",
    tpl_body: "tpl"
  },
  "atlassian-design" => {
    label: "Atlassian Design System",
    font_link: "",
    home_body: "tpl atl-home",
    home_extra_css: "../shared/surfaces.css",
    home_override: "../shared/overrides/atlassian-design.css",
    tpl_body: "tpl"
  }
}.freeze

# Paletas curadas por sistema. accent_dark = acento de alta luminancia para fondos oscuros
# (hero/nav) — evita el dark-on-dark y mantiene contraste AA. ink siempre tintado, nunca #000.
DOC_BRAND = {
  "material-design" => { ink: "#0f1419", paper: "#fbfcff", accent: "#005db8", accent_dark: "#9fc6ff", accent_soft: "#d6e6ff", highlight: "#ffd95e", gray: "#44474e", line: "#c9ccd4", radius: "18px", on_accent: "#ffffff", display: '"Roboto Flex", system-ui, sans-serif', body: '"Roboto Flex", system-ui, sans-serif' },
  "apple-hig" => { ink: "#1a1a1c", paper: "#f5f5f7", accent: "#0071e3", accent_dark: "#2997ff", accent_soft: "#e9f3fe", highlight: "#6cb6ff", gray: "#6e6e73", line: "#d2d2d7", radius: "18px", on_accent: "#ffffff", display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' },
  "fluent-design" => { ink: "#1b1a19", paper: "#faf9f8", accent: "#0067c0", accent_dark: "#4ca3e8", accent_soft: "#eaf3fc", highlight: "#7cc4ff", gray: "#605e5c", line: "#e1dfdd", radius: "8px", on_accent: "#ffffff", display: '"Segoe UI Variable", "Segoe UI", sans-serif', body: '"Segoe UI Variable", "Segoe UI", sans-serif' },
  "carbon-design" => { ink: "#0d0d0d", paper: "#f4f4f4", accent: "#0f62fe", accent_dark: "#78a9ff", accent_soft: "#e8f0ff", highlight: "#f1c21b", gray: "#525252", line: "#dcdcdc", radius: "0", on_accent: "#ffffff", display: '"IBM Plex Sans", system-ui, sans-serif', body: '"IBM Plex Sans", system-ui, sans-serif' },
  "polaris-design" => { ink: "#15201b", paper: "#f1f1f1", accent: "#008060", accent_dark: "#4bbf94", accent_soft: "#e3f1df", highlight: "#7ad6ad", gray: "#5c5f62", line: "#e1e3e5", radius: "12px", on_accent: "#ffffff", display: "Inter, system-ui, sans-serif", body: "Inter, system-ui, sans-serif" },
  "atlassian-design" => { ink: "#0e1b32", paper: "#f7f8f9", accent: "#0052cc", accent_dark: "#85b8ff", accent_soft: "#e3edff", highlight: "#ffc44d", gray: "#5e6c84", line: "#dfe1e6", radius: "8px", on_accent: "#ffffff", display: '"Charlie Display", "Segoe UI", sans-serif', body: '"Charlie Text", "Segoe UI", sans-serif' }
}.freeze

def doc_brand_css(system_id)
  b = DOC_BRAND[system_id]
  <<~CSS
    :root {
      --doc-ink: #{b[:ink]}; --doc-paper: #{b[:paper]}; --doc-accent: #{b[:accent]};
      --doc-accent-dark: #{b[:accent_dark]}; --doc-accent-soft: #{b[:accent_soft]};
      --doc-highlight: #{b[:highlight]}; --doc-gray: #{b[:gray]};
      --doc-line: #{b[:line]}; --doc-radius: #{b[:radius]}; --doc-on-accent: #{b[:on_accent]};
      --doc-font-display: #{b[:display]}; --doc-font-body: #{b[:body]}; --doc-max-width: 1080px;
    }
  CSS
end

def tpl_aliases(system_id)
  {
    "material-design" => "--tpl-font:var(--ds-font);--tpl-bg:var(--ds-surface);--tpl-surface:var(--ds-surface-container);--tpl-surface-alt:var(--ds-surface-container-low);--tpl-text:var(--ds-on-surface);--tpl-text-muted:var(--ds-on-surface-variant);--tpl-primary:var(--ds-primary);--tpl-on-primary:var(--ds-on-primary);--tpl-primary-subtle:var(--ds-primary-container);--tpl-border:var(--ds-outline-variant);--tpl-radius-sm:var(--ds-radius-sm);--tpl-radius-md:var(--ds-radius-md);--tpl-radius-lg:var(--ds-radius-lg);--tpl-radius-btn:999px;",
    "apple-hig" => "--tpl-font:var(--ds-font);--tpl-bg:var(--ds-surface);--tpl-surface:var(--ds-surface-secondary);--tpl-surface-alt:var(--ds-grouped-bg);--tpl-text:var(--ds-label);--tpl-text-muted:var(--ds-label-secondary);--tpl-primary:var(--ds-primary);--tpl-on-primary:var(--ds-on-primary);--tpl-border:var(--ds-separator);--tpl-radius-sm:var(--ds-radius-sm);--tpl-radius-md:var(--ds-radius-md);--tpl-radius-lg:var(--ds-radius-lg);--tpl-radius-xl:var(--ds-radius-xl);",
    "fluent-design" => "--tpl-font:var(--ds-font);--tpl-bg:var(--ds-surface);--tpl-surface:var(--ds-surface-card);--tpl-surface-alt:var(--ds-surface-secondary);--tpl-text:var(--ds-text-primary);--tpl-text-muted:var(--ds-text-secondary);--tpl-primary:var(--ds-primary);--tpl-on-primary:var(--ds-on-primary);--tpl-border:var(--ds-stroke);--tpl-radius-sm:var(--ds-radius-sm);--tpl-radius-md:var(--ds-radius-md);--tpl-nav-bg:var(--ds-acrylic);--tpl-shadow-card:var(--ds-shadow-2);",
    "carbon-design" => "--tpl-font:var(--ds-font);--tpl-bg:var(--ds-background);--tpl-surface:var(--ds-layer-02);--tpl-surface-alt:var(--ds-layer-01);--tpl-text:var(--ds-text-primary);--tpl-text-muted:var(--ds-text-secondary);--tpl-primary:var(--ds-interactive);--tpl-on-primary:var(--ds-text-on-color);--tpl-border:var(--ds-border-subtle);--tpl-radius-sm:0;--tpl-radius-md:0;--tpl-radius-lg:0;--tpl-success:var(--ds-support-success);",
    "polaris-design" => "--tpl-font:var(--ds-font);--tpl-bg:var(--ds-surface);--tpl-surface:var(--ds-surface-card);--tpl-text:var(--ds-text);--tpl-text-muted:var(--ds-text-secondary);--tpl-primary:var(--ds-primary);--tpl-on-primary:var(--ds-on-primary);--tpl-border:var(--ds-border);--tpl-radius-sm:var(--ds-radius-sm);--tpl-radius-md:var(--ds-radius-md);--tpl-nav-bg:var(--ds-surface-nav);--tpl-sidebar-bg:var(--ds-surface-nav);",
    "atlassian-design" => "--tpl-font:var(--ds-font);--tpl-bg:var(--ds-surface-sunken);--tpl-surface:var(--ds-surface);--tpl-surface-alt:var(--ds-surface-sunken);--tpl-text:var(--ds-text);--tpl-text-muted:var(--ds-text-subtle);--tpl-primary:var(--ds-primary);--tpl-on-primary:var(--ds-on-primary);--tpl-primary-subtle:var(--ds-primary-subtle);--tpl-border:var(--ds-border);--tpl-radius-sm:var(--ds-radius-sm);--tpl-success:var(--ds-success);"
  }.fetch(system_id) { raise "unknown system #{system_id}" }
end

def chrome(label, system_id)
  sys = SYSTEMS[system_id]
  "<div class=\"preview-bar\"><a href=\"../index.html\">← Galería</a><span>#{label}</span><span class=\"badge\">#{sys[:label]}</span></div>"
end

def head_homepage(system_id, title)
  sys = SYSTEMS[system_id]
  override = sys[:home_override] ? "<link rel=\"stylesheet\" href=\"#{sys[:home_override]}\">" : ""
  tpl_style = sys[:tpl_body] ? "<style>:root { #{tpl_aliases(system_id)} }</style>" : ""
  <<~HTML
    <!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>#{title} · #{sys[:label]}</title>
      #{sys[:font_link]}
      <link rel="stylesheet" href="../shared/chrome.css">
      <link rel="stylesheet" href="../../systems/#{system_id}/tokens.css">
      <link rel="stylesheet" href="#{sys[:home_extra_css]}">
      #{override}#{tpl_style}
    </head>
  HTML
end

def head_pitch(system_id, title)
  sys = SYSTEMS[system_id]
  <<~HTML
    <!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>#{title} · #{sys[:label]}</title>
      #{sys[:font_link]}
      <link rel="stylesheet" href="../shared/chrome.css">
      <link rel="stylesheet" href="../../systems/#{system_id}/tokens.css">
      <link rel="stylesheet" href="../../shared/document-experience.css">
      <link rel="stylesheet" href="../shared/overrides/#{system_id}.css">
      <style>#{doc_brand_css(system_id)}</style>
    </head>
  HTML
end

def head_dashboard(system_id, title)
  sys = SYSTEMS[system_id]
  if system_id == "material-design"
    return <<~HTML
      <!DOCTYPE html><html lang="es"><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>#{title} · #{sys[:label]}</title>
        #{sys[:font_link]}
        <link rel="stylesheet" href="../shared/chrome.css">
        <link rel="stylesheet" href="../../systems/#{system_id}/tokens.css">
        <link rel="stylesheet" href="../shared/material-expressive.css">
      </head>
    HTML
  end
  <<~HTML
    <!DOCTYPE html><html lang="es"><head>
      <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>#{title} · #{sys[:label]}</title>
      #{sys[:font_link]}
      <link rel="stylesheet" href="../shared/chrome.css">
      <link rel="stylesheet" href="../../systems/#{system_id}/tokens.css">
      <link rel="stylesheet" href="../shared/surfaces.css">
      <style>:root { #{tpl_aliases(system_id)} }</style>
    </head>
  HTML
end

# ——— HOMEPAGE: marketing producto + servicio (NO propuesta scroll) ———

def homepage_material(ph)
  feats = ph["features"] || []
  metrics = ph["metrics"] || []
  nav = ph["nav"] || {}
  head_homepage("material-design", "Homepage producto y servicio") +
    "<body class=\"m3-expressive\">#{chrome('Material 3 Expressive · Homepage', 'material-design')}" +
    <<~HTML
      <header class="m3-top-bar">
        <div class="logo">#{ph['brand']}</div>
        <nav>
          <a class="m3-nav-chip active" href="#">#{nav['product']}</a>
          <a class="m3-nav-chip" href="#">#{nav['service']}</a>
          <a class="m3-nav-chip" href="#">#{nav['pricing']}</a>
        </nav>
        <button class="m3-filled-button">#{ph['cta_primary']}</button>
      </header>
      <section class="m3-hero">
        <div>
          <div class="m3-hero-badge">#{ph['product']} · #{ph['service']}</div>
          <h1>#{ph['headline']}</h1>
          <p class="lead">#{ph['subhead']}</p>
          <div class="m3-hero-actions">
            <button class="m3-filled-button">#{ph['cta_primary']}</button>
            <button class="m3-tonal-button">#{ph['cta_secondary']}</button>
          </div>
          <div class="m3-duo">
            <div class="m3-duo-card accent"><h3>#{ph['product']}</h3><p>Self-serve desde el día uno.</p></div>
            <div class="m3-duo-card"><h3>#{ph['service']}</h3><p>Acompañamiento humano cuando lo necesitás.</p></div>
          </div>
        </div>
        <div class="m3-hero-visual"><strong>Vista #{ph['product']}</strong>Reemplazá con screenshot real</div>
      </section>
      <section class="m3-section">
        <div class="m3-section-head"><h2>#{ph['tagline']}</h2></div>
        <div class="m3-feature-grid">#{feats.map { |f| "<div class=\"m3-feature\"><h3>#{f['title']}</h3><p>#{f['body']}</p></div>" }.join}</div>
      </section>
      <section class="m3-metrics">#{metrics.map { |m| "<div class=\"m3-metric\"><strong>#{m['value']}</strong><span>#{m['label']}</span></div>" }.join}</section>
      <section class="m3-cta"><h2>Empezá con #{ph['brand']}</h2><button class="m3-filled-button">#{ph['cta_primary']}</button></section>
      <button class="m3-fab" aria-label="Acción">+</button>
    </body></html>
    HTML
end

def homepage_tpl(system_id, ph, layout: :split)
  feats = ph["features"] || []
  metrics = ph["metrics"] || []
  nav = ph["nav"] || {}
  sys = SYSTEMS[system_id]
  hero_inner = if layout == :centered
    <<~HERO
      <div class="tpl-hero-grid">
        <div>
          <span class="tag">#{ph['product']} · #{ph['service']}</span>
          <h1>#{ph['headline']}</h1>
          <p class="lead">#{ph['subhead']}</p>
          <div class="tpl-hero-actions">
            <button class="tpl-btn-primary">#{ph['cta_primary']}</button>
            <button class="tpl-btn-secondary">#{ph['cta_tertiary']}</button>
          </div>
        </div>
        <div class="tpl-hero-visual">Vista previa · #{ph['product']}<br><small>Mockup o screenshot</small></div>
      </div>
    HERO
  else
    <<~HERO
      <div class="tpl-hero-grid">
        <div>
          <span class="tag">#{ph['brand']}</span>
          <h1>#{ph['headline']}</h1>
          <p class="lead">#{ph['subhead']}</p>
          <div class="tpl-hero-actions">
            <button class="tpl-btn-primary">#{ph['cta_primary']}</button>
            <button class="tpl-btn-secondary">#{ph['cta_secondary']}</button>
          </div>
          <div class="tpl-dual">
            <div class="pill"><strong>#{ph['product']}</strong>Automatizá lo repetitivo.</div>
            <div class="pill"><strong>#{ph['service']}</strong>Expertos cuando importa.</div>
          </div>
        </div>
        <div class="tpl-hero-visual">#{ph['product']} + #{ph['service']}</div>
      </div>
    HERO
  end

  head_homepage(system_id, "Homepage producto y servicio") +
    "<body class=\"#{sys[:home_body]}\">#{chrome("#{sys[:label]} · Homepage", system_id)}" +
    <<~HTML
      <header class="tpl-nav">
        <div class="brand">#{ph['brand']}</div>
        <div class="links">
          <a href="#">#{nav['product']}</a><a href="#">#{nav['service']}</a>
          <a href="#">#{nav['pricing']}</a><a href="#">#{nav['login']}</a>
        </div>
        <a href="#" class="tpl-btn-primary">#{ph['cta_primary']}</a>
      </header>
      <section class="tpl-hero">#{hero_inner}</section>
      <section class="tpl-features">
        <h2>Por qué #{ph['brand']}</h2><p class="sub">#{ph['tagline']}</p>
        <div class="tpl-feature-grid">
#{feats.map { |f| "          <div class=\"tpl-feature-card\"><h3>#{f['title']}</h3><p>#{f['body']}</p></div>" }.join("\n")}
        </div>
      </section>
      <section class="tpl-metrics"><div class="tpl-metrics-grid">#{metrics.map { |m| "<div class=\"tpl-metric\"><strong>#{m['value']}</strong><span>#{m['label']}</span></div>" }.join}</div></section>
      <section class="tpl-cta-band"><h2>Empezá hoy</h2><p>#{ph['tagline']}</p><button class="tpl-btn-primary">#{ph['cta_primary']}</button></section>
      <footer class="tpl-footer"><span>© #{ph['brand']}</span><span>#{nav['about']} · #{nav['contact']}</span></footer>
    </body></html>
    HTML
end

def build_homepage(system_id, ph)
  case system_id
  when "material-design" then homepage_material(ph)
  when "apple-hig" then homepage_tpl(system_id, ph, layout: :centered)
  else homepage_tpl(system_id, ph, layout: :split)
  end
end

# ——— PITCH: documento scroll con layouts variados ———

def pitch_nav(ph)
  <<~HTML
    <nav class="doc-nav"><div class="doc-wrap">
      <a class="doc-logo" href="#">#{ph['brand']}</a>
      <div class="doc-nav-links">
        <a href="#problema">Problema</a><a href="#solucion">Solución</a>
        <a href="#mercado">Mercado</a><a href="#traccion">Tracción</a>
        <a href="#roadmap">Roadmap</a><a href="#ask">The ask</a>
      </div>
      <a class="doc-nav-cta" href="#">#{ph['cta_secondary']}</a>
    </div></nav>
  HTML
end

def pitch_footer(ph)
  "<footer class=\"doc-footer\"><div class=\"doc-wrap\"><div><h4>#{ph['brand']}</h4><p>#{PITCH['hook']}</p></div><div class=\"doc-foot-legal\">Pitch placeholder · #{ph['presentation']} · Reemplazá antes de presentar</div></div></footer>"
end

def build_pitch(system_id, ph)
  pitch = PITCH
  metrics = ph["metrics"] || []
  team = pitch["team"] || []
  roadmap = pitch["roadmap"] || []
  ask_use = pitch["ask_use"] || []

  head_pitch(system_id, "Pitch / reporte") +
    "<body class=\"doc\">#{chrome("#{SYSTEMS[system_id][:label]} · Pitch", system_id)}#{pitch_nav(ph)}" +
    <<~HTML
      <header class="doc-hero"><div class="doc-wrap">
        <span class="doc-kicker">#{pitch['kicker']}</span>
        <h1>#{ph['brand']} — <em>#{pitch['hook']}</em></h1>
        <p class="doc-hero-sub">#{ph['subhead']}</p>
        <div class="doc-hero-meta">
          <div><strong>#{ph['product']}</strong>Core del negocio</div>
          <div><strong>#{ph['service']}</strong>Retención y expansión</div>
          <div><strong>Stage</strong>Semilla · Pre-revenue OK</div>
        </div>
      </div></header>

      <section class="doc-section" id="problema"><div class="doc-wrap">
        <div class="doc-sec-label">01 — #{pitch['problem_title']}</div>
        <div class="doc-split">
          <div>
            <h3>#{pitch['problem_title']}</h3>
            <p>#{pitch['problem']}</p>
            <div class="doc-recap"><strong>Oportunidad:</strong> #{pitch['opportunity']}</div>
          </div>
          <div class="doc-stat-stack">
            <div class="doc-stat-box"><strong>72%</strong><span>Placeholder — dolor medible en tu ICP</span></div>
            <div class="doc-stat-box"><strong>3.2×</strong><span>Costo de no actuar vs. tu solución</span></div>
          </div>
        </div>
      </div></section>

      <section class="doc-section alt" id="solucion"><div class="doc-wrap">
        <div class="doc-sec-label">02 — #{pitch['solution_title']}</div>
        <h2 class="doc-sec-title">#{ph['product']} + #{ph['service']}</h2>
        <p class="doc-lead">#{pitch['solution']}</p>
        <div class="doc-visual-full"><strong>#{pitch['product_demo_label']}</strong><br>#{pitch['product_demo']}</div>
      </div></section>

      <section class="doc-section" id="mercado"><div class="doc-wrap">
        <div class="doc-sec-label">03 — Mercado y modelo</div>
        <div class="doc-table-side">
          <table class="doc-table">
            <thead><tr><th>Dimensión</th><th>Placeholder</th></tr></thead>
            <tbody>
              <tr><td>#{pitch['market_label']}</td><td>#{pitch['market']}</td></tr>
              <tr><td>#{pitch['model_label']}</td><td>#{pitch['model']}</td></tr>
              <tr><td>ICP</td><td>Equipos B2B que combinan #{ph['product']} y #{ph['service']}</td></tr>
            </tbody>
          </table>
          <div class="doc-side-card"><h4>Ventaja</h4><p>Integración producto-servicio en un solo funnel — difícil de copiar con herramientas sueltas.</p></div>
        </div>
      </div></section>

      <section class="doc-section alt" id="traccion"><div class="doc-wrap">
        <div class="doc-sec-label">04 — #{pitch['traction_title']}</div>
        <h2 class="doc-sec-title">#{pitch['traction_summary']}</h2>
        <div class="doc-kpi-row">#{metrics.map { |m| "<div class=\"doc-kpi\"><div class=\"label\">#{m['label']}</div><div class=\"value\">#{m['value']}</div></div>" }.join}</div>
        <blockquote class="doc-quote">"#{pitch['quote']}"<cite>— #{pitch['quote_author']}</cite></blockquote>
      </div></section>

      <section class="doc-section" id="roadmap"><div class="doc-wrap">
        <div class="doc-sec-label">05 — Roadmap</div>
        <h2 class="doc-sec-title">Próximos 12 meses</h2>
        <div class="doc-timeline">#{roadmap.map.with_index { |q, i| "<div class=\"doc-phase\"><div class=\"ph-num\">#{i + 1}</div><h3>#{q['quarter']} · #{q['focus']}</h3><span class=\"dur\">Trimestre</span><ul><li>#{q['items']}</li></ul></div>" }.join}</div>
      </div></section>

      <section class="doc-section alt" id="equipo"><div class="doc-wrap">
        <div class="doc-sec-label">06 — #{pitch['team_title']}</div>
        <div class="doc-team">#{team.map { |m| initials = m['name'].split.map { |w| w[0] }.join[0, 2]; "<div class=\"doc-team-member\"><div class=\"doc-avatar\">#{initials}</div><h4>#{m['name']}</h4><p>#{m['role']}</p></div>" }.join}</div>
      </div></section>

      <section class="doc-section" id="ask"><div class="doc-wrap">
        <div class="doc-sec-label">07 — #{pitch['ask_title']}</div>
        <div class="doc-ask-split">
          <div class="doc-ask-main"><h3>#{pitch['ask_title']}</h3><div class="amount">#{pitch['ask_amount']}</div><p style="margin-top:16px;opacity:.85">Para escalar #{ph['product']} y #{ph['service']}.</p></div>
          <div class="doc-ask-list"><h4>Uso de fondos</h4><ul>#{ask_use.map { |u| "<li>#{u}</li>" }.join}</ul></div>
        </div>
        <div class="doc-cta-final" style="margin-top:48px"><h3>¿Seguimos la conversación?</h3><a class="doc-btn" href="#">#{ph['cta_secondary']}</a></div>
      </div></section>

      #{pitch_footer(ph)}
    </body></html>
    HTML
end

# ——— DASHBOARD: app SaaS (NO propuesta) ———

def dashboard_material(ph)
  dash = DASH
  metrics = ph["metrics"] || []
  bars = [38, 62, 48, 78, 55, 88, 44].each_with_index.map { |h, i| "<div class=\"m3-chart-bar#{i.even? ? '' : ' accent'}\" style=\"height:#{h}%\"></div>" }.join
  head_dashboard("material-design", "Dashboard SaaS") +
    "<body class=\"m3-expressive\">#{chrome('Material 3 Expressive · Dashboard', 'material-design')}" +
    <<~HTML
      <div class="m3-dash">
        <aside class="m3-rail">
          <div class="m3-rail-item active"><span class="m3-rail-icon">◉</span>#{dash['section_overview']}</div>
          <div class="m3-rail-item"><span class="m3-rail-icon">▣</span>#{dash['section_reports']}</div>
          <div class="m3-rail-item"><span class="m3-rail-icon">◎</span>#{ph['product']}</div>
          <div class="m3-rail-item"><span class="m3-rail-icon">⚙</span>#{dash['section_settings']}</div>
        </aside>
        <div class="m3-dash-main">
          <div class="m3-dash-top"><h1>#{dash['welcome']}</h1><input class="m3-search" type="search" aria-label="Buscar" placeholder="Buscar…"><button class="m3-tonal-button">#{ph['cta_secondary']}</button></div>
          <div class="m3-dash-body">
            <div class="m3-kpi-row">#{metrics.map { |m| "<div class=\"m3-kpi\"><div class=\"label\">#{m['label']}</div><div class=\"value\">#{m['value']}</div><div class=\"delta\">↑</div></div>" }.join}</div>
            <div class="m3-dash-grid">
              <div class="m3-panel"><h3>#{ph['product']}</h3><div class="m3-chart">#{bars}</div></div>
              <div class="m3-panel"><h3>#{ph['service']}</h3><p style="color:var(--ds-on-surface-variant);margin:0;font:var(--ds-type-body-md)">Tickets · 12 · SLA 96%</p></div>
            </div>
            <div class="m3-table-wrap"><table class="m3-table"><thead><tr><th>Cliente</th><th>Plan</th><th>Estado</th><th>MRR</th></tr></thead>
            <tbody><tr><td>#{dash['table_client']}</td><td>Pro</td><td>#{dash['table_status']}</td><td>$420</td></tr></tbody></table></div>
          </div>
        </div>
      </div>
      <button class="m3-fab">+</button>
    </body></html>
    HTML
end

def dashboard_tpl(system_id, ph)
  dash = DASH
  metrics = ph["metrics"] || []
  bars = [35, 55, 45, 70, 60, 85].map { |h| "<div class=\"tpl-bar\" style=\"height:#{h}%\"></div>" }.join
  sidebar_w = system_id == "carbon-design" ? "288px" : "260px"
  head_dashboard(system_id, "Dashboard SaaS") +
    "<body class=\"tpl\">#{chrome("#{SYSTEMS[system_id][:label]} · Dashboard", system_id)}" +
    <<~HTML
      <div class="tpl-dash" style="--tpl-sidebar-w:#{sidebar_w}">
        <aside class="tpl-sidebar"><div class="brand">#{ph['brand']}</div><nav>
          <a href="#" class="active">#{dash['section_overview']}</a>
          <a href="#">#{dash['section_reports']}</a>
          <a href="#">#{ph['product']}</a>
          <a href="#">#{ph['service']}</a>
          <a href="#">#{dash['section_clients']}</a>
          <a href="#">#{dash['section_settings']}</a>
        </nav></aside>
        <div class="tpl-main">
          <div class="tpl-topbar"><h1>#{dash['welcome']}</h1><input class="search" type="search" aria-label="Buscar en #{ph['brand']}" placeholder="Buscar en #{ph['brand']}…"><button class="tpl-btn-primary">#{ph['cta_secondary']}</button></div>
          <div class="tpl-dash-content">
            <div class="tpl-kpi-row">#{metrics.map { |m| "<div class=\"tpl-kpi\"><div class=\"label\">#{m['label']}</div><div class=\"value\">#{m['value']}</div><div class=\"delta\">↑</div></div>" }.join}</div>
            <div class="tpl-dash-mid">
              <div class="tpl-panel"><h3>#{ph['product']}</h3><div class="tpl-chart-area">#{bars}</div></div>
              <div class="tpl-panel"><h3>#{ph['service']}</h3><p style="color:var(--tpl-text-muted);font-size:0.875rem;margin:0">SLA 96% · 12 tickets</p></div>
            </div>
            <div class="tpl-panel" style="padding:0;overflow:hidden"><table class="tpl-table"><thead><tr><th>Cliente</th><th>Producto</th><th>Estado</th><th>MRR</th></tr></thead>
            <tbody><tr><td>#{dash['table_client']}</td><td>#{ph['product']}</td><td>#{dash['table_status']}</td><td>$420</td></tr></tbody></table></div>
          </div>
        </div>
      </div>
    </body></html>
    HTML
end

def build_dashboard(system_id, ph)
  system_id == "material-design" ? dashboard_material(ph) : dashboard_tpl(system_id, ph)
end

# ——— Generate ———

Dir.mkdir(PREVIEW_DIR) unless Dir.exist?(PREVIEW_DIR)
count = 0
(registry["systems"] || {}).each_key do |system_id|
  { "homepage" => -> { build_homepage(system_id, ph) },
    "presentation" => -> { build_pitch(system_id, ph) },
    "dashboard" => -> { build_dashboard(system_id, ph) } }.each do |surface, gen|
    fn = surface == "dashboard" ? "#{system_id}-dashboard.html" : "#{system_id}-#{surface}.html"
    File.write(File.join(PREVIEW_DIR, fn), gen.call)
    count += 1
    puts "wrote #{fn}"
  end
end
puts "generate-atelier-previews: #{count} page(s)"

MD_SURFACES = { "homepage" => "Homepage producto y servicio", "presentation" => "Presentación pitch / reporte", "dashboard_saas" => "Dashboard SaaS" }.freeze

def surface_md(system_id, meta, key, surface_title, preview_file)
  body = case key
         when "homepage"
           <<~MD
             ## Superficie: marketing landing (NO propuesta scroll)

             - Nav sticky + CTA · hero producto/servicio · features · métricas · CTA band
             - **Material:** M3 Expressive (nav chips, FAB, tonal surfaces, duo cards)
             - **Apple:** hero centrado, tipografía SF, cards redondeadas
             - **Fluent / Polaris / Atlassian / Carbon:** `surfaces.css` + overrides por system
           MD
         when "presentation"
           <<~MD
             ## Superficie: pitch scroll (document-experience.css)

             Placeholders en `pitch:` del YAML. Layouts **distintos por sección**:
             split asimétrico · visual full-bleed · tabla + side card · KPI + quote · timeline · team · ask split
             Overrides: `preview/shared/overrides/#{system_id}.css`
           MD
         else
           <<~MD
             ## Superficie: dashboard app SaaS (NO propuesta)

             - **Material:** navigation rail + search pill + chart + tabla
             - **Resto:** sidebar + topbar + KPI strip + panels + tabla (`surfaces.css`)
           MD
         end
  <<~MD
    # #{meta['label']} — #{surface_title}

    **Preview:** `#{preview_file}` · **Placeholders:** `vitals/data/design/template-placeholders.yaml`

    #{body}

    ## Criterios #{meta['label']}

    Tokens: `systems/#{system_id}/tokens.css` · Skill: `systems/#{system_id}/SKILL.md`

    ## Anti-slop

    - Tres superficies con estructuras distintas — no clonar propuesta en homepage/dashboard
    - Aplicar tokens del system; no Inter genérico si el DS define otra tipografía
  MD
end

(registry["systems"] || []).each do |system_id, meta|
  base = File.join(ROOT, ".cursor/skills/design/templates/systems", system_id)
  Dir.mkdir(base) unless Dir.exist?(base)
  { "homepage" => "homepage.md", "presentation" => "presentation.md", "dashboard_saas" => "dashboard-saas.md" }.each do |key, filename|
    pk = key == "dashboard_saas" ? "dashboard_saas" : key
    File.write(File.join(base, filename), surface_md(system_id, meta, key, MD_SURFACES[key], meta.dig("preview_pages", pk)))
  end
end
puts "markdown specs: #{(registry['systems'] || {}).size * 3} file(s)"
