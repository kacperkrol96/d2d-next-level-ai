"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./session";
import { getDataSource } from "@/lib/data";

export async function demoLogin(formData: FormData) {
  const user = await getDataSource().findUser(String(formData.get("userId") ?? ""));
  if (!user) redirect("/login");
  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/kokpit");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
