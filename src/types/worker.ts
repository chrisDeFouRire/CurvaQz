export type AssetsBinding = {
  fetch: (request: Request) => Promise<Response>;
};

export type WorkerEnv = {
  DB: D1Database;
  AUTH_SECRET: string;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
  ASSETS?: AssetsBinding;
};
