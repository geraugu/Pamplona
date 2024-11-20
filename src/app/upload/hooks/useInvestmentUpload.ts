import { useState } from 'react'
import { Investimento } from '../../components/lib/interfaces'
import Papa from 'papaparse'
import { processFileContent } from '../utils/fileUtils'

export function useInvestmentUpload() {
  const [error, setError] = useState<string | null>(null)

  const processInvestmentCsv = async (file: File, investmentDate: string) => {
    try {
      const content = await processFileContent(file)
      
      const results = Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      })
      
      const investmentsData = results.data as Investimento[]
      const dataReferencia = new Date(investmentDate)
      const investmentsWithDate = investmentsData.map(investment => ({
        ...investment,
        dataReferencia
      }))
      
      return investmentsWithDate
    } catch (error: unknown) {
      console.error("Error processing investment CSV:", error)
      setError(`Erro ao processar CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  return {
    processInvestmentCsv,
    error,
    setError
  }
}
