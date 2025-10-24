"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Food",
  "Transport",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Shopping",
  "Other",
]

interface Transaction {
  id: string
  amount: number
  category: string
  type: "income" | "expense"
  date: string
  notes: string
}

export default function EditTransactionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const transactionId = params.id as string

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Food")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [date, setDate] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) return

      try {
        const docRef = doc(db, "transactions", transactionId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data() as Transaction
          setTransaction(data)
          setAmount(data.amount.toString())
          setCategory(data.category)
          setType(data.type)
          setDate(data.date)
          setNotes(data.notes)
        } else {
          setError("Transaction not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load transaction")
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [transactionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setSaving(true)

    try {
      const docRef = doc(db, "transactions", transactionId)
      await updateDoc(docRef, {
        amount: Number.parseFloat(amount),
        category,
        type,
        date,
        notes,
      })

      router.push("/transactions")
    } catch (err: any) {
      setError(err.message || "Failed to update transaction")
    } finally {
      setSaving(false)
    }
  }

  const quickAmounts = [10, 25, 50, 100]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="mb-6 transition-all duration-300 ease-out">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Card className="p-8 text-center shadow-sm">
            <p className="text-destructive">{error}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="mb-6 transition-all duration-300 ease-out">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight">Edit Transaction</h1>
        </div>

        <Card className="p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="flex gap-2">
                  {(["income", "expense"] as const).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={type === t ? "default" : "outline"}
                      onClick={() => setType(t)}
                      className="flex-1 transition-all duration-300 ease-out capitalize"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="transition-all duration-300 ease-out"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                className="transition-all duration-300 ease-out"
                required
              />
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((qa) => (
                  <Button
                    key={qa}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(qa.toString())}
                    className="transition-all duration-300 ease-out"
                  >
                    ${qa}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={category === cat ? "default" : "outline"}
                    onClick={() => setCategory(cat)}
                    className="transition-all duration-300 ease-out"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                placeholder="Add any notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground transition-all duration-300 ease-out resize-none"
                rows={3}
              />
            </div>

            {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{error}</div>}

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ease-out"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Card>
      </div>

      <Navigation />
    </div>
  )
}
