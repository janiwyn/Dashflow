import "server-only";

import { eq } from "drizzle-orm";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

import { db } from "@/db";
import { employeeCredentials, webauthnChallenges } from "@/db/schema";

/**
 * WebAuthn ceremonies for attendance's biometric clock-in: register a
 * platform authenticator (fingerprint/face) against an employee, then use
 * it later to identify who's tapping in — without a password, and without
 * this app ever touching the actual biometric data (that never leaves the
 * device; only a signed challenge does).
 */

const RP_NAME = "Dashflow POS";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function rpIdAndOrigin() {
  const url = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000");
  return { rpID: url.hostname, origin: url.origin };
}

async function saveChallenge(subject: string, challenge: string) {
  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.subject, subject));
  await db.insert(webauthnChallenges).values({ subject, challenge });
}

/** Single-use: reading a challenge deletes it, so a captured request can't be replayed. */
async function consumeChallenge(subject: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(webauthnChallenges)
    .where(eq(webauthnChallenges.subject, subject))
    .limit(1);
  if (!row) return null;
  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, row.id));
  if (Date.now() - row.createdAt.getTime() > CHALLENGE_TTL_MS) return null;
  return row.challenge;
}

export async function createRegistrationOptions(employeeId: number, employeeName: string) {
  const { rpID } = rpIdAndOrigin();
  const existing = await db
    .select({ credentialId: employeeCredentials.credentialId })
    .from(employeeCredentials)
    .where(eq(employeeCredentials.employeeId, employeeId));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: employeeName,
    userID: new TextEncoder().encode(String(employeeId)),
    userDisplayName: employeeName,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.credentialId })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      // Restricts to the device's own sensor (Windows Hello, Touch ID,
      // Android biometric) rather than a USB/NFC security key — this is
      // specifically the biometric option, not general WebAuthn 2FA.
      authenticatorAttachment: "platform",
    },
  });

  await saveChallenge(`register:${employeeId}`, options.challenge);
  return options;
}

export async function verifyRegistration(
  employeeId: number,
  response: RegistrationResponseJSON,
  deviceLabel?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { rpID, origin } = rpIdAndOrigin();
  const challenge = await consumeChallenge(`register:${employeeId}`);
  if (!challenge) return { ok: false, error: "This registration request expired — try again." };

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, error: "Could not verify this device." };
    }

    const { credential } = verification.registrationInfo;
    await db.insert(employeeCredentials).values({
      employeeId,
      credentialId: credential.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      deviceLabel: deviceLabel?.trim() || null,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Verification failed." };
  }
}

/**
 * No `allowCredentials` on purpose — a shared kiosk doesn't know in advance
 * which employee is about to touch the sensor. The browser surfaces every
 * resident credential enrolled on that device, and whichever one signs the
 * challenge tells us who it was.
 */
export async function createAuthenticationOptions(subjectKey: string) {
  const { rpID } = rpIdAndOrigin();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });
  await saveChallenge(subjectKey, options.challenge);
  return options;
}

export async function verifyAttendanceAuthentication(
  subjectKey: string,
  response: AuthenticationResponseJSON,
): Promise<{ ok: true; employeeId: number } | { ok: false; error: string }> {
  const { rpID, origin } = rpIdAndOrigin();
  const challenge = await consumeChallenge(subjectKey);
  if (!challenge) return { ok: false, error: "This request expired — try again." };

  const [stored] = await db
    .select()
    .from(employeeCredentials)
    .where(eq(employeeCredentials.credentialId, response.id))
    .limit(1);
  if (!stored) return { ok: false, error: "This device isn't registered to any employee." };

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.credentialId,
        publicKey: isoBase64URL.toBuffer(stored.publicKey),
        counter: stored.counter,
      },
    });

    if (!verification.verified) return { ok: false, error: "Could not verify." };

    await db
      .update(employeeCredentials)
      .set({ counter: verification.authenticationInfo.newCounter })
      .where(eq(employeeCredentials.id, stored.id));

    return { ok: true, employeeId: stored.employeeId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Verification failed." };
  }
}
