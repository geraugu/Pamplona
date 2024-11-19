'use client'

import React, { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { useToast } from '@/app/components/hooks/use-toast'

export default function UploadInfoPage() {
  const [bankStatementFile, setBankStatementFile] = useState<File | null>(null)
  const [creditCardFile, setCreditCardFile] = useState<File | null>(null)
  const [investmentFile, setInvestmentFile] = useState<File | null>(null)
  const { toast } = useToast()

  const handleFileUpload = (type: 'bank' | 'credit' | 'investment', file: File) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel']
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Erro de Upload',
        description: 'Por favor, selecione um arquivo CSV válido.',
        variant: 'destructive'
      })
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
      toast({
        title: 'Arquivos Incompletos',
        description: 'Por favor, faça upload de todos os três arquivos.',
        variant: 'destructive'
      })
      return
    }

    // TODO: Implement actual file upload logic
    toast({
      title: 'Upload Iniciado',
      description: 'Processando arquivos...',
      variant: 'default'
    })
  }

  return (
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
    </div>
  )
}
