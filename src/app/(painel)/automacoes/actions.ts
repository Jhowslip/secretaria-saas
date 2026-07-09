"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export async function updateAutomationSettingsAction(formData: FormData) {
  const tenant = await getTestTenant();

  const secretaryEnabled = getBooleanValue(formData, "secretaryEnabled");
  const remindersEnabled = getBooleanValue(formData, "remindersEnabled");
  const leadRecoveryEnabled = getBooleanValue(formData, "leadRecoveryEnabled");
  const billingEnabled = getBooleanValue(formData, "billingEnabled");
  const humanEscalationEnabled = getBooleanValue(formData, "humanEscalationEnabled");
  const voiceCallEnabled = getBooleanValue(formData, "voiceCallEnabled");
  const audioResponseEnabled = getBooleanValue(formData, "audioResponseEnabled");

  await prisma.automationSettings.upsert({
    where: {
      tenantId: tenant.id,
    },
    update: {
      secretaryEnabled,
      remindersEnabled,
      leadRecoveryEnabled,
      billingEnabled,
      humanEscalationEnabled,
      voiceCallEnabled,
      audioResponseEnabled,
    },
    create: {
      tenantId: tenant.id,
      secretaryEnabled,
      remindersEnabled,
      leadRecoveryEnabled,
      billingEnabled,
      humanEscalationEnabled,
      voiceCallEnabled,
      audioResponseEnabled,
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Automações",
      status: "success",
      message: "Configurações de automação atualizadas.",
    },
  });

  revalidatePath("/automacoes");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}