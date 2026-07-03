import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import s from "./index.module.css";

interface SavePresetModalProps {
  open: boolean;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export default function SavePresetModal({ open, onSave, onCancel }: SavePresetModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      dialogRef.current?.showModal();
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed) onSave(trimmed);
  };

  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby="save-preset-title"
      onCancel={onCancel}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCancel();
      }}
    >
      <h2 id="save-preset-title" className={s.title}>
        {t("modals.savePresetTitle")}
      </h2>
      <input
        ref={inputRef}
        type="text"
        className={s.input}
        aria-label={t("modals.presetNameLabel")}
        placeholder={t("modals.presetNamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <div className={s.actions}>
        <button type="button" className={s.btnSecondary} onClick={onCancel}>
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className={s.btnPrimary}
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          {t("common.save")}
        </button>
      </div>
    </dialog>
  );
}
