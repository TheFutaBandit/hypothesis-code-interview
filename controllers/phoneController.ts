import type { Request, Response } from "express";
import axios from "axios";
import { PrismaClient } from "../db/generated/prisma";

const BOLNA_API_URL = "https://api.bolna.ai/call";
const BOLNA_BEARER = "Bearer bn-ef4f471c9b8d4201acf56b35e01c94a0";
const BOLNA_AGENT_ID = "2524295d-ab7c-427d-85f5-0ec913632f87";
const BOLNA_FROM_PHONE = "";

const prisma = new PrismaClient();

// Function to wait for call completion and return transcript
async function waitForCallCompletion(executionId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 5 minutes (30 * 10 seconds)
  
  while (attempts < maxAttempts) {
    try {
      const url = `https://api.bolna.ai/executions/${encodeURIComponent(executionId)}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: BOLNA_BEARER,
          "Content-Type": "application/json",
        },
      });
      
      const data = response.data;
      
      // Check if call is completed - include all possible completion statuses
      if (data.status === "completed" || 
          data.status === "failed" || 
          data.status === "call-disconnected" ||
          data.status === "completed_with_error" ||
          data.status === "hangup") {
        console.log(`Call completed with status: ${data.status}`);
        return data.transcript || "";
      }
      
      console.log(`Call status: ${data.status}, waiting... (attempt ${attempts + 1}/${maxAttempts})`);
      
      // Wait 10 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
      
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed to check call status:`, error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  throw new Error(`Timed out waiting for call completion for execution ID: ${executionId}`);
}

export async function getPhoneNumber(req: Request, res: Response) {
  const phoneNumber = req.body?.["phone-number"];

  if (typeof phoneNumber !== "string" || phoneNumber.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid payload. Expect { "phone-number": "<string>" }' });
  }

  let responseBody: any = null;
  let executionId: string = "";
  
  try {
    // First, save the phone number to the database
    try {
      await prisma.user.create({
        data: {
          number: phoneNumber,
          transcript: "",
        },
      });
      console.log(`Phone number saved to database: ${phoneNumber}`);
    } catch (dbError: any) {
      // If user already exists, that's fine
      if (dbError.code === 'P2002') {
        console.log(`Phone number already exists in database: ${phoneNumber}`);
      } else {
        console.error("Failed to persist phone number:", dbError);
        return res.status(500).json({ error: "Failed to save phone number to database" });
      }
    }

    // Make the call via Bolna API
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
      }
    );

    console.log("Call initiated successfully:", resp.data);
    responseBody = resp.data;
    executionId = (resp.data && (resp.data.execution_id || resp.data.id)) || "";
    
    if (!executionId) {
      return res.status(500).json({ error: "No execution ID received from Bolna API" });
    }

    // Option 1: Wait for call completion synchronously (blocks response)
    // This means the user waits until the call completes
    try {
      console.log("Waiting for call completion...");
      const transcript = await waitForCallCompletion(executionId);
      
      console.log(`Received transcript: "${transcript}"`);
      
      // Update database with transcript
      await prisma.user.update({
        where: { number: phoneNumber },
        data: { transcript: transcript }
      });
      console.log(`Transcript saved for phone number: ${phoneNumber}`);
      
      // Return response with transcript included
      const bodyToReturn = { 
        ...responseBody, 
        execution_id: executionId,
        transcript: transcript,
        status: "completed_with_transcript"
      };
      return res.status(201).json(bodyToReturn);
      
    } catch (completionError) {
      console.error("Failed to wait for call completion:", completionError);
      
      // Return response without transcript (call still in progress)
      const bodyToReturn = { 
        ...responseBody, 
        execution_id: executionId,
        status: "call_initiated_transcript_pending"
      };
      return res.status(201).json(bodyToReturn);
    }

  } catch (error: any) {
    console.error("Failed to trigger external call:", error);
    return res.status(502).json({ error: "Failed to trigger call" });
  }
}

// Alternative endpoint that doesn't wait for completion (non-blocking)
export async function getPhoneNumberNonBlocking(req: Request, res: Response) {
  const phoneNumber = req.body?.["phone-number"];

  if (typeof phoneNumber !== "string" || phoneNumber.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid payload. Expect { "phone-number": "<string>" }' });
  }

  let responseBody: any = null;
  let executionId: string = "";
  
  try {
    // First, save the phone number to the database
    try {
      await prisma.user.create({
        data: {
          number: phoneNumber,
          transcript: "",
        },
      });
      console.log(`Phone number saved to database: ${phoneNumber}`);
    } catch (dbError: any) {
      // If user already exists, that's fine
      if (dbError.code === 'P2002') {
        console.log(`Phone number already exists in database: ${phoneNumber}`);
      } else {
        console.error("Failed to persist phone number:", dbError);
        return res.status(500).json({ error: "Failed to save phone number to database" });
      }
    }

    // Make the call via Bolna API
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
      }
    );

    console.log("Call initiated successfully:", resp.data);
    responseBody = resp.data;
    executionId = (resp.data && (resp.data.execution_id || resp.data.id)) || "";
    
    if (!executionId) {
      return res.status(500).json({ error: "No execution ID received from Bolna API" });
    }

    // Start background process to wait for call completion and fetch transcript
    // This doesn't block the response
    waitForCallCompletion(executionId)
      .then(async (transcript) => {
        try {
          await prisma.user.update({
            where: { number: phoneNumber },
            data: { transcript: transcript }
          });
          console.log(`Transcript saved for phone number: ${phoneNumber}`);
        } catch (dbError) {
          console.error("Failed to update transcript in database:", dbError);
        }
      })
      .catch(error => {
        console.error("Background transcript fetching failed:", error);
      });

    // Return response immediately (non-blocking)
    const bodyToReturn = { 
      ...responseBody, 
      execution_id: executionId,
      status: "call_initiated_transcript_pending"
    };
    return res.status(201).json(bodyToReturn);

  } catch (error: any) {
    console.error("Failed to trigger external call:", error);
    return res.status(502).json({ error: "Failed to trigger call" });
  }
}

export async function getExecutionLog(req: Request, res: Response) {
  const executionId = req.params.executionId;
  if (!executionId) {
    return res.status(400).json({ error: "executionId is required" });
  }

  const url = `https://api.bolna.ai/executions/${encodeURIComponent(executionId)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: BOLNA_BEARER,
        "Content-Type": "application/json",
      },
    });
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error("Failed to fetch execution log:", error);
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        error: "Failed to fetch execution log",
        details: error.response.data,
        status: error.response.status
      });
    }
    
    return res.status(502).json({ error: "Failed to fetch execution log" });
  }
}

// New endpoint to get transcript for a specific phone number
export async function getTranscriptByPhoneNumber(req: Request, res: Response) {
  const phoneNumber = req.params.phoneNumber;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { number: phoneNumber }
    });

    if (!user) {
      return res.status(404).json({ error: "Phone number not found" });
    }

    return res.status(200).json({
      phoneNumber: user.number,
      transcript: user.transcript,
      hasTranscript: user.transcript.length > 0
    });
  } catch (error) {
    console.error("Failed to fetch transcript:", error);
    return res.status(500).json({ error: "Failed to fetch transcript" });
  }
}




 

