import { useState } from 'react'
import { Transacao, CategoriaKeys } from '../../components/lib/interfaces'
import Papa from 'papaparse'
import { cleanDescription, processFileContent } from '../utils/fileUtils'
import { findMatchingCategory } from '../utils/categoryUtils'

interface UseBankUploadProps {
  categoryMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }}
  recentTransactions: Array<{ descricao: string; categoria: CategoriaKeys | null; subcategoria: string | null }>
  onUpdateCategoryMapping: (desc: string, categoria: CategoriaKeys, subcategoria: string) => void
}

interface BankTransactionCSV {
  "Data": string
  "Lançamento": string
  "Detalhes": string
  "Valor": string
}

export function useBankUpload({ 
  categoryMapping, 
  recentTransactions,
  onUpdateCategoryMapping 
}: UseBankUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const processBankCsv = async (file: File) => {
    try {
      const content = await processFileContent(file)
      
      const results = Papa.parse<BankTransactionCSV>(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      })
      
      const bankTransactionsData = results.data
      const bankTransactions: Transacao[] = bankTransactionsData
        .filter(transaction => {
          const descricao = (transaction["Lançamento"] + ' ' + transaction["Detalhes"]).toLowerCase()
          return !descricao.startsWith("bb rende") && !descricao.startsWith("saldo") && !descricao.startsWith("S A L D O")
        })
        .map((transaction, index) => {
          const descricao = cleanDescription(transaction["Lançamento"] + ' ' + transaction["Detalhes"])
          const categoryMatch = findMatchingCategory(descricao, categoryMapping, recentTransactions)
          
          const [day, month, year] = transaction["Data"].split('/')
          
          const valor = parseFloat(transaction["Valor"].replace(/\./g, '').replace(',', '.'))
          
          const bankTransaction: Transacao = {
            id: Date.now() + index,
            data: `${day}/${month}/${year}`,
            descricao: descricao,
            cidade: '',
            pais: "BR",
            valor: valor,
            categoria: categoryMatch?.category || null,
            subcategoria: categoryMatch?.subcategory || null,
            mesReferencia: parseInt(month),
            anoReferencia: parseInt(year),
            origem: 'conta_bancaria'
          }

          // Update category mapping
          if (bankTransaction.categoria && bankTransaction.descricao) {
            const normalizedDesc = bankTransaction.descricao.toLowerCase().trim()
            onUpdateCategoryMapping(
              normalizedDesc,
              bankTransaction.categoria,
              bankTransaction.subcategoria || ''
            )
          }

          return bankTransaction
        })
      
      return bankTransactions
    } catch (error: unknown) {
      console.error("Error processing bank CSV:", error)
      setError(`Erro ao processar CSV: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  return {
    processBankCsv,
    error,
    setError
  }
}
