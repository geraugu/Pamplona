"use client"

import { useState } from 'react'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import * as pdfjsLib from 'pdfjs-dist'
import { Transacao, CategoriaKeys } from './interfaces'

interface CreditCardUploadProps {
  onBack: () => void
  onExtractTransactions: (transactions: Transacao[]) => void
  findMatchingCategory: (description: string) => { category: CategoriaKeys; subcategory: string } | null
}

export function CreditCardUpload({ 
  onBack, 
  onExtractTransactions,
  findMatchingCategory 
}: CreditCardUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear] = useState<number>(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const extractCreditCardTransactions = async (text: string): Promise<Transacao[]> => {
    // Regex Atualizada com flags global e case-insensitive
    const regex = /(\d{2}\/\d{2})\s+([A-Za-z0-9\s*.-]+?)\s+(?:PARC\s+([\w\s]+?))?\s*(?:Parcela\s+(\d{1,2}\/\d{1,2}))?\s*(?:([A-Z]{2}))?\s+([\d.]+,\d{2})/gi
  
    const matches = Array.from(text.matchAll(regex))
    const transacoesExtraidas: Transacao[] = []
  
    // Para acompanhar as correspondências
    let matchFound = false
  
    for (const match of matches) {
      matchFound = true
      const [, data, descricao, cidadeParc, parcela, pais, valorStr] = match
      let parcelaInfo = parcela ? parcela.trim() : null
      let cidade = cidadeParc ? cidadeParc.trim() : ''
      const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'))
  
      transacoesExtraidas.push({
        id: Date.now() + transacoesExtraidas.length,
        data: data,
        descricao: descricao.trim(),
        cidade: cidade,
        parcela: parcelaInfo,
        pais: pais ? pais.trim() : '',
        valor: valor < 0 ? Math.abs(valor) : -Math.abs(valor),
        categoria: findMatchingCategory(descricao.trim())?.category || null,
        subcategoria: findMatchingCategory(descricao.trim())?.subcategory || null,
        origem: 'cartao_credito',
        mesReferencia: selectedMonth ?? undefined,
        anoReferencia: selectedYear
      })
    }
  
    if (!matchFound) {
      console.warn("Nenhuma transação foi encontrada com a regex atual.")
    }
  
    return transacoesExtraidas
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file || !selectedMonth) {
      setError('Por favor, selecione um arquivo PDF e o mês de referência.')
      return
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += pageText + '\n'
      }

      const extractedTransactions = await extractCreditCardTransactions(fullText)
      onExtractTransactions(extractedTransactions)
    } catch (error: any) {
      console.error("Error processing PDF:", error)
      setError(`Erro ao processar PDF: ${error.message}`)
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
      <Button type="submit" disabled={!file || !selectedMonth}>
        Extract Transactions
      </Button>
    </form>
  )
}
