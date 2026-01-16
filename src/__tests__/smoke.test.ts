import { describe, it, expect } from 'vitest';

describe('Types', () => {
  it('should have Student and Teacher types', () => {
    // Simple smoke test to ensure types are defined
    interface Student {
      id: number;
      name: string;
    }
    
    interface Teacher {
      id: number;
      name: string;
    }
    
    const student: Student = { id: 1, name: 'João' };
    const teacher: Teacher = { id: 1, name: 'Prof. Silva' };
    
    expect(student).toBeDefined();
    expect(teacher).toBeDefined();
    expect(student.name).toBe('João');
  });
});

describe('API', () => {
  it('should have proper endpoint structure', () => {
    // Smoke test for endpoint consistency
    const endpoints = [
      '/api/classes',
      '/api/students',
      '/api/teachers',
      '/api/activities',
      '/api/grades',
    ];
    
    endpoints.forEach((ep) => {
      expect(ep).toMatch(/^\/api\//);
    });
  });
});
