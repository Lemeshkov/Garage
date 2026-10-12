export type AdminPrincipal = { id: string; login: string; displayName: string; role: 'ADMIN'; sessionId: string; mustChangePassword: boolean };
export type AuthenticatedRequest = { headers: Record<string, string | string[] | undefined>; ip?: string; admin?: AdminPrincipal };
export type LoginDto = { login: string; password: string };
export type ChangePasswordDto = { currentPassword: string; newPassword: string };

