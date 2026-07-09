import { prisma } from "@/lib/prisma";
import { updateAutomationSettingsAction } from "./actions";

const automationItems = [
  {
    key: "secretaryEnabled",
    title: "Secretária virtual ativa",
    description:
      "Permite que a IA responda os atendimentos automaticamente quando o n8n estiver conectado.",
    warning:
      "Só ative quando a automação principal estiver testada. Se ativar antes, o cliente pode receber respostas incompletas.",
  },
  {
    key: "remindersEnabled",
    title: "Lembretes de agendamento",
    description:
      "Permite enviar lembretes automáticos antes de consultas, exames ou reuniões.",
  },
  {
    key: "leadRecoveryEnabled",
    title: "Recuperação de leads",
    description:
      "Permite enviar mensagens para contatos que pararam de responder antes de concluir o agendamento.",
  },
  {
    key: "billingEnabled",
    title: "Cobrança automática",
    description:
      "Permite criar cobranças ou links de pagamento quando a integração financeira estiver configurada.",
    warning:
      "Não ative em produção sem revisar regras de valor, vencimento e política de cancelamento.",
  },
  {
    key: "humanEscalationEnabled",
    title: "Escalação para humano",
    description:
      "Permite encaminhar o atendimento para uma pessoa quando a IA não puder resolver com segurança.",
  },
  {
    key: "voiceCallEnabled",
    title: "Ligações automáticas",
    description:
      "Permite usar agente de voz em ligações quando Retell/Twilio estiverem configurados.",
    warning:
      "Recurso mais sensível. Pode gerar custo e exige mais testes antes de vender para cliente.",
  },
  {
    key: "audioResponseEnabled",
    title: "Resposta por áudio",
    description:
      "Permite responder mensagens usando áudio, quando a integração de voz estiver configurada.",
  },
];

function getSettingValue(
  settings: Record<string, boolean | string | Date | null | undefined> | null | undefined,
  key: string
) {
  if (!settings) {
    return false;
  }

  return Boolean(settings[key]);
}

export default async function AutomacoesPage() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      automationSettings: true,
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Automações</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  const settings = tenant.automationSettings;
  const enabledCount = automationItems.filter((item) =>
    getSettingValue(settings, item.key)
  ).length;

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Automações</h2>
        <p className="mt-2 text-slate-600">
          Ative ou desative os recursos que a secretária virtual poderá usar.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Recursos ativos</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {enabledCount}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Secretária virtual</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {settings?.secretaryEnabled ? "Ativa" : "Desativada"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-slate-500">Escalação humana</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {settings?.humanEscalationEnabled ? "Ativa" : "Desativada"}
          </p>
        </div>
      </div>

      <form
        action={updateAutomationSettingsAction}
        className="mt-8 max-w-5xl rounded-xl border bg-white p-6"
      >
        <h3 className="font-semibold text-slate-900">
          Configurações da automação
        </h3>

        <div className="mt-5 space-y-4">
          {automationItems.map((item) => {
            const checked = getSettingValue(settings, item.key);

            return (
              <label
                key={item.key}
                className="flex cursor-pointer gap-4 rounded-xl border p-5 hover:bg-slate-50"
              >
                <div className="pt-1">
                  <input
                    type="checkbox"
                    name={item.key}
                    defaultChecked={checked}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-medium text-slate-900">{item.title}</p>

                    <span
                      className={
                        checked
                          ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                          : "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      }
                    >
                      {checked ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {item.description}
                  </p>

                  {item.warning ? (
                    <p className="mt-2 text-sm text-orange-700">
                      Atenção: {item.warning}
                    </p>
                  ) : null}
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">
            Como isso será usado pelo n8n?
          </p>
          <p className="mt-1 text-sm text-slate-600">
            O workflow vai consultar essas permissões antes de executar ações. Por exemplo: se lembretes estiverem desativados, o n8n não deve enviar lembretes mesmo que existam agendamentos.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Salvar automações
          </button>
        </div>
      </form>
    </div>
  );
}