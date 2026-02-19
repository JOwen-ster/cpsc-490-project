import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginButton from "@/components/signin-button";

export default async function Home() {
  const session = await auth();

  if (session) {
    const username = session.user?.username;
    if (username) {
      redirect(`/dashboard/${username}`);
    }
    // If session exists but username is missing, keep them on homepage to resign in
  }

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#e6edf3] flex flex-col items-center py-6 px-4">
      <div className="text-center mb-10">
        {/* Title */}
        <h1 className="text-5xl font-bold text-center mb-6">
          <span className="text-[#f85149]">Git</span>Graph
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-[#8b949e] max-w-xl mx-auto leading-relaxed">
          Turn GitHub issues into a learning roadmap. Know what to fix, what to
          learn, and what matters first.
        </p>

        {/* Login Button */}
        <div className="flex justify-center mt-6">
          <LoginButton />
        </div>
      </div>

      {/* Info Bubbles */}
      <div className="max-w-6xl w-full flex flex-col">
        {/* How it works (Left) */}
        <div className="w-full md:w-[45%] self-start">
          <h3 className="text-[#f0f6fc] font-medium mb-4 px-1">How it works</h3>
          <div className="bg-[#161b22]/40 border border-[#30363d] p-8 rounded-2xl">
            <p className="text-[#8b949e] leading-relaxed">
              Looking at a GitHub issues tab with hundreds of open tickets can
              be overwhelming.{" "}
              <span className="text-[#f85149] font-bold">Git</span>
              <span className="text-[#e6edf3] font-bold">Graph </span>
              provides a solution by transforming chaotic issue lists into an
              intuitively organized visual graph, giving you a clear roadmap of
              exactly where to start.
            </p>
          </div>
        </div>

        {/* Features (Right) */}
        <div className="w-full md:w-[45%] self-end">
          <h3 className="text-[#f0f6fc] font-medium mb-4 px-1">Features</h3>
          <div className="bg-[#161b22]/40 border border-[#30363d] p-8 rounded-2xl">
            <ul className="space-y-6">
              <li className="flex items-center gap-3">
                <span className="text-[#1f6feb] text-xl">•</span>
                <span className="font-semibold text-[#f0f6fc]">
                  AI Issue Summaries
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#1f6feb] text-xl">•</span>
                <span className="font-semibold text-[#f0f6fc]">
                  Smart Roadmap Ordering
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#1f6feb] text-xl">•</span>
                <span className="font-semibold text-[#f0f6fc]">
                  Predictive Issue Grouping
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
