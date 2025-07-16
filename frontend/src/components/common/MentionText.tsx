"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface MentionTextProps {
  content: string;
}

export function MentionText({ content }: MentionTextProps) {
  const router = useRouter();
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        // Every odd index is a username (captured group)
        if (index % 2 === 1) {
          return (
            <span
              key={index}
              className="text-primary font-medium hover:underline cursor-pointer"
              onClick={() => {
                router.push(`/profile/${part}`);
              }}
            >
              @{part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}