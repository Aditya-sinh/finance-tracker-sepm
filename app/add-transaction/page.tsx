"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { collection, addDoc } from "firebase/firestore"
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

export default function AddTransactionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Food")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)

    try {
      await addDoc(collection(db, "transactions"), {
        userId: user?.uid,
        amount: Number.parseFloat(amount),
        category,
        type,
        date,
        notes,
        createdAt: new Date(),
      })

      router.push("/transactions")
    } catch (err: any) {
      setError(err.message || "Failed to add transaction")
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [10, 25, 50, 100]

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
          <h1 className="text-3xl font-light tracking-tight">Add Transaction</h1>
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
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ease-out"
            >
              {loading ? "Adding..." : "Add Transaction"}
            </Button>
          </form>
        </Card>
      </div>

      <Navigation />
    </div>
  )
}
