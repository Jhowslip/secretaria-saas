import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingTenant = await prisma.tenant.findUnique({
    where: {
      slug: "clinica-teste",
    },
  });

  if (existingTenant) {
    await prisma.tenant.delete({
      where: {
        id: existingTenant.id,
      },
    });
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "Clínica Teste",
      slug: "clinica-teste",
    },
  });

  await prisma.company.create({
    data: {
      tenantId: tenant.id,
      name: "Clínica Teste",
      segment: "Clínica médica",
      whatsapp: "5581999999999",
      email: "contato@clinicateste.com.br",
      address: "Recife - PE",
      website: "https://clinicateste.com.br",
      assistantName: "Maria",
      assistantTone: "profissional, simpática e objetiva",
    },
  });

  const draAna = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name: "Dra. Ana Silva",
      specialty: "Cardiologista",
      bio: "Atendimento em cardiologia clínica para adultos.",
      defaultDurationMinutes: 40,
      priceInCents: 50000,
      active: true,
    },
  });

  const drJoao = await prisma.professional.create({
    data: {
      tenantId: tenant.id,
      name: "Dr. João Ferreira",
      specialty: "Clínico geral",
      bio: "Atendimento clínico geral e acompanhamento de rotina.",
      defaultDurationMinutes: 30,
      priceInCents: 30000,
      active: true,
    },
  });

  const consultaCardio = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Consulta cardiológica",
      description: "Consulta com avaliação clínica, histórico do paciente e orientação médica.",
      durationMinutes: 40,
      priceInCents: 50000,
      preparationNotes: "Levar exames anteriores, se houver.",
      active: true,
    },
  });

  await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Consulta clínica geral",
      description: "Consulta para avaliação inicial, sintomas gerais e encaminhamentos.",
      durationMinutes: 30,
      priceInCents: 30000,
      preparationNotes: "Levar documento com foto e exames recentes, se houver.",
      active: true,
    },
  });

  await prisma.availabilityRule.createMany({
    data: [
      {
        tenantId: tenant.id,
        professionalId: draAna.id,
        weekday: 1,
        startTime: "08:00",
        endTime: "12:00",
        active: true,
      },
      {
        tenantId: tenant.id,
        professionalId: draAna.id,
        weekday: 3,
        startTime: "14:00",
        endTime: "18:00",
        active: true,
      },
      {
        tenantId: tenant.id,
        professionalId: drJoao.id,
        weekday: 2,
        startTime: "09:00",
        endTime: "13:00",
        active: true,
      },
      {
        tenantId: tenant.id,
        professionalId: drJoao.id,
        weekday: 4,
        startTime: "13:00",
        endTime: "17:00",
        active: true,
      },
    ],
  });

  await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      professionalId: draAna.id,
      serviceId: consultaCardio.id,
      patientName: "Paciente Exemplo",
      patientPhone: "5581888888888",
      startAt: new Date("2026-07-09T12:00:00.000Z"),
      endAt: new Date("2026-07-09T12:40:00.000Z"),
      status: "SCHEDULED",
      source: "manual",
    },
  });

  await prisma.automationSettings.create({
    data: {
      tenantId: tenant.id,
      secretaryEnabled: false,
      remindersEnabled: false,
      leadRecoveryEnabled: false,
      billingEnabled: false,
      humanEscalationEnabled: true,
      voiceCallEnabled: false,
      audioResponseEnabled: false,
    },
  });

  await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName: "Setup inicial",
      status: "success",
      message: "Cliente de teste criado com sucesso.",
    },
  });

  console.log("Cliente de teste criado com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });