import { IdiomaProvider } from "@/components/i18n/idioma-provider"
import { getDicionario, getIdioma, getPais } from "@/lib/i18n"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O login também é traduzido — quem ainda não entrou escolhe a bandeira e a
  // escolha fica guardada no cookie.
  const [idioma, pais, dic] = await Promise.all([
    getIdioma(),
    getPais(),
    getDicionario(),
  ])
  return (
    <IdiomaProvider idioma={idioma} pais={pais} dic={dic}>
      <div className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
        {children}
      </div>
    </IdiomaProvider>
  )
}
