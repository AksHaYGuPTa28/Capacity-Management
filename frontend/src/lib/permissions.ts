import type { Role } from '@/types';

export const can = {
  manageUsers: (role?: Role) => role === 'ADMIN',
  createTeam: (role?: Role) => role === 'ADMIN',
  editTeam: (role?: Role) => role === 'ADMIN' || role === 'TEAM_MANAGER',
  deleteTeam: (role?: Role) => role === 'ADMIN',
  createResource: (role?: Role) => role === 'ADMIN' || role === 'RESOURCE_MANAGER',
  editResource: (role?: Role) => role === 'ADMIN' || role === 'RESOURCE_MANAGER' || role === 'TEAM_MANAGER',
  deleteResource: (role?: Role) => role === 'ADMIN',
  manageSkillCatalog: (role?: Role) => role === 'ADMIN',
  createProject: (role?: Role) => role === 'ADMIN' || role === 'RESOURCE_MANAGER',
  editProject: (role?: Role) => role === 'ADMIN' || role === 'RESOURCE_MANAGER',
  deleteProject: (role?: Role) => role === 'ADMIN',
  manageAllocations: (role?: Role) => role === 'ADMIN' || role === 'RESOURCE_MANAGER' || role === 'TEAM_MANAGER',
};
