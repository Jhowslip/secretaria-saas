"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

export async function clearLogsAction() {
  const tenant = await getTestTenant();

  await prisma.workflowLog.deleteMany({
    where: {
      tenantId: tenant.id,
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Logs",
      status: "success",
      message: "Histórico de logs limpo manualmente.",
    },
  });

  revalidatePath("/logs");
  revalidatePath("/dashboard");
}