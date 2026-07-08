import { useEffect, useState } from "react";
import { apiRequest } from "./api";

export type BakeryUser = {
  id?: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type BakerySessionUser = Omit<BakeryUser, "password">;

const SESSION_KEY = "bakery-dain-session";
const AUTH_CHANGE_EVENT = "bakery-dain-auth-change";

type AuthResponse = {
  token: string;
  user: BakerySessionUser;
};

type StoredSession = AuthResponse;

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getCurrentUser(): BakerySessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const session = window.localStorage.getItem(SESSION_KEY);
    return session ? (JSON.parse(session) as StoredSession).user : null;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const session = window.localStorage.getItem(SESSION_KEY);
    return session ? (JSON.parse(session) as StoredSession).token : null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emitAuthChange();
  return session.user;
}

export async function isUsernameTaken(username: string) {
  const response = await apiRequest<{ available: boolean }>(
    `/auth/username/check?username=${encodeURIComponent(username.trim())}`,
  );
  return !response.available;
}

export async function createUser(user: BakeryUser) {
  const response = await apiRequest<AuthResponse>("/auth/signup", {
    body: user,
    method: "POST",
  });
  return saveSession(response);
}

export async function login(username: string, password: string) {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    body: {
      password,
      username,
    },
    method: "POST",
  });
  return saveSession(response);
}

export function logout() {
  window.localStorage.removeItem(SESSION_KEY);
  emitAuthChange();
}

export function useAuthUser() {
  const [user, setUser] = useState<BakerySessionUser | null>(() => getCurrentUser());

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener(AUTH_CHANGE_EVENT, syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener(AUTH_CHANGE_EVENT, syncUser);
    };
  }, []);

  return user;
}
