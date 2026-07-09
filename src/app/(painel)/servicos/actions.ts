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

function parsePriceToCents(value: string) {
  if (!value) {
    return null;
  }

  const normalizedValue = value.replace(/\./g, "").replace(",", ".");
  const numericValue = Number(normalizedValue);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return Math.round(numericValue * 100);
}

function parseDuration(value: string) {
  const duration = Number(value);

  if (Number.isNaN(duration) || duration <= 0) {
    return 40;
  }

  return duration;
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

export async function createServiceAction(formData: FormData) {
  const tenant = await getTestTenant();

  const name = getStringValue(formData, "name");
  const description = getStringValue(formData, "description");
  const durationMinutes = parseDuration(getStringValue(formData, "durationMinutes"));
  const priceInCents = parsePriceToCents(getStringValue(formData, "price"));
  const preparationNotes = getStringValue(formData, "preparationNotes");

  if (!name) {
    throw new Error("O nome do serviço é obrigatório.");
  }

  await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name,
      description,
      durationMinutes,
      priceInCents,
      preparationNotes,
      active: true,
    },
  });

  revalidatePath("/servicos");
  revalidatePath("/dashboard");
}

export async function updateServiceAction(formData: FormData) {
  const tenant = await getTestTenant();

  const serviceId = getStringValue(formData, "serviceId");
  const name = getStringValue(formData, "name");
  const description = getStringValue(formData, "description");
  const durationMinutes = parseDuration(getStringValue(formData, "durationMinutes"));
  const priceInCents = parsePriceToCents(getStringValue(formData, "price"));
  const preparationNotes = getStringValue(formData, "preparationNotes");

  if (!serviceId) {
    throw new Error("Serviço não informado.");
  }

  if (!name) {
    throw new Error("O nome do serviço é obrigatório.");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId: tenant.id,
    },
  });

  if (!service) {
    throw new Error("Serviço não encontrado.");
  }

  await prisma.service.update({
    where: {
      id: service.id,
    },
    data: {
      name,
      description,
      durationMinutes,
      priceInCents,
      preparationNotes,
    },
  });

  revalidatePath("/servicos");
  revalidatePath("/dashboard");
}

export async function toggleServiceStatusAction(formData: FormData) {
  const tenant = await getTestTenant();

  const serviceId = getStringValue(formData, "serviceId");

  if (!serviceId) {
    throw new Error("Serviço não informado.");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId: tenant.id,
    },
  });

  if (!service) {
    throw new Error("Serviço não encontrado.");
  }

  await prisma.service.update({
    where: {
      id: service.id,
    },
    data: {
      active: !service.active,
    },
  });

  revalidatePath("/servicos");
  revalidatePath("/dashboard");
}