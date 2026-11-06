import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/login") || url.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  const session = await auth();
  if (!session?.user) {
    const login = new URL("/login", url);
    login.searchParams.set("callbackUrl", url.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
