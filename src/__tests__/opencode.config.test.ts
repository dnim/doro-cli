import fs from 'node:fs';
import path from 'node:path';

describe('OpenCode Configuration', () => {
  const configPath = path.join(process.cwd(), 'opencode.json');

  describe('opencode.json', () => {
    it('should exist in project root', () => {
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should be valid JSON', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have required schema reference', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);
      expect(config.$schema).toBe('https://opencode.ai/config.json');
    });

    it('should have valid structure', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      // Required top-level properties
      expect(config).toHaveProperty('$schema');
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('agent');
      expect(config).toHaveProperty('permission');
    });

    it('should have valid agent configuration', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.agent).toHaveProperty('plan');
      expect(config.agent).toHaveProperty('general');
      expect(config.agent).toHaveProperty('explore');
      expect(config.agent).toHaveProperty('title');
      expect(config.agent).toHaveProperty('summary');
      expect(config.agent).toHaveProperty('compaction');

      // Check agent models are properly formatted
      const agents = ['plan', 'general', 'explore', 'title', 'summary', 'compaction'];
      agents.forEach((agent) => {
        expect(config.agent[agent]).toHaveProperty('model');
        expect(typeof config.agent[agent].model).toBe('string');
        expect(config.agent[agent].model).toMatch(/^[\w-]+\/[\w.-]+$/); // provider/model format
      });
    });

    it('should have valid permission configuration', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      expect(config.permission).toHaveProperty('bash');
      expect(config.permission).toHaveProperty('edit');
      expect(config.permission).toHaveProperty('skill');

      // Check git security permissions
      expect(config.permission.bash['git commit *']).toBe('deny');
      expect(config.permission.bash['git push *']).toBe('deny');
      expect(config.permission.bash['git push']).toBe('deny');
    });

    it('should not have duplicate keys', () => {
      const content = fs.readFileSync(configPath, 'utf8');

      // Check for duplicate agent declarations
      const agentMatches = content.match(/"agent"\s*:/g);
      expect(agentMatches?.length).toBe(1);

      // Check for duplicate permission declarations
      const permissionMatches = content.match(/"permission"\s*:/g);
      expect(permissionMatches?.length).toBe(1);
    });

    it('should have consistent model naming', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      // All models should use same provider format
      const modelPattern = /^[\w-]+\/[\w.-]+$/;
      expect(config.model).toMatch(modelPattern);

      Object.values(config.agent as Record<string, { model: string }>).forEach((agent) => {
        expect(agent.model).toMatch(modelPattern);
      });
    });

    it('should have valid instructions paths', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      if (config.instructions && Array.isArray(config.instructions)) {
        config.instructions.forEach((instruction: string) => {
          const instructionPath = path.join(process.cwd(), instruction);
          expect(fs.existsSync(instructionPath)).toBe(true);
        });
      }
    });

    it('should have no trailing commas in JSON', () => {
      const content = fs.readFileSync(configPath, 'utf8');

      // Check for trailing commas which are invalid in JSON
      expect(content).not.toMatch(/,\s*[\]}]/);
    });
  });

  describe('Configuration Validation', () => {
    it('should pass basic schema validation', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      // Basic type checking
      expect(typeof config.$schema).toBe('string');
      expect(typeof config.model).toBe('string');
      expect(typeof config.agent).toBe('object');
      expect(typeof config.permission).toBe('object');
      expect(Array.isArray(config.instructions)).toBe(true);
    });

    it('should have secure default permissions', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      // Ensure git operations require permission or are denied
      const bashPermissions = config.permission.bash;
      const dangerousCommands = ['git commit *', 'git push *', 'git push'];

      dangerousCommands.forEach((cmd) => {
        expect(['deny', 'ask'].includes(bashPermissions[cmd])).toBe(true);
      });
    });

    it('should have proper edit permissions for protected files', () => {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(content);

      const editPermissions = config.permission.edit;
      expect(editPermissions['opencode.json']).toBe('ask');
      expect(editPermissions['.opencode/**']).toBe('ask');
      expect(editPermissions['.husky/**']).toBe('ask');
    });
  });
});
