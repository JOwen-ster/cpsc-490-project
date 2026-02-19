import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/signout-button";

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
    <div className="flex h-screen w-full bg-[#0d1117] text-[#e6edf3] overflow-hidden">
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
        <header className="h-14 border-b border-[#30363d] flex items-center px-6">
          <span className="font-semibold text-[#f0f6fc]">Issues Board</span>
        </header>

        <main className="flex-1 overflow-x-auto p-6 flex gap-6">
          {/* To Do Column */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-[#8b949e]"></div>
              <h3 className="font-medium text-sm text-[#f0f6fc]">To Do</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium">#1 Fix sidebar rendering</p>
                <p className="text-xs text-[#8b949e] mt-1">@lucas • 2h ago</p>
              </div>
            </div>
          </div>

          {/* In Progress Column */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-[#d29922]"></div>
              <h3 className="font-medium text-sm text-[#f0f6fc]">
                In Progress
              </h3>
            </div>
            <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-lg shadow-sm border-l-4 border-l-[#d29922]">
              <p className="text-sm font-medium">#4 Integrating Auth.js</p>
              <p className="text-xs text-[#8b949e] mt-1">@lucas • 5h ago</p>
            </div>
          </div>

          {/* Done Column */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 rounded-full bg-[#3fb950]"></div>
              <h3 className="font-medium text-sm text-[#f0f6fc]">Done</h3>
            </div>
          </div>
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
