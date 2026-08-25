import type { Language } from "../i18n";

export const CONTACT_EMAIL = "miguelfernandez1x1@gmail.com";
export const LAST_UPDATED_ES = "25 de agosto de 2026";
export const LAST_UPDATED_EN = "August 25, 2026";

export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const esTerms: LegalSection[] = [
  {
    title: "1. Aceptación de los términos",
    paragraphs: [
      "Al descargar, instalar o utilizar FinaApp («la Aplicación»), usted acepta estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguno de ellos, no debe utilizar la Aplicación.",
    ],
  },
  {
    title: "2. Naturaleza del servicio",
    paragraphs: [
      "FinaApp es una herramienta personal de registro y organización de finanzas. Funciona completamente sin conexión: toda la información que usted registra (movimientos, presupuestos, metas, deudas) se almacena únicamente en el almacenamiento local de su dispositivo.",
      "La Aplicación NO presta asesoría financiera, fiscal, contable ni de inversión. Las cifras, gráficos y resúmenes son cálculos informativos basados exclusivamente en los datos que usted ingresa y no constituyen una recomendación profesional.",
      "Las tasas de cambio mostradas se obtienen de servicios públicos de terceros (yadio.io, dolarapi.com y Binance) y pueden no reflejar el valor real o oficial de una moneda en un momento determinado. Usted acepta que las tasas se utilizan únicamente como referencia aproximada.",
    ],
  },
  {
    title: "3. Uso permitido",
    paragraphs: [
      "Usted se compromete a utilizar la Aplicación de forma lícita y personal. Queda prohibido: (a) usarla para actividades ilegales, incluida la ocultación u origen ilícito de fondos; (b) reproducir, modificar, descompilar o realizar ingeniería inversa del código fuente, excepto lo permitido por la ley aplicable.",
    ],
  },
  {
    title: "4. Su responsabilidad sobre los datos",
    paragraphs: [
      "Usted es el único responsable de la exactitud de los datos que registra y de mantener copias de seguridad. La Aplicación ofrece funciones de exportación e importación para respaldar su información; le recomendamos usarlas periódicamente.",
      "Si activa un PIN o desbloqueo biométrico, usted es responsable de custodiar esas credenciales. Si pierde su PIN y sus datos biométricos, no existe ningún método de recuperación remota, dado que no hay servidores.",
    ],
  },
  {
    title: "5. Propiedad intelectual",
    paragraphs: [
      "FinaApp, su nombre, logotipo, diseño y código fuente son propiedad de Miguel Fernández. Se le otorga una licencia limitada, no exclusiva, revocable y no transferible para usar la Aplicación en dispositivos de su propiedad.",
    ],
  },
  {
    title: "6. Limitación de responsabilidad",
    paragraphs: [
      "En la máxima medida permitida por la ley, la Aplicación se proporciona «tal cual» y «según disponibilidad», sin garantías expresas o implícitas. El titular no será responsable por pérdidas económicas, lucro cesante, pérdida de datos ni daños indirectos derivados del uso o la imposibilidad de uso de la Aplicación.",
      "El titular tampoco responde por decisiones financieras que usted tome a partir de la información mostrada por la Aplicación.",
    ],
  },
  {
    title: "7. Disponibilidad y cambios",
    paragraphs: [
      "Podemos actualizar, suspender o modificar cualquier función de la Aplicación, así como estos términos, en cualquier momento. Los cambios sustanciales serán notificados mediante actualización de la Aplicación o dentro de ella. El uso continuado tras la publicación de cambios implica la aceptación de los nuevos términos.",
    ],
  },
  {
    title: "8. Ley aplicable y jurisdicción",
    paragraphs: [
      "Estos términos se rigen por las leyes de la República Bolivariana de Venezuela y, cuando resulte aplicable, por las normativas internacionales vigentes en materia de protección al consumidor digital. Cualquier controversia se someterá a los tribunales competentes del municipio Mariño, estado Nueva Esparta, Venezuela, salvo que la legislación de consumo de su país de residencia le reconozca derechos irrenunciables adicionales.",
    ],
  },
  {
    title: "9. Contacto",
    paragraphs: [
      `Para consultas sobre estos términos, escriba a: ${CONTACT_EMAIL}.`,
    ],
  },
];

const enTerms: LegalSection[] = [
  {
    title: "1. Acceptance of the terms",
    paragraphs: [
      "By downloading, installing or using FinaApp (the \"Application\"), you agree to these Terms and Conditions in full. If you do not agree with any part of them, you must not use the Application.",
    ],
  },
  {
    title: "2. Nature of the service",
    paragraphs: [
      "FinaApp is a personal finance tracking and organization tool. It works fully offline: all information you enter (transactions, budgets, goals, debts) is stored only in your device's local storage.",
      "The Application does NOT provide financial, tax, accounting or investment advice. Figures, charts and summaries are informational calculations based solely on the data you enter and do not constitute professional recommendations.",
      "Exchange rates shown are obtained from public third-party services (yadio.io, dolarapi.com and Binance) and may not reflect the real or official value of a currency at any given time. You accept that rates are used only as an approximate reference.",
    ],
  },
  {
    title: "3. Permitted use",
    paragraphs: [
      "You agree to use the Application lawfully and for personal purposes only. The following is prohibited: (a) using it for illegal activities, including concealing funds from illicit sources; (b) reproducing, modifying, decompiling or reverse-engineering the source code, except where permitted by applicable law.",
    ],
  },
  {
    title: "4. Your responsibility for your data",
    paragraphs: [
      "You are solely responsible for the accuracy of the data you record and for keeping backups. The Application offers export and import features to back up your information; we recommend using them regularly.",
      "If you enable a PIN or biometric unlock, you are responsible for safeguarding those credentials. If you lose your PIN and your biometrics are unavailable, there is no remote recovery method, since there are no servers.",
    ],
  },
  {
    title: "5. Intellectual property",
    paragraphs: [
      "FinaApp, its name, logo, design and source code are owned by Miguel Fernández. A limited, non-exclusive, revocable, non-transferable license is granted to use the Application on devices you own.",
    ],
  },
  {
    title: "6. Limitation of liability",
    paragraphs: [
      "To the maximum extent permitted by law, the Application is provided \"as is\" and \"as available\", without express or implied warranties. The owner shall not be liable for financial losses, lost profits, data loss or indirect damages arising from the use of or inability to use the Application.",
      "The owner is also not liable for any financial decisions you make based on the information displayed by the Application.",
    ],
  },
  {
    title: "7. Availability and changes",
    paragraphs: [
      "We may update, suspend or modify any feature of the Application, as well as these terms, at any time. Material changes will be notified through an Application update or within it. Continued use after publication constitutes acceptance of the new terms.",
    ],
  },
  {
    title: "8. Governing law and jurisdiction",
    paragraphs: [
      "These terms are governed by the laws of the Bolivarian Republic of Venezuela and, where applicable, by current international regulations on digital consumer protection. Any dispute shall be submitted to the competent courts of the municipality of Mariño, Nueva Esparta state, Venezuela, unless the consumer protection legislation of your country of residence grants you additional non-waivable rights.",
    ],
  },
  {
    title: "9. Contact",
    paragraphs: [
      `For questions about these terms, please write to: ${CONTACT_EMAIL}.`,
    ],
  },
];

const esPrivacy: LegalSection[] = [
  {
    title: "1. Introducción",
    paragraphs: [
      "Esta Política de Privacidad describe cómo FinaApp trata la información de sus usuarios. Hemos diseñado la Aplicación bajo un principio de privacidad desde el diseño: no operamos servidores, no creamos cuentas y no recopilamos información personal en línea.",
      "Cumplimos con los principios generales de protección de datos reconocidos internacionalmente (incluidos los lineamientos del RGPD europeo y normas equivalentes), adaptados al hecho de que todo el procesamiento ocurre localmente en su dispositivo.",
    ],
  },
  {
    title: "2. Datos que tratamos y dónde se guardan",
    paragraphs: [
      "Toda la información que ingresa se guarda exclusivamente en el almacenamiento local (localStorage) de su dispositivo:",
    ],
    bullets: [
      "Movimientos: montos, categorías, descripciones y fechas que usted registra.",
      "Presupuestos, metas y deudas definidas por usted.",
      "Preferencias: idioma, moneda, configuración de tasas.",
      "Credenciales locales: hash del PIN (almacenado localmente, nunca transmitido) y configuración de bloqueo biométrico.",
    ],
  },
  {
    title: "3. Datos que NO recopilamos",
    paragraphs: [
      "No recopilamos, transmitimos ni vendemos: nombre, correo electrónico, teléfono, ubicación, identificadores publicitarios, contactos ni el contenido financiero registrado. No utilizamos analíticas de terceros, publicidad ni rastreadores.",
    ],
  },
  {
    title: "4. Servicios de terceros",
    paragraphs: [
      "Para mostrar tasas de cambio, la Aplicación consulta servicios públicos: yadio.io, dolarapi.com y Binance. Estas solicitudes solo incluyen la consulta de la divisa solicitada; no envían ningún dato personal ni contenido financiero. Cada proveedor puede registrar su dirección IP conforme a sus propias políticas.",
      "La Aplicación utiliza Google Fonts para cargar tipografías; esta solicitud puede revelar su dirección IP a Google. Si desea evitarlo, utilice la versión offline de la Aplicación después del primer inicio.",
    ],
  },
  {
    title: "5. Permisos del sistema",
    paragraphs: ["La Aplicación solicita los siguientes permisos, siempre con su consentimiento:"],
    bullets: [
      "Biometría: se usa únicamente para validar su identidad al desbloquear la Aplicación. Los datos biométricos nunca salen del entorno seguro de su dispositivo y no son accesibles por la Aplicación.",
      "Notificaciones locales: se usan únicamente para recordatorios de pagos de deudas que usted configure. No recibirá publicidad.",
      "Almacenamiento/compartir: se usa únicamente cuando usted exporta o importa su respaldo de datos.",
    ],
  },
  {
    title: "6. Seguridad",
    paragraphs: [
      "Los datos permanecen en su dispositivo. Puede protegerlos mediante PIN (guardado como hash local) y/o bloqueo biométrico. Ningún sistema es infalible; le recomendamos además proteger su dispositivo con las medidas de seguridad de su sistema operativo y realizar respaldos periódicos.",
    ],
  },
  {
    title: "7. Sus derechos",
    paragraphs: [
      "Dado que todos los datos están bajo su control directo, usted puede ejercer en cualquier momento sus derechos de acceso, rectificación, portabilidad y supresión:",
    ],
    bullets: [
      "Acceso y portabilidad: exporte todos sus datos desde Ajustes → Exportar.",
      "Supresión: elimine movimientos individuales o borre todos los datos desde Ajustes → Borrar datos, o desinstale la Aplicación.",
      "Rectificación: edite cualquier movimiento directamente en la Aplicación.",
      "Retiro del consentimiento: desactive permisos (biometría, notificaciones) desde Ajustes o desde la configuración de su sistema.",
    ],
  },
  {
    title: "8. Menores de edad",
    paragraphs: [
      "La Aplicación no está dirigida a menores de 13 años (o la edad mínima legal aplicable en su jurisdicción). No recopilamos conscientemente datos de menores.",
    ],
  },
  {
    title: "9. Cambios en esta política",
    paragraphs: [
      "Publicaremos cualquier cambio en esta política dentro de la Aplicación y actualizaremos la fecha de «última actualización». El uso continuado tras la publicación implica la aceptación de los cambios.",
    ],
  },
  {
    title: "10. Contacto",
    paragraphs: [
      `Responsable del tratamiento: Miguel Fernández. Para consultas de privacidad escriba a: ${CONTACT_EMAIL}.`,
    ],
  },
];

const enPrivacy: LegalSection[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "This Privacy Policy describes how FinaApp handles user information. The Application was designed under a privacy-by-design principle: we operate no servers, create no accounts and collect no personal information online.",
      "We follow internationally recognized data protection principles (including EU GDPR guidelines and equivalent standards), adapted to the fact that all processing happens locally on your device.",
    ],
  },
  {
    title: "2. Data we process and where it is stored",
    paragraphs: [
      "All information you enter is stored exclusively in your device's local storage (localStorage):",
    ],
    bullets: [
      "Transactions: amounts, categories, descriptions and dates you record.",
      "Budgets, goals and debts defined by you.",
      "Preferences: language, currency, rate settings.",
      "Local credentials: PIN hash (stored locally, never transmitted) and biometric lock settings.",
    ],
  },
  {
    title: "3. Data we do NOT collect",
    paragraphs: [
      "We do not collect, transmit or sell: name, email address, phone number, location, advertising identifiers, contacts or the financial content you record. We use no third-party analytics, ads or trackers.",
    ],
  },
  {
    title: "4. Third-party services",
    paragraphs: [
      "To display exchange rates, the Application queries public services: yadio.io, dolarapi.com and Binance. These requests include only the currency query; no personal data or financial content is sent. Each provider may log your IP address according to its own policies.",
      "The Application uses Google Fonts to load typefaces; this request may reveal your IP address to Google. To avoid it, use the Application's offline version after first launch.",
    ],
  },
  {
    title: "5. System permissions",
    paragraphs: ["The Application requests the following permissions, always with your consent:"],
    bullets: [
      "Biometrics: used only to verify your identity when unlocking the Application. Biometric data never leaves your device's secure environment and is not accessible to the Application.",
      "Local notifications: used only for debt payment reminders that you configure. You will not receive advertising.",
      "Storage/sharing: used only when you export or import your data backup.",
    ],
  },
  {
    title: "6. Security",
    paragraphs: [
      "Your data stays on your device. You can protect it with a PIN (stored as a local hash) and/or biometric lock. No system is infallible; we also recommend protecting your device with your operating system's security measures and performing regular backups.",
    ],
  },
  {
    title: "7. Your rights",
    paragraphs: [
      "Since all data is under your direct control, you can exercise your rights of access, rectification, portability and erasure at any time:",
    ],
    bullets: [
      "Access and portability: export all your data from Settings → Export.",
      "Erasure: delete individual transactions or clear all data from Settings → Clear data, or uninstall the Application.",
      "Rectification: edit any transaction directly in the Application.",
      "Withdrawal of consent: disable permissions (biometrics, notifications) from Settings or from your system configuration.",
    ],
  },
  {
    title: "8. Minors",
    paragraphs: [
      "The Application is not directed to children under 13 (or the minimum legal age applicable in your jurisdiction). We do not knowingly collect data from minors.",
    ],
  },
  {
    title: "9. Changes to this policy",
    paragraphs: [
      "Any changes to this policy will be posted within the Application and the \"last updated\" date will be revised. Continued use after posting constitutes acceptance of the changes.",
    ],
  },
  {
    title: "10. Contact",
    paragraphs: [
      `Data controller: Miguel Fernández. For privacy inquiries write to: ${CONTACT_EMAIL}.`,
    ],
  },
];

export function getLegalTexts(
  language: Language,
  doc: "terms" | "privacy",
): { sections: LegalSection[]; lastUpdated: string } {
  if (doc === "terms") {
    return {
      sections: language === "en" ? enTerms : esTerms,
      lastUpdated: language === "en" ? LAST_UPDATED_EN : LAST_UPDATED_ES,
    };
  }
  return {
    sections: language === "en" ? enPrivacy : esPrivacy,
    lastUpdated: language === "en" ? LAST_UPDATED_EN : LAST_UPDATED_ES,
  };
}
