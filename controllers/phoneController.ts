import type { Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "../db/generated/prisma";

// Simple in-memory store for demonstration purposes
export const savedPhoneNumbers: string[] = [];
const numberToExecutionId: Record<string, string> = {};

const BOLNA_API_URL = "https://api.bolna.ai/call";
const BOLNA_BEARER = "Bearer bn-ef4f471c9b8d4201acf56b35e01c94a0";
const BOLNA_AGENT_ID = "2524295d-ab7c-427d-85f5-0ec913632f87";
const BOLNA_FROM_PHONE = "";

const prisma = new PrismaClient();

export async function getPhoneNumber(req: Request, res: Response) {
  const phoneNumber = req.body?.["phone-number"];

  if (typeof phoneNumber !== "string" || phoneNumber.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid payload. Expect { "phone-number": "<string>" }' });
  }

  savedPhoneNumbers.push(phoneNumber);

  let responseBody: any = null;
  try {
    const resp = await axios.post(
      BOLNA_API_URL,
      {
        agent_id: BOLNA_AGENT_ID,
        from_phone_number: BOLNA_FROM_PHONE,
        recipient_phone_number: phoneNumber,
      },
      {
        headers: {
          Authorization: BOLNA_BEARER,
          "Content-Type": "application/json",
        },
        // timeout: 10_000,
      }
    );

    console.log(resp.data)
    responseBody = resp.data;
    const executionId = (resp.data && (resp.data.execution_id || resp.data.id)) || "";
    if (executionId) {
      numberToExecutionId[phoneNumber] = executionId;
    }

    // Persist phone number (and optionally execution id if present)
    try {
      await prisma.user.create({
        data: {
          number: phoneNumber,
          transcript: "",
        },
      });
    } catch (dbError) {
      // eslint-disable-next-line no-console
      console.error("Failed to persist phone number:", dbError);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to trigger external call:", error);
    return res.status(502).json({ error: "Failed to trigger call" });
  }

  const executionId = numberToExecutionId[phoneNumber] || "";
  const bodyToReturn = responseBody ? { ...responseBody, execution_id: executionId } : { execution_id: executionId };
  return res.status(201).json(bodyToReturn);
}

export async function getExecutionLog(req: Request, res: Response) {
  const executionId = req.params.executionId;
  if (!executionId) {
    return res.status(400).json({ error: "executionId is required" });
  }

  const url = `https://api.bolna.ai/executions/${encodeURIComponent(executionId)}/log`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: BOLNA_BEARER,
      },
    });
    return res.status(200).json(response.data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to fetch execution log:", error);
    return res.status(502).json({ error: "Failed to fetch execution log" });
  }
}




 

