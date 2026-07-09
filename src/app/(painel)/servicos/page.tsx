import { prisma } from "@/lib/prisma";
import {
  createServiceAction,
  toggleServiceStatusAction,
  updateServiceAction,
} from "./actions";

export const dynamic = "force-dynamic";

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

export default async function ServicosPage() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      services: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Serviços</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Serviços</h2>
        <p className="mt-2 text-slate-600">
          Cadastre consultas, exames, procedimentos ou serviços que a secretária virtual poderá oferecer e agendar.
        </p>
      </div>

      <form
        action={createServiceAction}
        className="mt-8 max-w-4xl rounded-xl border bg-white p-6"
      >
        <h3 className="font-semibold text-slate-900">Cadastrar novo serviço</h3>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome do serviço
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Ex: Consulta cardiológica"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="durationMinutes"
              className="block text-sm font-medium text-slate-700"
            >
              Duração em minutos
            </label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              defaultValue={40}
              min={5}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700">
              Valor
            </label>
            <input
              id="price"
              name="price"
              type="text"
              placeholder="Ex: 500,00"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="preparationNotes"
              className="block text-sm font-medium text-slate-700"
            >
              Preparo ou orientação
            </label>
            <input
              id="preparationNotes"
              name="preparationNotes"
              type="text"
              placeholder="Ex: levar exames anteriores"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-slate-700"
            >
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Ex: Consulta com avaliação clínica, histórico do paciente e orientação médica."
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">
            Como isso será usado pela automação?
          </p>
          <p className="mt-1 text-sm text-slate-600">
            A secretária virtual usará esses dados para responder dúvidas, informar valores, explicar preparos e identificar qual serviço o paciente deseja agendar.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Cadastrar serviço
          </button>
        </div>
      </form>

      <div className="mt-8 max-w-4xl">
        <h3 className="font-semibold text-slate-900">Serviços cadastrados</h3>

        <div className="mt-4 space-y-4">
          {tenant.services.length === 0 ? (
            <div className="rounded-xl border bg-white p-6">
              <p className="text-sm text-slate-500">
                Nenhum serviço cadastrado ainda.
              </p>
            </div>
          ) : (
            tenant.services.map((service) => (
              <div key={service.id} className="rounded-xl border bg-white p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {service.durationMinutes} min ·{" "}
                      {formatCurrency(service.priceInCents)}
                    </p>

                    {service.description ? (
                      <p className="mt-2 text-sm text-slate-500">
                        {service.description}
                      </p>
                    ) : null}

                    {service.preparationNotes ? (
                      <p className="mt-2 text-sm text-slate-500">
                        <strong>Preparo:</strong> {service.preparationNotes}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={
                      service.active
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
                    }
                  >
                    {service.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <form action={updateServiceAction} className="grid gap-5 md:grid-cols-2">
                  <input type="hidden" name="serviceId" value={service.id} />

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Nome do serviço
                    </label>
                    <input
                      name="name"
                      type="text"
                      defaultValue={service.name}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Duração em minutos
                    </label>
                    <input
                      name="durationMinutes"
                      type="number"
                      defaultValue={service.durationMinutes}
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
                      defaultValue={formatPriceInput(service.priceInCents)}
                      placeholder="Ex: 500,00"
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">
                      Preparo ou orientação
                    </label>
                    <input
                      name="preparationNotes"
                      type="text"
                      defaultValue={service.preparationNotes ?? ""}
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Descrição
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={service.description ?? ""}
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

                <form action={toggleServiceStatusAction} className="mt-3">
                  <input type="hidden" name="serviceId" value={service.id} />

                  <button
                    type="submit"
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {service.active ? "Desativar serviço" : "Ativar serviço"}
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