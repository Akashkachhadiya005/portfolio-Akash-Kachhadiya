import { siteConfig } from "@/data/site-config";
import { faqs } from "@/data/faq";

export function JsonLd() {
  const baseUrl = "https://akashkachhadiya.vercel.app";

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    jobTitle: "AI/ML Engineer",
    url: baseUrl,
    email: siteConfig.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ahmedabad",
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    sameAs: [siteConfig.github, siteConfig.linkedin],
    alumniOf: [
      {
        "@type": "EducationalOrganization",
        name: "V. L. Shah College of Commerce",
      },
      {
        "@type": "EducationalOrganization",
        name: "Datamites",
      },
    ],
    knowsAbout: [
      "Machine Learning",
      "Generative AI",
      "Deep Learning",
      "Data Science",
      "Amazon Web Services",
      "Python",
      "SQL",
      "MLOps",
      "NLP",
    ],
    hasCredential: [
      {
        "@type": "EducationalOccupationalCredential",
        name: "AWS Certified Machine Learning Engineer – Associate",
        credentialCategory: "certification",
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "AWS Certified Solutions Architect – Associate",
        credentialCategory: "certification",
      },
      {
        "@type": "EducationalOccupationalCredential",
        name: "AWS Certified AI Practitioner",
        credentialCategory: "certification",
      },
    ],
    worksFor: {
      "@type": "Organization",
      name: "Calyza Tech",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Akash Kachhadiya Portfolio",
    url: baseUrl,
    description: siteConfig.description,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
