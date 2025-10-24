"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { LogOut, User, TrendingUp, TrendingDown } from "lucide-react"

interface Transaction {
  id: string
  amount: number
  type: "income" | "expense"
  date: string
}

export default function ProfilePage() {
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

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  const transactionCount = transactions.length
  const averageTransaction = transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  const thisMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date)
    const now = new Date()
    return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear()
  })

  const thisMonthIncome = thisMonthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const thisMonthExpenses = thisMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-light tracking-tight mb-8">Profile</h1>

        <div className="space-y-6">
          <Card className="p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Account Information</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="font-medium">{transactionCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">This Month</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Income</p>
                  <p className="text-xl font-light text-green-600">${thisMonthIncome.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="text-xl font-light text-red-600">${thisMonthExpenses.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">All-Time Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Total Income</span>
                <span className="text-lg font-light text-green-600">${totalIncome.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="text-lg font-light text-red-600">${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-muted-foreground">Balance</span>
                <span className={`text-lg font-light ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
                  ${balance.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Savings Rate</span>
                <span className="text-lg font-light text-primary">{savingsRate.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Statistics</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Average Transaction</p>
                <p className="font-medium">${averageTransaction.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Button
            onClick={handleLogout}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all duration-300 ease-out flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>

      <Navigation />
    </div>
  )
}
