/**
 * Local OTLP collector for pinta-copilot development.
 *
 * Usage:  npm run mock-server     (listens on http://localhost:3000)
 *
 * Point the adapter at it:
 *   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:3000/v1/traces
 * (or put that line in ~/.copilot/pinta-copilot.env)
 *
 * Prints one line per received span: surface · hook · tool · guard.
 */
import http from "node:http";

const PORT = Number(process.env.PORT || 3000);

function v(value: Record<string, unknown>): unknown {
  return value ? Object.values(value)[0] : undefined;
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    if (!req.url?.includes("/traces")) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const j = JSON.parse(body);
      for (const rs of j.resourceSpans ?? []) {
        for (const ss of rs.scopeSpans ?? []) {
          for (const sp of ss.spans ?? []) {
            const a: Record<string, unknown> = {};
            for (const at of sp.attributes ?? []) a[at.key] = v(at.value);
            const surface = a["copilot.surface"] ?? "?";
            const hook = a["copilot.hook"] ?? sp.name;
            const tool = a["copilot.tool_name"] ?? a["copilot.toolName"] ?? "";
            const guard = a["pinta.guard.decision"] ? ` guard=${a["pinta.guard.decision"]}` : "";
            // eslint-disable-next-line no-console
            console.log(`[${surface}] ${hook}${tool ? " · " + tool : ""}${guard}`);
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("parse error:", (e as Error).message);
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{}");
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`pinta-copilot mock OTLP collector on http://localhost:${PORT} (POST /v1/traces)`);
});
