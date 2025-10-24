"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit2, Search } from "lucide-react"
import Link from "next/link"

interface Transaction {
  id: string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  notes: string
}

const CATEGORY_COLORS: Record<string, string> = {
  salary: "bg-blue-100 text-blue-800",
  freelance: "bg-purple-100 text-purple-800",
  investment: "bg-green-100 text-green-800",
  food: "bg-orange-100 text-orange-800",
  transport: "bg-red-100 text-red-800",
  entertainment: "bg-pink-100 text-pink-800",
  utilities: "bg-yellow-100 text-yellow-800",
  shopping: "bg-indigo-100 text-indigo-800",
  healthcare: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
}

export default function TransactionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"amount" | "category" | "date">("date")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [searchQuery, setSearchQuery] = useState("")

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteDoc(doc(db, "transactions", id))
      } catch (error) {
        console.error("Error deleting transaction:", error)
      }
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType
    const matchesSearch =
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.notes.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "amount") {
      return b.amount - a.amount
    } else if (sortBy === "category") {
      return a.category.localeCompare(b.category)
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
  })

  const filteredIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const filteredExpenses = filteredTransactions
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight mb-4">Transactions</h1>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by category or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-300 ease-out"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 flex-wrap">
              {(["all", "income", "expense"] as const).map((option) => (
                <Button
                  key={option}
                  variant={filterType === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(option)}
                  className="transition-all duration-300 ease-out capitalize"
                >
                  {option === "all" ? "All" : option}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {(["date", "amount", "category"] as const).map((option) => (
                <Button
                  key={option}
                  variant={sortBy === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(option)}
                  className="transition-all duration-300 ease-out capitalize"
                >
                  Sort by {option}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {filteredTransactions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">Income</p>
              <p className="text-xl font-light text-green-600">${filteredIncome.toFixed(2)}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">Expenses</p>
              <p className="text-xl font-light text-red-600">${filteredExpenses.toFixed(2)}</p>
            </Card>
            <Card className="p-4 shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">Count</p>
              <p className="text-xl font-light text-primary">{filteredTransactions.length}</p>
            </Card>
          </div>
        )}

        {sortedTransactions.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <p className="text-muted-foreground mb-4">
              {transactions.length === 0 ? "No transactions yet" : "No transactions match your filters"}
            </p>
            {transactions.length === 0 && (
              <Link href="/add-transaction">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Add your first transaction
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map((transaction) => (
              <Card
                key={transaction.id}
                className="p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300 ease-out"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        CATEGORY_COLORS[transaction.category.toLowerCase()] || CATEGORY_COLORS.other
                      }`}
                    >
                      {transaction.category}
                    </span>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  {transaction.notes && <p className="text-sm text-muted-foreground">{transaction.notes}</p>}
                </div>

                <div className="flex items-center gap-4">
                  <p
                    className={`text-lg font-medium ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                  </p>

                  <div className="flex gap-2">
                    <Link href={`/edit-transaction/${transaction.id}`}>
                      <Button size="icon" variant="ghost" className="transition-all duration-300 ease-out">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(transaction.id)}
                      className="transition-all duration-300 ease-out text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}
