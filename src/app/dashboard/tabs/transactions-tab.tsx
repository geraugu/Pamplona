"use client"

import { useState, Dispatch, SetStateAction, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "../../components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../components/ui/alert-dialog"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Transaction } from  "../../components/lib/interfaces" 
import { formatCurrency, formatDate, monthNames } from "../../components/lib/utils"
import categorias from "../../components/lib/categorias.json"
import { doc, updateDoc, deleteDoc, writeBatch, collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "../../services/firebase"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useToast } from "../../components/hooks/use-toast"
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

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

interface NewTransaction {
  descricao: string;
  valor: number;
  categoria: string;
  subcategoria: string;
  origem: 'cartao_credito' | 'conta_bancaria' | 'bank-statement';
  data: Date;
  parcela: string | null;
  anotacao: string | null;
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
  const newTransactionDialogCloseRef = useRef<HTMLButtonElement>(null);
  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    descricao: '',
    valor: 0,
    categoria: '',
    subcategoria: '',
    origem: 'conta_bancaria',
    data: new Date(),
    parcela: null,
    anotacao: null
  });

  // Filtered transactions by date only for card totals
  const dateFilteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Year filtering
      const yearMatch = selectedYear === 'all' || 
        transaction.anoReferencia === parseInt(selectedYear);

      // Month filtering
      const monthMatch = selectedMonth === 'all' || 
        transaction.mesReferencia === parseInt(selectedMonth);

      return yearMatch && monthMatch;
    });
  }, [transactions, selectedYear, selectedMonth]);

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
      const transactionOrigin = transaction.origem || 'conta_bancaria';
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

  // Calculation of totals (only affected by date filters)
  const totalIncome = useMemo<number>(() => 
    dateFilteredTransactions
      .filter(t => t.valor > 0 && t.categoria !== "Não contábil")
      .reduce((sum, t) => sum + t.valor, 0),
    [dateFilteredTransactions]
  );

  const totalExpenses = useMemo<number>(() => 
    dateFilteredTransactions
      .filter(t => t.valor < 0 && t.categoria !== "Não contábil" && t.categoria !== "Reserva")
      .reduce((sum, t) => sum + Math.abs(t.valor), 0),
    [dateFilteredTransactions]
  );

  const totalInvestments = useMemo<number>(() => 
    dateFilteredTransactions
      .filter(t => t.subcategoria === "Investimento" && t.valor < 0)
      .reduce((sum, t) => sum + Math.abs(t.valor), 0),
    [dateFilteredTransactions]
  );

  const totalRedemptions = useMemo<number>(() => 
    dateFilteredTransactions
      .filter(t => t.subcategoria === "Resgate investimentos" && t.valor > 0)
      .reduce((sum, t) => sum + t.valor, 0),
    [dateFilteredTransactions]
  );

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

  // Derive available subcategories for new transaction
  const newTransactionSubcategories = useMemo(() => {
    if (!newTransaction.categoria) return [];
    return categorias[newTransaction.categoria as keyof typeof categorias] || [];
  }, [newTransaction.categoria]);

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

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const transactionRef = doc(db, "transactions", editingTransaction.id);
      await updateDoc(transactionRef, {
        descricao: editingTransaction.descricao,
        valor: editingTransaction.valor,
        categoria: editingTransaction.categoria,
        subcategoria: editingTransaction.subcategoria,
        data: editingTransaction.data,
        mesReferencia: editingTransaction.mesReferencia,
        anoReferencia: editingTransaction.anoReferencia,
        anotacao: editingTransaction.anotacao || null
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

  const handleCreateTransaction = async () => {
    if (!newTransaction.descricao || !newTransaction.categoria || !newTransaction.subcategoria) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const transactionDate = newTransaction.data;
      const transactionData: Omit<Transaction, 'id'> = {
        descricao: newTransaction.descricao,
        valor: newTransaction.valor,
        categoria: newTransaction.categoria,
        subcategoria: newTransaction.subcategoria,
        data: Timestamp.fromDate(transactionDate),
        mesReferencia: transactionDate.getMonth() + 1,
        anoReferencia: transactionDate.getFullYear(),
        parcela: newTransaction.parcela || null,
        origem: newTransaction.origem === 'bank-statement' ? 'bank-statement' : newTransaction.origem,
        pais: 'Brasil',
        accountId,
        anotacao: newTransaction.anotacao
      };

      const docRef = await addDoc(collection(db, "transactions"), transactionData);
      
      // Add the new transaction to the local state
      const newTransactionWithId: Transaction = {
        ...transactionData,
        id: docRef.id,
      };
      
      setTransactions(prev => [...prev, newTransactionWithId]);

      // Close dialog
      if (newTransactionDialogCloseRef.current) {
        newTransactionDialogCloseRef.current.click();
      }

      // Reset form
      setNewTransaction({
        descricao: '',
        valor: 0,
        categoria: '',
        subcategoria: '',
        origem: 'conta_bancaria',
        data: new Date(),
        parcela: null,
        anotacao: null
      });

      // Show success toast
      toast({
        title: "Transação Criada",
        description: "A transação foi criada com sucesso.",
        variant: "default"
      });
    } catch (err) {
      console.error("Error creating transaction:", err);
      
      // Show error toast
      toast({
        title: "Erro ao Criar",
        description: "Não foi possível criar a transação.",
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
        t.anoReferencia === parseInt(selectedYear) &&
        // Add origin filter
        (selectedOrigin === 'all' || 
         (t.origem || 'conta_bancaria') === selectedOrigin)
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
            t.anoReferencia === parseInt(selectedYear) &&
            // Apply the same origin filter when updating local state
            (selectedOrigin === 'all' || 
             (t.origem || 'conta_bancaria') === selectedOrigin))
        )
      );

      // Show success toast with origin information
      const originText = selectedOrigin === 'all' 
        ? 'de todas as fontes' 
        : (selectedOrigin === 'cartao_credito' 
          ? 'do Cartão de Crédito' 
          : 'da Conta Bancária');

      toast({
        title: "Transações Excluídas",
        description: `Todas as transações de ${monthNames[selectedMonth as keyof typeof monthNames]} ${originText} foram excluídas com sucesso.`,
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
          <div className="flex gap-2">
            {/* New Transaction Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setNewTransaction({
                    descricao: '',
                    valor: 0,
                    categoria: '',
                    subcategoria: '',
                    origem: 'conta_bancaria',
                    data: new Date(),
                    parcela: null,
                    anotacao: null
                  })}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Data */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data" className="text-right">
                      Data
                    </Label>
                    <Input 
                      id="data" 
                      type="date"
                      value={newTransaction.data.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const newDate = new Date(e.target.value);
                        setNewTransaction(prev => ({
                          ...prev,
                          data: newDate
                        }))
                      }}
                      className="col-span-3" 
                    />
                  </div>

                  {/* Descrição */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descricao" className="text-right">
                      Descrição
                    </Label>
                    <Input 
                      id="descricao" 
                      type="text"
                      value={newTransaction.descricao}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        descricao: e.target.value
                      }))}
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
                      value={newTransaction.valor}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        valor: parseFloat(e.target.value)
                      }))}
                      className="col-span-3" 
                    />
                  </div>

                  {/* Categoria */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Categoria</Label>
                    <Select
                      value={newTransaction.categoria}
                      onValueChange={(value) => setNewTransaction(prev => ({
                        ...prev,
                        categoria: value,
                        subcategoria: ''
                      }))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
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
                      value={newTransaction.subcategoria}
                      onValueChange={(value) => setNewTransaction(prev => ({
                        ...prev,
                        subcategoria: value
                      }))}
                      disabled={!newTransaction.categoria}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a subcategoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {newTransactionSubcategories.map((subcategory: string) => (
                          <SelectItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Origem */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Origem</Label>
                    <Select
                      value={newTransaction.origem}
                      onValueChange={(value: 'cartao_credito' | 'conta_bancaria') => 
                        setNewTransaction(prev => ({
                          ...prev,
                          origem: value
                        }))
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a origem" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="conta_bancaria">Conta Bancária</SelectItem>
                        <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Parcela (opcional) */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="parcela" className="text-right">
                      Parcela
                    </Label>
                    <Select
                      value={newTransaction.parcela || ''} 
                      onValueChange={(value) => setNewTransaction(prev => ({
                        ...prev,
                        parcela: value || null
                      }))}
                    />
                  </div>

                  {/* Anotação (opcional) */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="anotacao" className="text-right">
                      Anotação
                    </Label>
                    <Input 
                      id="anotacao" 
                      value={newTransaction.anotacao || ''} 
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        anotacao: e.target.value
                      }))}
                      className="col-span-3" 
                      placeholder="Adicione uma anotação (opcional)"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="submit"
                    onClick={handleCreateTransaction}
                  >
                    Criar
                  </Button>
                  <DialogClose ref={newTransactionDialogCloseRef} className="hidden" />
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {selectedMonth !== 'all' && selectedYear !== 'all' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    Excluir Transações do Mês
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent  className="bg-white">
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
            <SelectContent className="bg-white">
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
            <SelectContent className="bg-white">
              <SelectItem value="all">Todos os Meses</SelectItem>
              {months.map((month, index) => (
                <SelectItem key={`${month}-${index}`} value={month}>
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
            <SelectContent className="bg-white">
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
            <SelectContent className="bg-white">
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
            <SelectContent className="bg-white">
              <SelectItem value="all">Todas Fontes</SelectItem>
              <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
              <SelectItem value="conta_bancaria">Conta Bancária</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Consolidated Totals Cards */}
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          {/* Receitas e Despesas Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas e Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Receitas: {formatCurrency(totalIncome)}</div>
              <div className="text-2xl font-bold text-red-600">Despesas: {formatCurrency(totalExpenses)}</div>
              <div className="text-2xl font-bold mt-2 border-t pt-2">
                Resultado: {formatCurrency(totalIncome - totalExpenses)}
              </div>
            </CardContent>
          </Card>

          {/* Investimentos Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Investimentos: {formatCurrency(totalInvestments)}</div>
              <div className="text-2xl font-bold text-purple-600">Resgates: {formatCurrency(totalRedemptions)}</div>
              <div className="text-2xl font-bold mt-2 border-t pt-2">
                Resultado: {formatCurrency(totalInvestments - totalRedemptions)}
              </div>
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
              <TableHead>Valor</TableHead>
              <TableHead>Anotação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction, index) => (
              <TableRow 
                key={`${transaction.id}-${index}`} 
                className={`${getRowColor(transaction)} ${transaction.parcela ? 'bg-yellow-100' : ''}`}
              >
                <TableCell>{formatDate(transaction.data.toDate())}</TableCell>
                <TableCell>
                  {transaction.descricao}
                  {transaction.parcela && (
                    <span className="text-sm text-gray-500"> ({transaction.parcela})</span>
                  )}
                </TableCell>
                <TableCell>{transaction.categoria}</TableCell>
                <TableCell>{transaction.subcategoria}</TableCell>
                <TableCell className={transaction.valor >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(transaction.valor)}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={transaction.anotacao || ''}>
                    {transaction.anotacao}
                  </div>
                </TableCell>
                <TableCell className="flex gap-2">
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
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                      </DialogHeader>
                      {editingTransaction && (
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-descricao" className="text-right">
                              Descrição
                            </Label>
                            <Input
                              id="edit-descricao"
                              value={editingTransaction.descricao}
                              className="col-span-3"
                              onChange={(e) => setEditingTransaction({
                                ...editingTransaction,
                                descricao: e.target.value
                              })}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-anotacao" className="text-right">
                              Anotação
                            </Label>
                            <Input
                              id="edit-anotacao"
                              value={editingTransaction.anotacao || ''}
                              className="col-span-3"
                              onChange={(e) => setEditingTransaction({
                                ...editingTransaction,
                                anotacao: e.target.value
                              })}
                              placeholder="Adicione uma anotação (opcional)"
                            />
                          </div>
                          {/* Data */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="data" className="text-right">
                              Data
                            </Label>
                            <Input 
                              id="data" 
                              type="date"
                              value={editingTransaction?.data.toDate().toISOString().split('T')[0] || ''}
                              onChange={(e) => {
                                const newDate = new Date(e.target.value);
                                setEditingTransaction(prev => 
                                  prev ? {
                                    ...prev, 
                                    data: Timestamp.fromDate(newDate),
                                    mesReferencia: newDate.getMonth() + 1,
                                    anoReferencia: newDate.getFullYear()
                                  } : null
                                )
                              }}
                              className="col-span-3" 
                            />
                          </div>

                          {/* Mês de Referência */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="mesReferencia" className="text-right">
                              Mês Ref.
                            </Label>
                            <Input 
                              id="mesReferencia" 
                              type="number"
                              min="1"
                              max="12"
                              value={editingTransaction?.mesReferencia || ''}
                              onChange={(e) => setEditingTransaction(prev => 
                                prev ? {...prev, mesReferencia: parseInt(e.target.value)} : null
                              )}
                              className="col-span-3" 
                            />
                          </div>

                          {/* Ano de Referência */}
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="anoReferencia" className="text-right">
                              Ano Ref.
                            </Label>
                            <Input 
                              id="anoReferencia" 
                              type="number"
                              min="2000"
                              max="2100"
                              value={editingTransaction?.anoReferencia || ''}
                              onChange={(e) => setEditingTransaction(prev => 
                                prev ? {...prev, anoReferencia: parseInt(e.target.value)} : null
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
                              <SelectContent className="bg-white">
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
                              <SelectContent className="bg-white">
                                {editingTransactionSubcategories.map((subcategory: string) => (
                                  <SelectItem key={subcategory} value={subcategory}>
                                    {subcategory}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button 
                          type="submit"
                          onClick={handleUpdateTransaction}
                        >
                          Salvar
                        </Button>
                        <DialogClose ref={dialogCloseRef} className="hidden" />
                      </DialogFooter>
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
                    <AlertDialogContent className="bg-white">
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
