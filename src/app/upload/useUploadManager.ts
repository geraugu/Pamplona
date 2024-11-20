import { useState, useEffect } from 'react'
import { Transacao, Investimento, CategoriaKeys } from '../components/lib/interfaces'
import { useAuth } from '../components/auth/authContext'
import { db, getTransactions } from '../services/firebase'
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore'
import { getInitialCategoryMapping } from './utils/categoryUtils'
import { useBankUpload } from './hooks/useBankUpload'
import { useCreditCardUpload } from './hooks/useCreditCardUpload'
import { useInvestmentUpload } from './hooks/useInvestmentUpload'

export function useUploadManager() {
  const [transactionsReferencia, setTransactionsReferencia] = useState<Transacao[]>([])
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [investments, setInvestments] = useState<Investimento[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [categoryMapping, setCategoryMapping] = useState(getInitialCategoryMapping)

  const { user, accountId } = useAuth()

  // Initialize specialized upload hooks
  const updateCategoryMapping = (desc: string, categoria: CategoriaKeys, subcategoria: string) => {
    setCategoryMapping(prevMapping => ({
      ...prevMapping,
      [desc]: {
        categoria: categoria,
        subcategoria: subcategoria,
        count: (prevMapping[desc]?.count || 0) + 1
      }
    }))
  }

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (accountId) {
          const fetchedTransactions = await getTransactions(accountId);
          const mappedTransactions: Transacao[] = fetchedTransactions.map(transaction => ({
            id: Date.now() + Math.random() + Math.random(),
            data: '01/01/2011',
            descricao: transaction.descricao,
            cidade: '',
            pais: transaction.pais || '',
            valor: transaction.valor,
            categoria: transaction.categoria as CategoriaKeys | null,
            subcategoria: transaction.subcategoria || null,
            mesReferencia: transaction.mesReferencia,
            anoReferencia: transaction.anoReferencia,
            origem: transaction.origem || 'unknown',
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
  }, [user, accountId]);

  // Create upload hooks after transactionsReferencia is loaded
  const bankUpload = useBankUpload({
    categoryMapping,
    recentTransactions: transactionsReferencia,
    onUpdateCategoryMapping: updateCategoryMapping
  })

  const creditCardUpload = useCreditCardUpload({
    categoryMapping,
    recentTransactions: transactionsReferencia,
    onUpdateCategoryMapping: updateCategoryMapping
  })

  const investmentUpload = useInvestmentUpload()

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
          transactionYear = transaction.anoReferencia || selectedYear
          transactionMonth = parseInt(month)
          transactionMonthReference = transaction.mesReferencia || selectedMonth || parseInt(month)
          if (selectedMonth) {
            transactionYear = selectedMonth < 9 && (parseInt(month) === 11 || parseInt(month) === 12 || parseInt(month) === 10)
              ? selectedYear - 1
              : selectedYear
          } else {
            transactionYear = transaction.anoReferencia || selectedYear
          }
        } else {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

  const editTransaction = (id: number, updatedTransaction: Partial<Transacao>) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => 
        transaction.id === id 
          ? { ...transaction, ...updatedTransaction } 
          : transaction
      )
    )
  }

  const deleteTransaction = (id: number) => {
    setTransactions(prevTransactions => 
      prevTransactions.filter(transaction => transaction.id !== id)
    )
  }

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

    const normalizedDesc = transactionToUpdate.descricao.toLowerCase()
    updateCategoryMapping(normalizedDesc, category, subcategory || '')
  }

  const processBankCsv = async (file: File) => {
    const newTransactions = await bankUpload.processBankCsv(file)
    setTransactions(newTransactions)
    if (bankUpload.error) setError(bankUpload.error)
    return newTransactions
  }

  // const processCreditCardPdf = async (file: File, selectedMonth: number, selectedYear: number) => {
    // const newTransactions = await creditCardUpload.processCreditCardPdf(file, selectedMonth, selectedYear)
    // setTransactions(newTransactions)
    // if (creditCardUpload.error) setError(creditCardUpload.error)
    // return newTransactions
  // }

  const processInvestmentCsv = async (file: File, investmentDate: string) => {
    const newInvestments = await investmentUpload.processInvestmentCsv(file, investmentDate)
    setInvestments(newInvestments)
    if (investmentUpload.error) setError(investmentUpload.error)
    return newInvestments
  }

  return {
    transactions,
    investments,
    error,
    saving,
    // processCreditCardPdf,
    processBankCsv,
    processInvestmentCsv,
    saveTransactions,
    saveInvestments,
    resetState,
    setError,
    editTransaction,
    deleteTransaction,
    changeTransactionCategory,
    setTransactions,
    // Add these to the return object
    categoryMapping,
    transactionsReferencia,
    updateCategoryMapping
  }
}
