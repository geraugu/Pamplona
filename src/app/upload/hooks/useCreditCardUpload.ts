import { useState } from 'react'
import { Transacao, CategoriaKeys } from '../../components/lib/interfaces'
import * as pdfjsLib from 'pdfjs-dist';
import { findMatchingCategory } from '../utils/categoryUtils'
import { TextItem } from 'pdfjs-dist/types/src/display/api'


interface UseCreditCardUploadProps {
  categoryMapping: {[key: string]: { categoria: CategoriaKeys; subcategoria: string; count: number }}
  recentTransactions: Array<{ descricao: string; categoria: CategoriaKeys | null; subcategoria: string | null }>
  onUpdateCategoryMapping: (desc: string, categoria: CategoriaKeys, subcategoria: string) => void
}

export function useCreditCardUpload({
  categoryMapping,
  recentTransactions,
  onUpdateCategoryMapping
}: UseCreditCardUploadProps) {
  const [error, setError] = useState<string | null>(null)

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
        const cidade = ''
        let parcelaInfo: string | undefined = undefined
        const descricaoTrimmed = descricao.trim()
        const categoryMatch = findMatchingCategory(descricaoTrimmed, categoryMapping, recentTransactions)

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
          onUpdateCategoryMapping(
            normalizedDesc,
            transaction.categoria,
            transaction.subcategoria || ''
          )
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
        const pageText = textContent.items
          .map((item) => {
            if ('str' in item) {
              return (item as TextItem).str
            }
            return ''
          })
          .join(' ')
        fullText += pageText + '\n'
      }

      const extractedTransactions = await extractCreditCardTransactions(fullText, selectedMonth, selectedYear)
      return extractedTransactions
    } catch (error: unknown) {
      console.error("Error processing PDF:", error)
      setError(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  return {
    processCreditCardPdf,
    error,
    setError
  }
}
