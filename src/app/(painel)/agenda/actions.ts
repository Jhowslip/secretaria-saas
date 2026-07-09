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

function buildDateTime(date: string, time: string) {
  if (!date || !time) {
    throw new Error("Data e horário são obrigatórios.");
  }

  return new Date(`${date}T${time}:00`);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getWeekdayFromDate(date: Date) {
  return date.getDay();
}

function getTimeFromDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function isTimeInsideAvailability({
  startTime,
  endTime,
  ruleStartTime,
  ruleEndTime,
}: {
  startTime: string;
  endTime: string;
  ruleStartTime: string;
  ruleEndTime: string;
}) {
  return startTime >= ruleStartTime && endTime <= ruleEndTime;
}

export async function createAppointmentAction(formData: FormData) {
  const tenant = await getTestTenant();

  const professionalId = getStringValue(formData, "professionalId");
  const serviceId = getStringValue(formData, "serviceId");
  const patientName = getStringValue(formData, "patientName");
  const patientPhone = getStringValue(formData, "patientPhone");
  const date = getStringValue(formData, "date");
  const startTime = getStringValue(formData, "startTime");

  if (!patientName) {
    throw new Error("O nome do paciente é obrigatório.");
  }

  if (!professionalId) {
    throw new Error("Selecione um profissional.");
  }

  if (!serviceId) {
    throw new Error("Selecione um serviço.");
  }

  const professional = await prisma.professional.findFirst({
    where: {
      id: professionalId,
      tenantId: tenant.id,
      active: true,
    },
  });

  if (!professional) {
    throw new Error("Profissional não encontrado ou inativo.");
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      tenantId: tenant.id,
      active: true,
    },
  });

  if (!service) {
    throw new Error("Serviço não encontrado ou inativo.");
  }

  const startAt = buildDateTime(date, startTime);
  const endAt = addMinutes(startAt, service.durationMinutes);

  const weekday = getWeekdayFromDate(startAt);
  const appointmentStartTime = getTimeFromDate(startAt);
  const appointmentEndTime = getTimeFromDate(endAt);

  const availabilityRules = await prisma.availabilityRule.findMany({
    where: {
      tenantId: tenant.id,
      professionalId: professional.id,
      weekday,
      active: true,
    },
  });

  if (availabilityRules.length === 0) {
    throw new Error(
      "Esse profissional não possui horário disponível cadastrado para esse dia da semana."
    );
  }

  const isInsideSomeAvailabilityRule = availabilityRules.some((rule) =>
    isTimeInsideAvailability({
      startTime: appointmentStartTime,
      endTime: appointmentEndTime,
      ruleStartTime: rule.startTime,
      ruleEndTime: rule.endTime,
    })
  );

  if (!isInsideSomeAvailabilityRule) {
    throw new Error(
      "O horário escolhido está fora da disponibilidade cadastrada para esse profissional."
    );
  }

  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      tenantId: tenant.id,
      professionalId: professional.id,
      status: {
        not: "CANCELED",
      },
      OR: [
        {
          startAt: {
            lt: endAt,
          },
          endAt: {
            gt: startAt,
          },
        },
      ],
    },
  });

  if (conflictingAppointment) {
    throw new Error("Já existe um agendamento para esse profissional nesse horário.");
  }

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      professionalId: professional.id,
      serviceId: service.id,
      patientName,
      patientPhone,
      startAt,
      endAt,
      status: "SCHEDULED",
      source: "manual",
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Agenda manual",
      status: "success",
      message: `Agendamento criado para ${patientName}.`,
    },
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const tenant = await getTestTenant();

  const appointmentId = getStringValue(formData, "appointmentId");
  const status = getStringValue(formData, "status");

  if (!appointmentId) {
    throw new Error("Agendamento não informado.");
  }

  const allowedStatuses = [
    "SCHEDULED",
    "CONFIRMED",
    "CANCELED",
    "COMPLETED",
    "NO_SHOW",
    "RESCHEDULED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Status inválido.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
    },
  });

  if (!appointment) {
    throw new Error("Agendamento não encontrado.");
  }

  await prisma.appointment.update({
    where: {
      id: appointment.id,
    },
    data: {
      status,
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Agenda manual",
      status: "success",
      message: `Status do agendamento atualizado para ${status}.`,
    },
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}

export async function deleteAppointmentAction(formData: FormData) {
  const tenant = await getTestTenant();

  const appointmentId = getStringValue(formData, "appointmentId");

  if (!appointmentId) {
    throw new Error("Agendamento não informado.");
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      tenantId: tenant.id,
    },
  });

  if (!appointment) {
    throw new Error("Agendamento não encontrado.");
  }

  await prisma.appointment.delete({
    where: {
      id: appointment.id,
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Agenda manual",
      status: "success",
      message: `Agendamento de ${appointment.patientName} excluído.`,
    },
  });

  revalidatePath("/agenda");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
}