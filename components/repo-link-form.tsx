"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addRepoByLink } from "@/app/actions";

export function RepoLinkForm() {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await addRepoByLink(formData);
      return result;
    },
    null
  );

  return (
    <form action={action} className="w-80 flex flex-col gap-2">
      <div className="relative">
        <input
          name="repoLink"
          type="text"
          placeholder="https://github.com/owner/repo"
          className="w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#1f6feb] transition-colors"
          disabled={isPending}
        />
      </div>
      <Button 
        type="submit" 
        disabled={isPending}
        className="bg-[#238636] hover:bg-[#2ea043] text-white border-none font-semibold h-9"
      >
        {isPending ? "Importing..." : "Import by Link"}
      </Button>
      {state?.error && (
        <p className="text-[#f85149] text-xs mt-1 text-center">{state.error}</p>
      )}
    </form>
  );
}
