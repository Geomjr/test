"use client";

import { Fragment, type ReactNode } from "react";

/** Bold spans: **text** */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    ),
  );
}

/**
 * Renders AI output as it streams: paragraphs, "- " bullets, "1. " numbered
 * lists, "## " headings, and **bold**. Deliberately not a full markdown engine.
 */
export function StreamedText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key}
        className={`my-1.5 space-y-1 pl-5 ${list.ordered ? "list-decimal" : "list-disc"} marker:text-label-3`}
      >
        {items.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const bullet = /^[-•*]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    const heading = /^#{1,3}\s+(.*)$/.exec(trimmed);

    if (bullet) {
      if (!list || list.ordered) {
        flushList(`l${i}`);
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1] ?? "");
    } else if (numbered) {
      if (!list || !list.ordered) {
        flushList(`l${i}`);
        list = { ordered: true, items: [] };
      }
      list.items.push(numbered[1] ?? "");
    } else {
      flushList(`l${i}`);
      if (heading) {
        blocks.push(
          <p key={`h${i}`} className="mt-3 mb-1 text-[15px] font-semibold">
            {renderInline(heading[1] ?? "", `h${i}`)}
          </p>,
        );
      } else if (trimmed) {
        blocks.push(
          <p key={`p${i}`} className="my-1.5">
            {renderInline(trimmed, `p${i}`)}
          </p>,
        );
      }
    }
  });
  flushList("tail");

  return <div className="text-[16px] leading-relaxed">{blocks}</div>;
}
