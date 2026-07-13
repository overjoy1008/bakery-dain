export type WorkerEnv = {
  ENVIRONMENT: "local" | "preview" | "production";
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_TOKEN?: string;
  USER_SESSION_SECRET?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_ANALYTICS_TOKEN?: string;
};

export type WorkerVariables = {
  adminUser?: {
    username: string;
    id?: string;
  };
};

export type AppBindings = {
  Bindings: WorkerEnv;
  Variables: WorkerVariables;
};
