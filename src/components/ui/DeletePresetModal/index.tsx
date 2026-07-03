import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import s from "./index.module.css";

interface DeletePresetModalProps {
  open: boolean;
  presetLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeletePresetModal({
  open,
  presetLabel,
  onConfirm,
  onCancel,
}: DeletePresetModalProps) {
  const { t } = useTranslation();
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
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
    >
      <h2 id="delete-preset-title" className={s.title}>
        {t("modals.deletePresetTitle")}
      </h2>
      <p className={s.body}>{t("modals.deleteConfirm", { label: presetLabel })}</p>
      <div className={s.actions}>
        <button className={s.btnSecondary} onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button className={s.btnDanger} onClick={onConfirm}>
          {t("common.delete")}
        </button>
      </div>
    </dialog>
  );
}
