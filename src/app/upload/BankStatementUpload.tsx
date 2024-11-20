"use client"

import { useState, useCallback } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { toast } from 'sonner'
import { Transacao, CategoriaKeys } from '../components/lib/interfaces'
import { useBankUpload } from './hooks/useBankUpload'

interface BankStatementUploadProps {
  onBack: () => void
  onExtractTransactions: (transactions: Transacao[]) => void
  findMatchingCategory: (description: string) => { category: CategoriaKeys; subcategory: string }
  categoryMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }}
  recentTransactions: Array<{ descricao: string; categoria: CategoriaKeys | null; subcategoria: string | null }>
  onUpdateCategoryMapping: (desc: string, categoria: CategoriaKeys, subcategoria: string) => void
}

export function BankStatementUpload({ 
  onBack, 
  onExtractTransactions,
  categoryMapping,
  recentTransactions,
  onUpdateCategoryMapping
}: BankStatementUploadProps) {
  const [bankCsvFile, setBankCsvFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const bankUpload = useBankUpload({
    categoryMapping,
    recentTransactions,
    onUpdateCategoryMapping
  })

  const handleBankCsvChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      // Validate file type
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        setBankCsvFile(file)
        setError(null)
      } else {
        setError('Por favor, selecione um arquivo CSV válido.')
        setBankCsvFile(null)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!bankCsvFile) {
      setError('Por favor, selecione um arquivo CSV de extrato bancário.')
      return
    }

    try {
      const extractedTransactions = await bankUpload.processBankCsv(bankCsvFile)
      
      if (extractedTransactions.length === 0) {
        toast.warning('Nenhuma transação válida encontrada no arquivo.')
        setError('Nenhuma transação válida encontrada no arquivo.')
        return
      }
      
      // Directly call the onExtractTransactions with the extracted transactions
      onExtractTransactions(extractedTransactions)
    } catch (error: unknown) {
      console.error("Error processing Bank CSV:", error)
      setError(`Erro ao processar CSV bancário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      toast.error('Erro ao processar arquivo CSV')
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack} 
          className="mb-4 text-foreground hover:bg-accent hover:text-white"
        >
          ← Voltar
        </Button>
        <div>
          <Label htmlFor="bank-csv-file">Upload CSV de Extrato Bancário</Label>
          <Input 
            id="bank-csv-file" 
            type="file" 
            accept=".csv" 
            onChange={handleBankCsvChange} 
          />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button 
          type="submit" 
          disabled={!bankCsvFile}
          className="text-foreground hover:bg-accent hover:text-white"
        >
          Upload Extrato Bancário
        </Button>
      </form>
    </div>
  )
}
