export type DoctorCheck = {
  label: string;
  ok: boolean;
};

export type DoctorResult = {
  ok: boolean;
  checks: DoctorCheck[];
  lines: string[];
};

export type DoctorOptions = {
  nodeVersion?: string;
  gatewayKey?: string;
  fetchHealth?: () => Promise<Response>;
};

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorResult> {
  const nodeVersion = options.nodeVersion ?? process.version;
  const gatewayKey = options.gatewayKey ?? process.env.GITRAG_CORE_GATEWAY_KEY ?? "";
  const fetchHealth = options.fetchHealth ?? (() => fetch("http://localhost:8787/health"));

  const checks: DoctorCheck[] = [
    {
      label: "Node.js >= 18",
      ok: getNodeMajor(nodeVersion) >= 18
    }
  ];

  try {
    const response = await fetchHealth();
    const health = (await response.json().catch(() => ({}))) as { gatewayConfigured?: boolean };
    checks.push({
      label: response.ok ? "Local GitRAG Relay Server Online" : "Local GitRAG Relay Server Offline",
      ok: response.ok
    });
    checks.push({
      label: "Gateway Environment Key Configured",
      ok: response.ok ? health.gatewayConfigured === true : gatewayKey.trim().length > 0
    });
  } catch {
    checks.push({
      label: "Local GitRAG Relay Server Offline",
      ok: false
    });
  }

  return {
    ok: checks.every((check) => check.ok),
    checks,
    lines: checks.map((check) => `${check.ok ? "✔" : "✖"} ${check.label}`)
  };
}

function getNodeMajor(nodeVersion: string): number {
  return Number(nodeVersion.replace(/^v/, "").split(".")[0] ?? 0);
}
