import Image from "next/image";
import GitHubLoginButton from "./components/GitHubLoginButton";

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col gap-8">
      <h1 className="text-4xl font-bold text-center">
        <span className="text-red-500">Git</span>Graph
      </h1>
      <p className="text-center">Organize and group your GitHub issues</p>
      <GitHubLoginButton />
    </main>
  );
}
