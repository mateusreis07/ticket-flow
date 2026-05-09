'use client'

import Link from 'next/link'
import EventForm from '@/components/dashboard/EventForm'
import { createEvent } from '@/lib/actions/events'

export default function CreateEventPage() {
  return (
    <div>
      <div className="mb-8">
        <Link 
          href="/dashboard/eventos" 
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-2 inline-block"
        >
          &larr; Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Criar novo evento</h1>
      </div>

      <EventForm onSubmitAction={createEvent} submitLabel="Publicar evento" />
    </div>
  )
}
