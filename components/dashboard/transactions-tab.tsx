"use client"

import { useState, Dispatch, SetStateAction, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/Label"
import { Transaction, SavedBankTransaction } from "@/lib/interfaces"
import { formatCurrency, formatDate, monthNames } from "@/lib/utils"
import categorias from "@/lib/categorias.json"
import { doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore"
import { db } from "@/services/firebase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useToast } from "@/hooks/use-toast"
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface TransactionsTabProps {
  transactions: Transaction[];
  years: string[];
  months: string[];
  selectedYear: string;
  selectedMonth: string;
  selectedCategory: string;
  selectedSubcategory: string;
  selectedOrigin: string;
  setSelectedYear: (year: string) => void;
  setSelectedMonth: (month: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedSubcategory: (subcategory: string) => void;
  setSelectedOrigin: (origin: string) => void;
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  accountId: string;
}

interface CategoryTotal {
  categoria: string;
  total: number;
}

export function TransactionsTab({
  transactions,
  years,
  months,
  selectedYear,
  selectedMonth,
  selectedCategory,
  selectedSubcategory,
  selectedOrigin = 'all',
  setSelectedYear,
  setSelectedMonth,
  setSelectedCategory,
  setSelectedSubcategory,
  setSelectedOrigin = () => {},
  setTransactions,
  accountId
}: TransactionsTabProps) {
  const { toast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);

  // Updated filtering logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Year filtering
      const yearMatch = selectedYear === 'all' || 
        transaction.anoReferencia === parseInt(selectedYear);

      // Month filtering
      const monthMatch = selectedMonth === 'all' || 
        transaction.mesReferencia === parseInt(selectedMonth);

      // Category filtering
      const categoryMatch = selectedCategory === 'all' || 
        transaction.categoria === selectedCategory;

      // Subcategory filtering
      const subcategoryMatch = selectedSubcategory === 'all' || 
        transaction.subcategoria === selectedSubcategory;

      // Updated origin filtering
      const transactionOrigin = (transaction as SavedBankTransaction).origem || 'conta_bancaria';
      const originMatch = selectedOrigin === 'all' || transactionOrigin === selectedOrigin;

      return yearMatch && monthMatch && categoryMatch && subcategoryMatch && originMatch;
    });
  }, [
    transactions, 
    selectedYear, 
    selectedMonth, 
    selectedCategory, 
    selectedSubcategory, 
    selectedOrigin
  ]);

  // Derive available subcategories based on selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    return categorias[selectedCategory as keyof typeof categorias] || [];
  }, [selectedCategory]);

  // Derive available subcategories for editing transaction
  const editingTransactionSubcategories = useMemo(() => {
    if (!editingTransaction?.categoria) return [];
    return categorias[editingTransaction.categoria as keyof typeof categorias] || [];
  }, [editingTransaction?.categoria]);

  // Category totals for bar chart
  const categoryChartData = useMemo<CategoryTotal[]>(() => {
    const categorySums = filteredTransactions.reduce<Record<string, number>>((acc, transaction) => {
      if (transaction.categoria === 'Não contábil') return acc;
      if (transaction.categoria === 'Reserva') return acc;

      if (transaction.valor > 0) return acc;

      if (!acc[transaction.categoria]) {
        acc[transaction.categoria] = 0;
      }

      acc[transaction.categoria] += Math.abs(transaction.valor);
      return acc;
    }, {});

    return Object.entries(categorySums)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  // Calculation of totals
  const totalIncome = useMemo<number>(() => 
    filteredTransactions
      .filter(t => t.valor > 0 && t.categoria !== "Não contábil")
      .reduce((sum, t) => sum + t.valor, 0),
    [filteredTransactions]
  );

  const totalExpenses = useMemo<number>(() => 
    filteredTransactions
      .filter(t => t.valor < 0 && t.categoria !== "Não contábil")
      .reduce((sum, t) => sum + Math.abs(t.valor), 0),
    [filteredTransactions]
  );

  const totalInvestments = useMemo<number>(() => 
    filteredTransactions
      .filter(t => t.subcategoria === "Investimento")
      .reduce((sum, t) => sum + Math.abs(t.valor), 0),
    [filteredTransactions]
  );

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const transactionRef = doc(db, "transactions", editingTransaction.id);
      await updateDoc(transactionRef, {
        descricao: editingTransaction.descricao,
        valor: editingTransaction.valor,
        categoria: editingTransaction.categoria,
        subcategoria: editingTransaction.subcategoria,
      });

      // Update transactions in parent component
      setTransactions(prevTransactions => 
        prevTransactions.map(t => 
          t.id === editingTransaction.id ? {...t, ...editingTransaction} : t
        )
      );

      // Close dialog
      if (dialogCloseRef.current) {
        dialogCloseRef.current.click();
      }
      
      // Reset editing state
      setEditingTransaction(null);

      // Show success toast
      toast({
        title: "Transação Atualizada",
        description: "A transação foi atualizada com sucesso.",
        variant: "default"
      });
    } catch (err) {
      console.error("Error updating transaction:", err);
      
      // Show error toast
      toast({
        title: "Erro ao Atualizar",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const transactionRef = doc(db, "transactions", transactionToDelete);
      await deleteDoc(transactionRef);
      
      // Remove transaction from parent component's state
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => t.id !== transactionToDelete)
      );

      // Reset delete state
      setTransactionToDelete(null);

      // Show success toast
      toast({
        title: "Transação Excluída",
        description: "A transação foi excluída com sucesso.",
        variant: "default"
      });
    } catch (err) {
      console.error("Error deleting transaction:", err);
      setError("Erro ao excluir transação");
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (selectedMonth === 'all') return;

    try {
      const batch = writeBatch(db);
      const transactionsToDelete = transactions.filter(t => 
        t.mesReferencia === parseInt(selectedMonth) &&
        t.anoReferencia === parseInt(selectedYear)
      );

      transactionsToDelete.forEach(transaction => {
        const transactionRef = doc(db, "transactions", transaction.id);
        batch.delete(transactionRef);
      });

      await batch.commit();

      // Update transactions in parent component
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => 
          !(t.mesReferencia === parseInt(selectedMonth) && 
            t.anoReferencia === parseInt(selectedYear))
        )
      );

      // Show success toast
      toast({
        title: "Transações Excluídas",
        description: `Todas as transações de ${monthNames[selectedMonth as keyof typeof monthNames]} foram excluídas com sucesso.`,
        variant: "default"
      });
    } catch (err) {
      console.error("Error deleting transactions:", err);
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir as transações.",
        variant: "destructive"
      });
    }
  };

  // Function to determine row color based on transaction type
  const getRowColor = (transaction: Transaction) => {
    if (transaction.categoria === "Não contábil") return "bg-gray-100";
    if (transaction.subcategoria === "Investimento") return "bg-blue-100";
    if (transaction.valor > 0) return "bg-green-100";
    if (transaction.valor < 0) return "bg-red-100";
    return "";
  };

  const availableCategories = Object.keys(categorias);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transações</CardTitle>
          {selectedMonth !== 'all' && selectedYear !== 'all' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Excluir Transações do Mês
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja excluir todas as transações?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todas as transações de {monthNames[selectedMonth as keyof typeof monthNames]} serão permanentemente removidas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllTransactions}>
                    Excluir Todas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          {/* Year Filter */}
          <Select 
            value={selectedYear} 
            onValueChange={setSelectedYear}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month Filter */}
          <Select 
            value={selectedMonth} 
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {monthNames[month as keyof typeof monthNames]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select 
            value={selectedCategory} 
            onValueChange={(value: string) => {
              setSelectedCategory(value);
              if (value === 'all') {
                setSelectedSubcategory('all');
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Cat.</SelectItem>
              {availableCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subcategory Filter */}
          <Select 
            value={selectedSubcategory} 
            onValueChange={setSelectedSubcategory}
            disabled={selectedCategory === "all"}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Subcategoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Subc.</SelectItem>
              {availableSubcategories.map((subcategory: string) => (
                <SelectItem key={subcategory} value={subcategory}>
                  {subcategory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Origin Filter - Simplified */}
          <Select 
            value={selectedOrigin || 'all'} 
            onValueChange={(value: string) => {
              setSelectedOrigin(value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Fontes</SelectItem>
              <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
              <SelectItem value="conta_bancaria">Conta Bancária</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {/* Rest of the component remains the same */}
      <CardContent>
        {/* Totals Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInvestments)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Bar Chart */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Totais por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={categoryChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)} 
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Total']} 
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#8884d8" 
                    name="Total" 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500">
                Nenhuma categoria encontrada
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Subcategoria</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow 
                key={transaction.id} 
                className={getRowColor(transaction)}
              >
                  <TableCell>{formatDate(transaction.data.toDate())}</TableCell>
                  <TableCell>{transaction.descricao}</TableCell>
                  <TableCell>{transaction.categoria}</TableCell>
                  <TableCell>{transaction.subcategoria}</TableCell>
                  <TableCell>{transaction.parcela}</TableCell>
                  <TableCell>
                    {(transaction as SavedBankTransaction).origem === 'cartao_credito' 
                      ? 'Cartão de Crédito' 
                      : 'Conta Bancária'}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(transaction.valor)}</TableCell>
                <TableCell className="flex justify-center items-center space-x-2">
                  {/* Edit Transaction Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* Descrição */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="descricao" className="text-right">
                            Descrição
                          </Label>
                          <Input 
                            id="descricao" 
                            value={editingTransaction?.descricao || ''} 
                            onChange={(e) => setEditingTransaction(prev => 
                              prev ? {...prev, descricao: e.target.value} : null
                            )}
                            className="col-span-3" 
                          />
                        </div>

                        {/* Valor */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="valor" className="text-right">
                            Valor
                          </Label>
                          <Input 
                            id="valor" 
                            type="number" 
                            value={editingTransaction?.valor || ''} 
                            onChange={(e) => setEditingTransaction(prev => 
                              prev ? {...prev, valor: parseFloat(e.target.value)} : null
                            )}
                            className="col-span-3" 
                          />
                        </div>

                        {/* Categoria */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Categoria</Label>
                          <Select
                            value={editingTransaction?.categoria}
                            onValueChange={(value) => setEditingTransaction(prev => 
                              prev ? {...prev, categoria: value, subcategoria: ''} : null
                            )}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Subcategoria */}
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Subcategoria</Label>
                          <Select
                            value={editingTransaction?.subcategoria}
                            onValueChange={(value) => setEditingTransaction(prev => 
                              prev ? {...prev, subcategoria: value} : null
                            )}
                            disabled={!editingTransaction?.categoria}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Selecione a subcategoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {editingTransactionSubcategories.map((subcategory: string) => (
                                <SelectItem key={subcategory} value={subcategory}>
                                  {subcategory}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <DialogFooter>
                          <Button 
                            type="submit"
                            onClick={handleUpdateTransaction}
                          >
                            Salvar
                          </Button>
                          <DialogClose ref={dialogCloseRef} className="hidden" />
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Delete Transaction Confirmation */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setTransactionToDelete(transaction.id)}
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja excluir esta transação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A transação será permanentemente removida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTransaction}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Error Display */}
        {error && (
          <div className="mt-4 text-red-500 text-center">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
