import { BookOpen } from "lucide-react";
import type { Question } from "@/lib/ase-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function VerseDialog({
  question,
  onOpenChange,
}: {
  question: Question | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!question;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 text-left text-base font-semibold leading-snug">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{question?.text}</span>
          </DialogTitle>
          {question?.verseRef && (
            <DialogDescription className="pt-1 text-left text-sm font-semibold text-primary">
              {question.verseRef}
            </DialogDescription>
          )}
        </DialogHeader>
        {question?.verseText && (
          <blockquote className="rounded-lg border-l-4 border-primary bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
            {question.verseText}
          </blockquote>
        )}
      </DialogContent>
    </Dialog>
  );
}
