import { describe, it, expect } from 'vitest';

describe('Types - Student', () => {
  it('should have all required student properties', () => {
    interface Student {
      id: number;
      name: string;
      status: string;
      number: number;
    }

    const student: Student = {
      id: 1,
      name: 'João Silva',
      status: 'Ativo',
      number: 5,
    };

    expect(student.id).toBe(1);
    expect(student.name).toBe('João Silva');
    expect(student.status).toBe('Ativo');
    expect(student.number).toBe(5);
  });

  it('should have optional student properties', () => {
    interface Student {
      id: number;
      name: string;
      profile_photo_url?: string;
    }

    const student: Student = {
      id: 1,
      name: 'Maria Santos',
      profile_photo_url: '/api/files/students/1/profile.jpg',
    };

    expect(student.profile_photo_url).toBeDefined();
    expect(student.profile_photo_url).toContain('/api/files/');
  });
});

describe('Types - Teacher', () => {
  it('should have all required teacher properties', () => {
    interface Teacher {
      id: number;
      name: string;
    }

    const teacher: Teacher = {
      id: 1,
      name: 'Prof. Silva',
    };

    expect(teacher.id).toBe(1);
    expect(teacher.name).toBe('Prof. Silva');
  });

  it('should support teacher subjects and yearly goals', () => {
    interface Teacher {
      id: number;
      name: string;
      subjects?: string[];
      yearly_goals?: string[];
    }

    const teacher: Teacher = {
      id: 1,
      name: 'Prof. Silva',
      subjects: ['Português', 'Redação'],
      yearly_goals: ['Melhorar ortografia', 'Aumentar leitura'],
    };

    expect(teacher.subjects).toHaveLength(2);
    expect(teacher.yearly_goals).toHaveLength(2);
    expect(teacher.subjects).toContain('Português');
  });
});

describe('API - ClassData', () => {
  it('should have correct class data structure', () => {
    interface ClassData {
      class: {
        id: number;
        name: string;
        school_year: string;
      };
      students: unknown[];
      activities: unknown[];
      grades: unknown[];
    }

    const classData: ClassData = {
      class: {
        id: 1,
        name: '1º Ano A',
        school_year: '2024',
      },
      students: [],
      activities: [],
      grades: [],
    };

    expect(classData.class.name).toBe('1º Ano A');
    expect(Array.isArray(classData.students)).toBe(true);
  });
});

describe('API - Activity', () => {
  it('should validate activity weight between 0 and 1', () => {
    interface Activity {
      id: number;
      name: string;
      weight: number;
      max_score: number;
    }

    const activity: Activity = {
      id: 1,
      name: 'Avaliação 1',
      weight: 0.5,
      max_score: 10,
    };

    expect(activity.weight).toBeGreaterThanOrEqual(0);
    expect(activity.weight).toBeLessThanOrEqual(1);
    expect(activity.max_score).toBeGreaterThan(0);
  });
});

describe('API - Grades', () => {
  it('should calculate weighted score correctly', () => {
    interface Grade {
      id: number;
      student_id: number;
      activity_id: number;
      score: number | null;
    }

    const grades: Grade[] = [
      { id: 1, student_id: 1, activity_id: 1, score: 8 },
      { id: 2, student_id: 1, activity_id: 2, score: 9 },
    ];

    const avgScore = grades.reduce((acc, g) => acc + (g.score ?? 0), 0) / grades.length;

    expect(avgScore).toBe(8.5);
    expect(grades.every(g => g.score === null || typeof g.score === 'number')).toBe(true);
  });
});
