import React from 'react'

interface InvestmentUploadProps {
  onBack: () => void
  onUploadInvestments: (csvFile: File, investmentDate: string) => void
}

export declare function InvestmentUpload(props: InvestmentUploadProps): React.ReactElement
