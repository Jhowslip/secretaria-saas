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

function parseWeekday(value: string) {
  const weekday = Number(value);

  if (Number.isNaN(weekday) || weekday < 0 || weekday > 6) {
    return 1;
  }

  return weekday;
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

export async function createAvailabilityRuleAction(formData: FormData) {
  const tenant = await getTestTenant();

  const professionalId = getStringValue(formData, "professionalId");
  const weekday = parseWeekday(getStringValue(formData, "weekday"));
  const startTime = getStringValue(formData, "startTime");
  const endTime = getStringValue(formData, "endTime");

  if (!professionalId) {
    throw new Error("Selecione um profissional.");
  }

  if (!startTime || !endTime) {
    throw new Error("Informe o horário de início e fim.");
  }

  const professional = await prisma.professional.findFirst({
    where: {
      id: professionalId,
      tenantId: tenant.id,
    },
  });

  if (!professional) {
    throw new Error("Profissional não encontrado.");
  }

  await prisma.availabilityRule.create({
    data: {
      tenantId: tenant.id,
      professionalId: professional.id,
      weekday,
      startTime,
      endTime,
      active: true,
    },
  });

  revalidatePath("/horarios");
}

export async function updateAvailabilityRuleAction(formData: FormData) {
  const tenant = await getTestTenant();

  const ruleId = getStringValue(formData, "ruleId");
  const weekday = parseWeekday(getStringValue(formData, "weekday"));
  const startTime = getStringValue(formData, "startTime");
  const endTime = getStringValue(formData, "endTime");

  if (!ruleId) {
    throw new Error("Horário não informado.");
  }

  if (!startTime || !endTime) {
    throw new Error("Informe o horário de início e fim.");
  }

  const rule = await prisma.availabilityRule.findFirst({
    where: {
      id: ruleId,
      tenantId: tenant.id,
    },
  });

  if (!rule) {
    throw new Error("Horário não encontrado.");
  }

  await prisma.availabilityRule.update({
    where: {
      id: rule.id,
    },
    data: {
      weekday,
      startTime,
      endTime,
    },
  });

  revalidatePath("/horarios");
}

export async function toggleAvailabilityRuleStatusAction(formData: FormData) {
  const tenant = await getTestTenant();

  const ruleId = getStringValue(formData, "ruleId");

  if (!ruleId) {
    throw new Error("Horário não informado.");
  }

  const rule = await prisma.availabilityRule.findFirst({
    where: {
      id: ruleId,
      tenantId: tenant.id,
    },
  });

  if (!rule) {
    throw new Error("Horário não encontrado.");
  }

  await prisma.availabilityRule.update({
    where: {
      id: rule.id,
    },
    data: {
      active: !rule.active,
    },
  });

  revalidatePath("/horarios");
}

export async function deleteAvailabilityRuleAction(formData: FormData) {
  const tenant = await getTestTenant();

  const ruleId = getStringValue(formData, "ruleId");

  if (!ruleId) {
    throw new Error("Horário não informado.");
  }

  const rule = await prisma.availabilityRule.findFirst({
    where: {
      id: ruleId,
      tenantId: tenant.id,
    },
  });

  if (!rule) {
    throw new Error("Horário não encontrado.");
  }

  await prisma.availabilityRule.delete({
    where: {
      id: rule.id,
    },
  });

  revalidatePath("/horarios");
}