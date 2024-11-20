"use client"

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Transacao, CategoriaKeys } from '../components/lib/interfaces'
// import { useCreditCardUpload } from './hooks/useCreditCardUpload'

interface CreditCardUploadProps {
  onBack: () => void
  onExtractTransactions: (transactions: Transacao[]) => void
  // This prop is kept for potential future use or parent component logic
  findMatchingCategory: (description: string) => { category: CategoriaKeys; subcategory: string }
  categoryMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }}
  recentTransactions: Array<{ descricao: string; categoria: CategoriaKeys | null; subcategoria: string | null }>
  onUpdateCategoryMapping: (desc: string, categoria: CategoriaKeys, subcategoria: string) => void
}

export function CreditCardUpload({ 
  onBack, 
  // onExtractTransactions,
  // categoryMapping,
  // recentTransactions,
  // onUpdateCategoryMapping
}: CreditCardUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear] = useState<number>(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)

  // const creditCardUpload = useCreditCardUpload({
  //   categoryMapping,
  //   recentTransactions,
  //   onUpdateCategoryMapping
  // })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !selectedMonth) {
      setError('Por favor, selecione um arquivo PDF e o mês de referência.')
      return
    }

    // try {
    //   const extractedTransactions = await creditCardUpload.processCreditCardPdf(file, selectedMonth, selectedYear)
    //   if (extractedTransactions.length === 0) {
    //     setError('Nenhuma transação encontrada no arquivo PDF.')
    //     return
    //   }
    //   onExtractTransactions(extractedTransactions)
    // } catch (error: unknown) {
    //   console.error("Error processing PDF:", error)
    //   setError(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    // }
  }

  return (
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
        <Label htmlFor="pdf-file">Upload Credit Card Statement PDF</Label>
        <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} />
      </div>
      <div>
        <Label htmlFor="month">Mês de referência</Label>
        <Input 
          type="number" 
          id="month" 
          min="1" 
          max="12" 
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedMonth(parseInt(e.target.value, 10))} 
        />
      </div>
      <div>
        <Label htmlFor="year">Ano de referência</Label>
        <Input type="number" id="year" value={selectedYear} readOnly />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Button 
        type="submit" 
        disabled={!file || !selectedMonth}
        className="text-foreground hover:bg-accent hover:text-white"
      >
        Extract Transactions
      </Button>
    </form>
  )
}
