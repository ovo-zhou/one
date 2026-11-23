import type { Role } from "../db/schema";

export type AppBindings = Env & {
  WECHAT_APP_ID?: string;
  WECHAT_APP_SECRET?: string;
};

export type AppEnv = {
  Bindings: AppBindings;
  Variables: { userId: string; role: Role };
};
