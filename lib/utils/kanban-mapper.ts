import { Column, CardData } from "@/components/dashboard-board";

export function mapIssuesToKanbanColumns(issues: any[], dbColumns: any[] = []): Column[] {
  let columns: Column[];
  
  if (dbColumns.length > 0) {
    columns = dbColumns.map(col => ({
      id: col.name, // We use name as the status/id for now to match issue.status
      dbId: col.id,
      title: col.name,
      color: col.color as any,
      cards: []
    }));
  } else {
    columns = [
      { id: "To Do", title: "To Do", color: "gray", cards: [] },
      { id: "In Progress", title: "In Progress", color: "yellow", cards: [] },
      { id: "Done", title: "Done", color: "green", cards: [] },
    ];
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
      status: issue.status,
      url: issue.url,
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
      status: issue.status,
      url: issue.url,
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
