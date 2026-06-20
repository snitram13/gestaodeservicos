"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

export function ClientesSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [valor, setValor] = useState(defaultValue)

  useEffect(() => {
    const t = setTimeout(() => {
      const url = valor.trim()
        ? `${pathname}?q=${encodeURIComponent(valor.trim())}`
        : pathname
      router.replace(url, { scroll: false })
    }, 300)
    return () => clearTimeout(t)
  }, [valor, pathname, router])

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Procurar por nome ou telefone…"
        className="h-11 pl-9"
        type="search"
        inputMode="search"
      />
    </div>
  )
}
