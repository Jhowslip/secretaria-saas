import { prisma } from "@/lib/prisma";

function formatCurrency(valueInCents?: number | null) {
    if (!valueInCents) {
        return "Não informado";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(valueInCents / 100);
}

export default async function DashboardPage() {
    const tenant = await prisma.tenant.findUnique({
        where: {
            slug: "clinica-teste",
        },
        include: {
            company: true,
            professionals: true,
            services: true,
            appointments: true,
            automationSettings: true,
            workflowLogs: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
            },
        },
    });

    if (!tenant) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                <p className="mt-2 text-red-600">
                    Nenhum cliente de teste encontrado no banco.
                </p>
            </div>
        );
    }

    const activeProfessionals = tenant.professionals.filter(
        (professional) => professional.active
    ).length;

    const activeServices = tenant.services.filter((service) => service.active).length;

    const automationSettings = tenant.automationSettings;

    const enabledAutomations = [
        automationSettings?.secretaryEnabled,
        automationSettings?.remindersEnabled,
        automationSettings?.leadRecoveryEnabled,
        automationSettings?.billingEnabled,
        automationSettings?.humanEscalationEnabled,
        automationSettings?.voiceCallEnabled,
        automationSettings?.audioResponseEnabled,
    ].filter(Boolean).length;

    return (
        <div>
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
                    <p className="mt-2 text-slate-600">
                        Visão geral da automação da {tenant.company?.name ?? tenant.name}.
                    </p>
                </div>

                <div className="rounded-full border bg-white px-4 py-2 text-sm text-slate-600">
                    Cliente teste: {tenant.slug}
                </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Status da secretária</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                        {tenant.automationSettings?.secretaryEnabled ? "Ativa" : "Desativada"}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Profissionais ativos</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                        {activeProfessionals}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Serviços ativos</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                        {activeServices}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Agendamentos</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                        {tenant.appointments.length}
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-5">
                    <p className="text-sm text-slate-500">Automações ativas</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                        {enabledAutomations}
                    </p>
                </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Dados da empresa</h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <p>
                            <strong>Nome:</strong> {tenant.company?.name}
                        </p>
                        <p>
                            <strong>Segmento:</strong> {tenant.company?.segment}
                        </p>
                        <p>
                            <strong>WhatsApp:</strong> {tenant.company?.whatsapp}
                        </p>
                        <p>
                            <strong>Assistente:</strong> {tenant.company?.assistantName}
                        </p>
                        <p>
                            <strong>Tom:</strong> {tenant.company?.assistantTone}
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Profissionais</h3>

                    <div className="mt-4 space-y-3">
                        {tenant.professionals.map((professional) => (
                            <div key={professional.id} className="rounded-lg border p-4">
                                <p className="font-medium text-slate-900">{professional.name}</p>
                                <p className="text-sm text-slate-500">
                                    {professional.specialty ?? "Sem especialidade cadastrada"}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Consulta: {professional.defaultDurationMinutes} min ·{" "}
                                    {formatCurrency(professional.priceInCents)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 rounded-xl border bg-white p-6">
                <h3 className="font-semibold text-slate-900">Últimos logs</h3>

                <div className="mt-4 space-y-3">
                    {tenant.workflowLogs.map((log) => (
                        <div key={log.id} className="rounded-lg border p-4 text-sm">
                            <p className="font-medium text-slate-900">{log.workflowName}</p>
                            <p className="text-slate-500">Status: {log.status}</p>
                            <p className="text-slate-600">{log.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}