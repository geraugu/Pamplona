"use client"

import React, { useState, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'
import { BarChart, Bar } from 'recharts'
import { Transaction } from "../../components/lib/interfaces"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"

interface AnalysesTabProps {
  transactions: Transaction[]
}

interface CategoryExpense {
  month: string;
  [key: string]: string | number; // Allow string keys with string or number values
}

export function AnalysesTab({ transactions }: AnalysesTabProps) {
  // Bar Chart States
  const [barTimeFilter, setBarTimeFilter] = useState<string>('6months')
  const [barOriginFilter, setBarOriginFilter] = useState<string>('all')

  // New Bar Chart State for Category Comparison
  const [categoryBarTimeFilter, setCategoryBarTimeFilter] = useState<string>('6months')

  // Line Chart States
  const [lineTimeFilter, setLineTimeFilter] = useState<string>('6months')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')

  // Month names in Portuguese
  const monthNames = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ]

  // Helper function to check if a date is within range
  const isWithinRange = (year: number, month: number, timeFilter: string) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-based month

    if (timeFilter === 'currentYear') {
      return year === currentYear
    }

    // Calculate months difference
    const monthsDiff = (currentYear - year) * 12 + (currentMonth - month)
    
    if (timeFilter === '12months') {
      return monthsDiff >= 0 && monthsDiff < 12
    }

    if (timeFilter === '6months') {
      return monthsDiff >= 0 && monthsDiff < 6
    }

    return false
  }

  // Filtering function for both charts
  const filterTransactions = (timeFilter: string, category: string = 'all', subcategory: string = 'all', origin: string = 'all') => {
    return transactions.filter(transaction => {
      // Time filter
      const timeMatch = isWithinRange(transaction.anoReferencia, transaction.mesReferencia, timeFilter)

      // Category and subcategory filters
      const categoryMatch = category === 'all' || transaction.categoria === category
      const subcategoryMatch = subcategory === 'all' || transaction.subcategoria === subcategory

      // Origin filter
      const originMatch = origin === 'all' || 
        (origin === 'conta_bancaria' && (!transaction.origem || transaction.origem === 'conta_bancaria')) ||
        (origin === 'cartao_credito' && transaction.origem === 'cartao_credito')

      return timeMatch && categoryMatch && subcategoryMatch && originMatch && transaction.valor < 0
    })
  }

  // Line Chart Filtering
  const lineFilteredTransactions = useMemo(() => 
    filterTransactions(lineTimeFilter, selectedCategory, selectedSubcategory), 
    [transactions, lineTimeFilter, selectedCategory, selectedSubcategory]
  )

  // Calculate total expenses for selected category/subcategory
  const totalCategoryExpenses = useMemo(() => {
    return lineFilteredTransactions.reduce((total, transaction) => {
      return total + Math.abs(transaction.valor)
    }, 0)
  }, [lineFilteredTransactions])

  // Line Chart Expenses by Category/Subcategory
  const categoryExpenses = useMemo<CategoryExpense[]>(() => {
    const expensesByMonthAndCategory: { [key: string]: { [key: string]: number } } = {}

    lineFilteredTransactions.forEach(transaction => {
      const monthKey = `${monthNames[transaction.mesReferencia - 1]}/${transaction.anoReferencia}`
      const categoryKey = selectedSubcategory !== 'all' 
        ? transaction.subcategoria 
        : (selectedCategory !== 'all' ? transaction.categoria : transaction.categoria)

      if (!expensesByMonthAndCategory[monthKey]) {
        expensesByMonthAndCategory[monthKey] = {}
      }

      if (!expensesByMonthAndCategory[monthKey][categoryKey]) {
        expensesByMonthAndCategory[monthKey][categoryKey] = 0
      }

      expensesByMonthAndCategory[monthKey][categoryKey] += Math.abs(transaction.valor)
    })

    // Transform data for line chart
    const transformedData = Object.entries(expensesByMonthAndCategory)
      .map(([month, categories]) => ({
        month,
        ...categories
      }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/')
        const [bMonth, bYear] = b.month.split('/')
        const monthOrder = monthNames
        return (parseInt(aYear) - parseInt(bYear)) || 
               (monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth))
      })

    return transformedData
  }, [lineFilteredTransactions, selectedCategory, selectedSubcategory])

  // Calculate average expenses for selected category/subcategory
  const averageCategoryExpenses = useMemo(() => {
    const monthCount = categoryExpenses.length
    return monthCount > 0 ? totalCategoryExpenses / monthCount : 0
  }, [categoryExpenses, totalCategoryExpenses])

  // Calculate median for selected category
  const medianValue = useMemo(() => {
    if (selectedCategory === 'all') return null

    const values = categoryExpenses
      .map(entry => {
        const categoryKey = Object.keys(entry).find(key => key !== 'month')
        if (!categoryKey) return undefined
        const value = entry[categoryKey]
        return typeof value === 'number' ? value : undefined
      })
      .filter((value): value is number => value !== undefined)
      .sort((a, b) => a - b)

    const mid = Math.floor(values.length / 2)
    return values.length % 2 === 0
      ? (values[mid - 1] + values[mid]) / 2
      : values[mid]
  }, [categoryExpenses, selectedCategory])

  // Bar Chart Filtering
  const barFilteredTransactions = useMemo(() => 
    filterTransactions(barTimeFilter, 'all', 'all', barOriginFilter), 
    [transactions, barTimeFilter, barOriginFilter]
  )

  // Bar Chart Monthly Expenses
  const monthlyExpenses = useMemo(() => {
    const expensesByMonth: { [key: string]: number } = {}

    barFilteredTransactions.forEach(transaction => {
      const monthKey = `${monthNames[transaction.mesReferencia - 1]}/${transaction.anoReferencia}`
      
      if (!expensesByMonth[monthKey]) {
        expensesByMonth[monthKey] = 0
      }
      
      expensesByMonth[monthKey] += Math.abs(transaction.valor)
    })

    return Object.entries(expensesByMonth)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/')
        const [bMonth, bYear] = b.month.split('/')
        const monthOrder = monthNames
        return (parseInt(aYear) - parseInt(bYear)) || 
               (monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth))
      })
  }, [barFilteredTransactions])

  // New Bar Chart Expenses by Category
  const categoryExpensesData = useMemo(() => {
    const expensesByCategory: { [key: string]: number } = {}

    const filteredTransactions = filterTransactions(categoryBarTimeFilter)

    filteredTransactions.forEach(transaction => {
      const categoryKey = transaction.categoria

      if (!expensesByCategory[categoryKey]) {
        expensesByCategory[categoryKey] = 0
      }

      expensesByCategory[categoryKey] += Math.abs(transaction.valor)
    })

    return Object.entries(expensesByCategory)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total) // Sort by total in descending order
  }, [transactions, categoryBarTimeFilter])

  // Get unique categories and subcategories
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.categoria)))
  const uniqueSubcategories = selectedCategory !== 'all' 
    ? Array.from(new Set(transactions
        .filter(t => t.categoria === selectedCategory)
        .map(t => t.subcategoria))) 
    : []

  // Determine the label for the selected category/subcategory
  const categoryLabel = selectedSubcategory !== 'all' 
    ? selectedSubcategory 
    : (selectedCategory !== 'all' ? selectedCategory : 'Todas as Categorias')

  return (
    <div className="space-y-8">
      {/* Bar Chart Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Despesas Mensais</h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <Select value={barTimeFilter} onValueChange={setBarTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent   className="bg-white">
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Últimos 12 meses</SelectItem>
                <SelectItem value="currentYear">Ano corrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
            <Select value={barOriginFilter} onValueChange={setBarOriginFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a origem" />
              </SelectTrigger>
              <SelectContent  className="bg-white">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="conta_bancaria">Conta Bancária</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyExpenses}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => {
                  const formattedValue = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(value))
                  return [formattedValue, 'Total']
                }}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Bar dataKey="total" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New Bar Chart Section for Category Comparison */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Despesas por Categoria</h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <Select value={categoryBarTimeFilter} onValueChange={setCategoryBarTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent  className="bg-white">
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Últimos 12 meses</SelectItem>
                <SelectItem value="currentYear">Ano corrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryExpensesData}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip 
                formatter={(value) => {
                  const formattedValue = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(value))
                  return [formattedValue, 'Total']
                }}
                labelFormatter={(label) => `Categoria: ${label}`}
              />
              <Bar dataKey="total" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Despesas por Categoria</h3>
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <Select value={lineTimeFilter} onValueChange={setLineTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent  className="bg-white">
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Últimos 12 meses</SelectItem>
                <SelectItem value="currentYear">Ano corrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent  className="bg-white">
                <SelectItem value="all">Todas</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCategory !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoria</label>
              <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subcategoria" />
                </SelectTrigger>
                <SelectContent  className="bg-white">
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueSubcategories.map(subcat => (
                    <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Average Expenses Card */}
        {(selectedCategory !== 'all' || selectedSubcategory !== 'all') && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          
        
          <Card className="w-full mb-4">
            <CardHeader>
              <CardTitle>Total Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalCategoryExpenses)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {`Período: ${lineTimeFilter === '6months' ? 'Últimos 6 meses' : 
                  lineTimeFilter === '12months' ? 'Últimos 12 meses' : 
                  'Ano corrente'}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {`Categoria: ${categoryLabel}`}
              </div>
            </CardContent>
          </Card>

          <Card className="w-full mb-4">
            <CardHeader>
              <CardTitle>Média de Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(averageCategoryExpenses)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {`Período: ${lineTimeFilter === '6months' ? 'Últimos 6 meses' : 
                  lineTimeFilter === '12months' ? 'Últimos 12 meses' : 
                  'Ano corrente'}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {`Categoria: ${categoryLabel}`}
              </div>
            </CardContent>
          </Card>
          
          </div>
        )}

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryExpenses}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => {
                  const formattedValue = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(value))
                  return [formattedValue, 'Total']
                }}
                labelFormatter={(label) => `Mês: ${label}`}
              />
              <Legend />
              {Object.keys(categoryExpenses[0] || {})
                .filter(key => key !== 'month')
                .map((category, index) => (
                  <Line 
                    key={category} 
                    type="monotone" 
                    dataKey={category} 
                    stroke={`hsl(${index * 360 / 10}, 70%, 50%)`}
                    strokeWidth={2}
                  />
                ))
              }
              {selectedCategory !== 'all' && medianValue && (
                <ReferenceLine 
                  y={medianValue} 
                  stroke="red" 
                  strokeDasharray="3 3"
                  label={{ value: 'Mediana', position: 'right' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
