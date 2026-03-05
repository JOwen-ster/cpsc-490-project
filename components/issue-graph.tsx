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
  tags?: { name: string; color: string }[];
}

interface IssueGraphProps {
  issues: Issue[];
  repoName: string;
}

export default function IssueGraph({ issues, repoName }: IssueGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      const handleResize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Configure forces once the graph is ready
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force("charge").strength(-150);
      fgRef.current.d3Force("link").distance(80);
      fgRef.current.d3Force("center").strength(0.05);
    }
  }, [dimensions]);

  const graphData = useMemo(() => {
    const nodes = [
      { id: "repo", name: repoName, val: 12, color: "#f0f6fc", isRepo: true },
      ...issues.map((issue) => ({
        id: issue.id,
        name: issue.title,
        val: 6,
        color: issue.status === "done" ? "#3fb950" : issue.status === "inprogress" ? "#d29922" : "#8b949e",
        isRepo: false,
      })),
    ];

    const links = issues.map((issue) => ({
      source: "repo",
      target: issue.id,
    }));

    return { nodes, links };
  }, [issues, repoName]);

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
            ctx.arc(node.x, node.y, node.isRepo ? 4 : 2.5, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Draw label
            if (globalScale > 1.5 || node.isRepo) {
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
              
              ctx.fillStyle = "rgba(13, 17, 23, 0.8)";
              ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + (node.isRepo ? 6 : 4), bckgDimensions[0], bckgDimensions[1]);
              
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = node.isRepo ? "#f0f6fc" : "#8b949e";
              ctx.fillText(label, node.x, node.y + (node.isRepo ? 6 : 4) + bckgDimensions[1] / 2);
            }
          }}
          nodeCanvasObjectMode={() => "after"}
        />
      )}
    </div>
  );
}
