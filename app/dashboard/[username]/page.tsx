import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/signout-button";
import DashboardBoard from "@/components/dashboard-board";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  if (!session || session.user?.username !== username) {
    redirect("/");
  }

  // Mock data for the repo list
  const repositories = ["test#1", "test#2"];

  return (
    <div className="flex h-screen w-full bg-[#0d1117] text-[#e6edf3] overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* 1. Sidebar */}
      <div className="w-64 border-r border-[#30363d] bg-[#010409] flex flex-col hidden md:flex">
        <div className="p-4">
          <div className="font-bold text-lg px-2 text-[#f0f6fc] mb-6">
            Hello, {session.user?.username}!
          </div>

          <div className="text-xs font-semibold text-[#8b949e] px-2 uppercase tracking-wider mb-3">
            Repositories
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {repositories.map((repo) => (
              <div
                key={repo}
                className="group flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#1c2128] cursor-pointer text-sm text-[#c9d1d9] transition-colors"
              >
                <span className="opacity-40 group-hover:opacity-100">📁</span>
                <span className="truncate">{repo}</span>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-[#30363d]">
          <SignOutButton />
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        <header className="h-14 border-b border-[#30363d] flex items-center px-6 shrink-0">
          <span className="font-semibold text-[#f0f6fc]">Issues Board</span>
        </header>

        <main className="flex-1 min-h-0">
          <DashboardBoard />
        </main>
      </div>

      {/* 3. Graph Analysis */}
      <div className="w-80 border-l border-[#30363d] bg-[#0d1117] p-6 hidden lg:flex flex-col">
        <div className="font-bold text-sm text-[#8b949e] uppercase tracking-wider mb-4">
          Graph Analysis
        </div>
        <div className="flex-1 rounded-xl border border-[#30363d] border-dashed flex flex-col items-center justify-center text-[#484f58] p-4 text-center">
          <p className="text-xs italic">
            Select an issue to see activity metrics and resolution velocity.
          </p>
        </div>
      </div>
    </div>
  );
}
