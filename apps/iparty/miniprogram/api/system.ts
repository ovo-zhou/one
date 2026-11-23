import { request } from "../utils/request";

export type PingResponse = {
  message: string;
};

export function ping(): Promise<PingResponse> {
  return request<PingResponse>("/ping");
}
