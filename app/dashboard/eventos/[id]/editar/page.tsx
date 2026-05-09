import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EventForm from '@/components/dashboard/EventForm'
import { updateEvent } from '@/lib/actions/events'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .eq('organizer_id', user.id)
    .single()

  if (!event) notFound()

  // create a wrapper to pass the id to the action
  const updateEventWithId = async (formData: FormData) => {
    'use server'
    return updateEvent(event.id, formData)
  }

  return (
    <div>
      <div className="mb-8">
        <Link 
          href="/dashboard/eventos" 
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-2 inline-block"
        >
          &larr; Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar evento</h1>
      </div>

      <EventForm 
        initialValues={event} 
        onSubmitAction={updateEventWithId} 
        submitLabel="Salvar alterações" 
      />
    </div>
  )
}
