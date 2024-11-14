import { useState, useEffect } from 'react'
import { Transacao, Investimento, CategoriaKeys } from './interfaces'
import categorias from 'lib/categorias.json'
import { useAuth } from 'components/auth/authContext'
import { db, getTransactions } from 'services/firebase'
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import Papa from 'papaparse'
import * as pdfjsLib from 'pdfjs-dist'

export function useUploadManager() {
  const [transactionsReferencia, setTransactionsReferencia] = useState<Transacao[]>([])
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [investments, setInvestments] = useState<Investimento[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [categoryMapping, setCategoryMapping] = useState<{[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }}>(() => {
    // Initialize categoryMapping with default categories from categorias.json
    const initialMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }} = {}
    
    Object.entries(categorias).forEach(([category, subcategories]) => {
      (subcategories as string[]).forEach((subcategory: string) => {
        const normalizedSubcategory = subcategory.toLowerCase().trim()
        initialMapping[normalizedSubcategory] = {
          categoria: category as CategoriaKeys,
          subcategoria: subcategory,
          count: 1
        }
      })
    })

    return initialMapping
  })

  const { user, accountId } = useAuth()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Only fetch transactions if accountId is not null
        if (accountId) {
          const fetchedTransactions = await getTransactions(accountId);
          const mappedTransactions: Transacao[] = fetchedTransactions.map(transaction => ({
            id: Date.now() + Math.random()+ Math.random(), // Generate a temporary ID
            data: '01/01/2011',
            descricao: transaction.descricao,
            cidade: '', // Assuming city is not available in Firestore
            pais: transaction.pais || '',
            valor: transaction.valor,
            categoria: transaction.categoria as CategoriaKeys | null,
            subcategoria: transaction.subcategoria || null,
            mesReferencia: transaction.mesReferencia,
            anoReferencia: transaction.anoReferencia,
            origem: transaction.origem || 'unknown', // Default origin
            parcela: null
          }));
          setTransactionsReferencia(mappedTransactions);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Erro ao buscar transações");
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, [user, accountId]); // Add user as a dependency
  
  const findMatchingCategory = (description: string): { category: CategoriaKeys; subcategory: string } => {
    if (transactionsReferencia.length === 0) {
      console.warn("No transactions available for matching categories. Using default.");
      return { category: 'Não contábil', subcategory: categorias['Não contábil'][0] };
    }

    const normalizedDesc = description.toLowerCase().trim()
    
    // Get current date to calculate the last two months of reference
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Filter transactions from the last two months with categories and subcategories
    const recentTransactionsWithCategories = transactionsReferencia.filter(transaction => 
      transaction.categoria && 
      transaction.subcategoria && 
      (transaction.anoReferencia === currentYear && (transaction.mesReferencia || 0) < currentMonth) 
    );

    // Exact match in category mapping
    if (categoryMapping[normalizedDesc]) {
      return {
        category: categoryMapping[normalizedDesc].categoria,
        subcategory: categoryMapping[normalizedDesc].subcategoria
      }
    }

    // Check against mapped transactions for matches
    for (const transaction of recentTransactionsWithCategories) {
      const transactionDesc = transaction.descricao.toLowerCase();
      if (transactionDesc.includes(normalizedDesc) || normalizedDesc.includes(transactionDesc)) {
        return {
          category: transaction.categoria!,
          subcategory: transaction.subcategoria!
        }
      }
    }

    // Find best match with highest count
    let bestMatch: { category: CategoriaKeys; subcategory: string; count: number } | null = null

    for (const [key, value] of Object.entries(categoryMapping)) {
      // Partial match with higher priority for longer matches
      if (normalizedDesc.includes(key) || key.includes(normalizedDesc)) {
        if (!bestMatch || value.count > bestMatch.count) {
          bestMatch = {
            category: value.categoria,
            subcategory: value.subcategoria,
            count: value.count
          }
        }
      }
    }

    // If best match found, return it
    if (bestMatch) {
      return {
        category: bestMatch.category,
        subcategory: bestMatch.subcategory
      }
    }

    // Fallback to default category mapping
    return mapTransactionToCategory(description)
  }

  const mapTransactionToCategory = (description: string): { category: CategoriaKeys; subcategory: string } => {
    const categoriaKeys = Object.keys(categorias) as CategoriaKeys[]
    for (const category of categoriaKeys) {
      const subcategories = categorias[category] as string[]
      for (const subcategory of subcategories) {
        if (description.toLowerCase().includes(subcategory.toLowerCase())) {
          return { category, subcategory }
        }
      }
    }
   // Default to 'Não contábil' if no match found
   return { 
    category: 'Não contábil', 
    subcategory: categorias['Não contábil'][0] 
  }
  }

  const extractCreditCardTransactions = async (
    text: string, 
    selectedMonth: number, 
    selectedYear: number
  ): Promise<Transacao[]> => {
    const regex = /(\d{2}\/\d{2})\s+([A-Za-z0-9\s*.-]+?)(?:\s+PARC\s+([A-Za-z\s]+?))?(?:\s+(Parcela\s+\d{1,2}\/\d{1,2}))?\s+(BR)\s+([\d.]+,\d{2})/g
    const linhas = text.split('\n')
    const transacoesExtraidas: Transacao[] = []
    console.log(linhas)

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

        const transaction: Transacao = {
          id: Date.now() + transacoesExtraidas.length,
          data: `${data}`,
          descricao: descricaoTrimmed,
          cidade: cidade,
          parcela: parcelaInfo || null,
          pais: pais || '',
          valor: valor < 0 ? Math.abs(valor) : -Math.abs(valor),
          categoria: categoryMatch.category,
          subcategoria: categoryMatch.subcategory,
          origem: 'cartao_credito',
          mesReferencia: selectedMonth,
          anoReferencia: selectedYear
        }

        // Update category mapping
        if (transaction.categoria && transaction.descricao) {
          const normalizedDesc = transaction.descricao.toLowerCase().trim()
          setCategoryMapping(prevMapping => {
            const updatedMapping = {...prevMapping}
            updatedMapping[normalizedDesc] = {
              categoria: transaction.categoria || '',
              subcategoria: transaction.subcategoria || '',
              count: (prevMapping[normalizedDesc]?.count || 0) + 1
            }
            return updatedMapping
          })
        }

        transacoesExtraidas.push(transaction)
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

      console.log(fullText)

      const extractedTransactions = await extractCreditCardTransactions(fullText, selectedMonth, selectedYear)
      setTransactions(extractedTransactions)
      return extractedTransactions
    } catch (error: any) {
      console.error("Error processing PDF:", error)
      setError(`Erro ao processar PDF: ${error.message}`)
      return []
    }
  }

  const cleanDescription = (description: string): string => {
    // Remove date patterns like 26/09, 26/09/2023, 15:54, etc.
    return description
      .replace(/\d{1,2}\/\d{1,2}(\/\d{4})?\s*\d{2}:\d{2}/g, '')  // Remove date and time
      .replace(/\d{1,2}\/\d{1,2}(\/\d{4})?/g, '')  // Remove date
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .trim()  // Remove leading/trailing whitespace
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
              const descricao = (transaction["Lançamento"] + ' ' + transaction["Detalhes"]).toLowerCase()
              return !descricao.startsWith("bb rende") && !descricao.startsWith("saldo") && !descricao.startsWith("S A L D O")
            })
            .map((transaction, index) => {
              const descricao = cleanDescription(transaction["Lancamento"] + ' ' + transaction["Detalhes"])
              const categoryMatch = findMatchingCategory(descricao)
              
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
                setCategoryMapping(prevMapping => ({
                  ...prevMapping,
                  [normalizedDesc]: {
                    categoria: bankTransaction.categoria!,
                    subcategoria: bankTransaction.subcategoria || '',
                    count: (prevMapping[normalizedDesc]?.count || 0) + 1
                  }
                }))
              }

              return bankTransaction
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
          transactionMonth =  parseInt(month)
          transactionMonthReference = transaction.mesReferencia || selectedMonth || parseInt(month)
          if (selectedMonth) {
            
            transactionYear = selectedMonth < 9 && (parseInt(month) === 11 || parseInt(month) === 12 || parseInt(month) === 10)
              ? selectedYear - 1
              : selectedYear
          } else {
            transactionYear = transaction.anoReferencia || selectedYear
          }
          console.log(selectedMonth,' ',selectedYear,transactionYear)
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
    const transactionToUpdate = transactions.find(t => t.id === id)
    
    if (!transactionToUpdate) return

    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.descricao === transactionToUpdate.descricao
          ? { 
              ...transaction, 
              categoria: category, 
              subcategoria: subcategory || null 
            } 
          : transaction
      )
    )

    // Update category mapping for future automatic categorization
    const normalizedDesc = transactionToUpdate.descricao.toLowerCase()
    setCategoryMapping(prevMapping => ({
      ...prevMapping,
      [normalizedDesc]: {
        categoria: category,
        subcategoria: subcategory || '',
        count: (prevMapping[normalizedDesc]?.count || 0) + 1
      }
    }))
  }

  // ... (rest of the code remains the same)

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
