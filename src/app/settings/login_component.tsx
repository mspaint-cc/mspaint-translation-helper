import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Session } from "next-auth";
import { GithubIcon, TriangleAlert } from "lucide-react";
import Image from "next/image";

export default async function LoginComponent() {
    const session = await auth() as Session & { accessToken: string };
    // Permission check
    const response = await fetch("https://api.github.com/repos/mspaint-cc/translations", {
        headers: {
            Authorization: `token ${session?.accessToken}`,
            "X-GitHub-Api-Version": "2022-11-28",
            "Accept": "application/vnd.github+json",
        },
        next: {
            revalidate: 60 * 60 * 24,
        }
    });
    
    const repoData = await response.json();
    const hasWriteAccess = repoData.permissions?.push;


    return (
        <Card className="w-full mt-5">
            <CardHeader>
                <CardTitle>Github Account</CardTitle>
                <CardDescription>The Github account you are logged in with.</CardDescription>
            </CardHeader>
            <CardContent>
                {(session && session?.user) ? (
                    <div className="flex flex-row gap-2 items-center">
                        <Avatar className="w-[4.5rem] h-[4.5rem]">
                            <AvatarImage src={session.user.image ?? `https://avatar.vercel.sh/${session.user.name ?? "anonymous"}?w=64&h=64`} />
                            <AvatarFallback>{(session.user.name ?? "anonymous").charAt(0)}</AvatarFallback>
                        </Avatar>

                        <p className="ml-2">
                            Logged in as {session.user.name ?? "anonymous"} (ID: {session.user.id})<br />
                            <span className="text-muted-foreground text-xs">{hasWriteAccess ? "You have write access to the translations repository." : "You do not have write access to the translations repository."}</span>
                        </p>

                        <form action={async () => {
                            "use server";
                            await signOut();
                        }} className="ml-auto">
                            <Button>Logout</Button>
                        </form>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 justify-center">
                        <div className="rounded-md border p-4 flex flex-col justify-center items-center gap-3">
                            <div className="flex flex-row gap-2 items-center justify-center">
                                <TriangleAlert className="text-yellow-400 w-[2rem] h-[2rem]" />
                                <p className="text-sm text-yellow-400/90">
                                    Please authorize the mspaint-cc organization if possible while logging in.
                                </p>

                            </div>
                            <Image src="/perms.png" width={500} height={300} alt="Permissions" />

                            <form action={async () => {
                                "use server";
                                await signIn("github");
                            }}>
                                <Button className="px-5 py-5">Login with Github <GithubIcon /></Button>
                            </form>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        
    )
}