(function () {
  "use strict";

  // ============================================================
  // Odwrotna Mapa - synchronizacja kontem opartym na frazie-seedzie
  // ============================================================
  // To NIE jest portfel kryptowalutowy - fraza seed jest tu wyłącznie
  // materiałem, z którego lokalnie (Web Crypto API, w przeglądarce)
  // wyprowadzamy: (1) klucz AES-GCM do szyfrowania treści ustawień,
  // (2) klucz prywatny protokołu Nostr, używany wyłącznie do
  // podpisywania i publikowania zaszyfrowanego bloba na publicznych
  // przekaźnikach (patrz sync-transport-service.js) - bez potrzeby
  // posiadania konta u jakiegokolwiek dostawcy.
  //
  // Lista słów NIE jest oficjalną listą BIP-39 (BIP-39 nie ma
  // oficjalnej polskiej listy - sprawdzone). Ponieważ ten seed nie
  // musi być kompatybilny z żadnym portfelem kryptowalutowym,
  // zbudowaliśmy własną, 364-wyrazową listę: słowa 4-8 liter, bez
  // polskich znaków diakrytycznych, każde jednoznacznie rozpoznawalne
  // po pierwszych 4 literach.

  const WORDLIST = ["akwarium", "alarm", "album", "alfabet", "ananas", "antena", "apteka", "arbuz", "atlas", "autobus", "balkon", "banan", "baran", "barszcz", "basen", "bateria", "beczka", "bekon", "beret", "bilet", "biurko", "blacha", "blok", "bluza", "boisko", "bomba", "borsuk", "broda", "brzoza", "bufet", "bulwa", "cebula", "cena", "centrum", "chata", "chleb", "chmura", "choinka", "chomik", "chusta", "ciasto", "ciocia", "cukier", "cygaro", "cyrk", "cytryna", "czapka", "daktyl", "dama", "deska", "diament", "dolina", "domek", "doniczka", "drabina", "drewno", "drzewo", "drzwi", "dworzec", "dynia", "dywan", "dzban", "dzik", "dzwon", "ekran", "fala", "farba", "fartuch", "fasada", "fasola", "figa", "flaga", "foka", "fontanna", "fotel", "gazeta", "gitara", "glina", "globus", "gniazdo", "gniewny", "golf", "gont", "gospoda", "grabie", "granica", "groch", "gruszka", "grzyb", "gumka", "gwiazda", "hala", "hamak", "harfa", "herbata", "hiena", "indyk", "iskra", "jajko", "jaskinia", "jasny", "jazda", "jedwab", "jesion", "jezioro", "kaczka", "kajak", "kaktus", "kalosz", "kanapa", "kapelusz", "kapusta", "karafka", "karp", "kartka", "kasza", "kelner", "kijek", "kino", "klamka", "klejnot", "klucz", "kluska", "kmin", "kogut", "kokos", "komin", "komoda", "konew", "konwalia", "koperta", "korek", "korona", "koszyk", "kotlet", "krab", "kran", "krawat", "kredens", "krem", "kret", "krokus", "krowa", "kubek", "kula", "kura", "kurczak", "kurtka", "kwadrat", "kwiat", "lampa", "lapis", "laska", "latarka", "lawenda", "lekarz", "leniwiec", "liczba", "liliowy", "lina", "linijka", "lotnia", "lustro", "magazyn", "magnes", "majtki", "malina", "marchew", "maska", "maszyna", "materac", "mech", "medal", "melon", "mewa", "mikser", "modrzew", "morela", "morze", "motocykl", "motyl", "msza", "mucha", "muszla", "nadzieja", "narty", "nauka", "nerka", "niebo", "nitka", "nora", "notatnik", "obcas", "obraz", "ocean", "ocet", "okno", "okulary", "opona", "ostryga", "owca", "owoc", "palma", "papier", "paprotka", "papuga", "parapet", "parkiet", "pekan", "pelikan", "pieprz", "piernik", "pies", "pilnik", "piwnica", "plansza", "plaster", "plecak", "plotka", "pluszak", "poduszka", "pojazd", "polana", "pole", "pomnik", "poranek", "portfel", "poszewka", "poziomka", "pralka", "prezent", "proca", "profesor", "promyk", "psota", "puchacz", "puder", "pukawka", "pusty", "pytanie", "raczek", "rajstopy", "rama", "rampa", "raszpla", "ratunek", "rejon", "rekin", "resor", "robot", "rodzynek", "rondel", "rower", "rura", "rurka", "rybak", "rycerz", "rynek", "rzeka", "rzepa", "sadza", "sakwa", "salon", "sanie", "sarna", "schowek", "serce", "serwetka", "siano", "siatka", "siewca", "sikora", "skarpeta", "skoczek", "skorupa", "slalom", "sofa", "sowa", "spinka", "sroka", "stajnia", "stary", "statek", "stolik", "stopa", "stroik", "strych", "suchar", "suszarka", "suwak", "swetr", "syrop", "szafa", "szalik", "szczotka", "szklanka", "szmata", "sznur", "szron", "szynka", "tabor", "taca", "talerz", "tama", "tapczan", "tarapaty", "targ", "tarka", "tasak", "teczka", "teren", "termos", "tkanina", "toporek", "torba", "torebka", "traktor", "trawa", "trufel", "tulipan", "tuner", "turban", "tygrys", "ubranie", "ucho", "ulica", "ulotka", "umywalka", "wafel", "walec", "wanna", "warstwa", "warzywo", "wentyl", "wesele", "weszka", "wiadro", "widelec", "wilk", "wiosna", "witryna", "wlot", "wodospad", "wolant", "wole", "workowy", "wozy", "wybieg", "wyspa", "zabawka", "zagroda", "zajazd", "zamek", "zamiar", "zaparcie", "zaprawa", "zastaw", "zawias", "zebra", "zegar", "zielony", "zima", "znaczek", "zszywka"];

  const DEFAULT_WORD_COUNT = 16;
  const WORD_INDEX = new Map(WORDLIST.map((w, i) => [w, i]));
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function randomWordlistIndex() {
    const n = WORDLIST.length;
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % n);
    const buf = new Uint32Array(1);
    let value;
    do {
      crypto.getRandomValues(buf);
      value = buf[0];
    } while (value >= limit);
    return value % n;
  }

  function generateSeedWords(count = DEFAULT_WORD_COUNT) {
    const words = [];
    for (let i = 0; i < count; i++) {
      words.push(WORDLIST[randomWordlistIndex()]);
    }
    return words;
  }

  function normalizeSeedInput(input) {
    if (Array.isArray(input)) input = input.join(" ");
    return String(input || "")
      .toLowerCase()
      .normalize("NFC")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function validateSeedWords(words) {
    if (!Array.isArray(words) || words.length < 12) {
      return { valid: false, error: "toKrotko" };
    }
    for (const w of words) {
      if (!WORD_INDEX.has(w)) {
        return { valid: false, error: "nieznaneSlowo", word: w };
      }
    }
    return { valid: true };
  }

  function seedWordsToString(words) {
    return words.join(" ");
  }

  async function deriveKeyMaterial(seedString) {
    return crypto.subtle.importKey(
      "raw",
      encoder.encode(seedString),
      "PBKDF2",
      false,
      ["deriveKey", "deriveBits"]
    );
  }

  async function deriveKeys(seedWords) {
    const seedString = seedWordsToString(seedWords);
    const keyMaterial = await deriveKeyMaterial(seedString);

    const encKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("odwrotnamapa-sync-enc-v1"),
        iterations: 210000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // Surowe 32 bajty do użycia jako klucz prywatny secp256k1 (Nostr) -
    // deriveBits, bo potrzebujemy gołych bajtów, nie obiektu CryptoKey.
    const nostrKeyBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode("odwrotnamapa-sync-nostr-key-v1"),
        iterations: 210000,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );

    return { encKey, nostrPrivKeyBytes: new Uint8Array(nostrKeyBits) };
  }

  function bufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async function encryptPayload(data, encKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = encoder.encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      encKey,
      plaintext
    );
    return `${bufferToBase64(iv)}.${bufferToBase64(ciphertext)}`;
  }

  async function decryptPayload(blob, encKey) {
    const [ivB64, ciphertextB64] = String(blob || "").split(".");
    if (!ivB64 || !ciphertextB64) {
      throw new Error("Nieprawidłowy format zaszyfrowanych danych.");
    }
    const iv = new Uint8Array(base64ToBuffer(ivB64));
    const ciphertext = base64ToBuffer(ciphertextB64);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      encKey,
      ciphertext
    );
    return JSON.parse(decoder.decode(plaintext));
  }

  window.OMAP_SYNC_CRYPTO = {
    WORDLIST,
    DEFAULT_WORD_COUNT,
    generateSeedWords,
    normalizeSeedInput,
    validateSeedWords,
    seedWordsToString,
    deriveKeys,
    encryptPayload,
    decryptPayload
  };
})();
