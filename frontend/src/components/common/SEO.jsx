import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'HRMS Pro';
const DEFAULT_TITLE = 'HRMS Pro - Modern HR Management Platform for Growing Businesses';
const DEFAULT_DESC = 'HRMS Pro is an all-in-one HR management platform for growing businesses. Automate payroll, track attendance, manage performance, and streamline HR operations.';
const SITE_URL = 'https://hrmspro.online';
const DEFAULT_IMAGE = '/mockups/dashboard.png';

const SEO = ({ title, description, image, type = 'website', publishedTime, author, jsonLd }) => {
  const location = useLocation();
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const fullDesc = description || DEFAULT_DESC;
  const fullImage = image || DEFAULT_IMAGE;
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={fullImage} />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {author && <meta name="author" content={author} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export const OrganizationSchema = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'HRMS Pro',
        url: SITE_URL,
        logo: `${SITE_URL}/vite.svg`,
        description: DEFAULT_DESC,
        foundingDate: '2020',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+1-555-123-4567',
          contactType: 'sales',
          email: 'hello@hrmspro.online',
        },
        sameAs: [
          'https://linkedin.com/company/hrmspro',
          'https://twitter.com/hrmspro',
          'https://github.com/hrmspro',
        ],
      })}
    </script>
  </Helmet>
);

export const BreadcrumbSchema = ({ items }) => {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${SITE_URL}${item.path}`,
  }));

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement,
        })}
      </script>
    </Helmet>
  );
};

export const BlogPostSchema = ({ post }) => {
  if (!post) return null;
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          image: post.image_url || DEFAULT_IMAGE,
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at || post.published_at || post.created_at,
          author: {
            '@type': 'Person',
            name: post.author_name || 'HRMS Pro',
          },
          publisher: {
            '@type': 'Organization',
            name: 'HRMS Pro',
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/vite.svg`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/blog/${post.id}`,
          },
        })}
      </script>
    </Helmet>
  );
};

export const FAQSchema = ({ questions }) => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      })}
    </script>
  </Helmet>
);

export default SEO;
