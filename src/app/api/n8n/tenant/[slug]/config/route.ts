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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
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
    include: {
      company: true,
      professionals: {
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      services: {
        where: {
          active: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      availabilityRules: {
        where: {
          active: true,
        },
        include: {
          professional: true,
        },
        orderBy: [
          {
            weekday: "asc",
          },
          {
            startTime: "asc",
          },
        ],
      },
      automationSettings: true,
      integrationConnections: true,
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

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
    company: tenant.company,
    professionals: tenant.professionals,
    services: tenant.services,
    availabilityRules: tenant.availabilityRules.map((rule) => ({
      id: rule.id,
      professionalId: rule.professionalId,
      professionalName: rule.professional.name,
      weekday: rule.weekday,
      startTime: rule.startTime,
      endTime: rule.endTime,
    })),
    automationSettings: tenant.automationSettings,
    integrations: tenant.integrationConnections,
  });
}