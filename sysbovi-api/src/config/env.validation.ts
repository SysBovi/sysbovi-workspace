const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_USER',
  'DB_PASS',
  'DB_NAME',
  'JWT_SECRET',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('\n✖  Variáveis de ambiente obrigatórias não definidas:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\n   Copie .env.example para .env e preencha os valores.\n');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET ?? '';
    if (jwtSecret.length < 32) {
      console.error('\n✖  JWT_SECRET deve ter no mínimo 32 caracteres em produção.\n');
      process.exit(1);
    }
  }
}
