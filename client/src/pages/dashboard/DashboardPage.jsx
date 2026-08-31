import useAuthStore from "@/store/useAuthStore";
import PostFeed from "@/components/posts/PostFeed";

// ── Dashboard component ───────────────────────────────────────────────────
const DashboardPage = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening in {user?.department || "your community"}.
        </p>
      </div>

      <PostFeed />
    </div>
  );
};

export default DashboardPage;
