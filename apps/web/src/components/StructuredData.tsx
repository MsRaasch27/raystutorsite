export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://raystutorsite.com'
  
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Ray Raasch - English Language Tutor",
    "description": "TEFL-certified English language tutor offering personalized, gamified learning experiences to help students achieve their language goals.",
    "url": baseUrl,
    "logo": `${baseUrl}/TEFLclass.jpg`,
    "image": `${baseUrl}/TEFLclass.jpg`,
    "founder": {
      "@type": "Person",
      "name": "Ray Raasch",
      "email": "msraasch27@gmail.com",
      "jobTitle": "TEFL Certified English Language Tutor",
      "description": "Over a decade of experience in education and gaming industries, specializing in making complex subjects fun and interesting to learn."
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "TH",
      "addressRegion": "Bangkok"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+66-XX-XXX-XXXX",
      "contactType": "customer service",
      "email": "msraasch27@gmail.com",
      "availableLanguage": ["English"]
    },
    "sameAs": [
      // Add social media profiles when available
    ],
    "offers": {
      "@type": "Offer",
      "name": "English Language Tutoring Services",
      "description": "One-on-one personalized English language instruction with flexible scheduling",
      "category": "Education",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "English Language Learning Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Free Trial Session",
            "description": "Complimentary trial session to experience personalized English tutoring"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "One-on-One English Tutoring",
            "description": "Personalized English language instruction tailored to individual learning goals"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Gamified Language Learning",
            "description": "Interactive, game-based approach to English language learning"
          }
        }
      ]
    }
  }

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Ray Raasch",
    "jobTitle": "TEFL Certified English Language Tutor",
    "description": "Experienced English language tutor with over a decade in education and gaming industries, specializing in personalized, gamified learning experiences.",
    "email": "msraasch27@gmail.com",
    "image": `${baseUrl}/TEFLclass.jpg`,
    "url": baseUrl,
    "knowsAbout": [
      "English Language Teaching",
      "TEFL Certification",
      "Gamified Learning",
      "Personalized Education",
      "Language Skills Development",
      "Online Tutoring"
    ],
    "hasCredential": {
      "@type": "EducationalOccupationalCredential",
      "name": "TEFL Certification",
      "description": "Teaching English as a Foreign Language certification"
    },
    "alumniOf": {
      "@type": "Organization",
      "name": "TEFL Certification Program"
    },
    "workLocation": {
      "@type": "Place",
      "name": "Bangkok, Thailand"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Ray Raasch - English Language Tutor",
    "description": "Transform your English learning journey with personalized, gamified tutoring designed to help you achieve your language goals fast.",
    "url": baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
    </>
  )
}
