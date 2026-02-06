import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  if ( !session || session?.user.username != username) {
    redirect("/");
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Hello, {session.user?.username}!
      </h1>
    </div>
  );
}
