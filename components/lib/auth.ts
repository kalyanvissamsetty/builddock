export type Role = "ADMIN" | "DEV" | "QA" | "VIEWER";

export type Me = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

import { serverApiFetch } from "./serverApi";

export async function getMe(): Promise<Me | null> {
  try {
    return await serverApiFetch<Me>("/api/auth/me");
  } catch {
    return null;
  }
}
