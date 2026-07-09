import { prisma } from "@/lib/prisma";
import { updateCompanyAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmpresaPage() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      company: true,
    },
  });

  if (!tenant) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Empresa</h2>
        <p className="mt-2 text-red-600">
          Nenhum cliente de teste encontrado no banco.
        </p>
      </div>
    );
  }

  const company = tenant.company;

  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Empresa</h2>
        <p className="mt-2 text-slate-600">
          Configure os dados principais da clínica ou empresa. Esses dados serão usados pela secretária virtual.
        </p>
      </div>

      <form action={updateCompanyAction} className="mt-8 max-w-3xl rounded-xl border bg-white p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome da empresa
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={company?.name ?? tenant.name}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="segment" className="block text-sm font-medium text-slate-700">
              Segmento
            </label>
            <input
              id="segment"
              name="segment"
              type="text"
              defaultValue={company?.segment ?? ""}
              placeholder="Ex: Clínica médica"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="text"
              defaultValue={company?.whatsapp ?? ""}
              placeholder="Ex: 5581999999999"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={company?.email ?? ""}
              placeholder="contato@empresa.com.br"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-slate-700">
              Endereço
            </label>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={company?.address ?? ""}
              placeholder="Ex: Recife - PE"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="website" className="block text-sm font-medium text-slate-700">
              Site
            </label>
            <input
              id="website"
              name="website"
              type="text"
              defaultValue={company?.website ?? ""}
              placeholder="https://empresa.com.br"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label htmlFor="assistantName" className="block text-sm font-medium text-slate-700">
              Nome da secretária virtual
            </label>
            <input
              id="assistantName"
              name="assistantName"
              type="text"
              defaultValue={company?.assistantName ?? "Maria"}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label htmlFor="assistantTone" className="block text-sm font-medium text-slate-700">
              Tom de atendimento
            </label>
            <input
              id="assistantTone"
              name="assistantTone"
              type="text"
              defaultValue={company?.assistantTone ?? "profissional, simpática e objetiva"}
              placeholder="Ex: acolhedor, direto e profissional"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-slate-900"
              required
            />
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">
            Como isso será usado pela automação?
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Esses dados vão alimentar o prompt da secretária virtual. Por exemplo: nome da empresa, estilo da resposta, WhatsApp, endereço e informações principais.
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  );
}