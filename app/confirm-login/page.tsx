import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AfterLoginPage() {
    const session = await auth();

    if ( !session ) redirect("/");

    const uname = session.user.username;

    redirect(`/dashboard/${uname}`);
}
