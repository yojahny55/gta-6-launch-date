/**
 * Tests for environment configuration
 * Validates wrangler.toml structure and environment variable setup
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Environment Configuration', () => {
  describe('wrangler.toml validation', () => {
    it('should have wrangler.toml file', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      expect(fs.existsSync(wranglerPath)).toBe(true);
    });

    it('should have production environment configured', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[env.production]');
      expect(content).toContain('name = "gta6-tracker"');
      expect(content).toContain('ENVIRONMENT = "production"');
    });

    it('should have dev environment configured', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[env.dev]');
      expect(content).toContain('name = "gta6-tracker-dev"');
      expect(content).toContain('ENVIRONMENT = "dev"');
    });

    it('should have preview environment configured', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[env.preview]');
      expect(content).toContain('name = "gta6-tracker-preview"');
      expect(content).toContain('ENVIRONMENT = "preview"');
    });

    it('should have D1 database binding in production environment', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[[env.production.d1_databases]]');
      expect(content).toContain('binding = "DB"');
      expect(content).toContain('database_name = "gta6-predictions"');
    });

    it('should have D1 database binding in dev environment', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[[env.dev.d1_databases]]');
    });

    it('should have D1 database binding in preview environment', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[[env.preview.d1_databases]]');
    });

    it('should have shared D1 database binding', () => {
      const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
      const content = fs.readFileSync(wranglerPath, 'utf-8');

      expect(content).toContain('[[d1_databases]]');
      expect(content).toContain('binding = "DB"');
      expect(content).toContain('database_name = "gta6-predictions"');
    });
  });

  describe('GitHub Actions workflow validation', () => {
    it('should have deploy workflow file', () => {
      const workflowPath = path.join(
        process.cwd(),
        '.github/workflows/deploy.yml',
      );
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    it('should have dev branch deployment step', () => {
      const workflowPath = path.join(
        process.cwd(),
        '.github/workflows/deploy.yml',
      );
      const content = fs.readFileSync(workflowPath, 'utf-8');

      expect(content).toContain('Deploy to Cloudflare Workers (DEV)');
      expect(content).toContain("github.ref == 'refs/heads/dev'");
      expect(content).toContain('deploy --env dev');
    });

    it('should have production branch deployment step', () => {
      const workflowPath = path.join(
        process.cwd(),
        '.github/workflows/deploy.yml',
      );
      const content = fs.readFileSync(workflowPath, 'utf-8');

      expect(content).toContain('Deploy to Cloudflare Workers (PRODUCTION)');
      expect(content).toContain("github.ref == 'refs/heads/main'");
      expect(content).toContain('deploy --env production');
    });

    it('should have preview deployment step for pull requests', () => {
      const workflowPath = path.join(
        process.cwd(),
        '.github/workflows/deploy.yml',
      );
      const content = fs.readFileSync(workflowPath, 'utf-8');

      expect(content).toContain('Deploy to Cloudflare Workers (PREVIEW)');
      expect(content).toContain("github.event_name == 'pull_request'");
      expect(content).toContain('deploy --env preview');
    });
  });

  describe('.gitignore validation', () => {
    it('should ignore .env files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const content = fs.readFileSync(gitignorePath, 'utf-8');

      expect(content).toContain('.env');
      expect(content).toContain('.env.local');
      expect(content).toContain('.env.*.local');
    });
  });

  describe('TypeScript environment types', () => {
    it('should have vite-env.d.ts file', () => {
      const viteEnvPath = path.join(process.cwd(), 'src/vite-env.d.ts');
      expect(fs.existsSync(viteEnvPath)).toBe(true);
    });

    it('should define ImportMetaEnv interface', () => {
      const viteEnvPath = path.join(process.cwd(), 'src/vite-env.d.ts');
      const content = fs.readFileSync(viteEnvPath, 'utf-8');

      expect(content).toContain('interface ImportMetaEnv');
      expect(content).toContain('VITE_API_URL');
      expect(content).toContain('VITE_ENVIRONMENT');
    });
  });
});
