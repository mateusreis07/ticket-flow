import { getTopOrganizers } from '@/lib/queries/organizers'
import { OrganizerCard } from '@/components/organizers/OrganizerCard'

export const metadata = {
  title: 'Organizadores — TicketFlow',
  description: 'Conheça quem faz os melhores eventos',
}

export default async function OrganizersPage() {
  // We use getTopOrganizers with a high limit to show all active organizers
  const organizers = await getTopOrganizers(50)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Organizadores</h1>
        <p className="text-gray-500 mt-1">Conheça quem faz os melhores eventos</p>

        {organizers.length === 0 ? (
          <div className="mt-12 text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">Nenhum organizador encontrado.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {organizers.map(organizer => (
              <OrganizerCard key={organizer.id} organizer={organizer} variant="large" />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
