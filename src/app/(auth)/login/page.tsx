import { Wrench } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = {
  title: "Entrar",
}

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm" size="default">
      <CardHeader className="items-center text-center">
        <div className="bg-primary text-primary-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-xl">
          <Wrench className="size-6" />
        </div>
        <CardTitle className="text-xl">PN Gestão de Serviços</CardTitle>
        <CardDescription>Inicie sessão para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
