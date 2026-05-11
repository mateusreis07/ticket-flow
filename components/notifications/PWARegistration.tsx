'use client'

import { useEffect } from 'react'

export default function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      console.log('[PWA] Iniciando registro manual...')
      
      // Tentar registrar o sw.js gerado pelo plugin
      navigator.serviceWorker
        .register('/sw.js')
        .then(function (registration) {
          console.log('[PWA] ✅ Service Worker registrado:', registration.scope)
          
          // Forçar atualização se houver um novo worker esperando
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] ✨ Novo conteúdo disponível, por favor recarregue.');
                }
              });
            }
          });
        })
        .catch(function (error) {
          console.error('[PWA] ❌ Falha ao registrar Service Worker:', error)
        })
    } else {
      console.warn('[PWA] Service Worker não suportado neste navegador.')
    }
  }, [])

  return null
}
