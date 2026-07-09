const tenantSlug = "clinica-teste";

export const dynamic = "force-dynamic";

const endpoints = [
    {
        name: "Buscar configuração completa",
        method: "GET",
        path: `/api/n8n/tenant/${tenantSlug}/config`,
        description:
            "Retorna empresa, profissionais, serviços, horários, automações e integrações.",
    },
    {
        name: "Buscar contexto da secretária",
        method: "GET",
        path: `/api/n8n/tenant/${tenantSlug}/assistant-context`,
        description:
            "Retorna um texto pronto para usar no prompt da IA dentro do n8n.",
    },
    {
        name: "Buscar horários disponíveis",
        method: "POST",
        path: `/api/n8n/tenant/${tenantSlug}/available-slots`,
        description:
            "Recebe profissional, serviço e data. Retorna os horários livres.",
    },
    {
        name: "Criar agendamento",
        method: "POST",
        path: `/api/n8n/tenant/${tenantSlug}/appointments`,
        description:
            "Cria um agendamento respeitando disponibilidade e conflito de horário.",
    },
    {
        name: "Enviar logs",
        method: "POST",
        path: `/api/n8n/tenant/${tenantSlug}/logs`,
        description:
            "Permite que o n8n envie logs de sucesso, erro, atenção ou pendência para o painel.",
    },
];

function maskApiKey(apiKey?: string) {
    if (!apiKey) {
        return "Não configurada";
    }

    if (apiKey.length <= 8) {
        return "********";
    }

    return `${apiKey.slice(0, 4)}${"*".repeat(apiKey.length - 8)}${apiKey.slice(-4)}`;
}

export default function N8nPage() {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const apiKey = process.env.N8N_API_KEY;

    return (
        <div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Conexão n8n</h2>
                <p className="mt-2 text-slate-600">
                    Use estas URLs nos nodes HTTP Request do n8n para conectar a automação ao painel.
                </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">URL base do app</p>
                    <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                        {appUrl}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Cliente teste</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                        {tenantSlug}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Chave da API</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                        {maskApiKey(apiKey)}
                    </p>
                </div>
            </div>

            <div className="mt-8 rounded-xl border bg-white">
                <div className="border-b p-5">
                    <h3 className="font-semibold text-slate-900">Endpoints disponíveis</h3>
                    <p className="mt-1 text-sm text-slate-500">
                        Todos exigem o header <code className="rounded bg-slate-100 px-1">x-api-key</code>.
                    </p>
                </div>

                <div className="divide-y">
                    {endpoints.map((endpoint) => (
                        <div key={endpoint.path} className="p-5">
                            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span
                                            className={
                                                endpoint.method === "GET"
                                                    ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                                    : "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                                            }
                                        >
                                            {endpoint.method}
                                        </span>

                                        <p className="font-medium text-slate-900">{endpoint.name}</p>
                                    </div>

                                    <p className="mt-2 text-sm text-slate-600">
                                        {endpoint.description}
                                    </p>

                                    <p className="mt-3 break-all rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                                        {appUrl}
                                        {endpoint.path}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Header obrigatório</h3>

                    <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                        {`x-api-key: ${apiKey ?? "sua-chave-aqui"}`}
                    </pre>

                    <p className="mt-3 text-sm text-slate-600">
                        No n8n, coloque isso no node HTTP Request em Headers.
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Exemplo de body para horários</h3>

                    <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                        {`{
  "professionalId": "id-do-profissional",
  "serviceId": "id-do-servico",
  "date": "2026-07-10"
}`}
                    </pre>
                </div>

                <div className="rounded-xl border bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Exemplo de body para agendamento</h3>

                    <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                        {`{
  "patientName": "Maria Oliveira",
  "patientPhone": "5581999999999",
  "professionalId": "id-do-profissional",
  "serviceId": "id-do-servico",
  "date": "2026-07-10",
  "startTime": "09:00",
  "source": "n8n",
  "executionId": "exec-001"
}`}
                    </pre>
                </div>

                <div className="rounded-xl border bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Exemplo de body para log</h3>

                    <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                        {`{
  "workflowName": "Secretária Virtual",
  "status": "success",
  "message": "Mensagem processada com sucesso.",
  "executionId": "exec-001"
}`}
                    </pre>
                </div>
            </div>

            <div className="mt-8 rounded-xl border bg-yellow-50 p-5">
                <p className="text-sm font-medium text-yellow-900">
                    Atenção
                </p>
                <p className="mt-1 text-sm text-yellow-800">
                    Em produção, essa chave precisa ser forte e secreta. Não coloque a chave completa em tela para clientes comuns. Esta página é uma ferramenta técnica para configuração inicial.
                </p>
            </div>
        </div>
    );
}