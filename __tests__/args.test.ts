import { describe, it, expect } from 'vitest';
import { parseArgs } from '../src/utils/args.js';

describe('parseArgs', () => {
  describe('basic options', () => {
    it('should parse --help', () => {
      const result = parseArgs(['--help']);
      expect(result.help).toBe(true);
    });

    it('should parse -h', () => {
      const result = parseArgs(['-h']);
      expect(result.help).toBe(true);
    });

    it('should parse --interactive', () => {
      const result = parseArgs(['--interactive']);
      expect(result.interactive).toBe(true);
    });

    it('should parse -i', () => {
      const result = parseArgs(['-i']);
      expect(result.interactive).toBe(true);
    });

    it('should parse --message', () => {
      const result = parseArgs(['--message', 'hello']);
      expect(result.message).toBe('hello');
    });

    it('should parse -m', () => {
      const result = parseArgs(['-m', 'hello']);
      expect(result.m).toBe('hello');
    });
  });

  describe('agent command options', () => {
    it('should parse --name', () => {
      const result = parseArgs(['agent', 'create', '--name', 'coder']);
      expect(result._[0]).toBe('agent');
      expect(result._[1]).toBe('create');
      expect(result.name).toBe('coder');
    });

    it('should parse --role', () => {
      const result = parseArgs(['agent', 'create', '--role', '程序员']);
      expect(result.role).toBe('程序员');
    });

    it('should parse --specialty', () => {
      const result = parseArgs(['agent', 'create', '--specialty', 'TypeScript']);
      expect(result.specialty).toBe('TypeScript');
    });

    it('should parse --personality', () => {
      const result = parseArgs(['agent', 'create', '--personality', '严谨']);
      expect(result.personality).toBe('严谨');
    });

    it('should parse --description', () => {
      const result = parseArgs(['agent', 'create', '--description', 'A coder']);
      expect(result.description).toBe('A coder');
    });

    it('should parse --model', () => {
      const result = parseArgs(['agent', 'create', '--model', 'opus']);
      expect(result.model).toBe('opus');
    });

    it('should parse --color', () => {
      const result = parseArgs(['agent', 'create', '--color', 'blue']);
      expect(result.color).toBe('blue');
    });
  });

  describe('run command options', () => {
    it('should parse --agents', () => {
      const result = parseArgs(['run', '--agents', 'coder,designer']);
      expect(result.agents).toBe('coder,designer');
    });

    it('should parse -a', () => {
      const result = parseArgs(['run', '-a', 'coder,designer']);
      expect(result.agents).toBe('coder,designer');
    });

    it('should parse --coordinator', () => {
      const result = parseArgs(['run', '--coordinator', 'manager']);
      expect(result.coordinator).toBe('manager');
    });

    it('should parse --task', () => {
      const result = parseArgs(['run', '--task', 'build a website']);
      expect(result.task).toBe('build a website');
    });
  });

  describe('positional arguments', () => {
    it('should collect positional arguments', () => {
      const result = parseArgs(['hello', 'world']);
      expect(result._).toEqual(['hello', 'world']);
    });

    it('should handle mixed options and positional args', () => {
      const result = parseArgs(['agent', 'create', '--name', 'coder', 'extra']);
      expect(result._).toEqual(['agent', 'create', 'extra']);
      expect(result.name).toBe('coder');
    });
  });
});
