import { useBeforeUnload, useBlocker } from "react-router-dom";
import { useCallback } from "react";
import { ConfirmDialog } from "@/components/shared";
export function UnsavedChanges({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(dirty);
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty],
    ),
  );
  return (
    <ConfirmDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => {
        if (!open && blocker.state === "blocked") blocker.reset();
      }}
      title="Leave without saving?"
      description="Your unsaved form changes will be lost. Images that were already uploaded remain saved."
      confirmLabel="Discard changes"
      destructive
      onConfirm={() => {
        if (blocker.state === "blocked") blocker.proceed();
      }}
    />
  );
}
