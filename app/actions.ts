"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseGitHubLink } from "@/lib/utils";

/**
 * Shared logic to import a repository and its issues.
 */
async function importRepoByFullName(
  userId: string,
  accessToken: string,
  name: string,
  fullName: string,
  description: string,
) {
  const upsertRepo = await prisma.repository.upsert({
    where: {
      userId_name: {
        userId: userId,
        name: name,
      },
    },
    update: {
      description: description,
    },
    create: {
      userId: userId,
      name: name,
      description: description,
    },
  });

  const newRepoId = upsertRepo.id;

  // Fetch issues from GitHub API (both open and closed)
  const issuesRes = await fetch(
    `https://api.github.com/repos/${fullName}/issues?state=all&per_page=100&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    },
  );

  if (issuesRes.ok) {
    const issues = await issuesRes.json();

    // 1. Clear existing issues
    await prisma.issue.deleteMany({ where: { repositoryId: newRepoId } });

    // 2. Pre-process Tags
    const uniqueTagsMap = new Map<string, string>();
    for (const issue of issues) {
      if (issue.pull_request) continue;
      issue.labels?.forEach((label: any) => {
        uniqueTagsMap.set(label.name, label.color);
      });
    }

    const tagNameToId = new Map<string, number>();
    for (const [tagName, tagColor] of uniqueTagsMap.entries()) {
      const tag = await prisma.tag.upsert({
        where: { repositoryId_name: { repositoryId: newRepoId, name: tagName } },
        update: { color: `#${tagColor || "8b949e"}` },
        create: {
          repositoryId: newRepoId,
          name: tagName,
          color: `#${tagColor || "8b949e"}`,
        },
      });
      tagNameToId.set(tagName, tag.id);
    }

    // 3. Create Issues
    const associationsToCreate: { issueId: number; tagId: number }[] = [];

    for (const issue of issues) {
      if (issue.pull_request) continue;

      const createdIssue = await prisma.issue.create({
        data: {
          repositoryId: newRepoId,
          issueNumber: issue.number,
          title: issue.title,
          description: issue.body || "",
          status: issue.state === "closed" ? "done" : "todo",
          author: `@${issue.user.login}`,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
        },
      });

      if (issue.labels && issue.labels.length > 0) {
        issue.labels.forEach((label: any) => {
          const tagId = tagNameToId.get(label.name);
          if (tagId) {
            associationsToCreate.push({ issueId: createdIssue.id, tagId });
          }
        });
      }
    }

    // 4. Batch Create Associations
    if (associationsToCreate.length > 0) {
      await prisma.issueTag.createMany({
        data: associationsToCreate,
        skipDuplicates: true,
      });
    }
  }

  return newRepoId;
}

export async function addRepo(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session?.accessToken) return;

  const name = formData.get("repoName") as string;
  const fullName = formData.get("repoFullName") as string;
  const description = (formData.get("description") as string) || "";

  if (!name || !fullName) return;

  const newRepoId = await importRepoByFullName(
    session.user.id,
    session.accessToken,
    name,
    fullName,
    description,
  );

  redirect(`/dashboard/${session.user.username}?repoId=${newRepoId}`);
}

export async function addRepoByLink(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session?.accessToken) {
    return { error: "Unauthorized" };
  }

  const link = formData.get("repoLink") as string;
  if (!link) return { error: "Link is required" };

  const parsed = parseGitHubLink(link);
  if (!parsed) return { error: "Invalid GitHub link" };

  const { owner, repo } = parsed;
  const fullName = `${owner}/${repo}`;

  // Fetch repo metadata from GitHub
  const repoRes = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: "no-store",
  });

  if (!repoRes.ok) {
    return { error: "Repository not found on GitHub" };
  }

  const repoData = await repoRes.json();
  const name = repoData.name;
  const description = repoData.description || "";

  const newRepoId = await importRepoByFullName(
    session.user.id,
    session.accessToken,
    name,
    fullName,
    description,
  );

  redirect(`/dashboard/${session.user.username}?repoId=${newRepoId}`);
}

export async function updateIssueStatus(issueId: string, newStatus: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.issue.update({
    where: { id: parseInt(issueId) },
    data: { status: newStatus },
  });

  return { success: true };
}

export async function refreshRepositoryIssues(repoId: string) {
  const session = await auth();

  if (!session?.user?.id || !session?.accessToken) {
    throw new Error("Unauthorized");
  }

  // 1. Get the repository name from our DB
  const repo = await prisma.repository.findFirst({
    where: {
      id: parseInt(repoId),
      userId: session.user.id,
    },
  });

  if (!repo) {
    throw new Error("Repository not found");
  }

  const repoName = repo.name;

  // We fetch the user's repos to find the full_name
  const githubReposRes = await fetch(
    "https://api.github.com/user/repos?per_page=100",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    },
  );

  if (!githubReposRes.ok) {
    throw new Error("Failed to fetch user repositories from GitHub");
  }

  const githubRepos = await githubReposRes.json();
  const targetRepo = githubRepos.find((r: any) => r.name === repoName);

  if (!targetRepo) {
    throw new Error("Repository not found on GitHub");
  }

  const fullName = targetRepo.full_name;

  // 2. Fetch the latest issues (both open and closed)
  const issuesRes = await fetch(
    `https://api.github.com/repos/${fullName}/issues?state=all&per_page=100&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    },
  );

  if (!issuesRes.ok) {
    throw new Error("Failed to fetch issues from GitHub");
  }

  const issues = await issuesRes.json();

  // 3. Batch Process Issues & Tags
  const parsedRepoId = parseInt(repoId);

  // Fetch all existing issues and tags for this repo in one go
  const [existingIssues, existingTags] = await Promise.all([
    prisma.issue.findMany({ where: { repositoryId: parsedRepoId } }),
    prisma.tag.findMany({ where: { repositoryId: parsedRepoId } }),
  ]);

  const issueMap = new Map(existingIssues.map((i) => [i.title, i]));
  const tagMap = new Map(existingTags.map((t) => [t.name, t]));

  for (const issue of issues) {
    if (issue.pull_request) continue;

    const existingIssue = issueMap.get(issue.title);
    let issueId: number;

    if (!existingIssue) {
      const newIssue = await prisma.issue.create({
        data: {
          repositoryId: parsedRepoId,
          issueNumber: issue.number,
          title: issue.title,
          description: issue.body || "",
          status: issue.state === "closed" ? "done" : "todo",
          author: `@${issue.user.login}`,
          createdAt: new Date(issue.created_at),
          updatedAt: new Date(issue.updated_at),
        },
      });
      issueId = newIssue.id;
    } else {
      issueId = existingIssue.id;

      // Sync status with GitHub
      let finalStatus = existingIssue.status;
      if (issue.state === "closed") {
        finalStatus = "done";
      } else if (issue.state === "open" && existingIssue.status === "done") {
        // Issue was reopened on GitHub
        finalStatus = "todo";
      }

      // Only update if actually changed
      if (
        existingIssue.description !== (issue.body || "") ||
        existingIssue.status !== finalStatus
      ) {
        await prisma.issue.update({
          where: { id: issueId },
          data: {
            description: issue.body || "",
            status: finalStatus,
            updatedAt: new Date(issue.updated_at),
          },
        });
      }
    }

    // Process Tags for this issue
    if (issue.labels && issue.labels.length > 0) {
      for (const label of issue.labels) {
        let tag = tagMap.get(label.name);

        if (!tag || tag.color !== `#${label.color}`) {
          tag = await prisma.tag.upsert({
            where: {
              repositoryId_name: {
                repositoryId: parsedRepoId,
                name: label.name,
              },
            },
            update: { color: `#${label.color || "8b949e"}` },
            create: {
              repositoryId: parsedRepoId,
              name: label.name,
              color: `#${label.color || "8b949e"}`,
            },
          });
          tagMap.set(label.name, tag);
        }

        // Association (IssueTag)
        await prisma.issueTag.upsert({
          where: {
            issueId_tagId: {
              issueId: issueId,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            issueId: issueId,
            tagId: tag.id,
          },
        });
      }
    }
  }

  // 4. Revalidate the dashboard page so the UI updates
  revalidatePath(`/dashboard/${session.user.username}`);

  return { success: true };
}

export async function deleteRepository(repoId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.repository.deleteMany({
    where: {
      id: parseInt(repoId),
      userId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/${session.user.username}`);
  return { success: true };
}
