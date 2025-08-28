# Voice AI Phone Flow System

A Node.js/Express backend that integrates with Bolna AI to make phone calls and automatically save transcripts to a PostgreSQL database.

Please run "bun test-transcript-fix.mjs" to get the output of the flow, the output has been pasted below"

## What It Does

1. **Makes phone calls** via Bolna AI API
2. **Automatically waits** for call completion
3. **Fetches transcripts** when calls end
4. **Saves everything** to PostgreSQL database
5. **Returns transcript** in the response

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
# Set your PostgreSQL connection string
export DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

### 3. Start the Server
```bash
bun index.ts
# or
npm start
```

Server will start on `http://localhost:3000`

### 4. Test the System
```bash
bun test-transcript-fix.mjs
```

## How to Use

### Make a Phone Call
```bash
curl -X POST http://localhost:3000/api/phone/number \
  -H "Content-Type: application/json" \
  -d '{"phone-number": "+1234567890"}'
```

**What happens:**
1. Phone number is saved to database
2. Call is initiated via Bolna AI
3. System waits for call to complete
4. Transcript is fetched and saved to database
5. Response includes the transcript

### Response Example
```json
{
  "status": "completed_with_transcript",
  "execution_id": "abc123",
  "transcript": "assistant: Hello from Bolna\nuser: Hi there\n",
  "message": "done"
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/phone/number` | Make call and wait for transcript |
| GET | `/api/phone/executions/:executionId` | Get execution log from Bolna |
| GET | `/api/phone/transcript/:phoneNumber` | Get saved transcript from database |

## Database Schema

```sql
CREATE TABLE "user" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "transcript" TEXT NOT NULL,
  CONSTRAINT "user_number_key" UNIQUE ("number"),
  CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
```

## Configuration

Set these environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)

## How It Works

```
User POST /api/phone/number
         ↓
   Save phone to DB
         ↓
   Initiate call via Bolna
         ↓
   WAIT for call completion
         ↓
   Fetch transcript
         ↓
   Update database
         ↓
   Return response with transcript
```

## Testing

The included `test-transcript-fix.mjs` script demonstrates the complete flow:

1. Makes a call to a test number
2. Waits for completion
3. Verifies transcript is saved
4. Shows success/failure

Run it with:
```bash
bun test-transcript-fix.mjs
```

## Requirements

- Node.js 18+ or Bun
- PostgreSQL database
- Bolna AI API access
- Valid phone numbers for testing

## Troubleshooting

- **Database connection issues**: Check `DATABASE_URL` environment variable
- **Bolna API errors**: Verify API credentials in `controllers/phoneController.ts`
- **Call not completing**: Check phone number format and Bolna API status

## Notes

- Calls are made synchronously (you wait for completion)
- System polls Bolna API every 10 seconds
- Maximum wait time: 5 minutes
- Phone numbers must be unique in database

## System Overview

![Voice AI Phone Flow System](images/image.png)


