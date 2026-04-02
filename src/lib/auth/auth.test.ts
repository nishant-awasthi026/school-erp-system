import { describe, it, expect } from 'vitest';
import { getPortalUrl } from '@/lib/auth';

describe('getPortalUrl', () => {
  it('should return super-admin dashboard for SUPER_ADMIN role', () => {
    expect(getPortalUrl('SUPER_ADMIN')).toBe('/dashboard/super-admin');
  });

  it('should return school-specific dashboard for SCHOOL_ADMIN role', () => {
    expect(getPortalUrl('SCHOOL_ADMIN', 'school-123')).toBe('/dashboard/school-123');
  });

  it('should return teacher portal for TEACHER role', () => {
    expect(getPortalUrl('TEACHER', 'school-123')).toBe('/dashboard/school-123/teacher');
  });

  it('should return student portal for STUDENT role', () => {
    expect(getPortalUrl('STUDENT', 'school-123')).toBe('/dashboard/school-123/student');
  });

  it('should return login if no schoolId is provided for school roles', () => {
    expect(getPortalUrl('SCHOOL_ADMIN')).toBe('/login');
  });
});
