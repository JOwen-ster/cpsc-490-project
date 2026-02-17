import { signOut } from "@/auth";

export default function SignOutButton() {
  return (
    // Have user redirected to homepage on signout
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-in-out hover:bg-white hover:text-black"
      >
        Sign Out
      </button>
    </form>
  );
}
