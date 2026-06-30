import { z } from 'zod';

/**
 * Walidacja zmiennych środowiskowych przy starcie aplikacji.
 * Brak/niepoprawna konfiguracja => aplikacja nie wstaje (fail-fast).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().min(1).default('http://localhost:3000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL jest wymagany'),
  // DIRECT_URL używa wyłącznie Prisma CLI (migracje/introspekcja) do połączenia
  // bezpośredniego (:5432), bo pooler Supabase (:6543) nie obsługuje migracji.
  // Runtime API łączy się przez DATABASE_URL, więc tu pozostaje OPCJONALNY —
  // wymaganie go zablokowałoby start backendu, który go nie potrzebuje.
  DIRECT_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET musi mieć min. 16 znaków'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET musi mieć min. 16 znaków'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Supabase Storage (backend, service_role)
  SUPABASE_URL: z.string().url('SUPABASE_URL musi być poprawnym URL'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'SUPABASE_SERVICE_ROLE_KEY jest wymagany (service_role z Supabase)'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Niepoprawna konfiguracja środowiska:\n${issues}`);
  }
  return parsed.data;
}
