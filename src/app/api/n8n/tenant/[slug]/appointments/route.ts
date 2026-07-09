import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(request: NextRequest) {
  const apiKey = process.env.N8N_API_KEY;

  if (!apiKey) {
    return false;
  }

  const authorizationHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  if (apiKeyHeader === apiKey) {
    return true;
  }

  if (authorizationHeader === `Bearer ${apiKey}`) {
    return true;
  }

  return false;
}

function getStringValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Horário inválido.");
  }

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getWeekdayFromDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    throw new Error("Data inválida.");
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

function buildDateTime(date: string, time: string) {
  if (!date || !time) {
    throw new Error("Data e horário são obrigatórios.");
  }

  return new Date(`${date}T${time}:00-03:00`);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function findProfessional({
  tenantId,
  professionalId,
  professionalName,
}: {
  tenantId: string;
  professionalId: string;
  professionalName: string;
}) {
  if (professionalId) {
    return prisma.professional.findFirst({
      where: {
        id: professionalId,
        tenantId,
        active: true,
      },
    });
  }

  if (!professionalName) {
    return null;
  }

  const professionals = await prisma.professional.findMany({
    where: {
      tenantId,
      active: true,
    },
  });

  return (
    professionals.find(
      (professional) =>
        professional.name.toLowerCase().trim() ===
        professionalName.toLowerCase().trim()
    ) ?? null
  );
}

async function findService({
  tenantId,
  serviceId,
  serviceName,
}: {
  tenantId: string;
  serviceId: string;
  serviceName: string;
}) {
  if (serviceId) {
    return prisma.service.findFirst({
      where: {
        id: serviceId,
        tenantId,
        active: true,
      },
    });
  }

  if (!serviceName) {
    return null;
  }

  const services = await prisma.service.findMany({
    where: {
      tenantId,
      active: true,
    },
  });

  return (
    services.find(
      (service) =>
        service.name.toLowerCase().trim() ===
        serviceName.toLowerCase().trim()
    ) ?? null
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { slug } = await context.params;

    const tenant = await prisma.tenant.findUnique({
      where: {
        slug,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        {
          error: "Cliente não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const patientName = getStringValue(body.patientName);
    const patientPhone = getStringValue(body.patientPhone);
    const professionalId = getStringValue(body.professionalId);
    const professionalName = getStringValue(body.professionalName);
    const serviceId = getStringValue(body.serviceId);
    const serviceName = getStringValue(body.serviceName);
    const date = getStringValue(body.date);
    const startTime = getStringValue(body.startTime);
    const source = getStringValue(body.source) || "n8n";
    const executionId = getStringValue(body.executionId);

    if (!patientName) {
      return NextResponse.json(
        {
          error: "patientName é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!date || !startTime) {
      return NextResponse.json(
        {
          error: "date e startTime são obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    const professional = await findProfessional({
      tenantId: tenant.id,
      professionalId,
      professionalName,
    });

    if (!professional) {
      return NextResponse.json(
        {
          error: "Profissional não encontrado ou inativo.",
        },
        {
          status: 400,
        }
      );
    }

    const service = await findService({
      tenantId: tenant.id,
      serviceId,
      serviceName,
    });

    if (!service) {
      return NextResponse.json(
        {
          error: "Serviço não encontrado ou inativo.",
        },
        {
          status: 400,
        }
      );
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + service.durationMinutes;

    if (endMinutes > 24 * 60) {
      return NextResponse.json(
        {
          error: "O agendamento ultrapassa o final do dia.",
        },
        {
          status: 400,
        }
      );
    }

    const endTime = minutesToTime(endMinutes);
    const weekday = getWeekdayFromDateString(date);

    const availabilityRules = await prisma.availabilityRule.findMany({
      where: {
        tenantId: tenant.id,
        professionalId: professional.id,
        weekday,
        active: true,
      },
    });

    if (availabilityRules.length === 0) {
      return NextResponse.json(
        {
          error:
            "Esse profissional não possui horário disponível cadastrado para esse dia da semana.",
        },
        {
          status: 400,
        }
      );
    }

    const isInsideAvailability = availabilityRules.some((rule) => {
      const ruleStartMinutes = timeToMinutes(rule.startTime);
      const ruleEndMinutes = timeToMinutes(rule.endTime);

      return startMinutes >= ruleStartMinutes && endMinutes <= ruleEndMinutes;
    });

    if (!isInsideAvailability) {
      return NextResponse.json(
        {
          error:
            "O horário escolhido está fora da disponibilidade cadastrada para esse profissional.",
        },
        {
          status: 400,
        }
      );
    }

    const startAt = buildDateTime(date, startTime);
    const endAt = addMinutes(startAt, service.durationMinutes);

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
      return NextResponse.json(
        {
          error:
            "Já existe um agendamento para esse profissional nesse horário.",
        },
        {
          status: 409,
        }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        professionalId: professional.id,
        serviceId: service.id,
        patientName,
        patientPhone,
        startAt,
        endAt,
        status: "SCHEDULED",
        source,
      },
      include: {
        professional: true,
        service: true,
      },
    });

    await prisma.workflowLog.create({
      data: {
        tenantId: tenant.id,
        workflowName: "API Agendamentos",
        status: "success",
        message: `Agendamento criado via API para ${patientName}.`,
        executionId: executionId || null,
      },
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        professional: appointment.professional?.name,
        service: appointment.service?.name,
        startAt: appointment.startAt,
        endAt: appointment.endAt,
        status: appointment.status,
        source: appointment.source,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado ao criar agendamento.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}