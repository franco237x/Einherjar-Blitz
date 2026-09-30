import { describe, expect, it } from 'vitest';
import { CredentialError, parseServiceAccount } from './gameServer';

const PROJECT = 'demo-project';
const KEY = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';
const account = { type: 'service_account', project_id: PROJECT, client_email: 'sa@demo.iam', private_key: KEY };
const json = JSON.stringify(account);

function problem(raw: string) {
  try {
    parseServiceAccount(raw, PROJECT);
    return 'ok';
  } catch (error) {
    return error instanceof CredentialError ? error.problem : 'other';
  }
}

describe('parseServiceAccount', () => {
  it('accepts the JSON as downloaded, with copy/paste accidents', () => {
    for (const raw of [
      json,
      `  ${json}\n`,
      `'${json}'`,
      JSON.stringify(json),
      `GAME_FIREBASE_SERVICE_ACCOUNT_JSON=${json}`,
      JSON.stringify({ ...account, private_key: KEY.replace(/\n/g, '\\n') }),
    ]) {
      const parsed = parseServiceAccount(raw, PROJECT);
      expect(parsed.privateKey).toBe(KEY);
      expect(parsed.clientEmail).toBe('sa@demo.iam');
    }
  });

  it('reports what is wrong without echoing the value', () => {
    expect(problem(json.slice(0, 40))).toBe('json_invalido');
    expect(problem('{"type":"authorized_user"}')).toBe('no_es_cuenta_de_servicio');
    expect(problem(JSON.stringify({ ...account, private_key: 'nope' }))).toBe('no_es_cuenta_de_servicio');
    expect(problem(JSON.stringify({ ...account, project_id: 'otro' }))).toBe('proyecto_distinto');
    try {
      parseServiceAccount(json.slice(0, 40), PROJECT);
    } catch (error) {
      expect((error as Error).message).not.toContain('sa@demo');
    }
  });
});
