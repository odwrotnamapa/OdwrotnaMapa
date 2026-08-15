// Odwrotna Mapa - Worker synchronizacji ustawień + proxy kluczy API
// -------------------------------------------------------------------
// Część 1 (/sync/...): Ten Worker NIGDY nie widzi ani seeda, ani
// odszyfrowanej treści ustawień - przechowuje wyłącznie
// nieprzezroczysty (zaszyfrowany po stronie przeglądarki) ciąg
// znaków pod kluczem będącym hashem seeda (accountId). To dokładnie
// model "zero-knowledge sync" (jak Bitwarden) - kompromitacja tego
// serwera nie ujawnia treści niczyich ustawień, tylko losowo
// wyglądające zaszyfrowane bloby.
//
// Część 2 (/events): proxy do Ticketmaster Discovery API (sekcja
// "Wydarzenia"). W przeciwieństwie do /sync/, to zewnętrzne API
// WYMAGA prawdziwego, tajnego klucza - nie da się tego "zaszyfrować
// po stronie klienta" tak jak ustawień, bo to klucz do CUDZEGO
// serwisu, nie nasze dane. Jedyny sposób, żeby klucz nie trafił do
// przeglądarki użytkownika (i np. nie wyciekł z repo na GitHubie),
// to trzymać go tutaj, jako sekret Workera (patrz README-DEPLOY.md -
// `wrangler secret put`), i żeby to ten Worker doklejał go do
// żądania, zanim poleci ono do Ticketmastera. Klient zna tylko adres
// tego Workera, nigdy klucz.
//
// Mapillary (warstwa pokrycia zdjęć poziomu ulicy i sam odtwarzacz
// mapillary-js, `OMAP_STREETVIEW`) NIE idzie już przez ten Worker -
// łączy się z Mapillary bezpośrednio z przeglądarki, tokenem
// klienckim z config.js `mapillary.accessToken`. Endpoint
// /mapillary/tiles poniżej został tylko jako opcjonalna, nieużywana
// przez appkę alternatywa (np. do samodzielnego wykorzystania) -
// wymaga wtedy sekretu MAPILLARY_TOKEN, ale appka go domyślnie nie
// woła.
//
// Wymaga: KV namespace podpięty pod binding "SYNC_KV" (patrz
// wrangler.toml i README-DEPLOY.md w tym samym folderze) oraz
// sekretu TICKETMASTER_API_KEY (MAPILLARY_TOKEN tylko jeśli używasz
// opcjonalnego endpointu /mapillary/tiles opisanego wyżej).

const ALLOWED_ORIGIN = "https://odwrotnamapa.pl";
// Dodatkowe originy dozwolone dla CORS - poza produkcyjną domeną,
// żeby dało się testować lokalnie (np. `./run.sh`, który serwuje
// stronę pod http://localhost:8000). To nie jest realne
// zabezpieczenie przed nadużyciem (Origin można sfałszować spoza
// przeglądarki, np. z curl) - patrz rate-limit per IP niżej, który
// faktycznie ogranicza zużycie limitu Mapillary/Ticketmastera.
// Jeśli testujesz na innym porcie/hoście, dopisz go tutaj.
const DEV_ORIGINS = ["http://localhost:8000", "http://127.0.0.1:8000"];
const ALL_ALLOWED_ORIGINS = [ALLOWED_ORIGIN, ...DEV_ORIGINS];
const MAX_BLOB_BYTES = 220000; // ~220 KB - z zapasem na ulubione miejsca, motywy kolorystyczne itp. (bez tekstur - te celowo nie są synchronizowane)
const RATE_LIMIT_WRITES_PER_MINUTE = 20;
const RATE_LIMIT_PROXY_PER_MINUTE = 60; // na adres IP, wspólne dla /mapillary i /events

function corsHeaders(origin) {
  const allowOrigin = ALL_ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGIN;
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

// Prosty rate-limit per adres IP dla /mapillary i /events. Bez tego
// każdy, kto trafi na adres tego Workera, mógłby jednym skryptem
// wyczerpać darmowy limit zapytań do Mapillary/Ticketmastera opłacony
// (czy raczej: przyznany za darmo) na Twoje konto - Worker chroni
// klucz przed WYCIEKIEM, ale sam w sobie nie chroni przed
// NADUŻYCIEM, więc dokładamy to osobno.
async function checkProxyRateLimit(env, request, bucketName) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = Math.floor(Date.now() / 60000);
  const key = `rlp:${bucketName}:${ip}:${bucket}`;
  const current = Number((await env.SYNC_KV.get(key)) || "0");
  if (current >= RATE_LIMIT_PROXY_PER_MINUTE) {
    return false;
  }
  await env.SYNC_KV.put(key, String(current + 1), { expirationTtl: 90 });
  return true;
}

// GET /mapillary/tiles/{z}/{x}/{y} - odpowiednik warstwy pokrycia
// Mapillary (tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}),
// tylko że token dokleja Worker, nie przeglądarka.
async function handleMapillaryTiles(request, env, origin, z, x, y) {
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return jsonResponse({ error: "invalid_tile_coords" }, 400, origin);
  }
  if (!env.MAPILLARY_TOKEN) {
    return jsonResponse({ error: "mapillary_not_configured" }, 501, origin);
  }
  const allowed = await checkProxyRateLimit(env, request, "mapillary");
  if (!allowed) {
    return jsonResponse({ error: "rate_limited" }, 429, origin);
  }

  const upstreamUrl = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/${z}/${x}/${y}?access_token=${env.MAPILLARY_TOKEN}`;
  const upstreamResponse = await fetch(upstreamUrl);
  const headers = {
    ...corsHeaders(origin),
    "Content-Type":
      upstreamResponse.headers.get("Content-Type") ||
      "application/x-protobuf",
    // Kafelki wektorowe pokrycia są praktycznie statyczne w skali
    // godzin - cache po stronie Cloudflare/przeglądarki znacznie
    // ogranicza liczbę zapytań, które faktycznie zużywają limit
    // Mapillary.
    "Cache-Control": "public, max-age=3600"
  };
  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers
  });
}

// GET /events?... - proxy do Ticketmaster Discovery API. Klient
// wysyła te same parametry co wcześniej bezpośrednio do
// Ticketmastera (latlong, radius, countryCode, size, sort, locale,
// startDateTime), OPRÓCZ apikey - ten dokleja Worker z sekretu.
async function handleEventsProxy(request, env, origin, url) {
  if (!env.TICKETMASTER_API_KEY) {
    return jsonResponse({ error: "events_not_configured" }, 501, origin);
  }
  const allowed = await checkProxyRateLimit(env, request, "events");
  if (!allowed) {
    return jsonResponse({ error: "rate_limited" }, 429, origin);
  }

  const upstreamUrl = new URL(
    "https://app.ticketmaster.com/discovery/v2/events.json"
  );
  // Przepisujemy tylko znaną, oczekiwaną listę parametrów - nie
  // pozwalamy klientowi wstrzyknąć dowolnych parametrów Ticketmastera
  // (np. apikey innego konta) przez ten proxy.
  const passthroughParams = [
    "latlong",
    "radius",
    "unit",
    "countryCode",
    "size",
    "sort",
    "locale",
    "startDateTime"
  ];
  for (const param of passthroughParams) {
    const value = url.searchParams.get(param);
    if (value !== null) upstreamUrl.searchParams.set(param, value);
  }
  upstreamUrl.searchParams.set("apikey", env.TICKETMASTER_API_KEY);

  const upstreamResponse = await fetch(upstreamUrl);
  const body = await upstreamResponse.text();
  return new Response(body, {
    status: upstreamResponse.status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const tilesMatch = url.pathname.match(
      /^\/mapillary\/tiles\/(\d+)\/(\d+)\/(\d+)$/
    );
    if (tilesMatch && request.method === "GET") {
      const [, z, x, y] = tilesMatch;
      return handleMapillaryTiles(request, env, origin, z, x, y);
    }

    if (url.pathname === "/events" && request.method === "GET") {
      return handleEventsProxy(request, env, origin, url);
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
