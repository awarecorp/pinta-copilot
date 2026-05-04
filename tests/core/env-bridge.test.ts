import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { bridgeUserConfigToOtelEnv } from '../../src/core/env-bridge';

const SAVED = { ...process.env };

describe('bridgeUserConfigToOtelEnv', () => {
  beforeEach(() => {
    process.env = { ...SAVED };
    delete process.env.CLAUDE_PLUGIN_OPTION_ENDPOINT;
    delete process.env.CLAUDE_PLUGIN_OPTION_API_KEY;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    delete process.env.OTEL_EXPORTER_OTLP_HEADERS;
  });
  afterEach(() => { process.env = SAVED; });

  it('aliases CLAUDE_PLUGIN_OPTION_ENDPOINT → OTEL_EXPORTER_OTLP_TRACES_ENDPOINT (full URL)', () => {
    process.env.CLAUDE_PLUGIN_OPTION_ENDPOINT = 'http://localhost:4318/v1/traces';
    bridgeUserConfigToOtelEnv();
    expect(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT).toBe('http://localhost:4318/v1/traces');
  });

  it('aliases CLAUDE_PLUGIN_OPTION_API_KEY → OTEL_EXPORTER_OTLP_HEADERS as x-pinta-relay-token', () => {
    process.env.CLAUDE_PLUGIN_OPTION_API_KEY = 'token-abc';
    bridgeUserConfigToOtelEnv();
    expect(process.env.OTEL_EXPORTER_OTLP_HEADERS).toBe('x-pinta-relay-token=token-abc');
  });

  it('does not overwrite existing OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', () => {
    process.env.CLAUDE_PLUGIN_OPTION_ENDPOINT = 'http://from-claude/';
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = 'http://from-explicit/';
    bridgeUserConfigToOtelEnv();
    expect(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT).toBe('http://from-explicit/');
  });

  it('no-op when neither CLAUDE_PLUGIN_OPTION nor OTEL env are set', () => {
    bridgeUserConfigToOtelEnv();
    expect(process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT).toBeUndefined();
    expect(process.env.OTEL_EXPORTER_OTLP_ENDPOINT).toBeUndefined();
    expect(process.env.OTEL_EXPORTER_OTLP_HEADERS).toBeUndefined();
  });
});
