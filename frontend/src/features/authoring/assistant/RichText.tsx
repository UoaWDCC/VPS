import type { ReactNode } from "react";
import { parseRichText, type Inline } from "./markdownLite";

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i): ReactNode => {
        switch (part.kind) {
          case "bold":
            return <strong key={i}>{part.text}</strong>;
          case "italic":
            return <em key={i}>{part.text}</em>;
          case "code":
            return (
              <code
                key={i}
                className="rounded-sm bg-base-300 px-1 font-mono text-xs"
              >
                {part.text}
              </code>
            );
          default:
            return <span key={i}>{part.text}</span>;
        }
      })}
    </>
  );
}

/** The assistant's words, with the bits of markdown models write drawn properly. */
export default function RichText({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2 break-words text-sm">
      {parseRichText(text).map((block, i) => {
        switch (block.kind) {
          case "heading":
            return (
              <p key={i} className="font-semibold">
                <Inlines parts={block.inline} />
              </p>
            );
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <List
                key={i}
                className={`flex flex-col gap-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Inlines parts={item} />
                  </li>
                ))}
              </List>
            );
          }
          case "table":
            return (
              <div key={i} className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      {block.header.map((cell, j) => (
                        <th key={j}>
                          <Inlines parts={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={j}>
                        {row.map((cell, k) => (
                          <td key={k}>
                            <Inlines parts={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-sm bg-base-300 p-2 font-mono text-xs"
              >
                {block.text}
              </pre>
            );
          default:
            return (
              <p key={i} className="whitespace-pre-wrap">
                <Inlines parts={block.inline} />
              </p>
            );
        }
      })}
    </div>
  );
}
