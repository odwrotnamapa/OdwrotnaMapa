// Odwrotna Mapa - Worker synchronizacji ustawień
// ------------------------------------------------
// Ten Worker NIGDY nie widzi ani seeda, ani odszyfrowanej treści
// ustawień - przechowuje wyłącznie nieprzezroczysty (zaszyfrowany
// po stronie przeglądarki) ciąg znaków pod kluczem będącym hashem
// seeda (accountId). To dokładnie model "zero-knowledge sync"
// (jak Bitwarden) - kompromitacja tego serwera nie ujawnia treści
// niczyich ustawień, tylko losowo wyglądające zaszyfrowane bloby.
//
// Wymaga: KV namespace podpięty pod binding "SYNC_KV" (patrz
// wrangler.toml i README-DEPLOY.md w tym samym folderze).

const ALLOWED_ORIGIN = "https://odwrotnamapa.pl";
const MAX_BLOB_BYTES = 220000; // ~220 KB - z zapasem na ulubione miejsca, motywy kolorystyczne itp. (bez tekstur - te celowo nie są synchronizowane)
const RATE_LIMIT_WRITES_PER_MINUTE = 20;

function corsHeaders(origin) {
  const allowOrigin = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function isValidAccountId(id) {
  return typeof id === "string" && /^[a-f0-9]{64}$/.test(id);
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin)
    }
  });
}

async function checkRateLimit(env, accountId) {
  const bucket = Math.floor(Date.now() / 60000); // bieżąca minuta
  const key = `rl:${accountId}:${bucket}`;
  const current = Number((await env.SYNC_KV.get(key)) || "0");
  if (current >= RATE_LIMIT_WRITES_PER_MINUTE) {
    return false;
  }
  await env.SYNC_KV.put(key, String(current + 1), { expirationTtl: 90 });
  return true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const match = url.pathname.match(/^\/sync\/([a-f0-9]{64})$/);
    if (!match) {
      return jsonResponse({ error: "not_found" }, 404, origin);
    }
    const accountId = match[1];
    if (!isValidAccountId(accountId)) {
      return jsonResponse({ error: "invalid_account_id" }, 400, origin);
    }

    if (request.method === "GET") {
      const stored = await env.SYNC_KV.get(accountId);
      if (!stored) {
        return jsonResponse({ error: "not_found" }, 404, origin);
      }
      return new Response(stored, {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
      });
    }

    if (request.method === "PUT") {
      const allowed = await checkRateLimit(env, accountId);
      if (!allowed) {
        return jsonResponse({ error: "rate_limited" }, 429, origin);
      }

      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "invalid_json" }, 400, origin);
      }

      const { blob, signature } = body || {};
      if (typeof blob !== "string" || typeof signature !== "string" || !blob || !signature) {
        return jsonResponse({ error: "missing_fields" }, 400, origin);
      }
      if (blob.length > MAX_BLOB_BYTES) {
        return jsonResponse({ error: "blob_too_large" }, 413, origin);
      }

      const record = { blob, signature, updatedAt: new Date().toISOString() };
      await env.SYNC_KV.put(accountId, JSON.stringify(record));
      return jsonResponse({ ok: true, updatedAt: record.updatedAt }, 200, origin);
    }

    return jsonResponse({ error: "method_not_allowed" }, 405, origin);
  }
};
