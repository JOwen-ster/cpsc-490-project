import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  if ( !session ) {
    redirect("/");
  }

  if ( session?.user.username != username ){
    redirect("/")
  }

  // TODO:
  // access GitHub username
  // this is done using the session object
  // refer to auth.ts in root dir
  // logging in with a valid session should redirect to the users dashboard page
  // the dynamic route should use the username
  // console.log(session.user.username);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Hello, {session.user?.username}!
      </h1>
    </div>
  );
}
