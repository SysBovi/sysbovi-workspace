export interface JwtPayload {
  sub: string;
  email: string;
  papel: string;
  tenantId: string;
  type: 'user';
}

export interface JwtAdminPayload {
  sub: string;
  email: string;
  type: 'admin';
}
