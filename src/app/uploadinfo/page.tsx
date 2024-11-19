'use client'

import React, { useState, ChangeEvent,useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
// import  TransactionTable  from './components/TransactionTable'
import { Transacao, CategoriaKeys } from '../components/lib/interfaces'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import categorias from '../../app/components/lib/categorias.json'
import * as pdfjsLib from 'pdfjs-dist'


export default function UploadInfoPage() {
    const [bankStatementFile, setBankStatementFile] = useState<File | null>(null)
    const [creditCardFile, setCreditCardFile] = useState<File | null>(null)
    const [investmentFile, setInvestmentFile] = useState<File | null>(null)
    // const [showOnlyUncategorized, setShowOnlyUncategorized] = useState<boolean>(true)
    const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null)
   
    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`
      }, [])


    const handleFileUpload = (type: 'bank' | 'credit' | 'investment', file: File) => {
        const allowedTypes = ['text/csv', 'application/vnd.ms-excel']

        if (!allowedTypes.includes(file.type)) {
            toast.error('Por favor, selecione um arquivo CSV válido.')
            return
        }

        switch (type) {
            case 'bank':
                setBankStatementFile(file)
                break
            case 'credit':
                setCreditCardFile(file)
                break
            case 'investment':
                setInvestmentFile(file)
                break
        }
    }

    const handleSubmit = () => {
        if (!bankStatementFile || !creditCardFile || !investmentFile) {
            toast.error('Por favor, faça upload de todos os três arquivos.')
           
            return
        }

        // TODO: Implement actual file upload logic
        toast.info('Processando arquivos...')
       
    }

    return (
        <>
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 text-center">Upload de Extratos</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Extrato Bancário (CSV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload('bank', file)
                            }}
                        />
                        {bankStatementFile && (
                            <p className="text-sm text-gray-500 mt-2">
                                Arquivo selecionado: {bankStatementFile.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Extrato de Cartão de Crédito (CSV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload('credit', file)
                            }}
                        />
                        {creditCardFile && (
                            <p className="text-sm text-gray-500 mt-2">
                                Arquivo selecionado: {creditCardFile.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Extrato de Investimentos (CSV)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload('investment', file)
                            }}
                        />
                        {investmentFile && (
                            <p className="text-sm text-gray-500 mt-2">
                                Arquivo selecionado: {investmentFile.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={!bankStatementFile || !creditCardFile || !investmentFile}
                >
                    Processar Arquivos
                </Button>
            </div>

            <div>
              
            </div>
        </div>
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
                          {categorias[editingTransaction.categoria].map((subcategoria: string) => (
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
                  <Button >
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </>
    )
}
