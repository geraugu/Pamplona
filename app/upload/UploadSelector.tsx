"use client"

import { Button } from "components/ui/button"

interface UploadSelectorProps {
  onSelectUploadType: (type: 'credit_card' | 'investment' | 'bank_statement') => void
}

export function UploadSelector({ onSelectUploadType }: UploadSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Button 
        variant="outline" 
        onClick={() => onSelectUploadType('credit_card')}
        className="h-40 flex flex-col items-center justify-center"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="mb-2"
        >
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
        Upload Cartão de Crédito (PDF)
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onSelectUploadType('investment')}
        className="h-40 flex flex-col items-center justify-center"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="mb-2"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        Upload Investimentos (CSV)
      </Button>
      <Button 
        variant="outline" 
        onClick={() => onSelectUploadType('bank_statement')}
        className="h-40 flex flex-col items-center justify-center"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="mb-2"
        >
          <rect width="18" height="10" x="3" y="14" rx="2" />
          <path d="M3 6h18" />
          <path d="M7 6V4h10v2" />
        </svg>
        Upload Extrato Bancário (CSV)
      </Button>
    </div>
  )
}
