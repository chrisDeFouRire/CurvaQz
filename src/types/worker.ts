export type AssetsBinding = {
  fetch: (request: Request) => Promise<Response>;
};

export interface WorkerEnv extends Env {
  fetch: typeof fetch;
}
