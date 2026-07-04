import Link from "next/link"
import { MapPin, MessageCircle, Phone, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { rotulosServico } from "@/lib/constants/modulos"
import { buttonVariants } from "@/components/ui/button"
import { telLink } from "@/lib/formatters/phone"
import { mapsLink } from "@/lib/maps"
import { waLink } from "@/lib/whatsapp"

type Props = {
  cliente: {
    id: string
    nome: string
    telefone: string
    morada: string | null
    cidade: string | null
  }
  temServicos?: boolean
}

export function ClienteQuickActions({ cliente, temServicos }: Props) {
  const r = rotulosServico(!!temServicos)
  const itemCls = cn(
    buttonVariants({ variant: "outline" }),
    "h-auto flex-col gap-1 py-3"
  )

  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={telLink(cliente.telefone)}
        className={itemCls}
        aria-label="Ligar"
      >
        <Phone className="size-5" />
        <span className="text-xs">Ligar</span>
      </a>
      <a
        href={waLink(cliente.telefone, `Olá ${cliente.nome}, `)}
        target="_blank"
        rel="noopener noreferrer"
        className={itemCls}
        aria-label="WhatsApp"
      >
        <MessageCircle className="size-5" />
        <span className="text-xs">WhatsApp</span>
      </a>
      <a
        href={mapsLink(cliente.morada, cliente.cidade)}
        target="_blank"
        rel="noopener noreferrer"
        className={itemCls}
        aria-label="Ver no mapa"
      >
        <MapPin className="size-5" />
        <span className="text-xs">Mapa</span>
      </a>
      <Link
        href={`/visitas/novo?cliente=${cliente.id}`}
        className={itemCls}
        aria-label={r.novo}
      >
        <Plus className="size-5" />
        <span className="text-xs">{r.Singular}</span>
      </Link>
    </div>
  )
}
