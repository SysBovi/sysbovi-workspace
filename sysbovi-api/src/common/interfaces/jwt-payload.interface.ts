export interface JwtPayload {
  sub: string;
  email: string;
  papel: 'ADMIN_FAZENDA' | 'ESPECIALISTA' | 'COMUM';
  tenantId: string;
  planoNome: string;
  type: 'user';
  iat: number;
  exp: number;
}

export interface JwtAdminPayload {
  sub: string;
  email: string;
  papel: 'UA';
  type: 'admin';
  iat: number;
  exp: number;
}
