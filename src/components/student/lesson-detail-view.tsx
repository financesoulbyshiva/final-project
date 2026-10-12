"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { PublishedLessonViewer } from "./published-lesson-viewer";
import { AccessCodeForm } from "./access-code-form";
import { StudentPublishedContent } from "@/types/published-content";
import { verifyStudentAccessCode } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface LessonDetailViewProps {
  contentId: string;
}

export function LessonDetailView({ contentId }: LessonDetailViewProps) {
  const searchParams = useSearchParams();
  const codeParam = searchParams?.get("code") || "";

  const [loading, setLoading] = React.useState(Boolean(codeParam));
  const [content, setContent] = React.useState<StudentPublishedContent | null>(null);

  React.useEffect(() => {
    if (codeParam) {
      let active = true;
      (async () => {
        try {
          const res = await verifyStudentAccessCode(codeParam);
          if (active && res.success && res.item) {
            if (!contentId || res.item.contentId === contentId) {
              setContent(res.item);
            }
          }
        } catch (err) {
          console.error("Failed to load lesson with code:", err);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }
  }, [codeParam, contentId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Verifying access code and loading lesson…</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 sm:px-6">
      {content ? (
        <PublishedLessonViewer content={content} />
      ) : (
        <div className="py-8">
          <AccessCodeForm
            onSuccess={(verifiedContent) => setContent(verifiedContent)}
          />
        </div>
      )}
    </div>
  );
}
