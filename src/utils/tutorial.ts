import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { t } from "../i18n";
import type { PageId } from "../types";

const STEP_PAGES: PageId[] = [
  "home",
  "home",
  "home",
  "home",
  "home",
  "home",
  "transactions",
  "transactions",
  "stats",
  "stats",
  "stats",
  "stats",
  "settings",
  "settings",
  "settings",
  "settings",
];

/**
 * Inicia la guía interactiva de bienvenida. Navega por las páginas
 * usando la función de navegación de la app para resaltar cada sección.
 * @param navigateTo Función de navegación del contexto.
 * @param openTransactionModal Abre el modal de registro de movimientos.
 * @param closeTransactionModal Cierra el modal de registro de movimientos.
 */
export function startTutorial(
  navigateTo: (page: PageId) => void,
  openTransactionModal: () => void,
  closeTransactionModal: () => void,
): void {
  const d = driver({
    animate: false,
    allowClose: false,
    showProgress: true,
    progressText: "{{current}} / {{total}}",
    overlayColor: "#0a0a0f",
    overlayOpacity: 0.75,
    popoverClass: "fina-driver-popover",
    waitForElement: 2500,
    skipMissingElement: true,
    steps: [
      {
        element: "#home-header",
        popover: {
          title: t("tutorial.step1_title"),
          description: t("tutorial.step1_body"),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".balance-hero",
        popover: {
          title: t("tutorial.step2_title"),
          description: t("tutorial.step2_body"),
          side: "bottom",
        },
      },
      {
        element: ".home-grid",
        popover: {
          title: t("tutorial.step3_title"),
          description: t("tutorial.step3_body"),
          side: "bottom",
        },
      },
      {
        element: "#goals-section",
        popover: {
          title: t("tutorial.step4_title"),
          description: t("tutorial.step4_body"),
          side: "bottom",
        },
      },
      {
        element: "#global-add-btn",
        popover: {
          title: t("tutorial.step5_title"),
          description: t("tutorial.step5_body"),
          side: "top",
        },
      },
      {
        element: "#txn-type-toggle",
        popover: {
          title: t("tutorial.step6_title"),
          description: t("tutorial.step6_body"),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".filters-scroll",
        popover: {
          title: t("tutorial.step7_title"),
          description: t("tutorial.step7_body"),
          side: "bottom",
        },
      },
      {
        element: ".cats-scroll",
        popover: {
          title: t("tutorial.step8_title"),
          description: t("tutorial.step8_body"),
          side: "bottom",
        },
      },
      {
        element: ".stats-main",
        popover: {
          title: t("tutorial.step9_title"),
          description: t("tutorial.step9_body"),
          side: "bottom",
        },
      },
      {
        element: "#stats-advisor",
        popover: {
          title: t("tutorial.step10_title"),
          description: t("tutorial.step10_body"),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#stats-export",
        popover: {
          title: t("tutorial.step11_title"),
          description: t("tutorial.step11_body"),
          side: "bottom",
          align: "start",
        },
      },
      {
        element: "#stats-compare",
        popover: {
          title: t("tutorial.step12_title"),
          description: t("tutorial.step12_body"),
          side: "bottom",
        },
      },
      {
        element: "#settings-rates",
        popover: {
          title: t("tutorial.step13_title"),
          description: t("tutorial.step13_body"),
          side: "bottom",
        },
      },
      {
        element: "#settings-language",
        popover: {
          title: t("tutorial.step14_title"),
          description: t("tutorial.step14_body"),
          side: "bottom",
        },
      },
      {
        element: "#settings-security",
        popover: {
          title: t("tutorial.step15_title"),
          description: t("tutorial.step15_body"),
          side: "top",
        },
      },
      {
        element: "#settings-actions",
        popover: {
          title: t("tutorial.step16_title"),
          description: t("tutorial.step16_body"),
          side: "top",
        },
      },
    ],
    onNextClick: (_element, _step, opts) => {
      const index = opts.driver.getActiveIndex() ?? 0;
      let delay = 0;
      if (index === 4) {
        openTransactionModal();
        delay = 450;
      }
      if (index === 5) closeTransactionModal();
      const next = STEP_PAGES[index + 1];
      if (next) {
        navigateTo(next);
        if (next !== STEP_PAGES[index] || index === 5) delay = Math.max(delay, 450);
      }
      if (delay > 0) setTimeout(() => opts.driver.moveNext(), delay);
      else opts.driver.moveNext();
    },
    onPrevClick: (_element, _step, opts) => {
      const index = opts.driver.getActiveIndex() ?? 0;
      let delay = 0;
      if (index === 5) {
        closeTransactionModal();
        delay = 350;
      } else if (index === 6) {
        openTransactionModal();
        navigateTo("home");
        delay = 450;
      }
      const prev = STEP_PAGES[index - 1];
      if (prev && delay === 0) {
        navigateTo(prev);
        if (prev !== STEP_PAGES[index]) delay = 450;
      }
      if (delay > 0) setTimeout(() => opts.driver.movePrevious(), delay);
      else opts.driver.movePrevious();
    },
  });
  navigateTo("home");
  setTimeout(() => d.drive(), 800);
}