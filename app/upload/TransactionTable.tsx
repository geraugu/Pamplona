import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import categorias from '@/lib/categorias.json'
import { Transacao, CategoriaKeys } from './interfaces'

interface TransactionTableProps {
  transactions: Transacao[]
  onEdit: (transaction: Transacao) => void
  onDelete: (id: number) => void
  onCategoryChange?: (id: number, category: CategoriaKeys) => void
  onSubcategoryChange?: (id: number, subcategory: string) => void
}

  // Function to determine row color based on transaction type
  const getRowColor = (transaction: Transacao) => {
    if (transaction.categoria === "Não contábil") return "bg-gray-100";
    if (transaction.subcategoria === "Investimento") return "bg-blue-100";
    if (transaction.valor > 0) return "bg-green-100";
    if (transaction.valor < 0) return "bg-red-100";
    return "";
  };

export default function TransactionTable({ 
  transactions, 
  onEdit, 
  onDelete,
  onCategoryChange,
  onSubcategoryChange
}: TransactionTableProps) {
  return (
    <div className="mt-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Parcela</TableHead>
            <TableHead>País</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Subcategoria</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
             <TableRow 
             key={transaction.id} 
             className={getRowColor(transaction)}
           >
              <TableCell>{transaction.data}</TableCell>
              <TableCell>{transaction.descricao}</TableCell>
              <TableCell>{transaction.parcela}</TableCell>
              <TableCell>{transaction.pais}</TableCell>
              <TableCell>R$ {transaction.valor.toFixed(2)}</TableCell>
              <TableCell>
                <Select
                  value={transaction.categoria || undefined}
                  onValueChange={(value) => onCategoryChange?.(transaction.id, value as CategoriaKeys)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(categorias).map((categoria) => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={transaction.subcategoria || undefined}
                  onValueChange={(value) => onSubcategoryChange?.(transaction.id, value)}
                  disabled={!transaction.categoria}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {transaction.categoria &&
                      categorias[transaction.categoria].map((subcategoria) => (
                        <SelectItem key={subcategoria} value={subcategoria}>
                          {subcategoria}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(transaction)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
