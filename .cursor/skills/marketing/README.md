# Marketing skills (El DT)

42 skills tácticas para el subagente **marketing-strategist**, basadas en [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) v2.

## Uso

1. Contexto base: `.agents/product-marketing.md` (skill `product-marketing`).
2. Elegir skill por intención (tabla abajo) y leer `marketing/{nombre}/GUIDE.md` completo, incluido `references/` si aplica.
3. El orquestador delega en **marketing-strategist**; este agente aplica la skill táctica correspondiente.

## Catálogo

| Skill | Área |
|-------|------|
| `product-marketing` | Contexto de producto (base para todas) |
| `ab-testing` | Experimentación y A/B tests |
| `ad-creative` | Creatividades de ads |
| `ads` | Campañas pagadas (Google, Meta, LinkedIn, etc.) |
| `ai-seo` | SEO para motores / respuestas IA |
| `analytics` | Medición, GA4, tracking |
| `aso` | App Store / Play Store |
| `churn-prevention` | Retención, dunning, cancel flows |
| `co-marketing` | Partnerships y campañas conjuntas |
| `cold-email` | Outbound B2B |
| `community-marketing` | Comunidades y advocacy |
| `competitor-profiling` | Research de competidores (URLs) |
| `competitors` | Páginas comparison / alternatives |
| `content-strategy` | Estrategia de contenido |
| `copy-editing` | Editar copy existente |
| `copywriting` | Copy nuevo (landings, web) |
| `cro` | Conversión en páginas y forms |
| `customer-research` | Research de clientes |
| `directory-submissions` | Directorios startup/SaaS |
| `emails` | Secuencias y lifecycle email |
| `free-tools` | Herramientas gratis como lead gen |
| `image` | Imágenes de marketing (IA) |
| `launch` | Lanzamientos |
| `lead-magnets` | Lead magnets |
| `marketing-ideas` | Ideas e inspiración |
| `marketing-psychology` | Psicología y persuasión |
| `onboarding` | Activación post-signup |
| `paywalls` | Paywalls in-app |
| `popups` | Modales y overlays |
| `pricing` | Pricing y packaging |
| `programmatic-seo` | SEO programático |
| `prospecting` | Listas y calificación B2B |
| `referrals` | Referidos y afiliados |
| `revops` | RevOps y handoff marketing→ventas |
| `sales-enablement` | Collateral de ventas |
| `schema` | Schema markup |
| `seo-audit` | Auditoría SEO |
| `signup` | Flujos de registro |
| `site-architecture` | Arquitectura del sitio |
| `sms` | SMS/MMS marketing |
| `social` | Redes sociales |
| `video` | Video marketing (IA) |

## Multi-IDE

| IDE | Ruta |
|-----|------|
| **Cursor** | `.cursor/skills/marketing/{skill}/` |
| **Antigravity** | `.agent/skills/marketing/{skill}/` |

Fuente canónica en Git: **Cursor**. Tras editar, corré `./scripts/sync-skills-parity.sh` para replicar el árbol completo en Antigravity.

Listado en README del repo: [Marketing strategist — 42 skills tácticas](../../../README.md#marketing-strategist--42-skills-tácticas).
