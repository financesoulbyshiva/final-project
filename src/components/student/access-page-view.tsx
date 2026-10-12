"use client";

import * as React from "react";
import { AccessCodeForm } from "./access-code-form";
import { PublishedLessonViewer } from "./published-lesson-viewer";
import { StudentPublishedContent } from "@/types/published-content";

export function AccessPageView() {
  const [content, setContent] = React.useState<StudentPublishedContent | null>(null);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {!content ? (
        <div className="py-8">
          <AccessCodeForm
            onSuccess={(verifiedContent) => setContent(verifiedContent)}
          />
        </div>
      ) : (
        <PublishedLessonViewer
          content={content}
          onBack={() => setContent(null)}
        />
      )}
    </div>
  );
}
