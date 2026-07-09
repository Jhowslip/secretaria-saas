import { prisma } from "@/lib/prisma";
import {
  createAvailabilityRuleAction,
  deleteAvailabilityRuleAction,
  toggleAvailabilityRuleStatusAction,
  updateAvailabilityRuleAction,
} from "./actions";

export const dynamic = "force-dynamic";

const weekdays = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

function getWeekdayLabel(weekday: number) {
  return weekdays.find((day) => day.value === weekday)?.label ?? "Dia inválido";
}

export default async function HorariosPage() {
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
      availabilityRules: {
        include: {
          professional: true,
        },
        orderBy: [
          {
            weekday: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      },
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Horários</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Horários</h2>
        <p className="mt-2 text-slate-600">
          Configure os dias e horários em que cada profissional pode receber agendamentos.
        </p>
      </div>

      <form
        action={createAvailabilityRuleAction}
        className="mt-8 max-w-4xl rounded-xl border bg-white p-6"
      >
        <h3 className="font-semibold text-slate-900">Cadastrar novo horário</h3>

        {tenant.professionals.length === 0 ? (
          <div className="mt-5 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
            Cadastre pelo menos um profissional ativo antes de criar horários.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-5 md:grid-cols-4">
              <div className="md:col-span-2">
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
                      {professional.name}{" "}
                      {professional.specialty ? `- ${professional.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="weekday"
                  className="block text-sm font-medium text-slate-700"
                >
                  Dia da semana
                </label>
                <select
                  id="weekday"
                  name="weekday"
                  defaultValue={1}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                  required
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Início
                  </label>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue="08:00"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Fim
                  </label>
                  <input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue="12:00"
                    className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">
                Como isso será usado pela automação?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                A secretária virtual usará esses horários para oferecer janelas disponíveis ao paciente. Depois, a agenda interna e o Google Calendar vão validar se o horário ainda está livre.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Cadastrar horário
              </button>
            </div>
          </>
        )}
      </form>

      <div className="mt-8 max-w-4xl">
        <h3 className="font-semibold text-slate-900">Horários cadastrados</h3>

        <div className="mt-4 space-y-4">
          {tenant.availabilityRules.length === 0 ? (
            <div className="rounded-xl border bg-white p-6">
              <p className="text-sm text-slate-500">
                Nenhum horário cadastrado ainda.
              </p>
            </div>
          ) : (
            tenant.availabilityRules.map((rule) => (
              <div key={rule.id} className="rounded-xl border bg-white p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {rule.professional.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {rule.professional.specialty || "Sem especialidade"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {getWeekdayLabel(rule.weekday)} · {rule.startTime} até{" "}
                      {rule.endTime}
                    </p>
                  </div>

                  <span
                    className={
                      rule.active
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    }
                  >
                    {rule.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <form
                  action={updateAvailabilityRuleAction}
                  className="grid gap-5 md:grid-cols-4"
                >
                  <input type="hidden" name="ruleId" value={rule.id} />

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Dia da semana
                    </label>
                    <select
                      name="weekday"
                      defaultValue={rule.weekday}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    >
                      {weekdays.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Início
                    </label>
                    <input
                      name="startTime"
                      type="time"
                      defaultValue={rule.startTime}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Fim
                    </label>
                    <input
                      name="endTime"
                      type="time"
                      defaultValue={rule.endTime}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                      required
                    />
                  </div>

                  <div className="md:col-span-4">
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Salvar alterações
                    </button>
                  </div>
                </form>

                <div className="mt-3 flex gap-3">
                  <form action={toggleAvailabilityRuleStatusAction}>
                    <input type="hidden" name="ruleId" value={rule.id} />

                    <button
                      type="submit"
                      className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {rule.active ? "Desativar horário" : "Ativar horário"}
                    </button>
                  </form>

                  <form action={deleteAvailabilityRuleAction}>
                    <input type="hidden" name="ruleId" value={rule.id} />

                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      Excluir horário
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}