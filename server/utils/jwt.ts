import { jwtVerify, SignJWT } from "jose";
import { isTokenRevoked } from "./tokenRevocation.js";

// Helper to get secret
const getSecret = () => {
  const config = useRuntimeConfig();
  const jwtKey = config.jwtKey || process.env.JWT_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  return new Uint8Array(Buffer.from(jwtKey, "hex"));
};

/** Generate JWT */
export async function createJwt(
  userId: string,
  level: number
): Promise<string> {
  const secret = getSecret();
  const signer = new SignJWT({ id: userId, level: level })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setExpirationTime("2h");
  return await signer.sign(secret);
}

/** Verify the JWT and return the payload. */
export async function verifyJwt(
  token: string
): Promise<{ id: string; level: number; exp: number } | false> {
  try {
    // Check if token has been revoked (e.g., after logout)
    if (isTokenRevoked(token)) {
      return false;
    }

    const secret = getSecret();
    const data = await jwtVerify(token, secret);
    // Check whether the payload has "id" and "exp".
    // This is most likely true.
    if (
      Object.hasOwn(data.payload, "id") &&
      Object.hasOwn(data.payload, "exp") &&
      Object.hasOwn(data.payload, "level")
    ) {
      return data.payload as { id: string; level: number; exp: number };
    } else return false; // shouldn't happen. If it does, immediately change JWT_KEY.
  } catch (e) {
    // Invalid JWT. Either the key changed or the token was not legit.
    return false;
  }
}
