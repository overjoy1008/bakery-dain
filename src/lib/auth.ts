import { useEffect, useState } from "react";

export type BakeryUser = {
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type BakerySessionUser = Omit<BakeryUser, "password">;

const USERS_KEY = "bakery-dain-users";
const SESSION_KEY = "bakery-dain-session";
const AUTH_CHANGE_EVENT = "bakery-dain-auth-change";

function readUsers(): BakeryUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const users = window.localStorage.getItem(USERS_KEY);
    return users ? (JSON.parse(users) as BakeryUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: BakeryUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function emitAuthChange() {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getCurrentUser(): BakerySessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const user = window.localStorage.getItem(SESSION_KEY);
    return user ? (JSON.parse(user) as BakerySessionUser) : null;
  } catch {
    return null;
  }
}

export function isUsernameTaken(username: string) {
  const normalizedUsername = username.trim().toLowerCase();
  return readUsers().some((user) => user.username.toLowerCase() === normalizedUsername);
}

export function createUser(user: BakeryUser) {
  if (isUsernameTaken(user.username)) {
    return null;
  }

  const nextUsers = [...readUsers(), user];
  writeUsers(nextUsers);

  const { password: _password, ...sessionUser } = user;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  emitAuthChange();
  return sessionUser;
}

export function login(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  const user = readUsers().find(
    (savedUser) =>
      savedUser.username.toLowerCase() === normalizedUsername && savedUser.password === password,
  );

  if (!user) {
    return null;
  }

  const { password: _password, ...sessionUser } = user;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  emitAuthChange();
  return sessionUser;
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
