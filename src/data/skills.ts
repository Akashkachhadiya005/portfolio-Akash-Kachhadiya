import type { SkillGroup } from "@/types";

export const skills: SkillGroup[] = [
  {
    category: "Generative AI & LLMs",
    items: [
      "Large Language Models (LLMs)",
      "RAG (Retrieval-Augmented Generation)",
      "RAGAS (RAG Evaluation)",
      "Prompt Engineering",
      "Google Gemini",
      "AI Agents",
      "Multi-Agent Systems",
      "Custom AI Applications",
      "Fine-tuning",
      "Vector Databases",
      "Embeddings",
      "Function / Tool Calling",
    ],
  },
  {
    category: "AI Observability & Evaluation",
    items: [
      "Arize AI / Phoenix",
      "Datadog",
      "LLM Tracing",
      "Model Evaluation",
      "OpenTelemetry",
      "Prompt Monitoring",
      "Drift Detection",
    ],
  },
  {
    category: "Machine Learning",
    items: [
      "Supervised & Unsupervised Learning",
      "Deep Learning (ANN, CNN)",
      "NLP",
      "Ensemble Methods",
      "Feature Engineering",
      "Model Deployment",
      "MLOps",
      "Time Series Analysis",
    ],
  },
  {
    category: "Cloud & AWS",
    items: [
      "AWS Solutions Architecture",
      "Amazon Bedrock",
      "Amazon SageMaker",
      "AWS Lambda",
      "Serverless Architecture",
      "Cloud Infrastructure",
      "S3 / EC2 / IAM",
      "Google Cloud (GCP)",
    ],
  },
  {
    category: "Data Engineering & Science",
    items: [
      "Python",
      "SQL",
      "Data Preprocessing",
      "EDA",
      "Statistical Analysis",
      "ETL Pipelines",
      "MongoDB",
    ],
  },
  // Kept at exactly six categories on purpose: SkillsSection splits the desktop
  // layout with skills.slice(0,3) and skills.slice(3,6), so a seventh group
  // would silently vanish on desktop. New tools go into an existing group.
  {
    category: "Tools & Collaboration",
    items: [
      "PyTorch",
      "TensorFlow",
      "Scikit-learn",
      "Pandas",
      "NumPy",
      "LangChain",
      "Docker",
      "Git / GitHub",
      "Power BI",
      "Jupyter",
      "Postman",
      "Jira",
      "Confluence",
      "Slack",
      "Microsoft Teams",
      "Outlook",
    ],
  },
];
