/**
 * @license
 * Copyright 2026 gemini-api2cli contributors
 * SPDX-License-Identifier: LicenseRef-CNC-1.0
 */

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPromptApiRouter,
  PROMPT_API_CREDENTIALS_ROUTE,
  PROMPT_API_CREDENTIAL_VERTEX_ROUTE,
  PROMPT_API_CREDENTIAL_COST_RESET_ROUTE,
  PROMPT_API_CREDENTIAL_COST_ROUTE,
  PROMPT_API_QUOTA_ROUTE,
  PROMPT_API_QUOTAS_ROUTE,
  type PromptApiDependencies,
} from './promptApi.js';
import { PromptCredentialStore } from './promptCredentialStore.js';
import { buildAcpChildEnv, type AcpPoolSettings } from './acpProcessPool.js';

const TEST_TOKEN = 'test-token-for-vertex-tests';
process.env['GEMINI_PROMPT_API_TOKEN'] = TEST_TOKEN;

function createTestApp(overrides: PromptApiDependencies): express.Express {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (!req.headers['authorization']) {
      req.headers['authorization'] = `Bearer ${TEST_TOKEN}`;
    }
    next();
  });
  app.use(createPromptApiRouter(overrides));
  return app;
}

const defaultAcpSettings: AcpPoolSettings = {
  idleTimeoutMs: 0,
  mcpEnabled: true,
  extensionsEnabled: true,
  skillsEnabled: true,
  proxyUrl: '',
  maxWorkers: 1,
  failoverWorkers: 0,
};

describe('Vertex AI Authentication & Credentials', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();
    for (const d of tempDirs) {
      rmSync(d, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  describe('PromptCredentialStore Vertex AI Support', () => {
    it('creates and persists a Vertex AI credential with service account key', async () => {
      const root = mkdtempSync(path.join(tmpdir(), 'vtx-store-'));
      tempDirs.push(root);
      const store = new PromptCredentialStore(root);

      const saJson = JSON.stringify({
        type: 'service_account',
        project_id: 'gcp-project-123',
        private_key_id: 'key-abc',
        client_email: 'sa@gcp-project-123.iam.gserviceaccount.com',
      });

      const cred = await store.createVertexCredential({
        label: 'My Vertex SA',
        project: 'gcp-project-123',
        location: 'us-central1',
        serviceAccountJson: saJson,
      });

      expect(typeof cred.id).toBe('string');
      expect(cred.id.length).toBeGreaterThan(0);
      expect(cred.type).toBe('vertex-ai');
      expect(cred.label).toBe('My Vertex SA');
      expect(cred.project).toBe('gcp-project-123');
      expect(cred.location).toBe('us-central1');
      expect(cred.hasServiceAccount).toBe(true);

      // Verify files in credential directory
      const credHome = store.getCredentialHomeDir(cred.id);
      const saPath = path.join(credHome, 'service-account.json');
      expect(existsSync(saPath)).toBe(true);
      expect(readFileSync(saPath, 'utf8')).toBe(saJson);

      const metaPath = path.join(root, 'credentials', cred.id, 'metadata.json');
      expect(existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
      expect(meta.type).toBe('vertex-ai');
      expect(meta.project).toBe('gcp-project-123');

      // Verify retrieval
      const loaded = await store.getCredential(cred.id);
      expect(loaded).toBeDefined();
      expect(loaded?.type).toBe('vertex-ai');
      expect(loaded?.hasServiceAccount).toBe(true);

      // Verify list
      const list = await store.listCredentials();
      expect(list.some((c) => c.id === cred.id && c.type === 'vertex-ai')).toBe(
        true,
      );
    });

    it('creates a Vertex AI credential with API Key and baseUrl', async () => {
      const root = mkdtempSync(path.join(tmpdir(), 'vtx-store-'));
      tempDirs.push(root);
      const store = new PromptCredentialStore(root);

      const cred = await store.createVertexCredential({
        label: 'Vertex API Key Cred',
        project: 'gcp-api-key-proj',
        location: 'europe-west1',
        apiKey: 'AQ.TestApiKey123',
        baseUrl: 'https://europe-west1-aiplatform.googleapis.com',
      });

      expect(cred.type).toBe('vertex-ai');
      expect(cred.apiKey).toBe('AQ.TestApiKey123');
      expect(cred.baseUrl).toBe(
        'https://europe-west1-aiplatform.googleapis.com',
      );
      expect(cred.hasServiceAccount).toBe(false);

      const loaded = await store.getCredential(cred.id);
      expect(loaded?.apiKey).toBe('AQ.TestApiKey123');
      expect(loaded?.baseUrl).toBe(
        'https://europe-west1-aiplatform.googleapis.com',
      );
    });

    it('correctly sets type: "oauth" for standard Google OAuth credentials', async () => {
      const root = mkdtempSync(path.join(tmpdir(), 'vtx-store-'));
      tempDirs.push(root);
      const store = new PromptCredentialStore(root);

      const cred = await store.createCredential('Standard Google Account');
      expect(cred.type).toBe('oauth');

      const loaded = await store.getCredential(cred.id);
      expect(loaded?.type).toBe('oauth');
    });

    it('creates and persists a Vertex AI credential with serviceTier', async () => {
      const root = mkdtempSync(path.join(tmpdir(), 'vtx-store-'));
      tempDirs.push(root);
      const store = new PromptCredentialStore(root);

      const cred = await store.createVertexCredential({
        label: 'Flex Tier Cred',
        project: 'gcp-flex-proj',
        location: 'us-central1',
        serviceTier: 'flex',
      });

      expect(cred.serviceTier).toBe('flex');

      const loaded = await store.getCredential(cred.id);
      expect(loaded?.serviceTier).toBe('flex');
    });
  });

  describe('buildAcpChildEnv Environment Setup', () => {
    it('sets Vertex AI environment variables for vertex-ai credentials with service account', () => {
      const fakeHome = mkdtempSync(path.join(tmpdir(), 'vtx-home-'));
      tempDirs.push(fakeHome);
      const saPath = path.join(fakeHome, 'service-account.json');
      writeFileSync(saPath, '{}');

      const env = buildAcpChildEnv(fakeHome, defaultAcpSettings, {
        id: 'vtx-123',
        type: 'vertex-ai',
        label: 'Test Vertex',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        project: 'my-vertex-project',
        location: 'us-east4',
        hasServiceAccount: true,
      });

      expect(env['GOOGLE_GENAI_USE_VERTEXAI']).toBe('true');
      expect(env['GOOGLE_GENAI_USE_GCA']).toBeUndefined();
      expect(env['GOOGLE_CLOUD_PROJECT']).toBe('my-vertex-project');
      expect(env['GOOGLE_CLOUD_PROJECT_ID']).toBe('my-vertex-project');
      expect(env['GOOGLE_CLOUD_LOCATION']).toBe('us-east4');
      expect(env['GOOGLE_APPLICATION_CREDENTIALS']).toBe(saPath);
      expect(env['GEMINI_CLI_NO_RELAUNCH']).toBe('true');
    });

    it('sets API key and base URL for vertex-ai credentials without service account', () => {
      const fakeHome = mkdtempSync(path.join(tmpdir(), 'vtx-home-'));
      tempDirs.push(fakeHome);

      const env = buildAcpChildEnv(fakeHome, defaultAcpSettings, {
        id: 'vtx-456',
        type: 'vertex-ai',
        label: 'Test Vertex API Key',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        project: 'my-api-project',
        location: 'asia-east1',
        apiKey: 'AQ.SampleKey',
        baseUrl: 'https://custom-aiplatform.googleapis.com',
      });

      expect(env['GOOGLE_GENAI_USE_VERTEXAI']).toBe('true');
      expect(env['GOOGLE_GENAI_USE_GCA']).toBeUndefined();
      expect(env['GOOGLE_API_KEY']).toBe('AQ.SampleKey');
      expect(env['GOOGLE_VERTEX_BASE_URL']).toBe(
        'https://custom-aiplatform.googleapis.com',
      );
      expect(env['GOOGLE_APPLICATION_CREDENTIALS']).toBeUndefined();
    });

    it('sets GCA environment variables for oauth credentials', () => {
      const fakeHome = mkdtempSync(path.join(tmpdir(), 'vtx-home-'));
      tempDirs.push(fakeHome);

      const env = buildAcpChildEnv(fakeHome, defaultAcpSettings, {
        id: 'cred-oauth',
        type: 'oauth',
        label: 'Test OAuth',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });

      expect(env['GOOGLE_GENAI_USE_GCA']).toBe('true');
      expect(env['GOOGLE_GENAI_USE_VERTEXAI']).toBeUndefined();
      expect(env['GOOGLE_CLOUD_PROJECT']).toBeUndefined();
      expect(env['GOOGLE_CLOUD_LOCATION']).toBeUndefined();
      expect(env['GOOGLE_APPLICATION_CREDENTIALS']).toBeUndefined();
    });

    it('sets VERTEX_AI_SHARED_REQUEST_TYPE when serviceTier is flex or priority', () => {
      const fakeHome = mkdtempSync(path.join(tmpdir(), 'vtx-home-'));
      tempDirs.push(fakeHome);

      const envFlex = buildAcpChildEnv(fakeHome, defaultAcpSettings, {
        id: 'vtx-flex',
        type: 'vertex-ai',
        label: 'Flex Cred',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        serviceTier: 'flex',
      });
      expect(envFlex['VERTEX_AI_SHARED_REQUEST_TYPE']).toBe('flex');

      const envPriority = buildAcpChildEnv(fakeHome, defaultAcpSettings, {
        id: 'vtx-pri',
        type: 'vertex-ai',
        label: 'Priority Cred',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        serviceTier: 'priority',
      });
      expect(envPriority['VERTEX_AI_SHARED_REQUEST_TYPE']).toBe('priority');

      const envStandard = buildAcpChildEnv(fakeHome, defaultAcpSettings, {
        id: 'vtx-std',
        type: 'vertex-ai',
        label: 'Standard Cred',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        serviceTier: 'standard',
      });
      expect(envStandard['VERTEX_AI_SHARED_REQUEST_TYPE']).toBeUndefined();
    });

    it('sets GEMINI_REQUEST_TIMEOUT_MS when settings.timeoutMs is positive', () => {
      const fakeHome = mkdtempSync(path.join(tmpdir(), 'vtx-home-'));
      tempDirs.push(fakeHome);

      const envWithTimeout = buildAcpChildEnv(fakeHome, {
        ...defaultAcpSettings,
        timeoutMs: 45000,
      });
      expect(envWithTimeout['GEMINI_REQUEST_TIMEOUT_MS']).toBe('45000');

      const envWithoutTimeout = buildAcpChildEnv(fakeHome, {
        ...defaultAcpSettings,
        timeoutMs: 0,
      });
      expect(envWithoutTimeout['GEMINI_REQUEST_TIMEOUT_MS']).toBeUndefined();
    });
  });

  describe('Prompt API HTTP Routes for Vertex AI', () => {
    it('creates a Vertex AI credential via POST /v1/credentials/vertex and lists it', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-api-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-api-creds-'),
      );
      tempDirs.push(credentialStoreRoot);

      const fakeCliEntry = path.join(workspaceRoot, 'fake-cli.js');
      writeFileSync(fakeCliEntry, '// fake\n');

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: fakeCliEntry,
        credentialStoreRoot,
        timeoutMs: 5000,
      });

      const createRes = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          label: 'Production GCP',
          project: 'prod-gcp-123',
          location: 'us-central1',
          serviceAccountJson: JSON.stringify({
            type: 'service_account',
            project_id: 'prod-gcp-123',
          }),
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.credential).toMatchObject({
        type: 'vertex-ai',
        label: 'Production GCP',
        project: 'prod-gcp-123',
        location: 'us-central1',
        hasServiceAccount: true,
      });

      const credId = createRes.body.credential.id;

      // Verify it appears in GET /v1/credentials
      const listRes = await request(app).get(PROMPT_API_CREDENTIALS_ROUTE);
      expect(listRes.status).toBe(200);
      const found = listRes.body.credentials.find(
        (c: { id: string }) => c.id === credId,
      );
      expect(found).toBeDefined();
      expect(found.type).toBe('vertex-ai');
      expect(found.project).toBe('prod-gcp-123');
    });

    it('accepts serviceAccountJson as an object or string', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-api-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-api-creds-'),
      );
      tempDirs.push(credentialStoreRoot);
      const fakeCliEntry = path.join(workspaceRoot, 'fake-cli.js');
      writeFileSync(fakeCliEntry, '// fake\n');

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: fakeCliEntry,
        credentialStoreRoot,
        timeoutMs: 5000,
      });

      const res = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          project: 'obj-project',
          location: 'asia-east1',
          serviceAccountJson: {
            type: 'service_account',
            project_id: 'obj-project',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.credential.hasServiceAccount).toBe(true);
    });

    it('rejects invalid inputs on POST /v1/credentials/vertex', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-api-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-api-creds-'),
      );
      tempDirs.push(credentialStoreRoot);
      const fakeCliEntry = path.join(workspaceRoot, 'fake-cli.js');
      writeFileSync(fakeCliEntry, '// fake\n');

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: fakeCliEntry,
        credentialStoreRoot,
        timeoutMs: 5000,
      });

      // Missing both apiKey and project/location
      const res1 = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({ label: 'No Project' });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('required');

      // Invalid serviceAccountJson string
      const res2 = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          project: 'valid-project',
          location: 'us-central1',
          serviceAccountJson: 'not-a-valid-json{',
        });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('valid JSON');
    });

    it('returns status: "ok" for Vertex AI credentials in quota endpoints without calling CodeAssist', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-api-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-api-creds-'),
      );
      tempDirs.push(credentialStoreRoot);
      const fakeCliEntry = path.join(workspaceRoot, 'fake-cli.js');
      writeFileSync(fakeCliEntry, '// fake\n');

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: fakeCliEntry,
        credentialStoreRoot,
        timeoutMs: 5000,
      });

      // Add Vertex credential
      const createRes = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          label: 'GCP Quota Test',
          project: 'gcp-quota-proj',
          location: 'us-central1',
        });
      const credId = createRes.body.credential.id;

      // GET /v1/quotas/:credentialId
      const singleRes = await request(app).get(
        PROMPT_API_QUOTA_ROUTE.replace(':credentialId', credId),
      );
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.status).toBe('ok');
      expect(singleRes.body.credential).toMatchObject({
        id: credId,
        type: 'vertex-ai',
        project: 'gcp-quota-proj',
        location: 'us-central1',
      });

      // GET /v1/quotas
      const allRes = await request(app).get(PROMPT_API_QUOTAS_ROUTE);
      expect(allRes.status).toBe(200);
      const foundQuota = allRes.body.quotas.find(
        (q: { credential?: { id?: string } }) => q.credential?.id === credId,
      );
      expect(foundQuota).toBeDefined();
      expect(foundQuota.status).toBe('ok');
      expect(foundQuota.credential.type).toBe('vertex-ai');
    });

    it('accepts serviceTier and validates allowed values in POST /v1/credentials/vertex', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-api-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-api-creds-'),
      );
      tempDirs.push(credentialStoreRoot);

      const fakeCliEntry = path.join(workspaceRoot, 'fake-cli.js');
      writeFileSync(fakeCliEntry, '// fake\n');

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: fakeCliEntry,
        credentialStoreRoot,
        timeoutMs: 5000,
      });

      // Valid serviceTier
      const validRes = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          label: 'Priority Test',
          project: 'gcp-pri-proj',
          location: 'us-central1',
          serviceTier: 'priority',
        });
      expect(validRes.status).toBe(201);
      expect(validRes.body.credential.serviceTier).toBe('priority');

      // Invalid serviceTier
      const invalidRes = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          label: 'Invalid Tier Test',
          project: 'gcp-inv-proj',
          location: 'us-central1',
          serviceTier: 'ultra-speed',
        });
      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error).toContain('Invalid "serviceTier"');
    });
  });

  describe('PromptCredentialStore Cost Estimation Tracking', () => {
    it('records and accumulates cost only for vertex-ai credentials', async () => {
      const root = mkdtempSync(path.join(tmpdir(), 'vtx-cost-'));
      tempDirs.push(root);
      const store = new PromptCredentialStore(root);

      const vtx = await store.createVertexCredential({
        label: 'Vertex Cost Test',
        project: 'gcp-cost-proj',
        location: 'us-central1',
      });
      const oauth = await store.createCredential('OAuth Test');

      // Record cost on vertex credential and ensure updatedAt does not change
      const initialUpdatedAt = vtx.updatedAt;
      const cost1 = await store.recordVertexCost(vtx.id, 0.0025);
      expect(cost1).toBeDefined();
      expect(cost1?.totalCostUsd).toBe(0.0025);

      const cost2 = await store.recordVertexCost(vtx.id, 0.005);
      expect(cost2?.totalCostUsd).toBe(0.0075);

      // Verify persistence and updatedAt stability by loading from store
      const loadedVtx = await store.getCredential(vtx.id);
      expect(loadedVtx?.costEstimate?.totalCostUsd).toBe(0.0075);
      expect(loadedVtx?.updatedAt).toBe(initialUpdatedAt);

      // Verify listCredentials ordering is unchanged after cost recording
      const listAfterCost = await store.listCredentials();
      const oauthIndex = listAfterCost.findIndex((c) => c.id === oauth.id);
      const vtxIndex = listAfterCost.findIndex((c) => c.id === vtx.id);
      // OAuth was created after Vertex, so OAuth is ahead; recording cost must NOT push Vertex ahead
      expect(oauthIndex).toBeLessThan(vtxIndex);

      // Verify oauth credentials are not tracked
      const oauthCost = await store.recordVertexCost(oauth.id, 0.01);
      expect(oauthCost).toBeUndefined();
      const loadedOauth = await store.getCredential(oauth.id);
      expect(loadedOauth?.costEstimate).toBeUndefined();

      // Reset vertex cost and ensure updatedAt remains unchanged
      const resetResult = await store.resetVertexCost(vtx.id);
      expect(resetResult?.totalCostUsd).toBe(0);

      const reloadedVtx = await store.getCredential(vtx.id);
      expect(reloadedVtx?.costEstimate?.totalCostUsd).toBe(0);
      expect(reloadedVtx?.updatedAt).toBe(initialUpdatedAt);
    });
  });

  describe('Vertex Cost Reset HTTP Endpoints', () => {
    it('resets cumulative cost via POST /v1/credentials/:id/cost/reset and returns updated quota', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-reset-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-reset-store-'),
      );
      tempDirs.push(credentialStoreRoot);

      const fakeCliEntry = path.join(workspaceRoot, 'fake-cli.js');
      writeFileSync(fakeCliEntry, '// fake\n');

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: fakeCliEntry,
        credentialStoreRoot,
        timeoutMs: 5000,
      });

      // 1. Create a Vertex credential
      const createRes = await request(app)
        .post(PROMPT_API_CREDENTIAL_VERTEX_ROUTE)
        .send({
          label: 'Reset API Test',
          project: 'gcp-reset-proj',
          location: 'us-central1',
        });
      expect(createRes.status).toBe(201);
      const credId = createRes.body.credential.id;

      // 2. Artificially add cost via store
      const store = new PromptCredentialStore(credentialStoreRoot);
      await store.recordVertexCost(credId, 0.12345);

      // 3. Verify quota endpoint returns accumulated cost
      const quotaBefore = await request(app).get(`/v1/quotas/${credId}`);
      expect(quotaBefore.status).toBe(200);
      expect(quotaBefore.body.credential.costEstimate?.totalCostUsd).toBe(
        0.12345,
      );

      // 4. Call POST /cost/reset
      const resetRes = await request(app).post(
        PROMPT_API_CREDENTIAL_COST_RESET_ROUTE.replace(':credentialId', credId),
      );
      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);
      expect(resetRes.body.costEstimate.totalCostUsd).toBe(0);

      // 5. Verify quota endpoint reflects 0 cost
      const quotaAfter = await request(app).get(`/v1/quotas/${credId}`);
      expect(quotaAfter.status).toBe(200);
      expect(quotaAfter.body.credential.costEstimate?.totalCostUsd).toBe(0);

      // 6. Call DELETE /cost
      await store.recordVertexCost(credId, 0.05);
      const deleteRes = await request(app).delete(
        PROMPT_API_CREDENTIAL_COST_ROUTE.replace(':credentialId', credId),
      );
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.costEstimate.totalCostUsd).toBe(0);
    });

    it('returns 404 when resetting cost for non-existent credential', async () => {
      const workspaceRoot = mkdtempSync(path.join(tmpdir(), 'vtx-ws-'));
      tempDirs.push(workspaceRoot);
      const credentialStoreRoot = mkdtempSync(
        path.join(tmpdir(), 'vtx-store-'),
      );
      tempDirs.push(credentialStoreRoot);

      const app = createTestApp({
        workspaceRoot,
        cliEntryPath: path.join(workspaceRoot, 'fake.js'),
        credentialStoreRoot,
      });

      const res = await request(app).post(
        PROMPT_API_CREDENTIAL_COST_RESET_ROUTE.replace(
          ':credentialId',
          'non-existent-id',
        ),
      );
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
