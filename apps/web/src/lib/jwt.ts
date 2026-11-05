import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const SESSION_COOKIE = "hg_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

export type SessionRole = "sekolah" | "admin" | "operator";

export interface Session {
  sub: string;
  role: SessionRole;
  username: string;
  namaTampilan: string;
  sekolahId?: string;
}

function jwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET wajib diatur minimal 32 karakter.");
  }
  return new TextEncoder().encode(secret);
}

function isRole(value: unknown): value is SessionRole {
  return value === "sekolah" || value === "admin" || value === "operator";
}

export async function createSessionToken(session: Session): Promise<string> {
  return new SignJWT({
    role: session.role,
    username: session.username,
    namaTampilan: session.namaTampilan,
    ...(session.sekolahId ? { sekolahId: session.sekolahId } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(jwtSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), {
      algorithms: ["HS256"],
    });

    if (
      !payload.sub ||
      !isRole(payload.role) ||
      typeof payload.username !== "string" ||
      typeof payload.namaTampilan !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      role: payload.role,
      username: payload.username,
      namaTampilan: payload.namaTampilan,
      sekolahId:
        typeof payload.sekolahId === "string" ? payload.sekolahId : undefined,
    };
  } catch {
    return null;
  }
}
