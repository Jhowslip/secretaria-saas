import { prisma } from "@/lib/prisma";
import { updateIntegrationAction } from "./actions";

export const dynamic = "force-dynamic";

const integrationItems = [
  {
    provider: "chatwoot",
    title: "WhatsApp / Chatwoot",
    description:
      "Canal onde chegam as conversas do cliente. A automação depende disso para responder no WhatsApp.",
  },
  {
    provider: "n8n",
    title: "n8n",
    description:
      "Motor principal das automações. Ele executa os fluxos da secretária virtual.",
  },
  {
    provider: "google_calendar",
    title: "Google Calendar",
    description:
      "Integração opcional para sincronizar agendamentos com a agenda Google do cliente.",
  },
  {
    provider: "asaas",
    title: "Asaas",
    description:
      "Integração para criar cobranças, links de pagamento ou controle financeiro.",
  },
  {
    provider: "retell",
    title: "Retell / Ligações",
    description:
      "Integração para agente de voz e ligações automáticas.",
  },
  {
    provider: "google_drive",
    title: "Google Drive",
    description:
      "Integração opcional para buscar ou enviar arquivos usados no atendimento.",
  },
];

const statusOptions = [
  { value: "DISCONNECTED", label: "Desconectado" },
  { value: "PENDING", label: "Pendente" },
  { value: "CONNECTED", label: "Conectado" },
  { value: "ERROR", label: "Erro" },
];

function getStatusLabel(status?: string | null) {
  const option = statusOptions.find((item) => item.value === status);

  return option?.label ?? "Desconectado";
}

function getStatusClass(status?: string | null) {
  const classes: Record<string, string> = {
    DISCONNECTED: "bg-slate-100 text-slate-700",
    PENDING: "bg-yellow-50 text-yellow-700",
    CONNECTED: "bg-green-50 text-green-700",
    ERROR: "bg-red-50 text-red-700",
  };

  return classes[status ?? "DISCONNECTED"] ?? classes.DISCONNECTED;
}

export default async function IntegracoesPage() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      integrationConnections: true,
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Integrações</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  const connectionsByProvider = new Map(
    tenant.integrationConnections.map((connection) => [
      connection.provider,
      connection,
    ])
  );

  const connectedCount = tenant.integrationConnections.filter(
    (connection) => connection.status === "CONNECTED" && connection.enabled
  ).length;

  const errorCount = tenant.integrationConnections.filter(
    (connection) => connection.status === "ERROR"
  ).length;

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Integrações</h2>
        <p className="mt-2 text-slate-600">
          Controle o status das ferramentas externas usadas pela secretária virtual.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Integrações conectadas</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {connectedCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Integrações com erro</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {errorCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total configurável</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {integrationItems.length}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {integrationItems.map((item) => {
          const connection = connectionsByProvider.get(item.provider);
          const status = connection?.status ?? "DISCONNECTED";

          return (
            <form
              key={item.provider}
              action={updateIntegrationAction}
              className="rounded-xl border bg-white p-6"
            >
              <input type="hidden" name="provider" value={item.provider} />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                    status
                  )}`}
                >
                  {getStatusLabel(status)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={status}
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-end gap-3 rounded-lg border px-3 py-2">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={connection?.enabled ?? false}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Integração habilitada
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Conta / identificação
                  </label>
                  <input
                    name="accountName"
                    type="text"
                    defaultValue={connection?.accountName ?? ""}
                    placeholder="Ex: Clínica Teste"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    ID externo
                  </label>
                  <input
                    name="externalId"
                    type="text"
                    defaultValue={connection?.externalId ?? ""}
                    placeholder="Ex: inbox_id, calendar_id..."
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Observações internas
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={connection?.notes ?? ""}
                    placeholder="Ex: token pendente, calendário ainda não conectado, testar webhook..."
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Salvar integração
                </button>
              </div>
            </form>
          );
        })}
      </div>

      <div className="mt-6 max-w-5xl rounded-xl border bg-slate-50 p-5">
        <p className="text-sm font-medium text-slate-900">
          Observação importante
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Neste momento, esta tela registra o status manual das integrações. Na próxima evolução, cada card poderá ter conexão real, começando pelo Google Calendar via OAuth.
        </p>
      </div>
    </div>
  );
}