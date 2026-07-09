import { prisma } from "@/lib/prisma";
import {
  createProfessionalAction,
  toggleProfessionalStatusAction,
  updateProfessionalAction,
} from "./actions";

function formatCurrency(valueInCents?: number | null) {
  if (!valueInCents) {
    return "Não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatPriceInput(valueInCents?: number | null) {
  if (!valueInCents) {
    return "";
  }

  return String(valueInCents / 100).replace(".", ",");
}

export default async function ProfissionaisPage() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      professionals: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profissionais</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Profissionais</h2>
        <p className="mt-2 text-slate-600">
          Cadastre os profissionais que poderão ser usados pela secretária virtual nos atendimentos e agendamentos.
        </p>
      </div>

      <form
        action={createProfessionalAction}
        className="mt-8 max-w-4xl rounded-xl border bg-white p-6"
      >
        <h3 className="font-semibold text-slate-900">Cadastrar novo profissional</h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Dra. Ana Silva"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-slate-700">
              Especialidade
            </label>
            <input
              id="specialty"
              name="specialty"
              type="text"
              placeholder="Ex: Cardiologista"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="defaultDurationMinutes"
              className="block text-sm font-medium text-slate-700"
            >
              Duração padrão em minutos
            </label>
            <input
              id="defaultDurationMinutes"
              name="defaultDurationMinutes"
              type="number"
              defaultValue={40}
              min={5}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700">
              Valor da consulta
            </label>
            <input
              id="price"
              name="price"
              type="text"
              placeholder="Ex: 500,00"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
              Descrição curta
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              placeholder="Ex: Atendimento em cardiologia clínica para adultos."
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Cadastrar profissional
          </button>
        </div>
      </form>

      <div className="mt-8 max-w-4xl">
        <h3 className="font-semibold text-slate-900">Profissionais cadastrados</h3>

        <div className="mt-4 space-y-4">
          {tenant.professionals.length === 0 ? (
            <div className="rounded-xl border bg-white p-6">
              <p className="text-sm text-slate-500">
                Nenhum profissional cadastrado ainda.
              </p>
            </div>
          ) : (
            tenant.professionals.map((professional) => (
              <div key={professional.id} className="rounded-xl border bg-white p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{professional.name}</p>
                    <p className="text-sm text-slate-500">
                      {professional.specialty || "Sem especialidade cadastrada"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {professional.defaultDurationMinutes} min ·{" "}
                      {formatCurrency(professional.priceInCents)}
                    </p>
                  </div>

                  <span
                    className={
                      professional.active
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    }
                  >
                    {professional.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <form action={updateProfessionalAction} className="grid gap-5 md:grid-cols-2">
                  <input
                    type="hidden"
                    name="professionalId"
                    value={professional.id}
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Nome
                    </label>
                    <input
                      name="name"
                      type="text"
                      defaultValue={professional.name}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Especialidade
                    </label>
                    <input
                      name="specialty"
                      type="text"
                      defaultValue={professional.specialty ?? ""}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Duração em minutos
                    </label>
                    <input
                      name="defaultDurationMinutes"
                      type="number"
                      defaultValue={professional.defaultDurationMinutes}
                      min={5}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Valor
                    </label>
                    <input
                      name="price"
                      type="text"
                      defaultValue={formatPriceInput(professional.priceInCents)}
                      placeholder="Ex: 500,00"
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Descrição curta
                    </label>
                    <textarea
                      name="bio"
                      rows={3}
                      defaultValue={professional.bio ?? ""}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="flex gap-3 md:col-span-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                    >
                      Salvar alterações
                    </button>
                  </div>
                </form>

                <form action={toggleProfessionalStatusAction} className="mt-3">
                  <input
                    type="hidden"
                    name="professionalId"
                    value={professional.id}
                  />

                  <button
                    type="submit"
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {professional.active ? "Desativar profissional" : "Ativar profissional"}
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}