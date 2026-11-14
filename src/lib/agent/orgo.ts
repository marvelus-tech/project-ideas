/**
 * Slim port of grokbot-clone server/src/orgo.ts (MIT).
 * Used only when ORGO_API_KEY and ORGO_WORKSPACE_ID are set.
 * The demo path never calls this.
 */

const BASE = "https://www.orgo.ai/api";

export class OrgoError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.ORGO_API_KEY;
  if (!key) throw new OrgoError(401, "ORGO_API_KEY is not set");
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  const json = text ? (JSON.parse(text) as { error?: string; message?: string }) : {};
  if (!response.ok) {
    throw new OrgoError(response.status, `Orgo ${method} ${path}: ${json.error || json.message || response.statusText}`);
  }
  return json as T;
}

export const orgo = {
  createComputer(name: string) {
    return call<{ id: string; status: string }>("POST", "/computers", {
      workspace_id: process.env.ORGO_WORKSPACE_ID,
      name,
      os: "linux",
      ram: Number(process.env.ORGO_RAM_GB || 4),
      cpu: Number(process.env.ORGO_CPU || 2),
    });
  },
  bash(id: string, command: string) {
    return call<{ success: boolean; output: string; exit_code: number }>("POST", `/computers/${id}/bash`, {
      command,
      timeout: 30,
    });
  },
};
