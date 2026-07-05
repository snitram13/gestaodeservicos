import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import { formatEuro } from "@/lib/formatters/currency"
import { formatData, formatHora } from "@/lib/formatters/date"
import { CATEGORIA_META } from "@/lib/constants/categorias"
import type { Cliente, Empresa, Servico, Visita } from "@/db/schema"

const C = {
  primary: "#2563eb",
  muted: "#64748b",
  border: "#e2e8f0",
  rowBorder: "#f1f5f9",
  dark: "#0f172a",
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: C.dark, fontFamily: "Helvetica" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  headerLeft: { maxWidth: 300 },
  logo: { width: 120, maxHeight: 56, objectFit: "contain", marginBottom: 8 },
  headerName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.primary },
  slogan: { color: C.muted, marginTop: 2 },
  contact: { color: C.muted, marginTop: 6, lineHeight: 1.4 },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "right" },
  docMeta: { color: C.muted, textAlign: "right", marginTop: 4, lineHeight: 1.5 },
  section: { marginTop: 22 },
  label: { color: C.muted, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderColor: C.border,
    paddingBottom: 6,
    marginTop: 8,
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: C.rowBorder,
  },
  cDesc: { flex: 1, paddingRight: 8 },
  cVal: { width: 75, textAlign: "right" },
  totals: { marginLeft: "auto", width: 210, marginTop: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderColor: C.border,
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  fotoRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  foto: {
    width: 150,
    height: 112,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  assinatura: {
    width: 220,
    maxHeight: 90,
    objectFit: "contain",
    borderBottomWidth: 1,
    borderColor: C.dark,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    color: C.muted,
    fontSize: 8,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingTop: 8,
  },
})

type Props = {
  visita: Visita & { cliente: Cliente | null; servicos: Servico[] }
  config: Empresa
  logo: string | null
  fotosAntes: string[]
  fotosDepois: string[]
  assinaturaUrl: string | null
}

export function OrdemServicoPDF({
  visita: v,
  config,
  logo,
  fotosAntes,
  fotosDepois,
  assinaturaUrl,
}: Props) {
  const servicos = [...v.servicos].sort((a, b) => a.ordem - b.ordem)
  const somaServicos = servicos.reduce((s, x) => s + Number(x.valor), 0)

  return (
    <Document title={`Ordem de Serviço ${v.numero}`} author={config.nome}>
      <Page size="A4" style={styles.page}>
        <View style={styles.between}>
          <View style={styles.headerLeft}>
            {logo ? <Image src={logo} style={styles.logo} /> : null}
            <Text style={styles.headerName}>{config.nome}</Text>
            {config.slogan ? <Text style={styles.slogan}>{config.slogan}</Text> : null}
            <Text style={styles.contact}>
              {[config.telefone, config.email, config.morada]
                .filter(Boolean)
                .join("\n")}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Ordem de Serviço</Text>
            <Text style={styles.docMeta}>
              {`Nº ${v.numero}\n${formatData(v.agendadoPara)} às ${formatHora(v.agendadoPara)}`}
            </Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.label}>CLIENTE</Text>
          <Text>{v.cliente?.nome ?? "—"}</Text>
          <Text style={styles.contact}>
            {[v.cliente?.telefone, v.moradaServico ?? v.cliente?.morada, v.cidade]
              .filter(Boolean)
              .join("\n")}
          </Text>
        </View>

        {/* Serviços / materiais */}
        <View style={styles.section}>
          <Text style={styles.title}>Serviços e materiais</Text>
          <View style={styles.th}>
            <Text style={styles.cDesc}>Descrição</Text>
            <Text style={styles.cVal}>Mão de obra</Text>
            <Text style={styles.cVal}>Material</Text>
            <Text style={styles.cVal}>Total</Text>
          </View>
          {servicos.map((s) => (
            <View key={s.id} style={styles.tr}>
              <Text style={styles.cDesc}>
                {s.titulo}
                {"  ·  "}
                {CATEGORIA_META[s.categoria].label}
              </Text>
              <Text style={styles.cVal}>{formatEuro(s.maoDeObra)}</Text>
              <Text style={styles.cVal}>{formatEuro(s.material)}</Text>
              <Text style={styles.cVal}>{formatEuro(s.valor)}</Text>
            </View>
          ))}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={{ color: C.muted }}>Serviços</Text>
              <Text>{formatEuro(somaServicos)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ color: C.muted }}>Deslocação</Text>
              <Text>{formatEuro(v.deslocacao)}</Text>
            </View>
            <View style={styles.grandTotal}>
              <Text>Total</Text>
              <Text>{formatEuro(v.valor)}</Text>
            </View>
          </View>
        </View>

        {/* Fotos */}
        {(fotosAntes.length > 0 || fotosDepois.length > 0) && (
          <View style={styles.section} wrap={false}>
            {fotosAntes.length > 0 && (
              <>
                <Text style={styles.title}>Fotos — Antes</Text>
                <View style={styles.fotoRow}>
                  {fotosAntes.map((u, i) => (
                    <Image key={i} src={u} style={styles.foto} />
                  ))}
                </View>
              </>
            )}
            {fotosDepois.length > 0 && (
              <>
                <Text style={[styles.title, { marginTop: 12 }]}>Fotos — Depois</Text>
                <View style={styles.fotoRow}>
                  {fotosDepois.map((u, i) => (
                    <Image key={i} src={u} style={styles.foto} />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Assinatura */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.title}>Assinatura do cliente</Text>
          {assinaturaUrl ? (
            <Image src={assinaturaUrl} style={styles.assinatura} />
          ) : (
            <View
              style={{
                width: 220,
                height: 60,
                borderBottomWidth: 1,
                borderColor: C.dark,
              }}
            />
          )}
          <Text style={[styles.contact, { marginTop: 4 }]}>{v.cliente?.nome ?? ""}</Text>
        </View>

        <Text style={styles.footer}>
          {`${config.nome} · Obrigado pela preferência!`}
        </Text>
      </Page>
    </Document>
  )
}
