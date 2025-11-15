# Aging With AI — Architectural Overview

## 0. Development

### Getting Started

#### environment variables

Copy `.env.example` to `.env` and adjust the values as needed:

```bash
cp .env.example .env
```

`DATABASE_URL` points to your local Postgres instance (e.g. `localhost`), while `DATABASE_URL_DOCKER` keeps the containers wired to the in-compose `db` service. Update `NEXT_PUBLIC_APP_URL` if you expose the frontend on a different hostname. `NEXTAUTH_URL` should match the public origin (e.g. `http://localhost:3000`) and `NEXTAUTH_SECRET` must be a long random string (generate via `openssl rand -base64 32`).

#### add Featherless.ai api key

to the .env file add (replace ... with actual key):
```
FEATHERLESS_API_KEY=...
```

#### run the dev server

to start the server run:
```bash
docker compose up web
```

This command installs dependencies (cached in the `web-node-modules` volume), generates the Prisma client, pushes the schema, and starts the Next.js dev server on port 3000.

#### authentication

Real authentication is now powered by Auth.js + Prisma. The onboarding form creates a user record (with a bcrypt-hashed password) and the API route `/api/auth/[...nextauth]` manages sessions. To test sign-in manually you can also call the credentials endpoint via `curl`:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"supersafepassword","name":"Demo"}'
```

Then log in with the UI or via `curl --request POST http://localhost:3000/api/auth/callback/credentials ...` if needed.

### create an encryption key

to create an encryption key run this script:
```bash
./scripts/create_new_encryption_key.sh
```

#### viewing the project

Open localhost:3000 with your browser to see the website.


To start the Prisma Studio dashboard on port 5555, run:

```bash
docker compose up studio
```

You can also run `docker compose up` without arguments to bring up `db`, `web`, and `studio` simultaneously. Once studio is running, open [http://localhost:5555](http://localhost:5555) to explore the database.

test the python api by opening localhost:8000 with the corresponding path.

### Development

#### using prisma ORM

to import prisma you can do this
```typescript
import { prisma } from "@/lib/prisma";
```

## 1. Concept

A planning and activity-matching system for older adults (~65+) who tend to stay at home.  
The goal is to encourage small steps outside, discover enjoyable activities, and support shared outings with family members — while maintaining dignity, agency, and privacy.

The system suggests relevant activities from public event sources (e.g. Espoo Linked Events), ranks them using AI, and nudges the senior with lightweight, adjustable reminders. Seniors remain fully in control: they choose, we assist.


## 2. Core Requirements

- Motivate seniors to try things without pressure.  
- Provide high-quality, personalized suggestions.  
- Encourage going outside and engaging with the city.  
- Maintain independence, privacy, and respect.  
- Keep the system simple to use, low friction, no gimmicks.

## 3. User Flows

### 3.1 Senior onboarding  
- Senior enters free-text interests, dislikes, availability, mobility constraints, and comfort levels.  
- AI converts the free text into a structured preference profile.  
- The system immediately generates initial recommendations.

### 3.2 Shared onboarding (relative / child / friend)  
- Senior shares a simple invite link.  
- The relative’s input is turned into a separate profile.  
- The system computes a joint profile (overlap of interests, times, budget).  
- Suggestions are adapted for activities they can enjoy together.

### 3.3 Daily suggestions  
- Senior receives 1–3 gentle nudges each day.  
- Suggestions contain a short reason and a link to see more details.  
- Seniors choose “Interested / Not now / Don’t show again”.

### 3.4 Planning support  
- If the senior is interested, the app helps with:  
  - Details and directions  
  - Calendar reminders  
  - Coordination with relatives (if applicable)

## 4. System Architecture

### 4.1 Components

- **Frontend**  
  Simple UI for onboarding, browsing suggestions, and planning.

- **Backend API**  
  Stores user profiles, event data, system preferences, and feedback.  
  Provides endpoints for:  
  - Profile creation  
  - Event storage  
  - Suggestion generation  
  - Feedback (positive/negative)

- **Event Ingestion Layer (n8n)**  
  Periodically pulls public events (e.g. Linked Events Espoo).  
  Normalizes and pushes them to the backend.

- **AI Layer (Featherless + optionally n8n AI Agent)**  
  Handles:  
  - Free-text profile extraction  
  - Joint profile creation  
  - Semantic scoring of events  
  - Optional micro-messages for nudges

- **Notification Layer (n8n)**  
  Sends emails/WhatsApp/SMS with suggestions.  
  Triggers planning workflows.  
  Handles scheduling.

## 5. AI Integration Strategy

### 5.1 Featherless — primary LLM engine  
Used for all text understanding and scoring:

- Extracting structured profile JSON from free text  
- Merging two profiles into a joint profile  
- Ranking events by relevance  
- Producing short reasons for recommendations  
- Generating short, friendly micro-suggestions (optional)

Featherless is called by the backend using standard chat completion API endpoints.

### 5.2 n8n — orchestration and automation  
n8n handles:

- Scheduled event fetching  
- Scheduled suggestion delivery  
- Workflow branching (e.g. if senior taps “interested”, trigger plan creation)  
- Optional AI Agent node for rewriting nudges or tone adjustments

n8n does **not** replace Featherless for core ranking logic.  
Instead, it organizes when the calls happen.

## 6. Data Models

### 6.1 User profile (stored after onboarding)  
```json
{
  "user_id": "...",
  "hobbies": [],
  "disliked": [],
  "preferred_time_of_day": [],
  "social_preference": "alone | small_group | family",
  "physical_intensity": 1,
  "noise_tolerance": 1,
  "travel_radius_km": 5,
  "tags": [],
  "availability": ["weekday_evenings", "weekends"],
  "updated_at": "..."
}
```

### 6.2 Event object  
```json
{
  "id": "...",
  "title": "...",
  "description": "...",
  "location": {"lat": ..., "lon": ..., "district": "..."},
  "start_time": "...",
  "end_time": "...",
  "tags": [],
  "price": "free | paid",
  "source": "Linked Events"
}
```

### 6.3 Scoring result  
```json
{
  "event_id": "...",
  "score": 1,
  "reason": "..."
}
```

### 6.4 Joint profile  
```json
{
  "shared_hobbies": [],
  "acceptable_noise_level": 2,
  "overlap_availability": [],
  "mutual_tags": [],
  "constraints": {...}
}
```

## 7. Recommendation Pipeline

### Step 1 — Hard filtering (backend only)  
Drop events that:  
- Are outside travel radius  
- Conflict with availability  
- Are clearly mismatched with dislikes  
- Are too intense or too loud

### Step 2 — Semantic scoring (Featherless)  
- Batch events in groups of ~5  
- Call LLM with profile + events  
- Get numeric scores and reasons  
- Sort by score

### Step 3 — Store and deliver  
- Top results written to DB  
- n8n reads them and delivers daily nudges

## 8. n8n Workflows

### 8.1 Event Fetcher (cron)  
- Call Linked Events API  
- Normalize  
- Push to backend

### 8.2 Daily Suggestion Sender  
- Cron triggers at chosen times  
- Pulls top events for each senior  
- Formats message (optional AI tone adjustment)  
- Sends via email/SMS/WhatsApp

### 8.3 Planning Flow  
Triggered when senior clicks “Interested”.

- Create calendar reminder  
- Send follow-up message with short plan  
- If joint activity: notify relative

## 9. Privacy Principles

- Store only structured preferences, not raw chat logs.  
- Strip personal details before sending text to Featherless.  
- No automatic bookings; senior always approves actions.  
- All data stays local except minimal text sent to Featherless.  
- Minimal retention: periodic cleanup of old interactions.

## 10. Future Extensions

- Embeddings-based similarity search  
- Personal adaptation model (simple weighting by accept/reject history)  
- Mobility-aware suggestions (distance + accessibility)  
- Social circles (suggest activities with friends in the app)  
- Voice-based onboarding
