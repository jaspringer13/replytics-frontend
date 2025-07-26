import { NextRequest } from 'next/server';

/**
 * Verify that the request contains a valid voice agent authentication key
 * @param req The incoming request
 * @returns boolean indicating if the request is authenticated
 */
export function verifyVoiceKey(req: NextRequest): boolean {
  const authKey = req.headers.get('x-voice-key');
  const expectedKey = process.env.VOICE_AGENT_AUTH_KEY;

  if (!authKey || !expectedKey) {
    return false;
  }

  // Constant time comparison to prevent timing attacks
  if (authKey.length !== expectedKey.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < authKey.length; i++) {
    mismatch |= authKey.charCodeAt(i) ^ expectedKey.charCodeAt(i);
  }

  return mismatch === 0;
}