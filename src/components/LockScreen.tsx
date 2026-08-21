import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { NativeBiometric } from "@capgo/capacitor-native-biometric";
import { useApp } from "../AppContext";
import { t, useI18n } from "../i18n";
import { hashPin } from "../utils/pin";
import fLogo from "../assets/f-logo.svg";

export default function LockScreen() {
  const { pinHash, useBiometrics, unlock, showToast } = useApp();
  useI18n();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const bioAttemptedRef = useRef(false);

  const attemptBio = async (retryMs?: number) => {
    if (!bioAvailable) return;
    try {
      await NativeBiometric.verifyIdentity({
        title: t("settings.app_name"),
        subtitle: t("lock.subtitle"),
        description: t("lock.subtitle"),
        maxAttempts: 5,
      });
      unlock();
      showToast(t("lock.unlocked"), "fa-lock-open");
    } catch (err) {
      const message = String(err);
      if (message.includes("cancel") || message.includes("fallback")) {
        // El usuario canceló: queda en la pantalla para ingresar el PIN.
      } else if (retryMs && retryMs > 0) {
        bioAttemptedRef.current = false;
        setTimeout(() => {
          if (!bioAttemptedRef.current) {
            bioAttemptedRef.current = true;
            attemptBio(0);
          }
        }, retryMs);
      } else {
        setError(true);
      }
    }
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !useBiometrics) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await NativeBiometric.isAvailable({
          useFallback: false,
        });
        if (!cancelled && result.isAvailable) setBioAvailable(true);
      } catch {
        if (!cancelled) setBioAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [useBiometrics]);

  useEffect(() => {
    if (!bioAvailable || bioAttemptedRef.current) return;
    bioAttemptedRef.current = true;
    const timer = setTimeout(() => attemptBio(1000), 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bioAvailable]);

  const handlePinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    setError(false);
    if (digits.length === 4 && pinHash) {
      if (hashPin(digits) === pinHash) {
        unlock();
        showToast(t("lock.unlocked"), "fa-lock-open");
      } else {
        setError(true);
        setPin("");
      }
    }
  };

  return (
    <div className="lock-screen">
      <img
        src={fLogo}
        alt=""
        className="lock-logo"
        draggable={false}
      />
      <h1 className="lock-title">{t("settings.app_name")}</h1>
      <p className="lock-subtitle">{t("lock.subtitle")}</p>

      <div className={`pin-dots ${error ? "shake" : ""}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`pin-dot ${pin.length > i ? "filled" : ""}`} />
        ))}
      </div>

      <input
        type="password"
        inputMode="numeric"
        autoFocus
        maxLength={4}
        className="pin-input"
        value={pin}
        onChange={(e) => handlePinChange(e.target.value)}
        aria-label={t("lock.enter_pin")}
      />

      {error && <p className="pin-error">{t("lock.error")}</p>}

      {bioAvailable && (
        <button className="btn-bio" onClick={() => attemptBio()}>
          <i className="fa-solid fa-fingerprint" />
          {t("lock.biometric")}
        </button>
      )}
    </div>
  );
}