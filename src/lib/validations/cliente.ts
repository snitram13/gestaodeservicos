import { z } from "zod"

import { metaPais, PAIS_PADRAO, type Pais } from "@/lib/constants/paises"

/**
 * Validação do cliente. O código postal e o número fiscal mudam de país para
 * país (0000-000 e NIF em PT, 5 dígitos e NIF/CIF em ES, 5 dígitos e
 * SIRET/TVA em FR), por isso o schema é construído a partir do país da empresa.
 */
export function clienteSchemaDe(pais: Pais = PAIS_PADRAO) {
  const meta = metaPais(pais)
  return z.object({
    nome: z.string().trim().min(2, "Indique o nome (mínimo 2 caracteres)."),
    telefone: z.string().trim().min(6, "Indique um telefone válido."),
    email: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Email inválido."),
    nif: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || meta.regexFiscal.test(v),
        `${meta.rotuloFiscal} inválido (ex.: ${meta.exemploFiscal}).`
      ),
    morada: z.string().trim(),
    cidade: z.string().trim(),
    codigoPostal: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || meta.regexCodigoPostal.test(v),
        `Código postal no formato ${meta.exemploCodigoPostal}.`
      ),
    notas: z.string().trim(),
  })
}

/** Schema de Portugal — recurso para onde o país ainda não é conhecido. */
export const clienteSchema = clienteSchemaDe("PT")

export type ClienteFormValues = z.infer<typeof clienteSchema>

export const CLIENTE_VAZIO: ClienteFormValues = {
  nome: "",
  telefone: "",
  email: "",
  nif: "",
  morada: "",
  cidade: "",
  codigoPostal: "",
  notas: "",
}
