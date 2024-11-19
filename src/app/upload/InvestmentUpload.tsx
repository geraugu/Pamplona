"use client"

import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

interface InvestmentUploadProps {
  onBack: () => void
  onUploadInvestments: (csvFile: File, investmentDate: string) => void
}

export function InvestmentUpload({ 
  onBack, 
  onUploadInvestments 
}: InvestmentUploadProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [investmentDate, setInvestmentDate] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCsvFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!csvFile || !investmentDate) {
      setError('Por favor, selecione um arquivo CSV e uma data de referência.')
      return
    }

    try {
      onUploadInvestments(csvFile, investmentDate)
    } catch (error: unknown) {
      console.error("Error processing CSV:", error)
      setError(`Erro ao processar CSV: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
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
        <Label htmlFor="csv-file">Upload CSV de Investimentos</Label>
        <Input id="csv-file" type="file" accept=".csv" onChange={handleCsvChange} />
      </div>
      <div>
        <Label htmlFor="investment-date">Data de Referência</Label>
        <Input
          id="investment-date"
          type="date"
          value={investmentDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvestmentDate(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Button 
        type="submit" 
        disabled={!csvFile || !investmentDate}
        className="text-foreground hover:bg-accent hover:text-white"
      >
        Upload Investimentos
      </Button>
    </form>
  )
}
