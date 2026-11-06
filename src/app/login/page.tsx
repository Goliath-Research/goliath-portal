import { devSignIn, entraSignIn } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const entraReady = Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
  );
  const devReady = process.env.AUTH_DEV_LOGIN === "1";

  return (
    <main className="login">
      <div className="login-card">
        <p className="kicker">Goliath</p>
        <h1>Portal</h1>
        <p>Operator entrance to GoliathOmics.</p>
        {devReady ? (
          <form action={devSignIn}>
            <input name="email" type="email" required defaultValue="operator@goliath.dev" aria-label="Email" />
            <input name="password" type="password" required placeholder="Password" aria-label="Password" />
            <button type="submit">Enter</button>
          </form>
        ) : null}
        {entraReady ? (
          <form action={entraSignIn}>
            <button type="submit">Continue with Microsoft Entra</button>
          </form>
        ) : null}
      </div>
    </main>
  );
}
