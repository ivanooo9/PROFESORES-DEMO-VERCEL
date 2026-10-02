import { apiClient, ApiError } from './apiClient';
import { organizationDemoService } from '../../demo/organizationDemoService';

export interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  role?: string;
  memberStatus?: string;
}

export interface ProfessionalModuleInfo {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: string;
}

export interface OrganizationModuleRecord {
  id: number;
  organizationId: number;
  moduleId: number;
  status: string;
  module: ProfessionalModuleInfo;
}

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

export const organizationApi = {
  async getCurrentUser(): Promise<UserSession | null> {
    if (isDemo) {
      return organizationDemoService.getCurrentUser();
    }
    try {
      const response = await apiClient.get<UserSession>('/api/auth/me');
      if (!response.success) {
        throw new Error(response.error || response.message || 'No se pudo validar la sesión.');
      }
      return response.data || (response as any).user || null;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  async getUserOrganizations(): Promise<Organization[]> {
    if (isDemo) {
      return organizationDemoService.getUserOrganizations();
    }
    const response = await apiClient.get<any[]>('/api/organizations');
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error(response.error || response.message || 'No se pudieron cargar las instituciones.');
    }
    return response.data.map((item: any) => {
      if (item.organization) {
        return {
          id: item.organization.id,
          name: item.organization.name,
          slug: item.organization.slug,
          type: item.organization.type,
          status: item.organization.status,
          role: item.role,
          memberStatus: item.status,
        };
      }
      return item;
    });
  },

  async getOrganizationModules(orgId: number): Promise<OrganizationModuleRecord[]> {
    if (isDemo) {
      return organizationDemoService.getOrganizationModules(orgId);
    }
    const response = await apiClient.get<OrganizationModuleRecord[]>(
      `/api/organizations/${orgId}/modules`
    );
    if (!response.success || !Array.isArray(response.data)) {
      throw new Error(response.error || response.message || 'No se pudieron cargar los módulos de la institución.');
    }
    return response.data;
  },

  async enableModule(orgId: number, moduleCode: string): Promise<boolean> {
    if (isDemo) {
      return organizationDemoService.enableModule(orgId, moduleCode);
    }
    const response = await apiClient.post(
      `/api/organizations/${orgId}/modules/${moduleCode}/enable`
    );
    if (!response.success) {
      throw new Error(response.error || `Error al habilitar el módulo ${moduleCode}`);
    }
    return true;
  },

  async activateModule(orgId: number, moduleCode: string): Promise<boolean> {
    return this.enableModule(orgId, moduleCode);
  },
};
