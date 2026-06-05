import { useEffect, useRef } from "react";
import s from "./index.module.css";

interface DeletePresetModalProps {
  open: boolean;
  presetLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeletePresetModal({ open, presetLabel, onConfirm, onCancel }: DeletePresetModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby="delete-preset-title"
      onCancel={onCancel}
      onClick={(e) => { if (e.target === dialogRef.current) onCancel(); }}
    >
      <h2 id="delete-preset-title" className={s.title}>Supprimer le préréglage</h2>
      <p className={s.body}>Supprimer « {presetLabel} » ?</p>
      <div className={s.actions}>
        <button className={s.btnSecondary} onClick={onCancel}>Annuler</button>
        <button className={s.btnDanger} onClick={onConfirm}>Supprimer</button>
      </div>
    </dialog>
  );
}
