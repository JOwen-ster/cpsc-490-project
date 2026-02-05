import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface Props {
  params: { username: string };
}

export default async function DashboardPage({ params }: Props) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  // access GitHub username or user id
  // this is done using the session object
  // refer to auth.ts in root dir

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Hello, {session.user?.email}!
      </h1>
    </div>
  );
}
