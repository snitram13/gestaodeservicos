type Tecnico = { id: string; nome: string; corAgenda: string | null }

/**
 * Legenda técnico → cor da agenda. Só aparece se algum técnico ativo tiver uma
 * cor definida (em Definições → Utilizadores). As visitas na agenda ficam
 * marcadas com a cor do técnico atribuído.
 */
export function AgendaLegenda({ tecnicos }: { tecnicos: Tecnico[] }) {
  const comCor = tecnicos.filter((t) => t.corAgenda)
  if (comCor.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
      <span className="text-muted-foreground">Técnicos:</span>
      {comCor.map((t) => (
        <span key={t.id} className="inline-flex items-center gap-1.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: t.corAgenda ?? undefined }}
          />
          <span className="text-foreground">{t.nome}</span>
        </span>
      ))}
    </div>
  )
}
