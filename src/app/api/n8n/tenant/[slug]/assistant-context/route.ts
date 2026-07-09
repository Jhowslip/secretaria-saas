import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const weekdays: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

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

function formatCurrency(valueInCents?: number | null) {
  if (!valueInCents) {
    return "valor não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatProfessionals(
  professionals: {
    name: string;
    specialty: string | null;
    defaultDurationMinutes: number;
    priceInCents: number | null;
    bio: string | null;
  }[]
) {
  if (professionals.length === 0) {
    return "- Nenhum profissional ativo cadastrado.";
  }

  return professionals
    .map((professional) => {
      return [
        `- ${professional.name}`,
        professional.specialty ? `  Especialidade: ${professional.specialty}` : null,
        `  Duração padrão: ${professional.defaultDurationMinutes} minutos`,
        `  Valor padrão: ${formatCurrency(professional.priceInCents)}`,
        professional.bio ? `  Observação: ${professional.bio}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatServices(
  services: {
    name: string;
    description: string | null;
    durationMinutes: number;
    priceInCents: number | null;
    preparationNotes: string | null;
  }[]
) {
  if (services.length === 0) {
    return "- Nenhum serviço ativo cadastrado.";
  }

  return services
    .map((service) => {
      return [
        `- ${service.name}`,
        `  Duração: ${service.durationMinutes} minutos`,
        `  Valor: ${formatCurrency(service.priceInCents)}`,
        service.description ? `  Descrição: ${service.description}` : null,
        service.preparationNotes ? `  Preparo/orientação: ${service.preparationNotes}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatAvailabilityRules(
  rules: {
    professional: {
      name: string;
    };
    weekday: number;
    startTime: string;
    endTime: string;
  }[]
) {
  if (rules.length === 0) {
    return "- Nenhum horário ativo cadastrado.";
  }

  return rules
    .map((rule) => {
      return `- ${rule.professional.name}: ${weekdays[rule.weekday] ?? "Dia inválido"} das ${rule.startTime} às ${rule.endTime}`;
    })
    .join("\n");
}

function formatAutomationRules(settings: {
  secretaryEnabled: boolean;
  remindersEnabled: boolean;
  leadRecoveryEnabled: boolean;
  billingEnabled: boolean;
  humanEscalationEnabled: boolean;
  voiceCallEnabled: boolean;
  audioResponseEnabled: boolean;
} | null) {
  if (!settings) {
    return "- Nenhuma configuração de automação cadastrada.";
  }

  return [
    `- Secretária virtual: ${settings.secretaryEnabled ? "ativa" : "desativada"}`,
    `- Lembretes de agendamento: ${settings.remindersEnabled ? "ativos" : "desativados"}`,
    `- Recuperação de leads: ${settings.leadRecoveryEnabled ? "ativa" : "desativada"}`,
    `- Cobrança automática: ${settings.billingEnabled ? "ativa" : "desativada"}`,
    `- Escalação para humano: ${settings.humanEscalationEnabled ? "ativa" : "desativada"}`,
    `- Ligações automáticas: ${settings.voiceCallEnabled ? "ativas" : "desativadas"}`,
    `- Resposta por áudio: ${settings.audioResponseEnabled ? "ativa" : "desativada"}`,
  ].join("\n");
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

  const companyName = tenant.company?.name ?? tenant.name;
  const assistantName = tenant.company?.assistantName ?? "secretária virtual";
  const assistantTone =
    tenant.company?.assistantTone ?? "profissional, simpática e objetiva";

  const contextText = `
Você é ${assistantName}, secretária virtual da ${companyName}.

Tom de atendimento:
${assistantTone}

Dados da empresa:
- Nome: ${companyName}
- Segmento: ${tenant.company?.segment ?? "não informado"}
- WhatsApp: ${tenant.company?.whatsapp ?? "não informado"}
- E-mail: ${tenant.company?.email ?? "não informado"}
- Endereço: ${tenant.company?.address ?? "não informado"}
- Site: ${tenant.company?.website ?? "não informado"}

Profissionais ativos:
${formatProfessionals(tenant.professionals)}

Serviços ativos:
${formatServices(tenant.services)}

Horários cadastrados:
${formatAvailabilityRules(tenant.availabilityRules)}

Configurações de automação:
${formatAutomationRules(tenant.automationSettings)}

Regras obrigatórias para atendimento:
- Não invente profissionais, serviços, valores, preparos ou horários.
- Use apenas as informações fornecidas neste contexto.
- Quando o paciente pedir horários, consulte a API de horários disponíveis antes de responder.
- Quando o paciente escolher um horário, crie o agendamento pela API de agendamentos.
- Se não houver informação suficiente, peça o dado que falta de forma objetiva.
- Se o assunto exigir humano, acione escalação humana quando estiver habilitada.
- Não confirme agendamento sem retorno positivo da API de agendamentos.
- Não diga que um horário está disponível sem consultar a API de horários disponíveis.
`.trim();

  return NextResponse.json({
    success: true,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
    assistantName,
    companyName,
    contextText,
  });
}