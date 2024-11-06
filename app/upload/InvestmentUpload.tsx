"use client"

import { useState } from 'react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import Papa from 'papaparse'
import { Investimento } from './interfaces'

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
    } catch (error: any) {
      console.error("Error processing CSV:", error)
      setError(`Erro ao processar CSV: ${error.message}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onBack} 
        className="mb-4"
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
      <Button type="submit" disabled={!csvFile || !investmentDate}>
        Upload Investimentos
      </Button>
    </form>
  )
}
