'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Transacao, CategoriaKeys } from '../components/lib/interfaces'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import categorias from '../components/lib/categorias.json'
import * as pdfjsLib from 'pdfjs-dist'
import { TextItem } from 'pdfjs-dist/types/src/display/api'

export default function UploadInfoPage() {
    const [creditCardFile, setCreditCardFile] = useState<File | null>(null)
    const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null)
   
    useEffect(() => {
         pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`
        // pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist/build/${pdfjsLib.version}/pdf.worker.min.js`
    }, [])

    const processCreditCardPdf = async (file: File) => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let fullText = ''
  
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .filter((item): item is TextItem => 'str' in item)
            .map((item: TextItem) => item.str)
            .join(' ')
          fullText += pageText + '\n'
        }
  
        console.log(fullText)
  
        // const extractedTransactions = await extractCreditCardTransactions(fullText, selectedMonth, selectedYear)
        // setTransactions(extractedTransactions)
        // return extractedTransactions
      } catch (error: unknown) {
        console.error("Error processing PDF:", error)
        // setError(`Erro ao processar PDF: ${error.message}`)
        return []
      }
    }

    const handleFileUpload = (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Por favor, selecione um arquivo PDF para o extrato de cartão de crédito.')
            return
        }

        setCreditCardFile(file)
    }

    const handleSubmit = () => {
        if (!creditCardFile) {
            toast.error('Por favor, faça upload do extrato de cartão de crédito em PDF.')
            return
        }

        processCreditCardPdf(creditCardFile)
    }

    return (
        <>
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6 text-center">Upload de Extrato de Cartão de Crédito</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Extrato de Cartão de Crédito (PDF)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(file)
                            }}
                        />
                        {creditCardFile && (
                            <p className="text-sm text-gray-500 mt-2">
                                Arquivo selecionado: {creditCardFile.name}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Button
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={!creditCardFile}
                >
                    Processar Arquivo PDF
                </Button>
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTransaction({
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTransaction({
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
