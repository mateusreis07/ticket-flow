'use client'

import { useEffect, useRef } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'

interface Props {
  onScanSuccess: (text: string) => void
}

export default function ScannerWrapper({ onScanSuccess }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    const codeReader = new BrowserQRCodeReader()

    const startScanning = async () => {
      try {
        if (!videoRef.current) return
        
        // Start scanning with facingMode environment (back camera)
        controlsRef.current = await codeReader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result, error) => {
            if (mounted && result) {
              onScanSuccess(result.getText())
            }
          }
        )
      } catch (err) {
        console.error('Camera initialization error:', err)
      }
    }

    startScanning()

    return () => {
      mounted = false
      if (controlsRef.current) {
        controlsRef.current.stop()
      }
    }
  }, [onScanSuccess])

  return (
    <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      {/* Scanner Overlay UI */}
      <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50">
        <div className="w-full h-full border-2 border-primary/50 relative">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary" />
        </div>
      </div>
    </div>
  )
}
