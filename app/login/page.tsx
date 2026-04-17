import LoginClient from "./login-client";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = String(params?.next || "/dashboard");

  return <LoginClient nextPath={nextPath} />;
}
