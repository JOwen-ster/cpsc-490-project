import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default async function RepoSelectPage() {
  const session = await auth();

  if (!session?.accessToken || !session.user?.id) {
    redirect("/");
  }

  // Fetch repositories from GitHub API
  const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    // We can add next: { revalidate: 60 } if we want to cache, 
    // but typically we want fresh data for this specific page.
    cache: 'no-store'
  });

  if (!res.ok) {
    console.error("Failed to fetch repositories", await res.text());
    return <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col items-center justify-center">
      <div>Error fetching repositories from GitHub. Check your scopes or try again.</div>
      <Link href={`/dashboard/${session.user.username}`} className="mt-4 text-blue-400 hover:underline">Return to Dashboard</Link>
    </main>;
  }

  const githubRepos: any[] = await res.json();

  async function addRepo(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id || !session?.accessToken) return;

    const name = formData.get("repoName") as string;
    const fullName = formData.get("repoFullName") as string;
    const description = (formData.get("description") as string) || "";

    if (!name || !fullName) return;

    // TODO: move to an ORM
    const insertResult = await db.query(
      `INSERT INTO repositories (user_id, name, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [session.user.id, name, description]
    );

    const newRepoId = insertResult.rows[0].id;

    // Fetch issues from GitHub API
    const issuesRes = await fetch(`https://api.github.com/repos/${fullName}/issues?state=open&per_page=100`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: 'no-store'
    });

    if (issuesRes.ok) {
      const issues = await issuesRes.json();

      // Clear existing issues to prevent duplicates on re-import
      // TODO: move to an ORM
      await db.query(`DELETE FROM issues WHERE repository_id = $1`, [newRepoId]);

      for (const issue of issues) {
        if (issue.pull_request) continue; // Skip pull requests

        // TODO: move to an ORM
        const issueInsert = await db.query(
          `INSERT INTO issues (repository_id, issue_number, title, description, status, author, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [
            newRepoId,
            issue.number,
            issue.title,
            issue.body || "",
            "todo",
            `@${issue.user.login}`,
            issue.created_at,
            issue.updated_at
          ]
        );
        const newIssueId = issueInsert.rows[0].id;

        if (issue.labels && issue.labels.length > 0) {
          for (const label of issue.labels) {
            // TODO: move to an ORM
            const tagInsert = await db.query(
              `INSERT INTO tags (repository_id, name, color)
               VALUES ($1, $2, $3)
               ON CONFLICT (repository_id, name) DO UPDATE SET color = EXCLUDED.color
               RETURNING id`,
              [newRepoId, label.name, `#${label.color || '8b949e'}`]
            );
            const newTagId = tagInsert.rows[0].id;

            // TODO: move to an ORM
            await db.query(
              `INSERT INTO issue_tags (issue_id, tag_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [newIssueId, newTagId]
            );
          }
        }
      }
    }

    redirect(`/dashboard/${session.user.username}?repoId=${newRepoId}`);
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col gap-6 items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#f0f6fc] mb-2">Import Repository</h1>
        <p className="text-sm text-[#8b949e]">Select a GitHub repository to add to your issues board.</p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] border shadow-sm h-12 px-6 text-lg w-80 justify-between"
          >
            Select Repository
            <span className="opacity-50 text-xs">▼</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 bg-[#161b22] border-[#30363d] text-[#e6edf3] rounded-md shadow-xl max-h-96 overflow-y-auto">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[#8b949e] font-normal text-xs px-3 py-2">
              Your Repositories
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#30363d]" />

            {githubRepos.length === 0 && (
              <div className="px-3 py-4 text-sm text-[#8b949e] text-center">No repositories found.</div>
            )}

            {githubRepos.map((repo) => (
              <form key={repo.id} action={addRepo}>
                <input type="hidden" name="repoName" value={repo.name} />
                <input type="hidden" name="repoFullName" value={repo.full_name} />
                <input type="hidden" name="description" value={repo.description || ""} />
                <DropdownMenuItem asChild className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2 w-full group">
                  <button type="submit" className="w-full text-left flex flex-col items-start gap-1">
                    <span className="font-medium">{repo.name}</span>
                    {repo.description && (
                      <span className="text-[10px] text-[#8b949e] group-focus:text-blue-200 line-clamp-1 truncate w-full">
                        {repo.description}
                      </span>
                    )}
                  </button>
                </DropdownMenuItem>
              </form>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-[#30363d]" />

          <DropdownMenuItem asChild className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2 w-full">
            <Link href={`/dashboard/${session.user.username}`}>
              Cancel & Return to Dashboard
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </main>
  );
}
