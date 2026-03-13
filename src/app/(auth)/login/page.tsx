import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>;
}

export const metadata = {
  title: "Sign In — IssueTracker",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from } = await searchParams;

  return <LoginForm redirectTo={from ?? "/issues"} />;
}
