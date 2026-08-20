import { useRef, useState } from "react";
import { useApp } from "../AppContext";
import { t, useI18n } from "../i18n";
import {
  ADVISOR_QUESTIONS,
  getAnswer,
  type AdvisorQuestionId,
} from "../utils/analysis";
import ModalSheet from "./ModalSheet";

interface FinanceAdvisorProps {
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "advisor";
  text: string;
}

export default function FinanceAdvisor({ onClose }: FinanceAdvisorProps) {
  const {
    transactions,
    currentMonth,
    currentYear,
    currency,
    budgets,
  } = useApp();
  useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  };

  const ask = (questionId: AdvisorQuestionId) => {
    const question = ADVISOR_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return;
    if (isTyping) return;

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    const answer = getAnswer(
      questionId,
      transactions,
      currentMonth,
      currentYear,
      currency,
      budgets,
    );

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: "user",
        text: t(`advisor.q_${questionId}`),
      },
    ]);
    setIsTyping(true);
    scrollToBottom();

    typingTimerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: "advisor",
          text: answer,
        },
      ]);
      setIsTyping(false);
      scrollToBottom();
    }, 900);
  };

  const reset = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setMessages([]);
    setIsTyping(false);
  };

  return (
    <ModalSheet onClose={onClose} className="advisor-sheet">
        <div className="advisor-header">
          <div className="advisor-avatar">
            <i className="fa-solid fa-robot" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {t("advisor.title")}
            </h2>
            <p className="card-subtitle" style={{ fontSize: 12 }}>
              {t("advisor.subtitle")}
            </p>
          </div>
          <button
            className="advisor-reset"
            onClick={reset}
            title={t("advisor.clear")}
          >
            <i className="fa-solid fa-rotate-left" />
          </button>
        </div>

        <div className="advisor-messages" ref={messagesRef}>
          {messages.length === 0 && !isTyping ? (
            <div className="advisor-empty">
              <i className="fa-solid fa-comments" />
              <p style={{ fontSize: 13, color: "var(--fg-muted)" }}>
                {t("advisor.start")}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`advisor-msg ${msg.role === "user" ? "user" : "advisor"}`}
              >
                <div className="advisor-bubble">
                  {msg.role === "advisor" &&
                    msg.text.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  {msg.role === "user" && <p>{msg.text}</p>}
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="advisor-msg advisor">
              <div className="advisor-bubble typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        <div className="advisor-questions">
          {ADVISOR_QUESTIONS.map((q) => (
            <button
              key={q.id}
              className="advisor-chip"
              onClick={() => ask(q.id)}
              disabled={isTyping}
            >
              <i className={`fa-solid ${q.icon}`} />
              {t(`advisor.q_${q.id}`)}
            </button>
          ))}
        </div>

        <button className="btn-ghost" onClick={onClose}>
          {t("advisor.close")}
        </button>
    </ModalSheet>
  );
}
