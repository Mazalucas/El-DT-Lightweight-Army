---
name: video
description: "When the user wants to create, generate, or produce video content using AI tools or programmatic frameworks. Also use when the user mentions 'video production,' 'AI video,' 'Remotion,' 'Hyperframes,' 'HeyGen,' 'Synthesia,' 'Veo,' 'Sora,' 'Runway,' 'Kling,' 'Seedance,' 'Hailuo,' 'MiniMax,' 'Pika,' 'Hunyuan,' 'Wan,' 'video generation,' 'AI avatar,' 'talking head video,' 'programmatic video,' 'video template,' 'explainer video,' 'product demo video,' 'video pipeline,' or 'make me a video.' Use this for video creation, generation, and production workflows. For video content strategy and what to post, see social. For paid video ad creative, see ad-creative."
metadata:
  version: 2.0.1
---

# Video

You are an expert video producer who helps create marketing videos using AI generation models, AI avatars, and programmatic video frameworks. Your goal is to help users produce professional video content efficiently — from product demos and explainers to social clips and ads.

## El DT — elegir carril primero

Dentro de El DT, leé [`tools/video/ROUTING.md`](../../../../tools/video/ROUTING.md) y la skill `video-routing` antes de esta guía. Nombrá un carril (`recordly`, `brag`, `hyperframes`, `remotion`, `footage`, `avatar` o `edit`). Hyperframes es un carril, no el motor por defecto. Una skill global que lo declare framework de salida cede ante esa matriz.

## Before Starting

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md` filename, in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Gather this context (ask if not provided):

### 1. Video Goal
- What type of video? (Product demo, explainer, testimonial, social clip, ad, tutorial)
- What's the target platform? (YouTube, TikTok/Reels/Shorts, website, ads, sales deck)
- What's the desired length?

### 2. Production Approach
- Do you need a human presenter? (AI avatar vs. voiceover vs. screen recording)
- Do you have existing footage or assets? (Screenshots, logos, product UI)
- Do you need generated footage? (AI-generated scenes, B-roll)
- Is this a one-off or a template for repeated use?

### 3. Technical Context
- What's your tech stack? (Node.js, Python, etc.)
- Do you have API keys for any video tools?
- Budget constraints? (Some tools charge per minute of video)

---

## Choosing Your Approach

The lane comes from [`tools/video/ROUTING.md`](../../../../tools/video/ROUTING.md). Use this table only after that file names a lane:

| Lane | Best for | Tool |
|------|----------|------|
| **recordly** | A recording of the real running product: clicks, cursor, walkthrough, README GIF | `/recordly` — official app via `./tools/video/install-recordly.sh`; a person records |
| **brag** | 15–25s share clip of the current project, with tone, music, and post copy | `/brag` — upstream skill cached by `./tools/video/install-brag.sh`, rendered with Hyperframes |
| **hyperframes** | HTML composition that is not that clip: explainer, PR walkthrough, slideshow, captions on footage, music-driven piece, sub-10s motion, launch longer than 25s | `npx hyperframes` |
| **remotion** | A video asset you keep: props, React brand system, batch, 3D, `tools/remotion` primitives, Studio, Lambda | `/remotion` · `remotion-producer` |
| **footage** | Original picture you cannot film | Veo 3, Sora 2, Runway, Kling, Seedance |
| **avatar** | A presenter on camera | HeyGen, Synthesia |
| **edit** | Cutting long footage into clips | Descript, Opus Clip, CapCut |

---

## Programmatic Video

Three code lanes. Pick with the matrix above. Do not install Hyperframes into the DT `package.json`, and do not copy the brag repo into this template.

### /brag

A launch recipe on top of Hyperframes, for this project, 15–25 seconds, one shareable file plus post copy. First run:

```bash
./tools/video/install-brag.sh
```

Then follow `output/.cache/brag/skills/brag/SKILL.md`. That cache is gitignored.

### Hyperframes (HTML)

Open-source engine from HeyGen. A composition is HTML with seekable timing; the CLI renders MP4. Use it when the matrix lands on the Hyperframes row. Runtime:

```bash
npx hyperframes doctor
```

Domain skills stay on the operator's machine (`npx hyperframes skills update`). They are not vendored into El DT.

### Remotion (React)

The maintained React lane already in the template. Frame-accurate motion (`useCurrentFrame`, `interpolate`, `spring`), props, and Lambda for batch. Entry:

```bash
cd tools/remotion && npm install && npm run dev
```

Free for teams of up to 3 people. Larger companies need a [commercial license](https://www.remotion.dev/docs/license).

Scaffold and primitives: [`tools/remotion/README.md`](../../../../tools/remotion/README.md).

---

## AI Video Generation

Generate original footage from text or image prompts. Use for B-roll, hero visuals, and scenes you can't practically film.

### Model Comparison

| Model | Resolution | Max Duration | Best For | Cost |
|-------|-----------|-------------|----------|------|
| **Veo 3** (Google) | Up to 1080p (4K varies) | Variable | Top overall quality, synced audio | API-based |
| **Sora 2** (OpenAI) | Up to 1080p | Up to ~20 sec | Cinematic + synced audio, ChatGPT/API integration | API + ChatGPT |
| **Runway Gen-4** | Up to 4K | ~10 sec/gen | Motion control, temporal consistency, edit-style workflows | $12-76/mo |
| **Kling 2.5/3.0** (Kuaishou) | Up to 1080p | Up to 2 min | Long-take generation, lower per-second cost | ~$0.03/sec |
| **Seedance** (ByteDance) | Up to 1080p | Short clips | Fast generation, strong motion fidelity at low cost, batch-friendly | Per-credit |
| **Hailuo / MiniMax** | Up to 1080p | Short clips | Character consistency across shots | Per-credit |
| **Pika 2.x** | 1080p | Short clips | Quick effects, image-to-video, lower bar to entry | Per-credit |
| **Hunyuan Video / Wan 2** | 720p–1080p | Variable | Open-source self-hosted; full control, no API fees | Free (GPU) |

**Quick picks**:
- **Highest quality + audio**: Veo 3 or Sora 2
- **Batch / volume / cost**: Kling, Seedance
- **Character consistency across multiple shots**: Hailuo
- **Self-hosted, brand-controlled**: Hunyuan Video or Wan 2 (open weights)
- **Storyboard → video workflow**: Runway, LTX Studio
- **Image-to-video from a still you already have**: Kling, Pika, Runway

### Prompting for Video Models

Good video prompts specify: **subject + action + camera + style + mood**

```
A close-up shot of hands typing on a laptop keyboard,
shallow depth of field, warm office lighting,
camera slowly pulls back to reveal a modern workspace,
cinematic color grading, 4K
```

**Common mistakes:**
- Too vague ("a person working") — add specifics
- Ignoring camera movement — specify dolly, pan, static
- Forgetting style — "cinematic," "documentary," "commercial"
- Requesting text in video — AI models struggle with readable text

**For detailed prompting guides**: See [references/ai-video-prompting.md](references/ai-video-prompting.md)

### When to Use AI Generation vs. Stock

| Use Case | AI Generation | Stock Footage |
|----------|:---:|:---:|
| Exact scene you imagined | Yes | Rarely matches |
| Consistent style across clips | Yes | Hard to match |
| Recognizable real locations | No (hallucinations) | Yes |
| Specific products/brands | No (use programmatic) | No |
| Quick B-roll | Either works | Faster |

---

## AI Avatars

Create talking-head videos without filming. An AI avatar delivers your script with realistic lip-sync, expressions, and gestures.

### HeyGen (recommended — has MCP server)

Best lip-sync and micro-expressions. 230+ avatars, 140+ languages.

**Agent integration:** HeyGen has an official MCP server — AI agents can generate avatar videos directly.

| Plan | Videos | Duration |
|------|--------|----------|
| Free | 3/mo | 3 min max |
| Creator | Unlimited | 5 min |
| Business | Unlimited | 20 min |

Check [heygen.com/pricing](https://www.heygen.com/pricing) for current prices.

**Best for:** Product explainers, feature announcements, personalized sales outreach, multilingual content.

**Custom avatars:** Upload a 2-5 min video of yourself to create a digital twin. Looks and sounds like you, generates videos from text scripts.

### Synthesia

Full-body avatars with expressive body language. Built-in script generation from URLs/docs.

**Best for:** Corporate training, compliance videos, enterprise presentations where professional tone > realism.

### When to Use Avatars vs. Other Approaches

| Scenario | Use Avatar | Use Instead |
|----------|:---:|-------------|
| Recurring content (weekly updates) | Yes | — |
| Multilingual versions | Yes | — |
| Personalized outreach at scale | Yes | — |
| Authentic founder content | No | Film yourself |
| Product UI walkthrough | No | Screen recording |
| Creative/artistic video | No | AI generation |

---

## Editing & Repurposing Tools

Turn existing content into multiple video formats.

| Tool | What It Does | Best For |
|------|-------------|----------|
| **Descript** | Transcript-based editing — edit video by editing text | Cleaning up interviews, podcasts, webinars |
| **Opus Clip** | Auto-clips long videos, scores virality potential | Long-form → short-form at scale |
| **CapCut** | Visual effects, captions, platform-native styling | TikTok/Reels polish |
| **Captions.ai** | Auto-captions, eye contact correction, AI dubbing | Solo talking-head content |

### Repurposing Workflow

```
Long-form content (podcast, webinar, demo)
    ↓
Descript: Clean up, remove filler, polish
    ↓
Opus Clip: Auto-extract 5-10 best moments
    ↓
CapCut: Add captions, effects, platform styling
    ↓
Distribute: TikTok, Reels, Shorts, LinkedIn
```

---

## Video Production Workflows

### Product Demo Video

1. **Script** the key features and value props (use copywriting skill)
2. **Screen record** the product flow
3. **Programmatic overlay** — titles, callouts, transitions on the code lane from `tools/video/ROUTING.md`
4. **AI B-roll** — generate establishing shots or lifestyle scenes with Veo/Runway
5. **Voiceover** — record yourself or use AI avatar for narration
6. **Export** at platform-appropriate specs

### Explainer Video

1. **Script** the problem → solution → CTA arc
2. **Choose presenter** — AI avatar (HeyGen) or voiceover + visuals
3. **Build visuals** — programmatic slides, screen recordings, AI-generated scenes
4. **Add captions** — always, for accessibility and engagement
5. **Export** — landscape for YouTube/website, vertical for social

### Batch Social Clips

1. **Create master template** on the Remotion lane when the same layout repeats with new data (`/remotion`)
2. **Feed data** — product features, testimonials, stats
3. **Render batch** — one template, many variations
4. **Add platform-specific captions** via CapCut or Captions.ai
5. **Schedule** across platforms

---

## Agent-Native Video Pipeline

The most powerful setup combines tools that agents can control directly:

```
Agent reads tools/video/ROUTING.md and names one lane
    ↓
brag, Hyperframes, or Remotion for the code picture
    and/or
HeyGen MCP for an avatar
    and/or
Veo/Runway API for B-roll
    ↓
Output: Ready-to-publish video
```

**What makes this agent-native:**
- The lane is chosen from the situation, then one engine runs
- HeyGen MCP — agents call it directly when the lane is avatar
- Video model APIs — standard HTTP requests when the lane is footage

---

## Common Mistakes

1. **Starting with tools, not strategy** — decide what video you need before picking tools
2. **AI-generated text in video** — models can't reliably render readable text; use programmatic overlays instead
3. **Uncanny valley avatars** — if avatar quality matters, invest in HeyGen Creator+ tier
4. **No captions** — 85% of social video is watched without sound
5. **Wrong aspect ratio** — 9:16 for social, 16:9 for YouTube/website, 1:1 for feeds
6. **Over-producing** — authentic often outperforms polished, especially on TikTok

---

## Task-Specific Questions

1. What type of video do you need? (Demo, explainer, social clip, ad, tutorial)
2. Do you need a human presenter or can it be voiceover/text?
3. Is this a one-off or a repeatable template?
4. What platform is it for? (This determines aspect ratio and length)
5. Do you have existing assets to work with? (Screenshots, footage, scripts)
6. What's your budget for video tools?

---

## Tool Integrations

For the tools catalog, see [`tools/REGISTRY.md`](../../../../../../tools/REGISTRY.md).

| Tool | Type | MCP | Guide |
|------|------|:---:|-------|
| **Routing** | Which lane | - | [`tools/video/ROUTING.md`](../../../../tools/video/ROUTING.md) |
| **Recordly** | Screen recording of the running product | - | `./tools/video/install-recordly.sh` — official binary, not vendored |
| **/brag** | 15–25s launch clip | - | `./tools/video/install-brag.sh` → cached upstream skill |
| **Remotion** | React video asset | - | [`tools/remotion/README.md`](../../../../tools/remotion/README.md) · `remotion-producer` |
| **Hyperframes** | HTML video | - | `npx hyperframes` — not vendored |
| **HeyGen** | AI avatars | Yes | Avatar lane in this guide |
| **Runway** | AI generation | - | [runwayml.com/docs](https://docs.dev.runwayml.com) |

---

## Related Skills

- **social**: For video content strategy, hooks, and what to post
- **ad-creative**: For paid video ad creative and iteration
- **copywriting**: For video scripts and messaging
- **marketing-psychology**: For hooks and persuasion in video
