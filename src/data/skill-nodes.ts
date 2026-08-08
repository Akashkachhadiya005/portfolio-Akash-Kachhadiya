/**
 * Skill nodes for the 3D network graph.
 *
 * RULES:
 *  1. Only Akash's REAL skills (must exist in `skills.ts`).
 *  2. Every mark below is self-hosted and verified to render correctly.
 *
 * WHY EVERYTHING IS SELF-HOSTED
 *  These used to be pulled live from jsDelivr. Measured on a production build,
 *  19 logos totalling just 24 KB took a median of 6.6 s and up to 8.3 s to
 *  arrive, because they were 19 separate third-party round-trips — while 615 KB
 *  of same-origin assets finished inside 418 ms. Latency, not bytes. Serving
 *  them from /public removes those round-trips entirely, drops three runtime
 *  CDN dependencies, and makes the masks same-origin.
 *
 * ORIGINAL SOURCES (fetched once into public/images/tech/)
 *  - Devicon            github.com/devicons/devicon        full-colour marks
 *  - Simple Icons v15   simple-icons npm package           LangChain only
 *  - gilbarbara/logos   github.com/gilbarbara/logos        Teams, Hugging Face,
 *                                                          Datadog, GitHub, OpenAI
 *  - svgl               github.com/pheralb/svgl            Gemini, Outlook
 *  - Microsoft          github.com/microsoft/PowerBI-Icons Power BI
 *  - RAGAS              github.com/explodinggradients/ragas
 *
 * EVERY NODE IS NOW A REAL FULL-COLOUR MARK — no `mono` masks left.
 *  Five nodes used to be Simple Icons silhouettes tinted to the node ink, which
 *  flattened brands that are not monochrome at all. Replaced with the real marks
 *  from gilbarbara/logos, verified by rendering each one and counting distinct
 *  colours: Hugging Face came back with 20 (the yellow face), where the old
 *  silhouette had 1. Datadog is genuinely single-colour purple, and GitHub and
 *  OpenAI are genuinely black, so those three are correct as published — the fix
 *  for them was to stop re-tinting them to #003135.
 *  LangChain has no official multi-colour icon; its published mark is monochrome
 *  black, so the Simple Icons geometry is correct. It renders fine as an <img>
 *  despite having no intrinsic width/height (verified: 150x150, ink present).
 *
 * Trademarks stay with their owners; used here nominatively to label skills.
 *
 * NOTES ON THE AWKWARD ONES
 *  - Power BI  Absent from Devicon, and Simple Icons dropped every Microsoft
 *              brand for licensing reasons. Microsoft publishes its own set
 *              (PowerBI-Icons, SVG/Power-BI.svg) for use in docs and diagrams.
 *              That repo is ARCHIVED, so a CDN link would be a standing
 *              availability risk.
 *  - Outlook   Same Microsoft gap. gilbarbara has no Outlook, so the colour
 *              mark comes from svgl.
 *  - Gemini    gilbarbara's google-gemini.svg is the WORDMARK — measured 512x188,
 *              aspect 2.74, only 10% ink. Useless inside a circle. svgl's
 *              gemini.svg is the icon-only spark: 296x298, square, 36% ink.
 *  - RAGAS     Real mark is a YELLOW set-square. Their only colour files are
 *              PNGs (ragas-logo.png is 50x50 — far too small for the cloud
 *              backdrop; logo.png is a wide wordmark), and their only vector is
 *              logo-black.svg. So the local copy takes the official 580x580
 *              vector geometry and fills it with #FFCC4D, sampled straight out
 *              of ragas-logo.png, which is a flat silhouette of exactly that one
 *              colour. A #1E1F21 outline (the brand's own dark) is stroked on:
 *              flat yellow alone measures 206 luminance against a 255 tile, so
 *              it washed out.
 *
 * NOT INCLUDED (no usable mark published anywhere — text-only in the cards):
 *  Arize AI / Phoenix, Amazon Bedrock, Amazon SageMaker.
 */

const T = "/images/tech";

export type SkillNodeData = {
  name: string;
  logo: string;
  /** Monochrome icon → rendered as a CSS mask so it takes the node ink colour */
  mono?: boolean;
  /**
   * Optical size correction (default 1).
   *
   * MEASURED, NOT GUESSED. Each logo is rendered and its ink bounding box
   * compared against the two established families:
   *   colour family → optical size 0.95 (median of the Devicon marks)
   *   mono family   → optical size 0.80 (GitHub 0.807, OpenAI/Datadog 0.80)
   * Solid single-colour glyphs read visually heavier than multi-colour marks,
   * which is why the mono family sits lower.
   */
  scale?: number;
};

export const skillNodes: SkillNodeData[] = [
  // ── Generative AI & LLMs ──
  { name: "OpenAI", logo: `${T}/openai.svg`, scale: 0.95 },
  { name: "Gemini", logo: `${T}/gemini.svg`, scale: 0.95 },
  { name: "LangChain", logo: `${T}/langchain.svg`, scale: 0.95 },
  { name: "Hugging Face", logo: `${T}/hugging-face.svg`, scale: 0.95 },
  { name: "RAGAS", logo: `${T}/ragas.svg`, scale: 0.95 },

  // ── AI Observability & Evaluation ──
  { name: "Datadog", logo: `${T}/datadog.svg`, scale: 0.95 },
  { name: "OpenTelemetry", logo: `${T}/opentelemetry.svg` },

  // ── Machine Learning ──
  { name: "PyTorch", logo: `${T}/pytorch.svg` },
  { name: "TensorFlow", logo: `${T}/tensorflow.svg` },
  { name: "Scikit-learn", logo: `${T}/scikit-learn.svg`, scale: 1.15 },

  // ── Cloud ──
  // Wide wordmark — needs boosting to match the square icons
  { name: "AWS", logo: `${T}/aws.svg`, scale: 1.3 },
  { name: "Google Cloud", logo: `${T}/google-cloud.svg` },
  { name: "Docker", logo: `${T}/docker.svg`, scale: 1.1 },

  // ── Data Engineering & Science ──
  { name: "Python", logo: `${T}/python.svg` },
  { name: "SQL", logo: `${T}/mysql.svg`, scale: 1.1 },
  { name: "MongoDB", logo: `${T}/mongodb.svg` },

  // ── Libraries & Analytics ──
  { name: "Pandas", logo: `${T}/pandas.svg` },
  { name: "NumPy", logo: `${T}/numpy.svg`, scale: 1.1 },
  { name: "Jupyter", logo: `${T}/jupyter.svg` },
  { name: "Power BI", logo: `${T}/power-bi.svg`, scale: 0.95 },

  // ── Collaboration & Dev Tools ──
  { name: "Git", logo: `${T}/git.svg` },
  { name: "GitHub", logo: `${T}/github.svg`, scale: 0.95 },
  // Devicon pads Jira heavily — ink is only 0.75 of the box, so 0.95 / 0.75 ≈ 1.25
  { name: "Jira", logo: `${T}/jira.svg`, scale: 1.25 },
  { name: "Confluence", logo: `${T}/confluence.svg`, scale: 0.95 },
  { name: "Postman", logo: `${T}/postman.svg`, scale: 0.95 },
  { name: "Slack", logo: `${T}/slack.svg`, scale: 0.95 },
  { name: "Microsoft Teams", logo: `${T}/microsoft-teams.svg`, scale: 0.95 },
  { name: "Outlook", logo: `${T}/outlook.svg`, scale: 0.95 },
];
