/**
 * lib/test-chat.mjs
 *
 * End-to-end test for POST /api/chat.
 * Run AFTER `npm run dev` is started:
 *   node lib/test-chat.mjs
 */

const BASE_URL = "http://localhost:4000/api/chat";

/** POST a single message to the chat API. */
async function chat({ message = "", step, sessionId } = {}) {
  const body = { message, step };
  if (sessionId) body.sessionId = sessionId;

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

/** Log a step result neatly. */
function logStep(label, data) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`STEP : ${label}`);
  console.log(`→ step  : ${data.step}`);
  console.log(`→ reply : ${data.reply}`);
  if (data.complete) console.log(`→ complete: true`);
}

// ---------------------------------------------------------------------------
// Conversation script
// ---------------------------------------------------------------------------

const STEPS = [
  { label: "welcome",       message: "",           step: "welcome"       },
  { label: "origin",        message: "Nagpur",     step: "origin"        },
  { label: "destination",   message: "Goa",        step: "destination"   },
  { label: "checkIn",       message: "2026-10-15", step: "checkIn"       },
  { label: "checkOut",      message: "2026-10-17", step: "checkOut"      },
  { label: "travelers",     message: "2",          step: "travelers"     },
  { label: "budget",        message: "50000",      step: "budget"        },
  { label: "airlines",      message: "any",        step: "airlines"      },
  { label: "directOnly",    message: "no",         step: "directOnly"    },
  { label: "departureTime", message: "any",        step: "departureTime" },
  { label: "minRating",     message: "3",          step: "minRating"     },
  { label: "amenities",     message: "none",       step: "amenities"     },
];

(async function main() {
  console.log("🚀  TripSmart Chat API — end-to-end test");
  console.log(`   Target: ${BASE_URL}\n`);

  let sessionId = null;
  let lastResponse = null;

  for (const { label, message, step } of STEPS) {
    try {
      const payload = { message, step };
      if (sessionId) payload.sessionId = sessionId;

      lastResponse = await chat(payload);
      logStep(label, lastResponse);

      // Capture sessionId from the first response and reuse it for all subsequent calls.
      if (!sessionId && lastResponse.sessionId) {
        sessionId = lastResponse.sessionId;
        console.log(`→ sessionId: ${sessionId}`);
      }

      // If the pipeline has completed, no more steps to send.
      if (lastResponse.complete) break;

    } catch (err) {
      console.error(`\n❌  Error at step "${label}":`, err.message);
      process.exitCode = 1;
      break;
    }
  }

  // ---------------------------------------------------------------------------
  // Final output — bundles
  // ---------------------------------------------------------------------------
  console.log(`\n${"═".repeat(60)}`);
  if (lastResponse?.complete) {
    const bundles = lastResponse.bundles ?? [];
    if (bundles.length === 0) {
      console.log("📭  No bundles found within budget.");
    } else {
      console.log(`🎉  ${bundles.length} bundle(s) returned:\n`);
      console.log(JSON.stringify(bundles, null, 2));
    }
  } else {
    console.log("⚠️   Conversation did not reach completion.");
  }
})();
