import { UserSession, Organization, OrganizationModuleRecord } from '../services/api/organizationApi';
import { demoStorage } from './demoStorage';

export const organizationDemoService = {
  async getCurrentUser(): Promise<UserSession | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getUser();
  },

  async getUserOrganizations(): Promise<Organization[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getOrganizations();
  },

  async getOrganizationModules(orgId: number): Promise<OrganizationModuleRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.getModules(orgId);
  },

  async enableModule(orgId: number, moduleCode: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return demoStorage.enableModule(orgId, moduleCode);
  },

  async activateModule(orgId: number, moduleCode: string): Promise<boolean> {
    return this.enableModule(orgId, moduleCode);
  },
};
