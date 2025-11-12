import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-display font-semibold mb-4">404</h1>
        <p className="text-xl text-foreground/70 mb-8">
          Página não encontrada
        </p>
        <Link href="/">
          <Button>Voltar para Home</Button>
        </Link>
      </div>
    </div>
  );
}

