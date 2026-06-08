export default function BreadcrumbStructuredData({ items }: { items: Array<{ name: string, url: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketflow.com.br'
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": `${baseUrl}${item.url}`
          }))
        })
      }}
    />
  )
}
