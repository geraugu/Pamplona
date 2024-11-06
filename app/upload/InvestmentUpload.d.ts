import React from 'react'
import { Investimento } from './interfaces'

interface InvestmentUploadProps {
  onBack: () => void
  onUploadInvestments: (csvFile: File, investmentDate: string) => void
}

export declare function InvestmentUpload(props: InvestmentUploadProps): React.ReactElement
