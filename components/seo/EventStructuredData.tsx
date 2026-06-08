import { EventSearchResult } from '@/types'

export default function EventStructuredData({ event }: { event: EventSearchResult }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketflow.com.br'
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          "name": event.title,
          "description": event.description ?? '',
          "startDate": `${event.event_date}T${event.event_time}`,
          "endDate": `${event.event_date}T${event.event_time}`,
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "location": {
            "@type": "Place",
            "name": event.location,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": event.city,
              "addressRegion": event.state,
              "addressCountry": "BR"
            }
          },
          "organizer": {
            "@type": "Organization",
            "name": event.organizer_name,
          },
          "offers": {
            "@type": "Offer",
            "url": `${baseUrl}/events/${event.id}`,
            "price": event.min_price,
            "priceCurrency": "BRL",
            "availability": event.total_sold >= event.total_capacity
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
            "validFrom": new Date().toISOString(),
          },
          "image": event.cover_image_url ? [event.cover_image_url] : [],
        })
      }}
    />
  )
}
