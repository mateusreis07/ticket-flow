'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ImportCSVModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  eventId: string
}

export function ImportCSVModal({ isOpen, onClose, listId, eventId }: ImportCSVModalProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: any[] } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo .csv')
      return
    }

    setFile(selected)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter(l => l.trim().length > 0).slice(0, 5) // Preview 5 lines max
      const parsedPreview = lines.map(l => l.split(','))
      setPreview(parsedPreview)
    }
    reader.readAsText(selected)
  }

  function downloadTemplate() {
    const content = "nome,email,telefone,quantidade,tipo_ingresso,nota\nJoão Silva,joao@email.com,11999999999,2,Pista VIP,Convidado Especial"
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_cortesia_ticketflow.csv'
    link.click()
  }

  async function handleImport() {
    if (!file) return

    setImporting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('listId', listId)
    formData.append('eventId', eventId)

    try {
      const response = await fetch('/api/courtesy/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.result)
        toast.success(`${data.result.imported} convidados importados!`)
        router.refresh()
      } else {
        toast.error(data.error || 'Erro ao importar CSV')
      }
    } catch (error) {
      toast.error('Erro de conexão ao tentar importar')
    } finally {
      setImporting(false)
    }
  }

  function resetStateAndClose() {
    setFile(null)
    setPreview([])
    setResult(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetStateAndClose}>
      <DialogContent className="sm:max-w-[600px] bg-white border-none shadow-2xl p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900">Importar Convidados</DialogTitle>
          <DialogDescription className="text-gray-500">
            Importe uma lista de convidados em massa via arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        {!file && !result && (
          <div className="mt-4 space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                id="csv-upload"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Arraste um CSV ou clique para selecionar
                </p>
                <p className="text-xs text-gray-500">
                  Somente arquivos .csv são suportados
                </p>
              </label>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={downloadTemplate}
                className="text-sm text-primary hover:underline font-medium"
              >
                Baixar modelo CSV
              </button>
            </div>
          </div>
        )}

        {file && !result && (
          <div className="mt-4 space-y-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={importing}>
                Remover
              </Button>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview (Primeiras linhas)</h4>
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Qtd</th>
                      <th className="px-3 py-2">Ingresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(preview[0]?.[0]?.toLowerCase() === 'nome' ? 1 : 0).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{row[0] || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{row[1] || '-'}</td>
                        <td className="px-3 py-2 text-gray-500">{row[3] || '1'}</td>
                        <td className="px-3 py-2 text-gray-500">{row[4] || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setFile(null)} disabled={importing}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={importing} className="bg-primary hover:bg-primary-dark">
                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar convidados
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900">{result.imported} convidados importados!</h3>
              <p className="text-sm text-gray-500 mt-1">Os convidados foram salvos como pendentes.</p>
            </div>

            {(result.skipped > 0 || result.errors.length > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Atenção durante a importação
                </div>
                {result.skipped > 0 && <p className="text-sm text-amber-700">- {result.skipped} linhas em branco ignoradas</p>}
                {result.errors.length > 0 && (
                  <div className="mt-2 text-sm text-amber-700">
                    <p className="font-medium">- {result.errors.length} erros encontrados:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.map((e, i) => (
                        <li key={i}>Linha {e.linha}: {e.detalhe}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <Button onClick={resetStateAndClose} className="w-full bg-primary hover:bg-primary-dark">
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
