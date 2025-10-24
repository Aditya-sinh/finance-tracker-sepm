"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"

interface Transaction {
  id: string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  notes: string
}

const COLORS = ["#5B4FD9", "#8B7FFF", "#A89FFF", "#C8BFFF", "#E8E0FF"]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "transactions"), where("userId", "==", user.uid))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const txns = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[]
        setTransactions(txns)
        setDataLoading(false)
      })

      return unsubscribe
    }
  }, [user])

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  const categoryData = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const existing = acc.find((item) => item.name === t.category)
        if (existing) {
          existing.value += t.amount
        } else {
          acc.push({ name: t.category, value: t.amount })
        }
        return acc
      },
      [] as { name: string; value: number }[],
    )

  const timeSeriesData = transactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce(
      (acc, t) => {
        const dateStr = new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        const existing = acc.find((item) => item.date === dateStr)

        if (existing) {
          if (t.type === "income") {
            existing.income += t.amount
          } else {
            existing.expenses += t.amount
          }
        } else {
          acc.push({
            date: dateStr,
            income: t.type === "income" ? t.amount : 0,
            expenses: t.type === "expense" ? t.amount : 0,
          })
        }
        return acc
      },
      [] as { date: string; income: number; expenses: number }[],
    )

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight mb-2">Welcome back, {user?.email?.split("@")[0]}</h1>
          <p className="text-muted-foreground">Here's your financial overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1">
            <p className="text-sm text-muted-foreground mb-2">Total Income</p>
            <p className="text-3xl font-light text-green-600">${totalIncome.toFixed(2)}</p>
          </Card>

          <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1">
            <p className="text-sm text-muted-foreground mb-2">Total Expenses</p>
            <p className="text-3xl font-light text-red-600">${totalExpenses.toFixed(2)}</p>
          </Card>

          <Card className="p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:-translate-y-1">
            <p className="text-sm text-muted-foreground mb-2">Balance</p>
            <p className={`text-3xl font-light ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
              ${balance.toFixed(2)}
            </p>
          </Card>
        </div>

        {timeSeriesData.length > 0 && (
          <Card className="p-6 shadow-sm mb-8">
            <h2 className="text-lg font-medium mb-6">Income vs Expenses</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  formatter={(value) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {categoryData.length > 0 && (
            <Card className="p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-6">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {recentTransactions.length > 0 && (
            <Card className="p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-6">Recent Transactions</h2>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between pb-4 border-b border-border last:border-b-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.category}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  )
}
