"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Investment } from "@/lib/interfaces"
import { formatCurrency, formatDate } from "@/lib/utils"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/services/firebase"
import { useAuth } from "@/components/auth/authContext"

export function InvestmentsTab() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { accountId } = useAuth();

  // Get unique dates from investments
  const dates = Array.from(new Set(investments.map(inv => 
    formatDate(inv.dataReferencia.toDate())
  ))).sort().reverse();

  useEffect(() => {
    if (!accountId) return;

    const fetchInvestments = async () => {
      try {
        setLoading(true);
        const investmentsRef = collection(db, "investments");
        const q = query(
          investmentsRef,
          where("accountId", "==", accountId),
          orderBy("dataReferencia", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedInvestments = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Investment[];

        setInvestments(fetchedInvestments);

        // Set initial selected date
        if (fetchedInvestments.length > 0 && !selectedDate) {
          setSelectedDate(formatDate(fetchedInvestments[0].dataReferencia.toDate()));
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching investments:", err);
        setError("Erro ao carregar investimentos");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, [accountId]);

  const filteredInvestments = investments.filter(inv => 
    !selectedDate || formatDate(inv.dataReferencia.toDate()) === selectedDate
  );

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Investimentos</CardTitle>
        <div className="flex gap-4 mt-4">
          <Select value={selectedDate || ""} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione a data" />
            </SelectTrigger>
            <SelectContent>
              {dates.map(date => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mercado</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço Custo</TableHead>
              <TableHead>Fin. Custo</TableHead>
              <TableHead>Preço Atual</TableHead>
              <TableHead>Fin. Mercado</TableHead>
              <TableHead>L/P a Realizar</TableHead>
              <TableHead>% L/P</TableHead>
              <TableHead>% Carteira</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvestments.map((investment) => (
              <TableRow key={investment.id}>
                <TableCell>{investment.Mercado}</TableCell>
                <TableCell>{investment.Ativo}</TableCell>
                <TableCell>{investment.QTD}</TableCell>
                <TableCell>{formatCurrency(investment["PU Custo"])}</TableCell>
                <TableCell>{formatCurrency(investment["Fin. Custo"])}</TableCell>
                <TableCell>{formatCurrency(investment["PU Atual"])}</TableCell>
                <TableCell>{formatCurrency(investment["Fin. Mercado"])}</TableCell>
                <TableCell>{formatCurrency(investment["L/P a Realizar"])}</TableCell>
                <TableCell>{investment["% L/P"].toFixed(2)}%</TableCell>
                <TableCell>{investment["% Carteira"].toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
