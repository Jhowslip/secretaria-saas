import { prisma } from "@/lib/prisma";
import { clearLogsAction } from "./actions";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusClass(status: string) {
  const normalizedStatus = status.toLowerCase();

  const classes: Record<string, string> = {
    success: "bg-green-50 text-green-700",
    error: "bg-red-50 text-red-700",
    warning: "bg-yellow-50 text-yellow-700",
    pending: "bg-blue-50 text-blue-700",
  };

  return classes[normalizedStatus] ?? "bg-slate-100 text-slate-700";
}

function getStatusLabel(status: string) {
  const normalizedStatus = status.toLowerCase();

  const labels: Record<string, string> = {
    success: "Sucesso",
    error: "Erro",
    warning: "Atenção",
    pending: "Pendente",
  };

  return labels[normalizedStatus] ?? status;
}

export default async function LogsPage() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      workflowLogs: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Logs</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  const totalLogs = tenant.workflowLogs.length;

  const successLogs = tenant.workflowLogs.filter(
    (log) => log.status.toLowerCase() === "success"
  ).length;

  const errorLogs = tenant.workflowLogs.filter(
    (log) => log.status.toLowerCase() === "error"
  ).length;

  const warningLogs = tenant.workflowLogs.filter(
    (log) => log.status.toLowerCase() === "warning"
  ).length;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Logs</h2>
          <p className="mt-2 text-slate-600">
            Acompanhe eventos importantes, execuções da automação e futuras falhas do n8n.
          </p>
        </div>

        <form action={clearLogsAction}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Limpar logs
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total de logs</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {totalLogs}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Sucessos</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {successLogs}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Atenções</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {warningLogs}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Erros</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {errorLogs}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-white">
        <div className="border-b p-5">
          <h3 className="font-semibold text-slate-900">Histórico de eventos</h3>
          <p className="mt-1 text-sm text-slate-500">
            Os eventos mais recentes aparecem primeiro.
          </p>
        </div>

        {tenant.workflowLogs.length === 0 ? (
          <div className="p-6">
            <p className="text-sm text-slate-500">
              Nenhum log encontrado ainda.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {tenant.workflowLogs.map((log) => (
              <div key={log.id} className="p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-medium text-slate-900">
                        {log.workflowName}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          log.status
                        )}`}
                      >
                        {getStatusLabel(log.status)}
                      </span>
                    </div>

                    {log.message ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {log.message}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Sem mensagem detalhada.
                      </p>
                    )}

                    {log.executionId ? (
                      <p className="mt-2 text-xs text-slate-400">
                        Execução: {log.executionId}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-sm text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 max-w-4xl rounded-xl border bg-slate-50 p-5">
        <p className="text-sm font-medium text-slate-900">
          Por que essa tela é importante?
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Quando o n8n for conectado, essa tela será usada para identificar problemas como falha no Google Calendar, erro no WhatsApp, token expirado, erro em cobrança ou falha na criação de eventos.
        </p>
      </div>
    </div>
  );
}