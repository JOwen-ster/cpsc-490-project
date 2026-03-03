"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateIssueStatus(issueId: string, newStatus: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // TODO: move to an ORM
  await db.query(
    `UPDATE issues
     SET status = $1, updated_at = NOW()
     WHERE id = $2`,
    [newStatus, parseInt(issueId)]
  );

  return { success: true };
}

export async function refreshRepositoryIssues(repoId: string) {
  const session = await auth();

  if (!session?.user?.id || !session?.accessToken) {
    throw new Error("Unauthorized");
  }

  // 1. Get the repository name from our DB
  // TODO: move to an ORM
  const repoResult = await db.query(
    `SELECT name FROM repositories WHERE id = $1 AND user_id = $2`,
    [parseInt(repoId), session.user.id]
  );
  
  if (repoResult.rowCount === 0) {
    throw new Error("Repository not found");
  }
  
  const repoName = repoResult.rows[0].name;

  // We fetch the user's repos to find the full_name
  const githubReposRes = await fetch("https://api.github.com/user/repos?per_page=100", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: 'no-store'
  });

  if (!githubReposRes.ok) {
    throw new Error("Failed to fetch user repositories from GitHub");
  }

  const githubRepos = await githubReposRes.json();
  const targetRepo = githubRepos.find((r: any) => r.name === repoName);

  if (!targetRepo) {
    throw new Error("Repository not found on GitHub");
  }

  const fullName = targetRepo.full_name;

  // 2. Fetch the latest open issues
  const issuesRes = await fetch(`https://api.github.com/repos/${fullName}/issues?state=open&per_page=100`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: 'no-store'
  });

  if (!issuesRes.ok) {
    throw new Error("Failed to fetch issues from GitHub");
  }

  const issues = await issuesRes.json();

  // 3. Upsert issues into the database
  for (const issue of issues) {
    if (issue.pull_request) continue; // Skip pull requests

    // Check if issue exists
    // TODO: move to an ORM
    const existingIssue = await db.query(
      `SELECT id FROM issues WHERE repository_id = $1 AND title = $2`,
      [parseInt(repoId), issue.title]
    );

    let issueId;

    if (existingIssue.rowCount === 0) {
      // Insert new issue
      // TODO: move to an ORM
      const issueInsert = await db.query(
        `INSERT INTO issues (repository_id, title, description, status, author, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          parseInt(repoId),
          issue.title,
          issue.body || "",
          "todo",
          `@${issue.user.login}`,
          issue.created_at,
          issue.updated_at
        ]
      );
      issueId = issueInsert.rows[0].id;
    } else {
      issueId = existingIssue.rows[0].id;
      // Update description/author if they changed, but we keep status intact
      // TODO: move to an ORM
      await db.query(
        `UPDATE issues SET description = $1, updated_at = $2 WHERE id = $3`,
        [issue.body || "", issue.updated_at, issueId]
      );
    }

    // Upsert tags
    if (issue.labels && issue.labels.length > 0) {
      for (const label of issue.labels) {
        // TODO: move to an ORM
        const tagInsert = await db.query(
          `INSERT INTO tags (repository_id, name, color)
           VALUES ($1, $2, $3)
           ON CONFLICT (repository_id, name) DO UPDATE SET color = EXCLUDED.color
           RETURNING id`,
          [parseInt(repoId), label.name, `#${label.color || '8b949e'}`]
        );
        const tagId = tagInsert.rows[0].id;

        // TODO: move to an ORM
        await db.query(
          `INSERT INTO issue_tags (issue_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [issueId, tagId]
        );
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

  // TODO: move to an ORM
  await db.query(
    `DELETE FROM repositories WHERE id = $1 AND user_id = $2`,
    [parseInt(repoId), session.user.id]
  );

  revalidatePath(`/dashboard/${session.user.username}`);
  return { success: true };
}
