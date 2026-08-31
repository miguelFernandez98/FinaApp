import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { t } from "../i18n";
import type { PageId } from "../types";

type StepDef = {
  page: PageId;
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  };
};

const STEP_DEFS: StepDef[] = [
  {
    page: "home",
    element: "#home-header",
    popover: {
      title: t("tutorial.step1_title"),
      description: t("tutorial.step1_body"),
      side: "bottom",
      align: "start",
    },
  },
  {
    page: "home",
    element: ".balance-hero",
    popover: {
      title: t("tutorial.step2_title"),
      description: t("tutorial.step2_body"),
      side: "bottom",
    },
  },
  {
    page: "home",
    element: ".home-grid",
    popover: {
      title: t("tutorial.step3_title"),
      description: t("tutorial.step3_body"),
      side: "bottom",
    },
  },
  {
    page: "home",
    element: "#debts-section",
    popover: {
      title: t("tutorial.step4_title"),
      description: t("tutorial.step4_body"),
      side: "bottom",
    },
  },
  {
    page: "home",
    element: "#goals-section",
    popover: {
      title: t("tutorial.step5_title"),
      description: t("tutorial.step5_body"),
      side: "bottom",
    },
  },
  {
    page: "home",
    element: "#recent-section",
    popover: {
      title: t("tutorial.step6_title"),
      description: t("tutorial.step6_body"),
      side: "top",
    },
  },
  {
    page: "home",
    element: "#global-add-btn",
    popover: {
      title: t("tutorial.step7_title"),
      description: t("tutorial.step7_body"),
      side: "top",
    },
  },
  {
    page: "home",
    element: "#txn-type-toggle",
    popover: {
      title: t("tutorial.step8_title"),
      description: t("tutorial.step8_body"),
      side: "bottom",
      align: "start",
    },
  },
  {
    page: "transactions",
    element: "#txn-search-btn",
    popover: {
      title: t("tutorial.step9_title"),
      description: t("tutorial.step9_body"),
      side: "bottom",
    },
  },
  {
    page: "transactions",
    element: ".filters-scroll",
    popover: {
      title: t("tutorial.step10_title"),
      description: t("tutorial.step10_body"),
      side: "bottom",
    },
  },
  {
    page: "transactions",
    element: ".cats-scroll",
    popover: {
      title: t("tutorial.step11_title"),
      description: t("tutorial.step11_body"),
      side: "bottom",
    },
  },
  {
    page: "stats",
    element: "#stats-advisor",
    popover: {
      title: t("tutorial.step12_title"),
      description: t("tutorial.step12_body"),
      side: "bottom",
      align: "start",
    },
  },
  {
    page: "stats",
    element: "#stats-export",
    popover: {
      title: t("tutorial.step13_title"),
      description: t("tutorial.step13_body"),
      side: "bottom",
      align: "start",
    },
  },
  {
    page: "stats",
    element: "#stats-compare",
    popover: {
      title: t("tutorial.step14_title"),
      description: t("tutorial.step14_body"),
      side: "bottom",
    },
  },
  {
    page: "stats",
    element: "#stats-trend",
    popover: {
      title: t("tutorial.step15_title"),
      description: t("tutorial.step15_body"),
      side: "top",
    },
  },
  {
    page: "stats",
    element: "#stats-budgets",
    popover: {
      title: t("tutorial.step16_title"),
      description: t("tutorial.step16_body"),
      side: "top",
    },
  },
  {
    page: "stats",
    element: "#stats-topcats",
    popover: {
      title: t("tutorial.step17_title"),
      description: t("tutorial.step17_body"),
      side: "top",
    },
  },
  {
    page: "settings",
    element: "#settings-language",
    popover: {
      title: t("tutorial.step18_title"),
      description: t("tutorial.step18_body"),
      side: "bottom",
    },
  },
  {
    page: "settings",
    element: "#settings-rates",
    popover: {
      title: t("tutorial.step19_title"),
      description: t("tutorial.step19_body"),
      side: "bottom",
    },
  },
  {
    page: "settings",
    element: "#settings-security",
    popover: {
      title: t("tutorial.step20_title"),
      description: t("tutorial.step20_body"),
      side: "top",
    },
  },
  {
    page: "settings",
    element: "#settings-actions",
    popover: {
      title: t("tutorial.step21_title"),
      description: t("tutorial.step21_body"),
      side: "top",
    },
  },
];

/**
 * Inicia la guía interactiva de bienvenida. Navega por las páginas
 * usando la función de navegación de la app para resaltar cada sección.
 * Los pasos cuyo elemento no existe en el DOM (ej. deudas sin registrar)
 * se omiten automáticamente para no atascar el avance.
 * @param navigateTo Función de navegación del contexto.
 * @param openTransactionModal Abre el modal de registro de movimientos.
 * @param closeTransactionModal Cierra el modal de registro de movimientos.
 */
export function startTutorial(
  navigateTo: (page: PageId) => void,
  openTransactionModal: () => void,
  closeTransactionModal: () => void,
): void {
  navigateTo("home");
  setTimeout(() => {
    const visibleDefs = STEP_DEFS.filter((step) => {
      if (step.element !== "#debts-section") return true;
      return document.getElementById("debts-section") !== null;
    });
    const stepPages: PageId[] = visibleDefs.map((step) => step.page);
    const addBtnIndex = visibleDefs.findIndex(
      (step) => step.element === "#global-add-btn",
    );
    const toggleIndex = visibleDefs.findIndex(
      (step) => step.element === "#txn-type-toggle",
    );

    const d = driver({
      animate: false,
      allowClose: true,
      showProgress: true,
      progressText: "{{current}} / {{total}}",
      nextBtnText: t("tutorial.next"),
      prevBtnText: t("tutorial.previous"),
      doneBtnText: t("tutorial.done"),
      showButtons: ["next", "previous", "close"],
      onPopoverRender: (popover) => {
        const closeBtn = popover.footerButtons.querySelector(".driver-popover-close-btn");
        if (closeBtn) closeBtn.textContent = t("tutorial.skip");
      },
      overlayColor: "#0a0a0f",
      overlayOpacity: 0.75,
      popoverClass: "fina-driver-popover",
      waitForElement: 2500,
      steps: visibleDefs.map((step) => ({ element: step.element, popover: step.popover })),
      onNextClick: (_element, _step, opts) => {
        const index = opts.driver.getActiveIndex() ?? 0;
        let delay = 0;
        if (index === addBtnIndex) {
          openTransactionModal();
          delay = 450;
        }
        if (index === toggleIndex) closeTransactionModal();
        const next = stepPages[index + 1];
        if (next) {
          navigateTo(next);
          if (next !== stepPages[index] || index === addBtnIndex) {
            delay = Math.max(delay, 450);
          }
        }
        const advance = () => {
          opts.driver.moveNext();
          const nextIdx = opts.driver.getActiveIndex();
          if (nextIdx !== undefined) {
            const nextStep = visibleDefs[nextIdx];
            if (nextStep) {
              const el = document.querySelector(nextStep.element);
              if (el) {
                const navH = document.querySelector(".bottom-nav")?.getBoundingClientRect().height ?? 64;
                const sysBar = window.innerHeight - document.documentElement.clientHeight;
                const bottomReserved = navH + sysBar + 20;
                el.scrollIntoView({ behavior: "auto", block: "center" });
                requestAnimationFrame(() => {
                  const rect = el.getBoundingClientRect();
                  if (rect.bottom > window.innerHeight - bottomReserved) {
                    window.scrollBy(0, rect.bottom - window.innerHeight + bottomReserved);
                  }
                });
              }
            }
          }
        };
        if (delay > 0) setTimeout(advance, delay);
        else advance();
      },
      onPrevClick: (_element, _step, opts) => {
        const index = opts.driver.getActiveIndex() ?? 0;
        let delay = 0;
        if (index === toggleIndex) {
          closeTransactionModal();
          delay = 350;
        } else if (index === toggleIndex + 1) {
          openTransactionModal();
          navigateTo("home");
          delay = 450;
        }
        const prev = stepPages[index - 1];
        if (prev && delay === 0) {
          navigateTo(prev);
          if (prev !== stepPages[index]) delay = 450;
        }
        const advance = () => {
          opts.driver.movePrevious();
          const prevIdx = opts.driver.getActiveIndex();
          if (prevIdx !== undefined) {
            const prevStep = visibleDefs[prevIdx];
            if (prevStep) {
              const el = document.querySelector(prevStep.element);
              if (el) {
                const navH = document.querySelector(".bottom-nav")?.getBoundingClientRect().height ?? 64;
                const sysBar = window.innerHeight - document.documentElement.clientHeight;
                const bottomReserved = navH + sysBar + 20;
                el.scrollIntoView({ behavior: "auto", block: "center" });
                requestAnimationFrame(() => {
                  const rect = el.getBoundingClientRect();
                  if (rect.bottom > window.innerHeight - bottomReserved) {
                    window.scrollBy(0, rect.bottom - window.innerHeight + bottomReserved);
                  }
                });
              }
            }
          }
        };
        if (delay > 0) setTimeout(advance, delay);
        else advance();
      },
    });
    d.drive();
  }, 800);
}