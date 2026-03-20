import { auth } from "@/auth";
import { redirect } from "next/navigation";
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
import { addRepo } from "@/app/actions";
import { RepoLinkForm } from "@/components/repo-link-form";

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

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col gap-8 items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#f0f6fc] mb-3">Add Repository</h1>
        <p className="text-[#8b949e]">Select from your account or import any public repository.</p>
      </div>

      <div className="flex flex-col gap-8 items-center">
        {/* Option 1: Dropdown */}
        <div className="flex flex-col gap-3 items-center">
          <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            Your Repositories
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] border shadow-sm h-11 px-6 text-base w-80 justify-between"
              >
                Select Repository
                <span className="opacity-50 text-xs">▼</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 bg-[#161b22] border-[#30363d] text-[#e6edf3] rounded-md shadow-xl max-h-96 overflow-y-auto">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[#8b949e] font-normal text-xs px-3 py-2">
                  Recent Repositories
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
                        <span className="font-medium truncate w-full">{repo.name}</span>
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Divider */}
        <div className="flex items-center w-80 gap-4">
          <div className="h-px bg-[#30363d] flex-1"></div>
          <span className="text-[#484f58] text-xs font-bold">OR</span>
          <div className="h-px bg-[#30363d] flex-1"></div>
        </div>

        {/* Option 2: Link Import */}
        <div className="flex flex-col gap-3 items-center">
          <label className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            Public Repository Link
          </label>
          <RepoLinkForm />
        </div>
      </div>

      <div className="mt-4">
        <Link 
          href={`/dashboard/${session.user.username}`}
          className="text-sm text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
        >
          Cancel & Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
