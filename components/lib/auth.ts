export type Role = "ADMIN" | "DEV" | "QA" | "VIEWER";

export type Me = {
  id: number;
  email: string;
  name: string;
  role: Role;
};


import { serverApiFetch } from "./serverApi";

export async function getMe() {
  return serverApiFetch("/api/auth/me");
}