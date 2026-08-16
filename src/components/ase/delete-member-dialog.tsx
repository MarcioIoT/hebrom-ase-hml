import { useState } from "react";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteMemberDialogProps {
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteMemberDialog({
  memberName,
  open,
  onOpenChange,
  onConfirm,
}: DeleteMemberDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover membro?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{memberName}</strong> da
            avaliação? Essa ação não pode ser desfeita e todas as notas e
            observações desse membro serão perdidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface UseDeleteMemberDialogResult {
  dialog: ReactNode;
  confirm: (name: string, onConfirm: () => void) => void;
}

export function useDeleteMemberDialog(): UseDeleteMemberDialogResult {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<() => void>(() => {});

  const confirm = (memberName: string, action: () => void) => {
    setName(memberName);
    setOnConfirmAction(() => action);
    setOpen(true);
  };

  const dialog = (
    <DeleteMemberDialog
      memberName={name}
      open={open}
      onOpenChange={setOpen}
      onConfirm={() => {
        setOpen(false);
        onConfirmAction();
      }}
    />
  );

  return { dialog, confirm };
}
