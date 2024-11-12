"use client"

import { useState, ChangeEvent, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Button } from 'components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from 'components/ui/dialog'
import { Input } from 'components/ui/input'
import { Label } from 'components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import { toast } from 'sonner'

import { useUploadManager } from './useUploadManager'
import { UploadSelector } from './UploadSelector'
import { CreditCardUpload } from './CreditCardUpload'
import { InvestmentUpload } from './InvestmentUpload'
import { BankStatementUpload } from './BankStatementUpload'

import TransactionTable from './TransactionTable'
import InvestmentTable from './InvestmentTable'
import { Transacao, Investimento, CategoriaKeys } from './interfaces'
import categorias from 'lib/categorias.json'

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist'

export default function UploadPage() {
  const [uploadType, setUploadType] = useState<'none' | 'credit_card' | 'investment' | 'bank_statement'>('none')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear] = useState<number>(new Date().getFullYear())
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null)
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState<boolean>(true)

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`
  }, [])

  const {
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
  } = useUploadManager()

  const handleUploadTypeChange = (type: 'credit_card' | 'investment' | 'bank_statement') => {
    setUploadType(type)
    resetState()
  }

  const handleCreditCardExtract = async (extractedTransactions: Transacao[]) => {
    try {
      if (extractedTransactions.length === 0) {
        setError('Nenhuma transação encontrada no arquivo PDF.')
      } else {
        // Update transactions with user-specified month and year
        const updatedTransactions = extractedTransactions.map(transaction => ({
          ...transaction,
          mes_referencia: selectedMonth,
          ano_referencia: selectedYear
        }))
        
        // Directly set the transactions
        setTransactions(updatedTransactions)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao extrair transações do cartão de crédito')
    }
  }

  const handleInvestmentUpload = async (csvFile: File, investmentDate: string) => {
    try {
      const uploadedInvestments = await processInvestmentCsv(csvFile, investmentDate)
      if (uploadedInvestments.length === 0) {
        setError('Nenhum investimento encontrado no arquivo CSV.')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar arquivo de investimentos')
    }
  }

  const handleBankStatementExtract = async (transactions: Transacao[]) => {
    if (transactions.length === 0) {
      setError('Nenhuma transação encontrada no extrato bancário.')
    } else {
      // Directly set the transactions
      setTransactions(transactions)
    }
  }

  const handleSaveTransactions = async () => {
    if (selectedMonth === null) {
      toast.error('Por favor, selecione o mês de referência')
      return
    }

    const saved = await saveTransactions(selectedYear, selectedMonth)
    if (saved) {
      toast.success('Transações salvas com sucesso!')
      resetState()
      setUploadType('none')
    } else {
      toast.error('Erro ao salvar transações')
    }
  }

  const handleSaveInvestments = async () => {
    const saved = await saveInvestments()
    if (saved) {
      toast.success('Investimentos salvos com sucesso!')
      resetState()
      setUploadType('none')
    } else {
      toast.error('Erro ao salvar investimentos')
    }
  }

  const handleEditTransaction = (transaction: Transacao) => {
    setEditingTransaction({...transaction})
  }

  const handleUpdateTransaction = () => {
    if (editingTransaction) {
      editTransaction(editingTransaction.id, editingTransaction)
      setEditingTransaction(null)
      toast.success('Transação atualizada com sucesso!')
    }
  }

  const handleDeleteTransaction = (id: number) => {
    deleteTransaction(id)
    toast.success('Transação excluída com sucesso!')
  }

  const handleCategoryChange = (id: number, category: CategoriaKeys) => {
    changeTransactionCategory(id, category)
    toast.success('Categoria atualizada com sucesso!')
    
    // If showing only uncategorized, toggle the filter to refresh the view
    if (showOnlyUncategorized) {
      setShowOnlyUncategorized(false)
      setShowOnlyUncategorized(true)
    }
  }

  const handleSubcategoryChange = (id: number, subcategory: string) => {
    const transaction = transactions.find(t => t.id === id)
    if (transaction && transaction.categoria) {
      changeTransactionCategory(id, transaction.categoria, subcategory)
      toast.success('Subcategoria atualizada com sucesso!')
    }
  }

  // Filter transactions to show uncategorized first or all
  const filteredTransactions = showOnlyUncategorized 
    ? transactions.filter(t => 
        t.categoria === null || 
        t.categoria === undefined || 
        (t.categoria && (!t.subcategoria || t.subcategoria === null))
      )
    : transactions

  return (
    <>
      <Card className="w-full mx-auto">
        <CardHeader>
          <CardTitle>Upload de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadType === 'none' && (
            <UploadSelector onSelectUploadType={handleUploadTypeChange} />
          )}

          {uploadType === 'credit_card' && (
            <CreditCardUpload 
              onBack={() => setUploadType('none')}
              onExtractTransactions={handleCreditCardExtract}
              findMatchingCategory={findMatchingCategory}
            />
          )}

          {uploadType === 'investment' && (
            <InvestmentUpload 
              onBack={() => setUploadType('none')}
              onUploadInvestments={handleInvestmentUpload}
            />
          )}

          {uploadType === 'bank_statement' && (
            <BankStatementUpload 
              onBack={() => setUploadType('none')}
              onExtractTransactions={handleBankStatementExtract}
              findMatchingCategory={findMatchingCategory}
            />
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Erro: </strong>
              <span className="block sm:inline">{error}</span>
              <span 
                className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
                onClick={() => setError(null)}
              >
                <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <title>Close</title>
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.03a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
              </span>
            </div>
          )}
          
          {(transactions.length > 0 || investments.length > 0) && (
            <div className="mb-4">
              <Label>Mês de Referência</Label>
              <Select 
                value={selectedMonth ? selectedMonth.toString() : undefined} 
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {new Date(0, index).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {transactions.length > 0 && (
            <>
              <div className="flex items-center space-x-4 mb-4">
                <Button 
                  variant={showOnlyUncategorized ? "default" : "outline"}
                  onClick={() => setShowOnlyUncategorized(!showOnlyUncategorized)}
                >
                  {showOnlyUncategorized ? "Mostrar Todas" : "Mostrar Não Categorizadas"}
                </Button>
                <span className="text-sm text-gray-600">
                  {showOnlyUncategorized 
                    ? `Mostrando ${filteredTransactions.length} transações não categorizadas` 
                    : `Mostrando todas as ${transactions.length} transações`}
                </span>
              </div>
              <TransactionTable 
                transactions={filteredTransactions} 
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onCategoryChange={handleCategoryChange}
                onSubcategoryChange={handleSubcategoryChange}
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveTransactions} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Transações'}
                </Button>
              </div>
            </>
          )}
          
          {investments.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-medium">Investimentos</h2>
              <InvestmentTable investments={investments} />
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSaveInvestments} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Investimentos'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editingTransaction && (
        <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input 
                  value={editingTransaction.descricao} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTransaction({
                    ...editingTransaction, 
                    descricao: e.target.value
                  })}
                />
              </div>
              <div>
                <Label>Valor</Label>
                <Input 
                  type="number" 
                  value={editingTransaction.valor} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTransaction({
                    ...editingTransaction, 
                    valor: parseFloat(e.target.value)
                  })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select
                  value={editingTransaction.categoria || undefined}
                  onValueChange={(value: CategoriaKeys) => setEditingTransaction({
                    ...editingTransaction,
                    categoria: value,
                    subcategoria: null
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categorias).map((categoria) => (
                      <SelectItem key={categoria} value={categoria as CategoriaKeys}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingTransaction.categoria && (
                <div>
                  <Label>Subcategoria</Label>
                  <Select
                    value={editingTransaction.subcategoria || undefined}
                    onValueChange={(value: string) => setEditingTransaction({
                      ...editingTransaction,
                      subcategoria: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a subcategoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias[editingTransaction.categoria].map((subcategoria) => (
                        <SelectItem key={subcategoria} value={subcategoria}>
                          {subcategoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancelar
                </Button>
              </DialogClose>
              <Button onClick={handleUpdateTransaction}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
