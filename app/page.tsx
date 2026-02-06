import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/signin-button";

export default async function Home() {
  const session = await auth();

  if (session) {
    const username = session.user?.username;
    if (username) {
      redirect(`/dashboard/${username}`);
    } else {
      // Session exists but is missing required user data; recover by clearing it.
      // NOTE: need to still implement signout
      // redirect("/api/auth/signout");
    }
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-gray-200 p-8 flex flex-col gap-16">
      <section className="text-center flex flex-col items-center gap-4">
        {/* Title */}
        <h1 className="text-4xl font-bold text-center">
          <span className="text-red-500">Git</span>Graph
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-400 max-w-xl">
          Turn GitHub issues into a learning roadmap. Know what to fix, what to
          learn, and what matters first.
        </p>

        {/* Login Button */}
        <LoginButton />
      </section>

      {/* How it works */}
      <div className="ml-10">
        <p className="p-2">How it works</p>
        <p className="border border-gray-800 bg-[#161b22] rounded-lg max-w-xl p-4 text-gray-400">
          Add text here to explain how the app works. Lorem ipsum dolor sit amet
          consectetur adipisicing elit. Blanditiis, aperiam accusamus rem
          voluptate neque iusto quo nulla molestias? Repellat omnis alias harum
          facere consequuntur quaerat voluptatum, ea reiciendis quasi qui.
        </p>
      </div>

      {/* Features */}
      <div className="self-end mr-10">
        <p className="p-2">Features</p>
        <p className="border border-gray-800 bg-[#161b22] rounded-lg max-w-xl p-4 text-gray-400">
          Add list here to display features of the app. Lorem ipsum dolor sit
          amet consectetur adipisicing elit. Blanditiis, aperiam accusamus rem
          voluptate neque iusto quo nulla molestias? Repellat omnis alias harum
          facere consequuntur quaerat voluptatum, ea reiciendis quasi qui.
        </p>
      </div>
    </main>
  );
}
