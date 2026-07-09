import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

import {
    createAppointmentAction,
    deleteAppointmentAction,
    updateAppointmentStatusAction,
} from "./actions";

function formatDateTime(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        SCHEDULED: "Agendado",
        CONFIRMED: "Confirmado",
        CANCELED: "Cancelado",
        COMPLETED: "Compareceu",
        NO_SHOW: "Faltou",
        RESCHEDULED: "Remarcado",
    };

    return labels[status] ?? status;
}

function getStatusClass(status: string) {
    const classes: Record<string, string> = {
        SCHEDULED: "bg-blue-50 text-blue-700",
        CONFIRMED: "bg-green-50 text-green-700",
        CANCELED: "bg-red-50 text-red-700",
        COMPLETED: "bg-slate-100 text-slate-700",
        NO_SHOW: "bg-orange-50 text-orange-700",
        RESCHEDULED: "bg-purple-50 text-purple-700",
    };

    return classes[status] ?? "bg-slate-100 text-slate-700";
}

export default async function AgendaPage() {
    const tenant = await prisma.tenant.findUnique({
        where: {
            slug: "clinica-teste",
        },
        include: {
            professionals: {
                where: {
                    active: true,
                },
                orderBy: {
                    name: "asc",
                },
            },
            services: {
                where: {
                    active: true,
                },
                orderBy: {
                    name: "asc",
                },
            },
            appointments: {
                include: {
                    professional: true,
                    service: true,
                },
                orderBy: {
                    startAt: "asc",
                },
            },
        },
    });

    if (!tenant) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
                <p className="mt-2 text-red-600">
                    Nenhum cliente de teste encontrado no banco.
                </p>
            </div>
        );
    }

    const canCreateAppointment =
        tenant.professionals.length > 0 && tenant.services.length > 0;

    return (
        <div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
                <p className="mt-2 text-slate-600">
                    Crie e acompanhe os agendamentos da secretária virtual.
                </p>
            </div>

            <form
                action={createAppointmentAction}
                className="mt-8 max-w-5xl rounded-xl border bg-white p-6"
            >
                <h3 className="font-semibold text-slate-900">Criar novo agendamento</h3>

                {!canCreateAppointment ? (
                    <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        Para criar agendamentos, cadastre pelo menos um profissional ativo e um serviço ativo.
                    </div>
                ) : (
                    <>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="patientName"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Nome do paciente
                                </label>
                                <input
                                    id="patientName"
                                    name="patientName"
                                    type="text"
                                    placeholder="Ex: Maria Oliveira"
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="patientPhone"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    WhatsApp do paciente
                                </label>
                                <input
                                    id="patientPhone"
                                    name="patientPhone"
                                    type="text"
                                    placeholder="Ex: 5581999999999"
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="professionalId"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Profissional
                                </label>
                                <select
                                    id="professionalId"
                                    name="professionalId"
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                    required
                                >
                                    <option value="">Selecione</option>
                                    {tenant.professionals.map((professional) => (
                                        <option key={professional.id} value={professional.id}>
                                            {professional.name}
                                            {professional.specialty ? ` - ${professional.specialty}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="serviceId"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Serviço
                                </label>
                                <select
                                    id="serviceId"
                                    name="serviceId"
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                    required
                                >
                                    <option value="">Selecione</option>
                                    {tenant.services.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {service.name} · {service.durationMinutes} min
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="date"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Data
                                </label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                    required
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="startTime"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Horário
                                </label>
                                <input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    defaultValue="09:00"
                                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                    required
                                />
                            </div>
                        </div>

                        <div className="mt-6 rounded-lg bg-slate-50 p-4">
                            <p className="text-sm font-medium text-slate-900">
                                Regra aplicada agora
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                O sistema valida se o horário escolhido está dentro da disponibilidade cadastrada para o profissional e também bloqueia conflito com outro agendamento.
                            </p>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                                Criar agendamento
                            </button>
                        </div>
                    </>
                )}
            </form>

            <div className="mt-8 max-w-5xl">
                <h3 className="font-semibold text-slate-900">Agendamentos cadastrados</h3>

                <div className="mt-4 space-y-4">
                    {tenant.appointments.length === 0 ? (
                        <div className="rounded-xl border bg-white p-6">
                            <p className="text-sm text-slate-500">
                                Nenhum agendamento cadastrado ainda.
                            </p>
                        </div>
                    ) : (
                        tenant.appointments.map((appointment) => (
                            <div key={appointment.id} className="rounded-xl border bg-white p-6">
                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <p className="font-semibold text-slate-900">
                                                {appointment.patientName}
                                            </p>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                                                    appointment.status
                                                )}`}
                                            >
                                                {getStatusLabel(appointment.status)}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">
                                            <strong>Data:</strong> {formatDateTime(appointment.startAt)} até{" "}
                                            {formatDateTime(appointment.endAt)}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            <strong>Profissional:</strong>{" "}
                                            {appointment.professional?.name ?? "Não informado"}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-600">
                                            <strong>Serviço:</strong>{" "}
                                            {appointment.service?.name ?? "Não informado"}
                                        </p>

                                        {appointment.patientPhone ? (
                                            <p className="mt-1 text-sm text-slate-600">
                                                <strong>WhatsApp:</strong> {appointment.patientPhone}
                                            </p>
                                        ) : null}

                                        <p className="mt-1 text-sm text-slate-500">
                                            Origem: {appointment.source}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-3 md:min-w-56">
                                        <form action={updateAppointmentStatusAction}>
                                            <input
                                                type="hidden"
                                                name="appointmentId"
                                                value={appointment.id}
                                            />

                                            <label className="block text-sm font-medium text-slate-700">
                                                Alterar status
                                            </label>

                                            <select
                                                name="status"
                                                defaultValue={appointment.status}
                                                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                                            >
                                                <option value="SCHEDULED">Agendado</option>
                                                <option value="CONFIRMED">Confirmado</option>
                                                <option value="CANCELED">Cancelado</option>
                                                <option value="COMPLETED">Compareceu</option>
                                                <option value="NO_SHOW">Faltou</option>
                                                <option value="RESCHEDULED">Remarcado</option>
                                            </select>

                                            <button
                                                type="submit"
                                                className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                                            >
                                                Salvar status
                                            </button>
                                        </form>

                                        <form action={deleteAppointmentAction}>
                                            <input
                                                type="hidden"
                                                name="appointmentId"
                                                value={appointment.id}
                                            />

                                            <button
                                                type="submit"
                                                className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                            >
                                                Excluir agendamento
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}