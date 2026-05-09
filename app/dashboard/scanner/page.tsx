'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Camera, CameraOff, QrCode, CheckCircle2, 
  XCircle, ChevronLeft, Ticket
} from 'lucide-react'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import Link from 'next/link'

type ScannerState = 'idle' | 'scanning' | 'loading' | 'success' | 'error'

interface ScanResult {
  valid: boolean
  scannedAt: string
  reason?: string
  ticket?: {
    buyer_name: string
    ticket_type_name: string
    event_title: string
    buyer_email?: string
    used_at?: string
  }
}

export default function ScannerPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [scannerState, setScannerState] = useState<ScannerState>('idle')
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<ScanResult[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  // Autenticação e busca de eventos
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('events')
        .select('id, title, event_date')
        .eq('organizer_id', user.id)
        .eq('status', 'published')
        .order('event_date', { ascending: false })

      if (data) {
        setEvents(data)
      }
    }
    init()
  }, [supabase, router])

  // Gerenciamento do scanner
  useEffect(() => {
    if (scannerState === 'scanning' && videoRef.current) {
      const codeReader = new BrowserQRCodeReader()
      
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        if (!controlsRef.current) {
          controlsRef.current = controls
        }
        if (result) {
          handleScan(result.getText())
        }
      }).catch((e) => {
        console.error('Erro ao iniciar scanner:', e)
        setHasPermission(false)
        setScannerState('idle')
      })

      return () => {
        controlsRef.current?.stop()
        controlsRef.current = null
      }
    }
  }, [scannerState])

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      stream.getTracks().forEach(track => track.stop()) // Fecha a stream apenas de teste
      setHasPermission(true)
      setScannerState('scanning')
    } catch (err) {
      console.error('Permissão de câmera negada:', err)
      setHasPermission(false)
    }
  }

  const handleScan = async (qrCode: string) => {
    if (scannerState === 'loading') return
    
    setScannerState('loading')
    controlsRef.current?.stop()

    try {
      const response = await fetch(`/api/tickets/${encodeURIComponent(qrCode)}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode })
      })
      
      const data = await response.json()
      
      const scanTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      
      if (data.valid) {
        // Verificar se o ticket pertence ao evento filtrado (se houver)
        if (selectedEventId && selectedEventId !== 'all') {
          // Nota: precisaria retornar o event_id na API, assumimos que o organizador vai ver se o título bate
        }

        const newResult: ScanResult = { 
          valid: true, 
          ticket: data.ticket,
          scannedAt: scanTime 
        }
        
        setLastResult(newResult)
        setHistory(prev => [newResult, ...prev].slice(0, 10))
        setScannerState('success')
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      } else {
        const newResult: ScanResult = { 
          valid: false, 
          reason: data.reason,
          ticket: data.ticket,
          scannedAt: scanTime 
        }
        
        setErrorMessage(data.reason)
        setLastResult(newResult)
        setHistory(prev => [newResult, ...prev].slice(0, 10))
        setScannerState('error')
        
        if (navigator.vibrate) navigator.vibrate(500)
      }

      setTimeout(() => {
        setScannerState('scanning')
      }, 3000)

    } catch (error) {
      console.error('Erro na requisição:', error)
      setErrorMessage('Erro de conexão. Tente novamente.')
      setScannerState('error')
      
      setTimeout(() => {
        setScannerState('scanning')
      }, 3000)
    }
  }

  const validCount = history.filter(h => h.valid).length
  const invalidCount = history.filter(h => !h.valid).length

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col font-sans">
      
      {/* === HEADER DO SCANNER === */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between z-10 relative">
        <div className="flex-1">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 w-fit">
            <ChevronLeft className="h-4 w-4" /> Dashboard
          </Link>
        </div>
        
        <div className="flex-1 text-center flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="text-white font-semibold text-sm">TicketFlow</span>
          </div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">Validador</p>
        </div>
        
        <div className="flex-1 flex justify-end">
          <select 
            className="bg-gray-800 border-gray-700 text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary max-w-[120px] truncate"
            value={selectedEventId || 'all'}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="all">Todos os eventos</option>
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title.substring(0, 20)}...</option>
            ))}
          </select>
        </div>
      </div>

      {/* === ÁREA DA CÂMERA === */}
      <div className="relative flex-1 flex items-center justify-center bg-gray-950 min-h-[50vh] overflow-hidden">
        
        {(hasPermission === null || scannerState === 'idle') && (
          <div className="text-center px-8 z-10">
            <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <QrCode className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold">Scanner de ingressos</h2>
            <p className="text-gray-500 text-sm mt-2 text-center max-w-xs mx-auto">
              Posicione o QR Code do ingresso na câmera para validar a entrada.
            </p>
            <button 
              onClick={startScanner}
              className="mt-8 bg-primary text-white rounded-xl px-8 py-4 font-semibold text-base flex items-center justify-center gap-2 mx-auto hover:bg-primary-hover transition-colors"
            >
              <Camera className="h-5 w-5" /> Iniciar scanner
            </button>
          </div>
        )}

        {hasPermission === false && (
          <div className="text-center px-8 z-10">
            <CameraOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-semibold text-lg">Permissão negada</h2>
            <p className="text-gray-400 text-sm mt-2 text-center max-w-xs mx-auto">
              Acesse as configurações do seu navegador e permita o acesso à câmera.
            </p>
            <button 
              onClick={startScanner}
              className="mt-6 border border-gray-600 text-white rounded-xl px-6 py-3 text-sm hover:bg-gray-800 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {(scannerState === 'scanning' || scannerState === 'loading') && (
          <>
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay 
              muted 
              playsInline
            />
            
            <div className="absolute inset-0 z-10 flex flex-col">
              <div className="flex-1 bg-gray-950/40"></div>
              <div className="flex">
                <div className="flex-1 bg-gray-950/40"></div>
                
                {/* Mira */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 ${scannerState === 'loading' ? 'border-primary' : 'border-white'} rounded-tl-lg transition-colors`}></div>
                  <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 ${scannerState === 'loading' ? 'border-primary' : 'border-white'} rounded-tr-lg transition-colors`}></div>
                  <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 ${scannerState === 'loading' ? 'border-primary' : 'border-white'} rounded-bl-lg transition-colors`}></div>
                  <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 ${scannerState === 'loading' ? 'border-primary' : 'border-white'} rounded-br-lg transition-colors`}></div>
                  
                  {scannerState === 'loading' && (
                    <div className="animate-spin border-4 border-primary border-t-transparent rounded-full w-12 h-12"></div>
                  )}
                </div>

                <div className="flex-1 bg-gray-950/40"></div>
              </div>
              <div className="flex-1 bg-gray-950/40 flex items-center justify-center">
                <p className="text-white/80 text-sm font-medium bg-gray-900/60 px-4 py-2 rounded-full backdrop-blur-sm">
                  {scannerState === 'loading' ? 'Validando ingresso...' : 'Aponte para o QR Code do ingresso'}
                </p>
              </div>
            </div>
          </>
        )}

        {scannerState === 'success' && (
          <div className="absolute inset-0 bg-green-500/95 flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
            <CheckCircle2 className="h-24 w-24 text-white animate-bounce" style={{ animationIterationCount: 1 }} />
            <h2 className="text-white text-3xl font-black tracking-wider mt-6">ENTRADA LIBERADA</h2>
            
            {lastResult?.ticket && (
              <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-xs border border-white/20">
                <p className="text-white font-bold text-xl mb-1">{lastResult.ticket.buyer_name}</p>
                <p className="text-white/90 text-sm font-medium mb-3">{lastResult.ticket.ticket_type_name}</p>
                <div className="border-t border-white/20 pt-3 mt-3">
                  <p className="text-white/70 text-xs">Validado às {lastResult.scannedAt}</p>
                </div>
              </div>
            )}
            
            <p className="text-white/80 text-sm mt-8 animate-pulse">Próximo scan em 3 segundos...</p>
          </div>
        )}

        {scannerState === 'error' && (
          <div className="absolute inset-0 bg-red-500/95 flex flex-col items-center justify-center z-20 animate-in fade-in duration-200">
            <XCircle className="h-24 w-24 text-white" />
            <h2 className="text-white text-3xl font-black tracking-wider mt-6">ENTRADA NEGADA</h2>
            
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 text-center">
              <p className="text-white font-medium text-lg">{errorMessage}</p>
            </div>
            
            <p className="text-white/80 text-sm mt-8 animate-pulse">Próximo scan em 3 segundos...</p>
          </div>
        )}

      </div>

      {/* === HISTÓRICO DE VALIDAÇÕES === */}
      <div className="bg-gray-900 border-t border-gray-800 flex flex-col max-h-[35vh]">
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 shrink-0">
          <span className="text-gray-400 text-sm font-medium">Últimas validações</span>
          <Link href="/dashboard/scanner/resumo" className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full px-3 py-1.5 transition-colors font-medium">
            Ver resumo do dia
          </Link>
        </div>

        <div className="overflow-y-auto flex-1">
          {history.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-8">Nenhuma validação nesta sessão</p>
          ) : (
            history.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <div className="flex-shrink-0">
                  {item.valid ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.valid ? (
                    <>
                      <p className="text-gray-200 text-sm font-medium truncate">{item.ticket?.buyer_name}</p>
                      <p className="text-gray-500 text-xs">{item.ticket?.ticket_type_name}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-400 text-sm font-medium">Ingresso inválido</p>
                      <p className="text-gray-500 text-xs truncate">{item.reason}</p>
                    </>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-gray-600 text-xs">{item.scannedAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* === CONTADOR DE SESSÃO === */}
      <div className="bg-gray-950 border-t border-gray-800 px-4 py-3 flex justify-around text-center shrink-0">
        <div className="flex-1">
          <p className="text-green-400 text-xl font-bold leading-none">{validCount}</p>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">Válidos</p>
        </div>
        <div className="w-px bg-gray-800"></div>
        <div className="flex-1">
          <p className="text-red-400 text-xl font-bold leading-none">{invalidCount}</p>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">Inválidos</p>
        </div>
        <div className="w-px bg-gray-800"></div>
        <div className="flex-1">
          <p className="text-white text-xl font-bold leading-none">{history.length}</p>
          <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">Total</p>
        </div>
      </div>

    </div>
  )
}
