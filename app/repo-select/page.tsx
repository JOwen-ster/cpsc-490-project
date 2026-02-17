import { auth } from "@/auth";
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
import { redirect } from "next/navigation";

export default async function RepoSelectPage() {
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/api/auth/signin");
  }

  const response = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=10",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center">
        <p>Failed to fetch repositories. Please try signing in again.</p>
      </main>
    );
  }

  const repos = await response.json();

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:text-[#f0f6fc] border shadow-sm h-12 px-6 text-lg w-64"
          >
            Repository
            <span className="ml-2 opacity-50">▼</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64 bg-[#161b22] border-[#30363d] text-[#e6edf3] rounded-md shadow-xl">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-[#8b949e] font-normal text-xs px-3 py-2">
              Select a repository
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-[#30363d]" />

            {repos.map((repo: any) => (
              <DropdownMenuItem
                key={repo.id}
                className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2"
              >
                {repo.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-[#30363d]" />

          <DropdownMenuItem className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2">
            View GitHub Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2">
            Support
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </main>
  );
}
