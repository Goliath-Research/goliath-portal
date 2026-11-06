import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";

function allowedOperators(): string[] | null {
  const raw = process.env.GOLIATH_PORTAL_OPERATORS?.trim();
  if (!raw) return null;
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function operatorMayEnter(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = allowedOperators();
  if (!allow) return true;
  return allow.includes(email.toLowerCase());
}

const providers: Provider[] = [];

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

if (process.env.AUTH_DEV_LOGIN === "1") {
  providers.push(
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const expected = process.env.AUTH_DEV_PASSWORD ?? "portal";
        if (!email || password !== expected || !operatorMayEnter(email)) return null;
        return { id: email, email, name: email };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? "goliath-portal-dev-secret-change-me",
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user }) {
      return operatorMayEnter(user.email);
    },
  },
});
