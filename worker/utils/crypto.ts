const passwordAlgorithm = "pbkdf2_sha256";
const passwordIterations = 100_000;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function pbkdf2(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations: passwordIterations,
      name: "PBKDF2",
      salt: hexToBytes(saltHex),
    },
    key,
    256,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltHex = bytesToHex(salt);
  const hashHex = await pbkdf2(password, saltHex);
  return `${passwordAlgorithm}$${passwordIterations}$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password: string, passwordHash: string | null) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, iterations, saltHex, hashHex] = passwordHash.split("$");

  if (algorithm !== passwordAlgorithm || iterations !== String(passwordIterations) || !saltHex) {
    return false;
  }

  const candidateHash = await pbkdf2(password, saltHex);
  return timingSafeEqual(candidateHash, hashHex);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToHex(new Uint8Array(signature));
}

export async function createSessionToken(userId: string, secret: string) {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string) {
  const [userId, issuedAt, signature] = token.split(".");

  if (!userId || !issuedAt || !signature) {
    return null;
  }

  const expectedSignature = await sign(`${userId}.${issuedAt}`, secret);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return null;
  }

  return {
    issuedAt: Number(issuedAt),
    userId,
  };
}

