import { useState } from "react";
import { useAppData, useAppActions } from "../AppContext";
import { t, useI18n } from "../i18n";
import { hashPin } from "../utils/pin";
import ModalSheet from "./ModalSheet";

interface PinModalProps {
  onClose: () => void;
}

export default function PinModal({ onClose }: PinModalProps) {
  const { pinHash } = useAppData();
  const { setPinHash, showToast } = useAppActions();
  useI18n();
  const needsCurrent = pinHash !== null;
  const [current, setCurrent] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSave = () => {
    if (needsCurrent && hashPin(current) !== pinHash) {
      showToast(t("lock.wrong_current"), "fa-circle-exclamation", "var(--danger)");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      showToast(t("lock.invalid"), "fa-circle-exclamation", "var(--danger)");
      return;
    }
    if (pin !== confirm) {
      showToast(t("lock.mismatch"), "fa-circle-exclamation", "var(--danger)");
      return;
    }
    setPinHash(hashPin(pin));
    showToast(t("lock.set_success"));
    onClose();
  };

  return (
    <ModalSheet onClose={onClose}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
          {t("lock.set_title")}
        </h2>
        <p className="field-label" style={{ marginBottom: 16 }}>
          {t("lock.set_subtitle")}
        </p>

        {needsCurrent && (
          <div style={{ marginBottom: 12 }}>
            <label className="field-label">{t("lock.current_pin")}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input-field"
              value={current}
              onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label className="field-label">{t("lock.enter_pin")}</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input-field"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">{t("lock.confirm_pin")}</label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input-field"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
          />
        </div>

        <button className="btn-primary" onClick={handleSave}>
          {t("goals.save")}
        </button>
        <button className="btn-ghost" onClick={onClose}>
          {t("goals.cancel")}
        </button>
    </ModalSheet>
  );
}