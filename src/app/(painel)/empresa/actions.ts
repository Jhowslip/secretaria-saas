"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function updateCompanyAction(formData: FormData) {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
    include: {
      company: true,
    },
  });

  if (!tenant) {
    throw new Error("Cliente de teste não encontrado.");
  }

  const name = getStringValue(formData, "name");
  const segment = getStringValue(formData, "segment");
  const whatsapp = getStringValue(formData, "whatsapp");
  const email = getStringValue(formData, "email");
  const address = getStringValue(formData, "address");
  const website = getStringValue(formData, "website");
  const assistantName = getStringValue(formData, "assistantName");
  const assistantTone = getStringValue(formData, "assistantTone");

  await prisma.company.upsert({
    where: {
      tenantId: tenant.id,
    },
    update: {
      name,
      segment,
      whatsapp,
      email,
      address,
      website,
      assistantName,
      assistantTone,
    },
    create: {
      tenantId: tenant.id,
      name,
      segment,
      whatsapp,
      email,
      address,
      website,
      assistantName,
      assistantTone,
    },
  });

  await prisma.tenant.update({
    where: {
      id: tenant.id,
    },
    data: {
      name,
    },
  });

  revalidatePath("/empresa");
  revalidatePath("/dashboard");
}