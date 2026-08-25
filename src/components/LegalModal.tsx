import { t, useI18n } from "../i18n";
import { getLegalTexts } from "../legal/legalTexts";
import ModalSheet from "./ModalSheet";

interface LegalModalProps {
  doc: "terms" | "privacy";
  onClose: () => void;
}

export default function LegalModal({ doc, onClose }: LegalModalProps) {
  const { language } = useI18n();
  const { sections, lastUpdated } = getLegalTexts(language, doc);

  return (
    <ModalSheet onClose={onClose} className="legal-sheet">
      <h2 className="modal-title">
        {doc === "terms" ? t("legal.terms_title") : t("legal.privacy_title")}
      </h2>
      <p className="legal-updated">{t("legal.last_updated", { date: lastUpdated })}</p>
      <div className="legal-content">
        {sections.map((section) => (
          <section key={section.title}>
            <h3>{section.title}</h3>
            {section.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {section.bullets && (
              <ul>
                {section.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </ModalSheet>
  );
}
