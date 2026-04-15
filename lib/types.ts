export type SessionUser = {
  appUserId: string;
  tenantId: string;
  roleCode: string;
  inspectorId?: string | null;
  email: string;
  fullName: string;
};

export type SheetRow = Record<string, string | number | boolean | null>;
