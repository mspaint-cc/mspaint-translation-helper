"use server";

import { auth } from "@/auth";
import { Session } from "next-auth";

/*
Ignore this im just breaking down the thingy so this less complicated for me to implement

- check for write permissions (mspaint-cc/translations)
   - if not then fork the repo and then create a PR then return a JSON that contains the PR link
      - to create a PR we need to create a branch and then push it to the repo
      - then we need to create a PR from the branch to the main branch

   - if they do then directly modify the file.

*/
export async function publish_translations(translations: Record<string, string>, lang: string) {
    const session = await auth() as Session & { accessToken: string };
    if (!session || !session.accessToken) return;

    // User info
    const userResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `token ${session?.accessToken}`,
        }
    });
    const userData = await userResponse.json();
    const username = userData.login;

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
    
    if (!hasWriteAccess) {
        // Create a fork
        const forkResponse = await fetch("https://api.github.com/repos/mspaint-cc/translations/forks", {
            method: "POST",
            headers: {
                Authorization: `token ${session?.accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
            }
        });
        
        if (!forkResponse.ok) {
            return {
                success: false,
                message: {
                    message: "Failed to create fork",
                    description: "Failed to fork the translations repository. Please try again later."
                }
            };
        }
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get the ref to create a branch from
        const refResponse = await fetch(`https://api.github.com/repos/${username}/translations/git/refs/heads/main`, {
            headers: {
                Authorization: `token ${session?.accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
            }
        });
        
        if (!refResponse.ok) {
            return {
                success: false,
                message: {
                    message: "Failed to get reference",
                    description: "Failed to get the main branch reference. Please try again later."
                }
            };
        }
        
        const refData = await refResponse.json();
        const latestCommitSha = refData.object.sha;
        
        // Create a new branch
        const branchName = `update-${lang}-translations-${Date.now()}`;
        const createBranchResponse = await fetch(`https://api.github.com/repos/${username}/translations/git/refs`, {
            method: "POST",
            headers: {
                Authorization: `token ${session?.accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: latestCommitSha
            })
        });
        
        if (!createBranchResponse.ok) {
            return {
                success: false,
                message: {
                    message: "Failed to create branch",
                    description: "Failed to create a new branch. Please try again later."
                }
            };
        }
        
        // Get the file content
        const fileResponse = await fetch(`https://api.github.com/repos/${username}/translations/contents/translations/${lang}.json`, {
            headers: {
                Authorization: `token ${session?.accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
            }
        });
        
        let fileSha;
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            fileSha = fileData.sha;
        }
        
        // Update file in fork
        const fileContent = JSON.stringify(translations, null, 2);
        const updateFileResponse = await fetch(`https://api.github.com/repos/${username}/translations/contents/translations/${lang}.json`, {
            method: "PUT",
            headers: {
                Authorization: `token ${session?.accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `feat: updated ${lang} translation`,
                content: Buffer.from(fileContent).toString("base64"),
                branch: branchName,
                sha: fileSha
            })
        });
        
        if (!updateFileResponse.ok) {
            return {
                success: false,
                message: {
                    message: "Failed to update file",
                    description: "Failed to update the translations file in your fork. Please try again later."
                }
            };
        }
        
        // Create a PR
        const prResponse = await fetch("https://api.github.com/repos/mspaint-cc/translations/pulls", {
            method: "POST",
            headers: {
                Authorization: `token ${session?.accessToken}`,
                "X-GitHub-Api-Version": "2022-11-28",
                "Accept": "application/vnd.github+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: `Update ${lang} translations`,
                body: `This PR updates translations for ${lang}`,
                head: `${username}:${branchName}`,
                base: "main"
            })
        });
        
        if (!prResponse.ok) {
            return {
                success: false,
                message: {
                    message: "Failed to create PR",
                    description: "Failed to create a pull request. Please try again later."
                }
            };
        }
        
        const prData = await prResponse.json();
        return {
            success: true,
            message: {
                message: "Your changes are in review!",
                description: "We have forked the repo and created a PR. Please wait for the changes to be reviewed.",
                action: {
                    label: "View PR",
                    onClick: "OPEN_LINK",
                    href: prData.html_url
                }
            }
        };
    };

    // Get file sha
    const fileResponse = await fetch(`https://api.github.com/repos/mspaint-cc/translations/contents/translations/${lang}.json`, {
        method: "GET",
        headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            "Accept": "application/vnd.github+json",
        }
    });

    let fileData;
    try {
        fileData = await fileResponse.json();
    } catch  {
        return {
            success: false,
            message: {
                message: "Failed to fetch file",
                description: "Failed to fetch the translations file. Please try again later."
            }
        }
    }

    const fileSha = fileData.sha;
    const fileContent = JSON.stringify(translations, null, 2);

    // Update file
    const commitResponse = await fetch(`https://api.github.com/repos/mspaint-cc/translations/contents/translations/${lang}.json`, {
        method: "PUT",
        headers: {
            "X-GitHub-Api-Version": "2022-11-28",
            "Accept": "application/vnd.github+json",
            "Authorization": `token ${session?.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: `feat: updated ${lang} translation`,
            content: Buffer.from(fileContent).toString("base64"),
            sha: fileSha,
            branch: "main"
        })
    });

    if (commitResponse.status !== 200) {
        return {
            success: false,
            message: {
                message: "Failed to commit changes",
                description: `Had an HTTP error (${commitResponse.status}) while committing changes to the translations file. Please try again later.`
            }
        }
    }

    return {
        success: true,
        message: {
            message: "Translations updated!",
            description: "Your translations have been successfully updated.",
            action: {
                label: "Show changes",
                onClick: "OPEN_LINK",
                href: "https://github.com/mspaint-cc/translations/commits/main/"
            }
        }
    }

}