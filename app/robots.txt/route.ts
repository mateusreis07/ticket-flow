export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ticketflow.com.br'

  const content = `User-agent: *
Allow: /
Allow: /eventos/
Allow: /events/
Allow: /busca
Allow: /organizadores/
Disallow: /dashboard/
Disallow: /meus-ingressos/
Disallow: /checkout/
Disallow: /api/
Disallow: /auth/callback
Disallow: /auth/escolher-papel

Sitemap: ${baseUrl}/sitemap.xml
`

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
