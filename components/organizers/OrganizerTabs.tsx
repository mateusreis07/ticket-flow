'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { EventSearchResult, OrganizerProfile } from '@/types'
import { CalendarX, Calendar, Globe, MapPin, MessageCircle, ExternalLink } from 'lucide-react'
import EventCard from '../events/EventCard'

interface OrganizerTabsProps {
  organizerId: string
  upcomingEvents: EventSearchResult[]
  upcomingTotal: number
  initialPastEvents: EventSearchResult[]
  pastTotal: number
  organizer: OrganizerProfile
}

export function OrganizerTabs({
  organizerId,
  upcomingEvents,
  upcomingTotal,
  initialPastEvents,
  pastTotal,
  organizer
}: OrganizerTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') as 'upcoming' | 'past' | 'about' || 'upcoming'
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'about'>(defaultTab)
  const [pastEvents, setPastEvents] = useState<EventSearchResult[]>(initialPastEvents)
  const [hasLoadedPast, setHasLoadedPast] = useState(initialPastEvents.length > 0)

  const handleTabChange = (tab: 'upcoming' | 'past' | 'about') => {
    setActiveTab(tab)
    // Update URL silently
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    window.history.replaceState(null, '', `?${params.toString()}`)

    if (tab === 'past' && !hasLoadedPast) {
      // In a real app, you might want to fetch here if initialPastEvents is empty
      setHasLoadedPast(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return (
    <div>
      {/* Tabs Headers */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleTabChange('upcoming')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'upcoming' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Próximos eventos ({upcomingTotal})
        </button>
        <button
          onClick={() => handleTabChange('past')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'past' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Eventos passados ({pastTotal})
        </button>
        <button
          onClick={() => handleTabChange('about')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'about' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Sobre
        </button>
      </div>

      {/* Tabs Content */}
      <div className="min-h-[300px]">
        {/* UPCOMING */}
        {activeTab === 'upcoming' && (
          <div>
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <CalendarX className="w-10 h-10 text-gray-300 mb-4" />
                <h3 className="text-gray-900 font-medium mb-1">Nenhum evento próximo</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Siga este organizador para ser notificado quando novos eventos forem criados.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAST */}
        {activeTab === 'past' && (
          <div>
            {pastEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                <CalendarX className="w-10 h-10 text-gray-300 mb-4" />
                <h3 className="text-gray-900 font-medium mb-1">Nenhum evento realizado ainda</h3>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map(event => (
                  <div key={event.id} className="opacity-80 hover:opacity-100 transition-opacity">
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT */}
        {activeTab === 'about' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {organizer.bio && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Sobre o organizador</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{organizer.bio}</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Informações</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Membro desde {formatDate(organizer.created_at)}</span>
                  </li>
                  {(organizer.city || organizer.state) && (
                    <li className="flex items-center gap-3 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{[organizer.city, organizer.state].filter(Boolean).join(', ')}</span>
                    </li>
                  )}
                  <li className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="w-4 h-4 text-center font-bold text-gray-400">#</span>
                    <span>{organizer.published_events_count} eventos publicados</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600 text-sm">
                    <span className="w-4 h-4 text-center font-bold text-gray-400">🎟️</span>
                    <span>{organizer.total_tickets_sold} ingressos vendidos</span>
                  </li>
                </ul>
              </div>

              {(organizer.website || organizer.instagram || organizer.facebook || organizer.whatsapp) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Links</h3>
                  <ul className="space-y-3">
                    {organizer.website && (
                      <li>
                        <a href={organizer.website.startsWith('http') ? organizer.website : `https://${organizer.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 text-sm hover:text-primary transition-colors">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span>{organizer.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      </li>
                    )}
                    {organizer.instagram && (
                      <li>
                        <a href={`https://instagram.com/${organizer.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 text-sm hover:text-primary transition-colors">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                          <span>{organizer.instagram.startsWith('@') ? organizer.instagram : `@${organizer.instagram}`}</span>
                        </a>
                      </li>
                    )}
                    {organizer.facebook && (
                      <li>
                        <a href={organizer.facebook.startsWith('http') ? organizer.facebook : `https://facebook.com/${organizer.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 text-sm hover:text-primary transition-colors">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                          <span>Facebook</span>
                        </a>
                      </li>
                    )}
                    {organizer.whatsapp && (
                      <li>
                        <a href={`https://wa.me/${organizer.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 text-sm hover:text-primary transition-colors">
                          <MessageCircle className="w-4 h-4 text-green-500" />
                          <span>Contato via WhatsApp</span>
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
