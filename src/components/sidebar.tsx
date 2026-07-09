import Link from "next/link";

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/empresa", label: "Empresa" },
  { href: "/profissionais", label: "Profissionais" },
  { href: "/servicos", label: "Serviços" },
  { href: "/horarios", label: "Horários" },
  { href: "/agenda", label: "Agenda" },
  { href: "/integracoes", label: "Integrações" },
  { href: "/automacoes", label: "Automações" },
  { href: "/logs", label: "Logs" },
  { href: "/n8n", label: "Conexão n8n" },
];

export function Sidebar() {
  return (
    <aside className="min-h-screen w-64 border-r bg-white p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-900">Secretária SaaS</h1>
        <p className="mt-1 text-sm text-slate-500">
          Painel de automação
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}