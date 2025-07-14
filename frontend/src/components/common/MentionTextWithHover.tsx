"use client";

import React from "react";
import { MentionLink } from "./MentionLink";

interface MentionTextWithHoverProps {
  content: string;
}

export function MentionTextWithHover({ content }: MentionTextWithHoverProps) {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        // Every odd index is a username (captured group)
        if (index % 2 === 1) {
          return (
            <MentionLink 
              key={`mention-${part}-${index}`} 
              username={part} 
            />
          );
        }
        return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
      })}
    </>
  );
}