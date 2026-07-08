export type WorkerEnv = {
  ENVIRONMENT: "local" | "preview" | "production";
  DB: D1Database;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_TOKEN?: string;
  USER_SESSION_SECRET?: string;
};

export type WorkerVariables = {
  adminUser?: {
    username: string;
  };
};

export type AppBindings = {
  Bindings: WorkerEnv;
  Variables: WorkerVariables;
};
