"use client"
export const dynamic = 'force-dynamic';

import { useState, ChangeEvent, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { toast } from 'sonner'

// import { useUploadManager } from './useUploadManager'
// import { UploadSelector } from './UploadSelector'
// import { CreditCardUpload } from './CreditCardUpload'
// import { InvestmentUpload } from './InvestmentUpload'
// import { BankStatementUpload } from './BankStatementUpload'
// import { findMatchingCategory } from './utils/categoryUtils'

// import TransactionTable from './TransactionTable'
// import InvestmentTable from './InvestmentTable'
import { Transacao, CategoriaKeys } from '../components/lib/interfaces'
import categorias from '../components/lib/categorias.json'

// Import PDF.js
import * as pdfjsLib from 'pdfjs-dist'

export default function UploadPage() {
  const [uploadType, setUploadType] = useState<'none' | 'credit_card' | 'investment' | 'bank_statement'>('none')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear] = useState<number>(new Date().getFullYear())
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null)
  const [showOnlyUncategorized, setShowOnlyUncategorized] = useState<boolean>(true)

  return (
    <>
      <Label>teste</Label>
    </>
  )
}
