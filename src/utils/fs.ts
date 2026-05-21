import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

export async function ensureDirectory(path: string): Promise<string> {
  const resolved = resolve(path);
  await mkdir(resolved, { recursive: true });
  return resolved;
}

