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

  const normalizedValue = value
    .replace(/\./g, "")
    .replace(",", ".");

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

export async function createProfessionalAction(formData: FormData) {
  const tenant = await getTestTenant();

  const name = getStringValue(formData, "name");
  const specialty = getStringValue(formData, "specialty");
  const bio = getStringValue(formData, "bio");
  const defaultDurationMinutes = parseDuration(
    getStringValue(formData, "defaultDurationMinutes")
  );
  const priceInCents = parsePriceToCents(getStringValue(formData, "price"));

  if (!name) {
    throw new Error("O nome do profissional é obrigatório.");
  }

  await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name,
      specialty,
      bio,
      defaultDurationMinutes,
      priceInCents,
      active: true,
    },
  });

  revalidatePath("/profissionais");
  revalidatePath("/dashboard");
}

export async function updateProfessionalAction(formData: FormData) {
  const tenant = await getTestTenant();

  const professionalId = getStringValue(formData, "professionalId");
  const name = getStringValue(formData, "name");
  const specialty = getStringValue(formData, "specialty");
  const bio = getStringValue(formData, "bio");
  const defaultDurationMinutes = parseDuration(
    getStringValue(formData, "defaultDurationMinutes")
  );
  const priceInCents = parsePriceToCents(getStringValue(formData, "price"));

  if (!professionalId) {
    throw new Error("Profissional não informado.");
  }

  if (!name) {
    throw new Error("O nome do profissional é obrigatório.");
  }

  await prisma.professional.update({
    where: {
      id: professionalId,
      tenantId: tenant.id,
    },
    data: {
      name,
      specialty,
      bio,
      defaultDurationMinutes,
      priceInCents,
    },
  });

  revalidatePath("/profissionais");
  revalidatePath("/dashboard");
}

export async function toggleProfessionalStatusAction(formData: FormData) {
  const tenant = await getTestTenant();

  const professionalId = getStringValue(formData, "professionalId");

  if (!professionalId) {
    throw new Error("Profissional não informado.");
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

  await prisma.professional.update({
    where: {
      id: professional.id,
    },
    data: {
      active: !professional.active,
    },
  });

  revalidatePath("/profissionais");
  revalidatePath("/dashboard");
}