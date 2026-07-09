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

function getBooleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function getTestTenant() {
  const tenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
  });

  if (!tenant) {
    throw new Error("Cliente de teste não encontrado.");
  }

  return tenant;
}

export async function updateIntegrationAction(formData: FormData) {
  const tenant = await getTestTenant();

  const provider = getStringValue(formData, "provider");
  const status = getStringValue(formData, "status");
  const accountName = getStringValue(formData, "accountName");
  const externalId = getStringValue(formData, "externalId");
  const notes = getStringValue(formData, "notes");
  const enabled = getBooleanValue(formData, "enabled");

  if (!provider) {
    throw new Error("Integração não informada.");
  }

  const allowedStatuses = ["DISCONNECTED", "PENDING", "CONNECTED", "ERROR"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Status inválido.");
  }

  await prisma.integrationConnection.upsert({
    where: {
      tenantId_provider: {
        tenantId: tenant.id,
        provider,
      },
    },
    update: {
      status,
      accountName,
      externalId,
      notes,
      enabled,
    },
    create: {
      tenantId: tenant.id,
      provider,
      status,
      accountName,
      externalId,
      notes,
      enabled,
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Integrações",
      status: "success",
      message: `Integração ${provider} atualizada.`,
    },
  });

  revalidatePath("/integracoes");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}