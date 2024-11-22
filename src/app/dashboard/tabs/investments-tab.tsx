"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Investment } from "../../components/lib/interfaces"
import { formatCurrency, formatDate } from "../../components/lib/utils"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../services/firebase"
import { useAuth } from "../../components/auth/authContext"

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

  const parseExpirationDate = (ativo: string): Date | null => {
    const match = ativo.match(/Venc:(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  };

  const parseIssueDate = (ativo: string): Date | null => {
    const match = ativo.match(/Emiss:(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const [, day, month, year] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  };

  const filteredInvestments = investments
    .filter(inv => !selectedDate || formatDate(inv.dataReferencia.toDate()) === selectedDate)
    .sort((a, b) => {
      // First, sort by market order
      const marketOrder = [
        '\'Titulo Privado\'', 
        '\'Tesouro Direto\'', 
        '\'Ações a Vista\''
      ];
      
      const aIndex = marketOrder.indexOf(a.Mercado);
      const bIndex = marketOrder.indexOf(b.Mercado);
      
      // If market order is different, use that
      if (aIndex !== bIndex) return aIndex - bIndex;

      // Then, prioritize investments with upcoming expiration dates
      const aExpDate = parseExpirationDate(a.Ativo);
      const bExpDate = parseExpirationDate(b.Ativo);
      const now = new Date();

      // If both have expiration dates, sort by proximity to current date
      if (aExpDate && bExpDate) {
        const aDiff = Math.abs(aExpDate.getTime() - now.getTime());
        const bDiff = Math.abs(bExpDate.getTime() - now.getTime());
        return aDiff - bDiff;
      }

      // Investments with expiration dates come first
      if (aExpDate) return -1;
      if (bExpDate) return 1;

      // If no expiration dates, maintain original order
      return 0;
    });

  // Rest of the code remains the same as in the previous implementation...
  // (Keeping the entire original implementation, just modified the sorting logic)
  const tituloPrivadoInvestments = filteredInvestments.filter(inv => 
    inv.Mercado === '\'Titulo Privado\''
  );

  const totalFinCustoTituloPrivado = tituloPrivadoInvestments.reduce((total, inv) => 
    total + (inv["Fin. Custo"] || 0), 0);
  const totalFinMercado = tituloPrivadoInvestments.reduce((total, inv) => 
    total + (inv["Fin. Mercado"] || 0), 0);

  const totalLPRealizarTituloPrivado = tituloPrivadoInvestments.reduce((total, inv) => 
    total + (inv["L/P a Realizar"] || 0), 0);

  const percentLPTituloPrivado = totalFinCustoTituloPrivado !== 0 
    ? (totalLPRealizarTituloPrivado / totalFinCustoTituloPrivado) * 100 
    : 0;

  // Tesouro Direto calculations
  const tesouroDiretoInvestments = filteredInvestments.filter(inv => 
    inv.Mercado === '\'Tesouro Direto\''
  );

  const totalFinCustoTesouroDireto = tesouroDiretoInvestments.reduce((total, inv) => 
    total + (inv["Fin. Custo"] || 0), 0);

  const totalFinMercadoTesouroDireto = tesouroDiretoInvestments.reduce((total, inv) => 
    total + (inv["Fin. Mercado"] || 0), 0);

  const totalLPRealizarTesouroDireto = tesouroDiretoInvestments.reduce((total, inv) => 
    total + (inv["L/P a Realizar"] || 0), 0);

  const percentLPTesouroDireto = totalFinCustoTesouroDireto !== 0 
    ? (totalLPRealizarTesouroDireto / totalFinCustoTesouroDireto) * 100 
    : 0;

  // Ações a Vista calculations
  const acoesAVistaInvestments = filteredInvestments.filter(inv => 
    inv.Mercado === '\'Ações a Vista\''
  );

  const totalFinCustoAcoesAVista = acoesAVistaInvestments.reduce((total, inv) => 
    total + (inv["Fin. Custo"] || 0), 0);
  const totalFinMercadoAcoesAVista = acoesAVistaInvestments.reduce((total, inv) => 
    total + (inv["Fin. Mercado"] || 0), 0);

  const totalLPRealizarAcoesAVista = acoesAVistaInvestments.reduce((total, inv) => 
    total + (inv["L/P a Realizar"] || 0), 0);

  const percentLPAcoesAVista = totalFinCustoAcoesAVista !== 0 
    ? (totalLPRealizarAcoesAVista / totalFinCustoAcoesAVista) * 100 
    : 0;

  // Total calculations
  const totalFinCusto = filteredInvestments.reduce((total, inv) => 
    total + (inv["Fin. Custo"] || 0), 0);
  const totalFinMercadoTodos = filteredInvestments.reduce((total, inv) => 
    total + (inv["Fin. Mercado"] || 0), 0);

  const totalLPRealizar = filteredInvestments.reduce((total, inv) => 
    total + (inv["L/P a Realizar"] || 0), 0);

  const percentLPTotal = totalFinCusto !== 0 
    ? (totalLPRealizar / totalFinCusto) * 100 
    : 0;

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Market color mapping
  const marketColorMap: Record<string, string> = {
    '\'Titulo Privado\'': 'bg-blue-50 hover:bg-blue-100',
    '\'Tesouro Direto\'': 'bg-green-50 hover:bg-green-100',
    '\'Ações a Vista\'': 'bg-yellow-50 hover:bg-yellow-100'
  };

  // Market color mapping for current year investments
  const currentYear = new Date().getFullYear();
  const marketColorMapCurrentYear: Record<string, string> = {
    '\'Titulo Privado\'': 'bg-blue-200 hover:bg-blue-300',
    '\'Tesouro Direto\'': 'bg-green-50 hover:bg-green-100',
    '\'Ações a Vista\'': 'bg-yellow-50 hover:bg-yellow-100'
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <Select value={selectedDate || ""} onValueChange={setSelectedDate}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione a data" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {dates.map(date => (
              <SelectItem key={date} value={date}>
                {date}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Fin. Mercado - Título Privado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFinMercado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L/P a Realizar - Título Privado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLPRealizarTituloPrivado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalLPRealizarTituloPrivado)}
              <span className="text-sm ml-2">({percentLPTituloPrivado.toFixed(2)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Fin. Mercado - Tesouro Direto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFinMercadoTesouroDireto)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L/P a Realizar - Tesouro Direto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLPRealizarTesouroDireto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalLPRealizarTesouroDireto)}
              <span className="text-sm ml-2">({percentLPTesouroDireto.toFixed(2)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Fin. Mercado - Ações a Vista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFinMercadoAcoesAVista)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L/P a Realizar - Ações a Vista</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLPRealizarAcoesAVista >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalLPRealizarAcoesAVista)}
              <span className="text-sm ml-2">({percentLPAcoesAVista.toFixed(2)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Fin. Mercado - Todos Mercados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFinMercadoTodos)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>L/P a Realizar - Todos Mercados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalLPRealizar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalLPRealizar)}
              <span className="text-sm ml-2">({percentLPTotal.toFixed(2)}%)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
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
              {filteredInvestments.map((investment) => {
                const percentLP = investment["Fin. Custo"] !== 0 
                  ? (investment["L/P a Realizar"] / investment["Fin. Custo"]) * 100 
                  : 0;
                
                // Safe conversion of percentage columns
                const percentLPColumn = typeof investment["% L/P"] === 'string' 
                  ? parseFloat(investment["% L/P"]) 
                  : investment["% L/P"] || 0;

                const percentCarteiraColumn = typeof investment["% Carteira"] === 'string'
                  ? parseFloat(investment["% Carteira"])
                  : investment["% Carteira"] || 0;

                // Check if the investment was issued in the current year
                const issueDate = parseIssueDate(investment.Ativo);
                const isCurrentYearInvestment = issueDate 
                  ? issueDate.getFullYear() === currentYear 
                  : false;
                
                return (
                <TableRow 
                  key={investment.id} 
                  className={
                    isCurrentYearInvestment && investment.Mercado === '\'Titulo Privado\''
                      ? marketColorMapCurrentYear[investment.Mercado]
                      : marketColorMap[investment.Mercado] || ''
                  }
                >
                  <TableCell>{investment.Mercado}</TableCell>
                  <TableCell>{investment.Ativo}</TableCell>
                  <TableCell>{investment.QTD}</TableCell>
                  <TableCell>{formatCurrency(investment["PU Custo"])}</TableCell>
                  <TableCell>{formatCurrency(investment["Fin. Custo"])}</TableCell>
                  <TableCell>{formatCurrency(investment["PU Atual"])}</TableCell>
                  <TableCell>{formatCurrency(investment["Fin. Mercado"])}</TableCell>
                  <TableCell className={investment["L/P a Realizar"] >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(investment["L/P a Realizar"])}
                    <span className="text-sm ml-2">({percentLP.toFixed(2)}%)</span>
                  </TableCell>
                  <TableCell>{percentLPColumn.toFixed(2)}%</TableCell>
                  <TableCell>{percentCarteiraColumn.toFixed(2)}%</TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
