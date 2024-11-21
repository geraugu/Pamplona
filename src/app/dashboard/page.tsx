"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { useAuth } from "../components/auth/authContext"
import { db } from "../services/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { Transaction } from "../components/lib/interfaces"
import { monthNames } from "../components/lib/utils"
import { OverviewTab } from "./tabs/overview-tab"
import { TransactionsTab } from "./tabs/transactions-tab"
import Link from "next/link"
// import { InvestmentsTab } from "./tabs/investments-tab"
import { AnalysesTab } from "./tabs/analyses-tab"

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("all");
  const { user, accountId, loading: authLoading } = useAuth();

  // Get available years and months from transactions
  const dates = transactions.map(t => {
    return {
      year: t.anoReferencia.toString(),
      month: t.mesReferencia.toString(),
    };
  });
  const years = Array.from(new Set(dates.map(d => d.year))).sort().reverse();
  const months = Array.from(new Set(dates.filter(d => d.year === selectedYear).map(d => d.month.toString().padStart(2, '0')))).sort().reverse();

  // Set default selections when transactions load
  useEffect(() => {
    if (transactions.length > 0 && !selectedYear) {
      const latestTransaction = transactions[0];
      setSelectedYear(latestTransaction.anoReferencia.toString());
      setSelectedMonth(latestTransaction.mesReferencia.toString().padStart(2, '0'));
    }
  }, [transactions, selectedYear]);

  // Filter transactions by selected year, month, category, subcategory, and origin
  const filteredTransactions = transactions.filter(t => {
    if (!selectedYear || !selectedMonth) return false;
    const yearMatch = t.anoReferencia === parseInt(selectedYear);
    const monthMatch = t.mesReferencia === parseInt(selectedMonth);
    const categoryMatch = selectedCategory === "all" || t.categoria === selectedCategory;
    const subcategoryMatch = selectedSubcategory === "all" || t.subcategoria === selectedSubcategory;
    const transactionOrigin = t.origem || 'conta_bancaria';
    const originMatch = selectedOrigin === "all" || transactionOrigin === selectedOrigin;
    return yearMatch && monthMatch && categoryMatch && subcategoryMatch && originMatch;
  }).sort((a, b) => b.data.toDate().getTime() - a.data.toDate().getTime());

  // Calculate totals for the selected month
  const totalExpenses = filteredTransactions.reduce((acc, t) => acc + t.valor, 0);
  const totalIncome = 0; // You might want to add an income field to transactions later

  useEffect(() => {
    // If authentication is still loading, do nothing
    if (authLoading) {
      return;
    }

    // If no account ID, do nothing (it might be in the process of being created)
    if (!accountId) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const transactionsRef = collection(db, "transactions");
        const q = query(
          transactionsRef,
          where("accountId", "==", accountId),
          orderBy("data", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedTransactions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];

        setTransactions(fetchedTransactions);
        setError(null);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        setError("Erro ao carregar transações");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId, authLoading]);

  const getSelectedMonthName = () => {
    if (!selectedMonth) return "";
    const monthKey = selectedMonth.toString().padStart(2, '0');
    return monthNames[monthKey as keyof typeof monthNames] || "";
  };

  // Show loading state while authentication is being resolved
  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  // If no user is logged in, show a message with a login link
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-600">
        Você não está logado. Por favor, faça  <Link href="/login" className="text-blue-600 hover:underline"> login </Link>  para acessar o dashboard.
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList 
            className="grid grid-cols-4 bg-neutral-100 p-1 rounded-lg"
            style={{
              gridTemplateColumns: 'repeat(4, 1fr)',
            }}
          >
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-white rounded-md transition-colors"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-white rounded-md transition-colors"
            >
              Transações
            </TabsTrigger>
            <TabsTrigger 
              value="investments" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-white rounded-md transition-colors"
            >
              Investimentos
            </TabsTrigger>
            <TabsTrigger 
              value="analyses" 
              className="data-[state=active]:bg-secondary data-[state=active]:text-white rounded-md transition-colors"
            >
              Análises
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab 
              transactions={transactions}
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              selectedMonthName={getSelectedMonthName()}
              filteredTransactions={filteredTransactions}
            />
          </TabsContent>
          <TabsContent value="transactions">
            <TransactionsTab 
              transactions={transactions}
              years={years}
              months={months}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              selectedOrigin={selectedOrigin}
              setSelectedYear={setSelectedYear}
              setSelectedMonth={setSelectedMonth}
              setSelectedCategory={setSelectedCategory}
              setSelectedSubcategory={setSelectedSubcategory}
              setSelectedOrigin={setSelectedOrigin}
              setTransactions={setTransactions}
              accountId={accountId || ''}
            />
          </TabsContent>
          <TabsContent value="investments">
            {/* <InvestmentsTab /> */}
          </TabsContent>
          <TabsContent value="analyses">
            <AnalysesTab transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
