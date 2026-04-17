"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface Issue {
  id: string;
  title: string;
  status: string;
  groupId?: number | null;
  tags?: { name: string; color: string }[];
}

interface IssueGraphProps {
  issues: Issue[];
  repoName: string;
  viewMode?: "status" | "groups";
  groups?: { id: number; name: string }[];
  kanbanColumns?: { name: string; color: string }[];
}

const COLOR_MAP: Record<string, string> = {
  green: "#3fb950",
  yellow: "#d29922",
  gray: "#8b949e",
  blue: "#1f6feb",
  red: "#f85149",
  purple: "#8957e5",
  primary: "#1f6feb",
};

export default function IssueGraph({ 
  issues, 
  repoName, 
  viewMode = "status", 
  groups = [],
  kanbanColumns = [] 
}: IssueGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getIssueColor = (issue: Issue) => {
    // If we have dynamic columns, try to find a match by name
    if (kanbanColumns.length > 0) {
      const col = kanbanColumns.find(c => c.name.toLowerCase() === issue.status.toLowerCase());
      if (col && COLOR_MAP[col.color]) {
        return COLOR_MAP[col.color];
      }
    }

    // Fallback to hardcoded defaults
    const status = issue.status.toLowerCase();
    if (status === "done") return COLOR_MAP.green;
    if (status === "in progress" || status === "inprogress") return COLOR_MAP.yellow;
    return COLOR_MAP.gray;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  // Configure forces once the graph is ready
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge").strength(-150);
      fgRef.current.d3Force("link").distance(60);
      fgRef.current.d3Force("center").strength(0.05);
    }
  }, [dimensions, viewMode]);

  const graphData = useMemo(() => {
    const nodes: any[] = [
      { id: "repo", name: repoName, val: 12, color: "#f0f6fc", isRepo: true, isGroup: false },
    ];
    const links: any[] = [];

    if (viewMode === "groups") {
      // Create group nodes
      groups.forEach(group => {
        nodes.push({
          id: `group-${group.id}`,
          name: group.name,
          val: 8,
          color: "#bc8cff", // Purple for groups
          isRepo: false,
          isGroup: true,
        });
        links.push({
          source: "repo",
          target: `group-${group.id}`,
        });
      });

      // Create issue nodes and link to groups
      issues.forEach(issue => {
        nodes.push({
          id: issue.id,
          name: issue.title,
          val: 4,
          color: getIssueColor(issue),
          isRepo: false,
          isGroup: false,
        });

        if (issue.groupId) {
          links.push({
            source: `group-${issue.groupId}`,
            target: issue.id,
          });
        } else {
          // If no group, link directly to repo
          links.push({
            source: "repo",
            target: issue.id,
          });
        }
      });
    } else {
      // Status view: Repo -> Columns -> Issues
      // Create column nodes
      kanbanColumns.forEach(col => {
        nodes.push({
          id: `col-${col.name}`,
          name: col.name,
          val: 8,
          color: COLOR_MAP[col.color] || COLOR_MAP.gray,
          isRepo: false,
          isGroup: true, // Use same styling as groups
        });
        links.push({
          source: "repo",
          target: `col-${col.name}`,
        });
      });

      // Create issue nodes and link to columns
      issues.forEach(issue => {
        nodes.push({
          id: issue.id,
          name: issue.title,
          val: 4,
          color: getIssueColor(issue),
          isRepo: false,
          isGroup: false,
        });

        const colNodeId = `col-${issue.status}`;
        if (nodes.some(n => n.id === colNodeId)) {
          links.push({
            source: colNodeId,
            target: issue.id,
          });
        } else {
          links.push({
            source: "repo",
            target: issue.id,
          });
        }
      });
    }

    return { nodes, links };
  }, [issues, repoName, viewMode, groups, kanbanColumns]);

  return (
    <div ref={containerRef} className="w-full h-full flex-1">
      {dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="#0d1117"
          nodeLabel="name"
          nodeRelSize={1}
          linkColor={() => "#30363d"}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.isRepo ? 4 : (node.isGroup ? 3.5 : 2.5), 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Draw label
            if (globalScale > 1.5 || node.isRepo || node.isGroup) {
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
              
              ctx.fillStyle = "rgba(13, 17, 23, 0.8)";
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (node.isRepo ? 6 : (node.isGroup ? 5 : 4)), bckgDimensions[0], bckgDimensions[1]);
              
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = (node.isRepo || node.isGroup) ? "#f0f6fc" : "#8b949e";
              ctx.fillText(label, node.x, node.y + (node.isRepo ? 6 : (node.isGroup ? 5 : 4)) + bckgDimensions[1] / 2);
            }
          }}
          nodeCanvasObjectMode={() => "after"}
        />
      )}
    </div>
  );
}
