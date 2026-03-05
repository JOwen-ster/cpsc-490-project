import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/signout-button";
import DashboardBoard, { Column, CardData } from "@/components/dashboard-board";
import Link from "next/link";
import { db } from "@/lib/db";
import { ensureUserAndSeed, initializeSchema } from "@/lib/schema";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { refreshRepositoryIssues, deleteRepository } from "@/app/actions";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ params, searchParams }: Props) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const session = await auth();

  if (!session || session.user?.username !== username) {
    redirect("/");
  }

  // Ensure DB schema and user exists
  await initializeSchema();
  await ensureUserAndSeed({
    id: session.user.id!,
    username: session.user.username!,
    image: session.user.image!,
  });

  // Fetch repositories
  // TODO: move to an ORM
  const reposResult = await db.query(
    `SELECT id, name FROM repositories WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.user.id],
  );
  const repositories = reposResult.rows;

  // Determine selected repo
  let selectedRepoId = resolvedSearchParams.repoId as string | undefined;
  if (!selectedRepoId && repositories.length > 0) {
    selectedRepoId = repositories[0].id.toString();
  }

  // Handle Refresh Action
  async function handleRefresh() {
    "use server";
    if (selectedRepoId) {
      await refreshRepositoryIssues(selectedRepoId);
    }
  }

  // Fetch issues for selected repo
  let issues: any[] = [];
  if (selectedRepoId) {
    // TODO: move to an ORM
    const issuesResult = await db.query(
      `SELECT i.*, 
        COALESCE(
          json_agg(
            json_build_object('name', t.name, 'color', t.color)
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
       FROM issues i
       LEFT JOIN issue_tags it ON i.id = it.issue_id
       LEFT JOIN tags t ON it.tag_id = t.id
       WHERE i.repository_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      [parseInt(selectedRepoId)],
    );
    issues = issuesResult.rows;
  }

  // Map issues to columns
  const columns: Column[] = [
    { id: "todo", title: "To Do", color: "gray", cards: [] },
    { id: "inprogress", title: "In Progress", color: "yellow", cards: [] },
    { id: "done", title: "Done", color: "green", cards: [] },
  ];

  issues.forEach((issue) => {
    const displayNum = issue.issue_number || issue.id;
    const card: CardData = {
      id: issue.id.toString(),
      title: `#${displayNum} ${issue.title}`,
      author: issue.author,
      time: new Date(issue.created_at).toLocaleDateString(), // or time ago
      tags: issue.tags,
    };

    const col = columns.find((c) => c.id === issue.status);
    if (col) {
      col.cards.push(card);
    } else {
      columns[0].cards.push(card);
    }
  });

  return (
    <div className="flex h-screen w-full bg-[#0d1117] text-[#e6edf3] overflow-hidden font-[family-name:var(--font-geist-sans)]">
      {/* 1. Sidebar */}
      <div className="w-64 border-r border-[#30363d] bg-[#010409] flex flex-col hidden md:flex">
        <div className="p-4">
          <div className="font-bold text-lg px-2 text-[#f0f6fc] mb-6">
            Hello, {session.user?.username}!
          </div>

          <div className="flex items-center justify-between px-2 mb-3">
            <div className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
              Repositories
            </div>
            <Link
              href="/repo-select"
              className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors p-1 hover:bg-[#1c2128] rounded-md"
              title="Add Repository"
            >
              <Plus size={14} />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {repositories.map((repo) => {
              const isActive = selectedRepoId === repo.id.toString();
              const deleteRepoAction = async () => {
                "use server";
                await deleteRepository(repo.id.toString());
              };

              return (
                <div
                  key={repo.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                    isActive ? "bg-[#1f242c]" : "hover:bg-[#1c2128]"
                  }`}
                >
                  <Link
                    href={`/dashboard/${username}?repoId=${repo.id}`}
                    className={`flex-1 flex items-center gap-2 min-w-0 ${
                      isActive ? "text-[#f0f6fc] font-medium" : "text-[#c9d1d9]"
                    }`}
                  >
                    <span
                      className={`opacity-40 group-hover:opacity-100 ${isActive ? "opacity-100" : ""}`}
                    >
                      📁
                    </span>
                    <span className="truncate">{repo.name}</span>
                  </Link>
                  <form action={deleteRepoAction}>
                    <button
                      type="submit"
                      className="opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-[#f85149] transition-all p-1 -mr-1 rounded hover:bg-[#30363d]"
                      title="Remove Repository"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-[#30363d]">
          <SignOutButton />
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
        <header className="h-14 border-b border-[#30363d] flex items-center justify-between px-6 shrink-0">
          <span className="font-semibold text-[#f0f6fc]">Issues Board</span>
          {selectedRepoId && (
            <form action={handleRefresh}>
              <button
                type="submit"
                className="flex items-center gap-2 text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] transition-colors p-2 hover:bg-[#1c2128] rounded-md"
                title="Refresh issues from GitHub"
              >
                <RefreshCcw size={14} />
                Refresh
              </button>
            </form>
          )}
        </header>

        <main className="flex-1 min-h-0">
          <DashboardBoard initialColumns={columns} />
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
