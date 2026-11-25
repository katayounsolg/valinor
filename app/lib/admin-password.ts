
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

async function deriveKey(
  password: string,
  salt: Buffer
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      {
        N: COST,
        r: BLOCK_SIZE,
        p: PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
        } else {
          resolve(derivedKey as Buffer);
        }
      }
    );
  });
}

export async function hashAdminPassword(
  password: string
): Promise<string> {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      "Password must be between 12 and 128 characters."
    );
  }

  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt);

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    if (
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 128
    ) {
      return false;
    }

    const parts = storedHash.split("$");

    if (parts.length !== 6) {
      return false;
    }

    const [
      algorithm,
      cost,
      blockSize,
      parallelization,
      saltHex,
      hashHex,
    ] = parts;

    if (
      algorithm !== "scrypt" ||
      cost !== String(COST) ||
      blockSize !== String(BLOCK_SIZE) ||
      parallelization !== String(PARALLELIZATION) ||
      !/^[a-f0-9]{32}$/i.test(saltHex) ||
      !/^[a-f0-9]{128}$/i.test(hashHex)
    ) {
      return false;
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedHash = Buffer.from(hashHex, "hex");
    const actualHash = await deriveKey(password, salt);

    return timingSafeEqual(expectedHash, actualHash);
  } catch {
    return false;
  }
}
