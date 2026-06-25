import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  searchQuery?: string;
  category?: string;
  resultsCount?: number;
  canonicalUrl?: string;
  imageUrl?: string;
  type?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  searchQuery,
  category,
  resultsCount,
  canonicalUrl,
  imageUrl,
  type = 'website'
}) => {
  const defaultTitle = 'Equyvo - Social Media Platform';
  const defaultDescription = 'Connect, share, and discover amazing content on Equyvo';
  
  const pageTitle = title || defaultTitle;
  const pageDescription = description || defaultDescription;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = pageDescription;
    
    // Update canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }
    
    // Update search-specific meta tags
    if (searchQuery) {
      let searchQueryMeta = document.querySelector('meta[name="search_query"]') as HTMLMetaElement;
      if (!searchQueryMeta) {
        searchQueryMeta = document.createElement('meta');
        searchQueryMeta.name = 'search_query';
        document.head.appendChild(searchQueryMeta);
      }
      searchQueryMeta.content = searchQuery;
      
      if (category) {
        let searchCategoryMeta = document.querySelector('meta[name="search_category"]') as HTMLMetaElement;
        if (!searchCategoryMeta) {
          searchCategoryMeta = document.createElement('meta');
          searchCategoryMeta.name = 'search_category';
          document.head.appendChild(searchCategoryMeta);
        }
        searchCategoryMeta.content = category;
      }
      
      if (resultsCount !== undefined) {
        let searchResultsMeta = document.querySelector('meta[name="search_results"]') as HTMLMetaElement;
        if (!searchResultsMeta) {
          searchResultsMeta = document.createElement('meta');
          searchResultsMeta.name = 'search_results';
          document.head.appendChild(searchResultsMeta);
        }
        searchResultsMeta.content = resultsCount.toString();
      }
    }
  }, [pageTitle, pageDescription, searchQuery, category, resultsCount, canonicalUrl]);

  // This component doesn't render anything visible
  return null;
};

export default SEOHead;
