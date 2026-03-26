import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/signout-button";
import DashboardBoard, { Column, CardData } from "@/components/dashboard-board";
import DashboardContainer from "@/components/dashboard-container";
import IssueGraph from "@/components/issue-graph";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ensureUserAndSeed } from "@/lib/schema";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { refreshRepositoryIssues, deleteRepository } from "@/app/actions";
import { mapIssuesToKanbanColumns } from "@/lib/utils/kanban-mapper";

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

  // Ensure user exists
  await ensureUserAndSeed({
    id: session.user.id!,
    username: session.user.username!,
    image: session.user.image!,
  });

  // Fetch repositories using Prisma
  const repositories = await prisma.repository.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

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

  // Fetch issues for selected repo using Prisma
  let issues: any[] = [];
  if (selectedRepoId) {
    const issuesData = await prisma.issue.findMany({
      where: {
        repositoryId: parseInt(selectedRepoId),
      },
      include: {
        issueTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform issues to include tags in the format expected by the UI
    issues = issuesData.map((issue) => ({
      ...issue,
      tags: issue.issueTags.map((it) => ({
        name: it.tag.name,
        color: it.tag.color,
      })),
    }));
  }

  // Map issues to columns using the extracted mapper
  const columns = mapIssuesToKanbanColumns(issues);

  return (
    <DashboardContainer
      sidebar={
        <>
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
                      isActive
                        ? "bg-[#1f242c]"
                        : "hover:bg-[#1c2128]"
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
        </>
      }
      headerActions={
        selectedRepoId && (
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
        )
      }
      main={
        <div className="flex-1 min-h-0 bg-[#0d1117]">
          <DashboardBoard initialColumns={columns} />
        </div>
      }
      graph={
        <div className="flex-1 h-full w-full">
          {selectedRepoId ? (
            <IssueGraph 
              issues={issues} 
              repoName={repositories.find(r => r.id.toString() === selectedRepoId)?.name || "Repository"} 
            />
          ) : (
            <div className="flex-1 rounded-xl border border-[#30363d] border-dashed flex flex-col items-center justify-center text-[#484f58] p-4 text-center bg-[#010409]">
              <p className="text-xs italic">
                Select a repository to see activity metrics and resolution velocity.
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}
