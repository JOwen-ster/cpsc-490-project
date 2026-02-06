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

export default function RepoSelect() {
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

            <DropdownMenuItem className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2">
              Repo 1
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2">
              Repo 2
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#1f6feb] focus:text-white cursor-pointer px-3 py-2">
              Repo 3
            </DropdownMenuItem>
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
