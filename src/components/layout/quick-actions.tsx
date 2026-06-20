"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { QUICK_ACTIONS } from "@/lib/navigation"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/** Botão "+ Novo" com menu — usado no topo em ecrã grande. */
export function NovoButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            Novo
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-48">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <DropdownMenuItem key={a.href} render={<Link href={a.href} />}>
              <Icon className="size-4" />
              {a.label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Botão de ação flutuante central — usado na barra inferior do telemóvel. */
export function QuickActionFab() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            aria-label="Criar novo"
            className="size-14 -translate-y-3 rounded-full shadow-lg"
          />
        }
      >
        <Plus className="size-6" />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader>
          <SheetTitle>Criar novo</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 px-4 pb-2">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-14 justify-start gap-3 text-base"
                )}
              >
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </span>
                {a.label}
              </Link>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
