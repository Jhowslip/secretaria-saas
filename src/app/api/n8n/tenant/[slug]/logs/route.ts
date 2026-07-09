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

function normalizeStatus(status: unknown) {
  if (typeof status !== "string") {
    return "success";
  }

  const normalizedStatus = status.toLowerCase();

  const allowedStatuses = ["success", "error", "warning", "pending"];

  if (!allowedStatuses.includes(normalizedStatus)) {
    return "success";
  }

  return normalizedStatus;
}

function getStringValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(
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

  const workflowName = getStringValue(body.workflowName);
  const status = normalizeStatus(body.status);
  const message = getStringValue(body.message);
  const executionId = getStringValue(body.executionId);

  if (!workflowName) {
    return NextResponse.json(
      {
        error: "workflowName é obrigatório.",
      },
      {
        status: 400,
      }
    );
  }

  const log = await prisma.workflowLog.create({
    data: {
      tenantId: tenant.id,
      workflowName,
      status,
      message: message || null,
      executionId: executionId || null,
    },
  });

  return NextResponse.json({
    success: true,
    log: {
      id: log.id,
      workflowName: log.workflowName,
      status: log.status,
      message: log.message,
      executionId: log.executionId,
      createdAt: log.createdAt,
    },
  });
}