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
  return new Date(`${date}T${time}:00-03:00`);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function hasConflict({
  slotStart,
  slotEnd,
  appointments,
}: {
  slotStart: Date;
  slotEnd: Date;
  appointments: {
    startAt: Date;
    endAt: Date;
  }[];
}) {
  return appointments.some((appointment) => {
    return appointment.startAt < slotEnd && appointment.endAt > slotStart;
  });
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
        service.name.toLowerCase().trim() === serviceName.toLowerCase().trim()
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

    const professionalId = getStringValue(body.professionalId);
    const professionalName = getStringValue(body.professionalName);
    const serviceId = getStringValue(body.serviceId);
    const serviceName = getStringValue(body.serviceName);
    const date = getStringValue(body.date);

    if (!date) {
      return NextResponse.json(
        {
          error: "date é obrigatório.",
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

    const weekday = getWeekdayFromDateString(date);

    const availabilityRules = await prisma.availabilityRule.findMany({
      where: {
        tenantId: tenant.id,
        professionalId: professional.id,
        weekday,
        active: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (availabilityRules.length === 0) {
      return NextResponse.json({
        success: true,
        date,
        professional: professional.name,
        service: service.name,
        durationMinutes: service.durationMinutes,
        slots: [],
        message:
          "Esse profissional não possui horários cadastrados para esse dia.",
      });
    }

    const dayStart = buildDateTime(date, "00:00");
    const dayEnd = buildDateTime(date, "23:59");

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        professionalId: professional.id,
        status: {
          not: "CANCELED",
        },
        startAt: {
          lt: dayEnd,
        },
        endAt: {
          gt: dayStart,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    });

    const slots: {
      startTime: string;
      endTime: string;
    }[] = [];

    for (const rule of availabilityRules) {
      const ruleStartMinutes = timeToMinutes(rule.startTime);
      const ruleEndMinutes = timeToMinutes(rule.endTime);

      let currentStartMinutes = ruleStartMinutes;

      while (currentStartMinutes + service.durationMinutes <= ruleEndMinutes) {
        const currentEndMinutes = currentStartMinutes + service.durationMinutes;

        const slotStartTime = minutesToTime(currentStartMinutes);
        const slotEndTime = minutesToTime(currentEndMinutes);

        const slotStart = buildDateTime(date, slotStartTime);
        const slotEnd = addMinutes(slotStart, service.durationMinutes);

        const conflict = hasConflict({
          slotStart,
          slotEnd,
          appointments,
        });

        if (!conflict) {
          slots.push({
            startTime: slotStartTime,
            endTime: slotEndTime,
          });
        }

        currentStartMinutes += service.durationMinutes;
      }
    }

    return NextResponse.json({
      success: true,
      date,
      professional: professional.name,
      service: service.name,
      durationMinutes: service.durationMinutes,
      slots,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao buscar horários disponíveis.";

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