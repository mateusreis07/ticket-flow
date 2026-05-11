'use client'

import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      window.addEventListener('load', function () {
        navigator.serviceWorker
          .register('/sw.js')
          .then(function (registration) {
            console.log('Service Worker registrado com sucesso:', registration.scope)
          })
          .catch(function (error) {
            console.error('Falha ao registrar o Service Worker:', error)
          })
      })
    }
  }, [])

  return null
}
