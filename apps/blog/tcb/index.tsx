import tcb from "@cloudbase/node-sdk";
const app = tcb.init({
  secretId: process.env.SecretId,
  secretKey: process.env.SecretKey,
  env: "ryan-8gy6kj7jafc56d01",
});
export const { models } = app;
