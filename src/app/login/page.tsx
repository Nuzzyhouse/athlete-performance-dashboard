import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div className="card" style={{ width: 360, padding: "2rem" }}>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            marginBottom: "0.25rem",
            color: "var(--text-pri)",
          }}
        >
          Performance Dashboard
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-mute)", marginBottom: "1.5rem" }}>
          Sign in to continue
        </p>
        <LoginForm callbackUrl={callbackUrl ?? "/"} />
      </div>
    </div>
  );
}
