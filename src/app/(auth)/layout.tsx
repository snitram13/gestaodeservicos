import { IdiomaProvider } from "@/components/i18n/idioma-provider"
import { getDicionario, getIdioma } from "@/lib/i18n"

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O login também é traduzido — quem ainda não entrou escolhe a bandeira e a
  // escolha fica guardada no cookie.
  const [idioma, dic] = await Promise.all([getIdioma(), getDicionario()])
  return (
    <IdiomaProvider idioma={idioma} dic={dic}>
      <div className="bg-muted/40 flex min-h-dvh items-center justify-center p-4">
        {children}
      </div>
    </IdiomaProvider>
  )
}
