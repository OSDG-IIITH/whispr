"use client";

import React from "react";

interface MentionTextProps {
  content: string;
}

export function MentionText({ content }: MentionTextProps) {
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
                window.location.href = `/profile/${part}`;
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