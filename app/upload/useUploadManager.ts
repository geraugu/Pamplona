import { useState } from 'react'
import { Transacao, Investimento, CategoriaKeys } from './interfaces'
import categorias from 'lib/categorias.json'
import { useAuth } from 'components/auth/authContext'
import { db } from 'services/firebase'
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import Papa from 'papaparse'
import * as pdfjsLib from 'pdfjs-dist'

export function useUploadManager() {
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [investments, setInvestments] = useState<Investimento[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [categoryMapping, setCategoryMapping] = useState<{[key: string]: { categoria: string; subcategoria: string; count: number }}>({})

  const { user, accountId } = useAuth()

  const findMatchingCategory = (description: string) => {
    const normalizedDesc = description.toLowerCase()
    
    if (categoryMapping[normalizedDesc]) {
      return {
        category: categoryMapping[normalizedDesc].categoria,
        subcategory: categoryMapping[normalizedDesc].subcategoria
      }
    }

    for (const [key, value] of Object.entries(categoryMapping)) {
      if (normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
        return {
          category: value.categoria,
          subcategory: value.subcategoria
        }
      }
    }

    return mapTransactionToCategory(description)
  }

  const mapTransactionToCategory = (description: string) => {
    const categoriaKeys = Object.keys(categorias) as CategoriaKeys[]
    for (const category of categoriaKeys) {
      const subcategories = categorias[category]
      for (const subcategory of subcategories) {
        if (description.toLowerCase().includes(subcategory.toLowerCase())) {
          return { category, subcategory }
        }
      }
    }
    return null
  }

  const extractCreditCardTransactions = async (
    text: string, 
    selectedMonth: number, 
    selectedYear: number
  ): Promise<Transacao[]> => {
    const regex = /(\d{2}\/\d{2})\s+([A-Za-z0-9\s*.-]+?)(?:\s+PARC\s+([A-Za-z\s]+?))?(?:\s+(Parcela\s+\d{1,2}\/\d{1,2}))?\s+(BR)\s+([\d.]+,\d{2})/g
    const linhas = text.split('\n')
    const transacoesExtraidas: Transacao[] = []

    linhas.forEach((linha) => {
      let match
      while ((match = regex.exec(linha)) !== null) {
        const [, data, descricao, cidadeParc, parcela, pais, valorStr] = match
        let cidade = ''
        let parcelaInfo: string | undefined = undefined
        const descricaoTrimmed = descricao.trim()
        const categoryMatch = findMatchingCategory(descricaoTrimmed)

        if (cidadeParc) {
          if (parcela) {
            parcelaInfo = parcela.trim()
          }
        } else {
          const partes = linha.trim().split(/\s+/)
          const indiceBR = partes.indexOf('BR')
          if (indiceBR > 0) {
            const palavraAntes = partes[indiceBR - 2]
            if (palavraAntes && palavraAntes.startsWith('Parcela')) {
              parcelaInfo = partes[indiceBR - 2] + ' ' + partes[indiceBR - 1]
            }
          }
        }

        const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'))

        transacoesExtraidas.push({
          id: Date.now() + transacoesExtraidas.length,
          data: `${data}`,
          descricao: descricaoTrimmed,
          cidade: cidade,
          parcela: parcelaInfo,
          pais,
          valor: valor < 0 ? Math.abs(valor) : -Math.abs(valor),
          categoria: categoryMatch?.category || null,
          subcategoria: categoryMatch?.subcategory || null,
          origem: 'cartao_credito',
          mesReferencia: selectedMonth,
          anoReferencia: selectedYear
        })
      }
      regex.lastIndex = 0
    })

    return transacoesExtraidas
  }

  const processCreditCardPdf = async (file: File, selectedMonth: number, selectedYear: number) => {
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

      const extractedTransactions = await extractCreditCardTransactions(fullText, selectedMonth, selectedYear)
      setTransactions(extractedTransactions)
      return extractedTransactions
    } catch (error: any) {
      console.error("Error processing PDF:", error)
      setError(`Erro ao processar PDF: ${error.message}`)
      return []
    }
  }

  const processBankCsv = async (file: File) => {
    return new Promise<Transacao[]>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target?.result) {
          const results = Papa.parse(e.target.result as string, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          })
          const bankTransactionsData = results.data as any[]
          const bankTransactions: Transacao[] = bankTransactionsData
            .filter(transaction => {
              const descricao = (transaction["Lancamento"] + ' ' + transaction["Detalhes"]).toLowerCase()
              return !descricao.startsWith("bb rende") && !descricao.startsWith("saldo") && !descricao.startsWith("S A L D O")
            })
            .map((transaction, index) => {
              const descricao = transaction["Lancamento"] + ' ' + transaction["Detalhes"]
              const categoryMatch = findMatchingCategory(descricao)
              const [day, month, year] = transaction["Data"].split('/')
              
              const valor = parseFloat(transaction["Valor"].replace(/\./g, '').replace(',', '.'))
              const valorAjustado = transaction["Tipo Lancamento"]?.toLowerCase() === "entrada" 
                ? Math.abs(valor) 
                : -Math.abs(valor)

              return {
                id: Date.now() + index,
                data: `${day}/${month}/${year}`,
                descricao: descricao,
                cidade: '',
                pais: "BR",
                valor: valorAjustado,
                categoria: categoryMatch?.category || null,
                subcategoria: categoryMatch?.subcategory || null,
                mesReferencia: parseInt(month),
                anoReferencia: parseInt(year),
                origem: 'conta_bancaria'
              }
            })
          
          setTransactions(bankTransactions)
          resolve(bankTransactions)
        }
      }
      reader.onerror = (error) => {
        console.error("Error reading CSV:", error)
        setError(`Erro ao ler CSV: ${error}`)
        reject(error)
      }
      reader.readAsText(file)
    })
  }

  const processInvestmentCsv = async (file: File, investmentDate: string) => {
    return new Promise<Investimento[]>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (e.target?.result) {
          const results = Papa.parse(e.target.result as string, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
          })
          const investmentsData = results.data as Investimento[]
          const dataReferencia = new Date(investmentDate)
          const investmentsWithDate = investmentsData.map(investment => ({
            ...investment,
            dataReferencia
          }))
          
          setInvestments(investmentsWithDate)
          resolve(investmentsWithDate)
        }
      }
      reader.onerror = (error) => {
        console.error("Error reading CSV:", error)
        setError(`Erro ao ler CSV: ${error}`)
        reject(error)
      }
      reader.readAsText(file)
    })
  }

  const saveTransactions = async (selectedYear: number, selectedMonth: number | null) => {
    if (!user || !accountId) {
      setError('Você precisa estar logado e ter uma conta associada para salvar as transações.')
      return false
    }

    setSaving(true)
    try {
      for (const transaction of transactions) {
        const [day, month] = transaction.data.split('/')
        
        let transactionYear: number
        let transactionMonth: number
        let transactionMonthReference: number

        if (transaction.origem === 'cartao_credito') {
          // For credit card transactions, use the extracted month and year references
          transactionYear = transaction.anoReferencia || selectedYear
          transactionMonth = transaction.mesReferencia || parseInt(month)
          transactionMonthReference = transaction.mesReferencia || selectedMonth || parseInt(month)
        } else {
          // For other transaction types, use the existing logic
          if (selectedMonth) {
            transactionYear = selectedMonth < 9 && (parseInt(month) === 11 || parseInt(month) === 12 || parseInt(month) === 10)
              ? selectedYear - 1
              : selectedYear
          } else {
            transactionYear = transaction.anoReferencia || selectedYear
          }
          transactionMonth = parseInt(month)
          transactionMonthReference = selectedMonth || parseInt(month)
        }

        const date = new Date(transactionYear, transactionMonth - 1, parseInt(day))
        
        if (isNaN(date.getTime())) {
          console.error(`Invalid date values: Year: ${transactionYear}, Month: ${transactionMonth}, Day: ${day}`)
          throw new RangeError("Invalid date values")
        }

        const transactionData = {
          data: Timestamp.fromDate(date),
          mesReferencia: transactionMonthReference,
          anoReferencia: selectedYear,
          descricao: transaction.descricao,
          cidade: transaction.cidade,
          parcela: transaction.parcela || null,
          pais: transaction.pais,
          valor: transaction.valor,
          categoria: transaction.categoria || null,
          subcategoria: transaction.subcategoria || null,
          accountId: accountId,
          origem: transaction.origem || 'cartao_credito',
          createdAt: Timestamp.now()
        }

        await addDoc(collection(db, "transactions"), transactionData)
      }

      return true
    } catch (error: any) {
      console.error('Error saving transactions:', error)
      setError('Erro ao salvar transações')
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveInvestments = async () => {
    if (!user || !accountId) {
      setError('Você precisa estar logado e ter uma conta associada para salvar os investimentos.')
      return false
    }

    setSaving(true)
    try {
      for (const investment of investments) {
        await addDoc(collection(db, "investments"), {
          ...investment,
          accountId: accountId,
          createdAt: serverTimestamp(),
          dataReferencia: Timestamp.fromDate(investment.dataReferencia!)
        })
      }

      return true
    } catch (error: any) {
      console.error('Error saving investments:', error)
      setError('Erro ao salvar investimentos')
      return false
    } finally {
      setSaving(false)
    }
  }

  const resetState = () => {
    setTransactions([])
    setInvestments([])
    setError(null)
    setSaving(false)
  }

  // New method to edit a transaction
  const editTransaction = (id: number, updatedTransaction: Partial<Transacao>) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === id 
          ? { ...transaction, ...updatedTransaction } 
          : transaction
      )
    )
  }

  // New method to delete a transaction
  const deleteTransaction = (id: number) => {
    setTransactions(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== id)
    )
  }

  // New method to change transaction category
  const changeTransactionCategory = (id: number, category: CategoriaKeys, subcategory?: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === id 
          ? { 
              ...transaction, 
              categoria: category, 
              subcategoria: subcategory || null 
            } 
          : transaction
      )
    )
  }

  return {
    transactions,
    investments,
    error,
    saving,
    findMatchingCategory,
    processCreditCardPdf,
    processBankCsv,
    processInvestmentCsv,
    saveTransactions,
    saveInvestments,
    resetState,
    setError,
    editTransaction,
    deleteTransaction,
    changeTransactionCategory,
    setTransactions
  }
}
