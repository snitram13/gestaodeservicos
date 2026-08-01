import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import type { Traduzir } from "@/lib/i18n/dicionarios"
import type { Formatos } from "@/lib/formatos"

import type {
  Cliente,
  Empresa,
  Orcamento,
  OrcamentoItem,
} from "@/db/schema"

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
  docTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  docMeta: { color: C.muted, textAlign: "right", marginTop: 4, lineHeight: 1.5 },
  section: { marginTop: 22 },
  label: { color: C.muted, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 18 },
  desc: { color: C.muted, marginTop: 3, lineHeight: 1.4 },
  th: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderColor: C.border,
    paddingBottom: 6,
    marginTop: 16,
    fontFamily: "Helvetica-Bold",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: C.rowBorder,
  },
  cDesc: { flex: 1, paddingRight: 8 },
  cQtd: { width: 50, textAlign: "right" },
  cPreco: { width: 75, textAlign: "right" },
  cTotal: { width: 80, textAlign: "right" },
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
  notas: { marginTop: 26, color: C.muted, lineHeight: 1.4 },
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
  /** Tradutor do idioma da empresa (o PDF vai para o cliente final). */
  t: Traduzir
  /** Formatadores no fuso/idioma da empresa (ver lib/formatos.ts). */
  fmt: Pick<Formatos, "data" | "hora" | "euro">
  orcamento: Orcamento & {
    cliente: Cliente | null
    itens: OrcamentoItem[]
  }
  config: Empresa
  logo?: string | null
}

export function OrcamentoPDF({ t, fmt, orcamento: o, config, logo = null }: Props) {
  const itens = [...o.itens].sort((a, b) => a.ordem - b.ordem)

  return (
    <Document title={`Orçamento ${o.numero}`} author={config.nome}>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.between}>
          <View style={styles.headerLeft}>
            {logo ? <Image src={logo} style={styles.logo} /> : null}
            <Text style={styles.headerName}>{config.nome}</Text>
            {config.slogan ? (
              <Text style={styles.slogan}>{config.slogan}</Text>
            ) : null}
            <Text style={styles.contact}>
              {[
                config.nif ? `NIF ${config.nif}` : null,
                config.telefone,
                config.email,
                config.morada,
              ]
                .filter(Boolean)
                .join("\n")}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{t("ORÇAMENTO")}</Text>
            <Text style={styles.docMeta}>
              {`Nº ${o.numero}`}
              {"\n"}
              {`Data: ${fmt.data(o.criadoEm)}`}
              {o.validade ? `\nVálido até: ${fmt.data(o.validade)}` : ""}
            </Text>
          </View>
        </View>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.label}>{t("PARA")}</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>
            {o.cliente?.nome ?? "—"}
          </Text>
          <Text style={styles.desc}>
            {[
              o.cliente?.morada,
              o.cliente?.codigoPostal,
              o.cliente?.cidade,
              o.cliente?.nif ? `NIF ${o.cliente.nif}` : null,
              o.cliente?.telefone,
            ]
              .filter(Boolean)
              .join("\n")}
          </Text>
        </View>

        {/* Local da obra */}
        {(o.morada || o.cidade) && (
          <View style={styles.section}>
            <Text style={styles.label}>{t("LOCAL DA OBRA")}</Text>
            <Text style={styles.desc}>
              {[o.morada, o.cidade].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}

        {/* Título */}
        <Text style={styles.title}>{o.titulo}</Text>
        {o.descricao ? <Text style={styles.desc}>{o.descricao}</Text> : null}

        {/* Tabela */}
        <View style={styles.th}>
          <Text style={styles.cDesc}>{t("Descrição")}</Text>
          <Text style={styles.cQtd}>{t("Qtd.")}</Text>
          <Text style={styles.cPreco}>{t("Preço un.")}</Text>
          <Text style={styles.cTotal}>{t("Total")}</Text>
        </View>
        {itens.map((it) => (
          <View style={styles.tr} key={it.id}>
            <Text style={styles.cDesc}>{it.descricao}</Text>
            <Text style={styles.cQtd}>{Number(it.quantidade)}</Text>
            <Text style={styles.cPreco}>{fmt.euro(it.precoUnit)}</Text>
            <Text style={styles.cTotal}>{fmt.euro(it.totalLinha)}</Text>
          </View>
        ))}

        {/* Totais */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={{ color: C.muted }}>{t("Subtotal")}</Text>
            <Text>{fmt.euro(o.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ color: C.muted }}>
              {`IVA (${Number(o.taxaIva)}%)`}
            </Text>
            <Text>{fmt.euro(o.totalIva)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>{t("Total")}</Text>
            <Text>{fmt.euro(o.total)}</Text>
          </View>
        </View>

        {o.notas ? <Text style={styles.notas}>{o.notas}</Text> : null}

        <Text style={styles.footer} fixed>
          {`${config.nome}${config.iban ? ` · IBAN ${config.iban}` : ""} · Obrigado pela preferência!`}
        </Text>
      </Page>
    </Document>
  )
}
