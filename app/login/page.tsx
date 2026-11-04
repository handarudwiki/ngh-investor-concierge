import type { Metadata } from "next";
import { Login } from "./login";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <Login />;
}
