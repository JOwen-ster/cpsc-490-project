import { Column, CardData } from "@/components/dashboard-board";

export function mapIssuesToKanbanColumns(issues: any[]): Column[] {
  const columns: Column[] = [
    { id: "todo", title: "To Do", color: "gray", cards: [] },
    { id: "inprogress", title: "In Progress", color: "yellow", cards: [] },
    { id: "done", title: "Done", color: "green", cards: [] },
  ];

  issues.forEach((issue) => {
    const displayNum = issue.issueNumber || issue.issue_number || issue.id;
    const card: CardData = {
      id: issue.id.toString(),
      title: `#${displayNum} ${issue.title}`,
      author: issue.author,
      time: issue.createdAt instanceof Date 
        ? issue.createdAt.toISOString() 
        : (issue.created_at instanceof Date ? issue.created_at.toISOString() : new Date(issue.createdAt || issue.created_at).toISOString()),
      tags: issue.tags,
    };

    const col = columns.find((c) => c.id === issue.status);
    if (col) {
      col.cards.push(card);
    } else {
      columns[0].cards.push(card);
    }
  });

  return columns;
}

export function mapIssuesToGroupColumns(issues: any[], groups: any[]): Column[] {
  if (groups.length === 0) return [];

  const columns: Column[] = groups.map(group => ({
    id: group.id.toString(),
    title: group.name,
    color: "primary",
    cards: []
  }));

  // Add an "Ungrouped" column if there are issues without a group
  const ungroupedIssues = issues.filter(i => !i.groupId);
  if (ungroupedIssues.length > 0) {
    columns.push({
      id: "ungrouped",
      title: "Ungrouped",
      color: "gray",
      cards: []
    });
  }

  issues.forEach((issue) => {
    const displayNum = issue.issueNumber || issue.issue_number || issue.id;
    const card: CardData = {
      id: issue.id.toString(),
      title: `#${displayNum} ${issue.title}`,
      author: issue.author,
      time: issue.createdAt instanceof Date 
        ? issue.createdAt.toISOString() 
        : (issue.created_at instanceof Date ? issue.created_at.toISOString() : new Date(issue.createdAt || issue.created_at).toISOString()),
      tags: issue.tags,
    };

    const colId = issue.groupId ? issue.groupId.toString() : "ungrouped";
    const col = columns.find((c) => c.id === colId);
    if (col) {
      col.cards.push(card);
    }
  });

  return columns;
}
