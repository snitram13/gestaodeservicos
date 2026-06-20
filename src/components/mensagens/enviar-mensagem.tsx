"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"

import { TEMPLATES_WHATSAPP } from "@/lib/constants/mensagens-whatsapp"
import { interpolarMensagem, waLink } from "@/lib/whatsapp"
import { formatTelefone } from "@/lib/formatters/phone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/common/combobox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ClienteOpt = { id: string; nome: string; telefone: string }

export function EnviarMensagem({ clientes }: { clientes: ClienteOpt[] }) {
  const [clienteId, setClienteId] = useState("")
  const [texto, setTexto] = useState("")
  const cliente = clientes.find((c) => c.id === clienteId)

  function aplicarModelo(template: string) {
    setTexto(interpolarMensagem(template, { nome: cliente?.nome ?? "" }))
  }

  function enviar() {
    if (!cliente) return
    window.open(waLink(cliente.telefone, texto), "_blank", "noopener")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar mensagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Cliente</Label>
          <Combobox
            options={clientes.map((c) => ({
              value: c.id,
              label: c.nome,
              sub: formatTelefone(c.telefone),
            }))}
            value={clienteId}
            onChange={setClienteId}
            placeholder="Selecionar cliente"
            searchPlaceholder="Procurar cliente…"
          />
        </div>

        <div className="grid gap-2">
          <Label>Modelos</Label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES_WHATSAPP.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => aplicarModelo(t.texto)}
              >
                {t.titulo}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="msg">Mensagem</Label>
          <Textarea
            id="msg"
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escolha um modelo acima ou escreva a mensagem…"
          />
          <p className="text-muted-foreground text-xs">
            Pode editar o texto antes de enviar. Marcadores como {"{data}"} ou{" "}
            {"{valor}"} podem ser preenchidos manualmente.
          </p>
        </div>

        <Button
          onClick={enviar}
          disabled={!cliente || !texto.trim()}
          className="gap-1.5"
        >
          <MessageCircle className="size-4" />
          Abrir WhatsApp
        </Button>
      </CardContent>
    </Card>
  )
}
