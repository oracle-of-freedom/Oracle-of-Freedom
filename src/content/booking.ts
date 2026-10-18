import type { Locale } from "@/i18n/routing";

export type BookingCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  dek: string;
  chooseType: string;
  chooseTime: string;
  localTime: string;
  yourDetails: string;
  duration: string;
  loading: string;
  unavailable: string;
  name: string;
  email: string;
  note: string;
  notePlaceholder: string;
  consent: string;
  submit: string;
  sending: string;
  back: string;
  successTitle: string;
  successBody: string;
  successBodySaved: string;
  download: string;
  again: string;
  error: string;
  rate: string;
  acceptEyebrow: string;
  acceptTitle: string;
  acceptBody: string;
  acceptButton: string;
  accepting: string;
  acceptedTitle: string;
  acceptedBody: string;
  joinMeeting: string;
  acceptClosed: string;
  acceptMissing: string;
};

export const bookingCopy: Record<Locale, BookingCopy> = {
  en: {
    metaTitle: "Book a call · Oracle of Freedom",
    metaDescription: "Choose a time to meet photographer and filmmaker Agota Urbikaite.",
    eyebrow: "A moment to meet",
    title: "Book time with Agota",
    dek: "Choose what you need and pick a free time. Times follow your time zone.",
    chooseType: "1. Choose a meeting",
    chooseTime: "2. Choose a time",
    localTime: "Shown in {zone}.",
    yourDetails: "3. Your details",
    duration: "minutes",
    loading: "Looking for free times…",
    unavailable: "There are no free times in the next few weeks. Write to me and we’ll find one.",
    name: "Your name",
    email: "Email",
    note: "Anything Agota should know?",
    notePlaceholder: "A little about your idea…",
    consent: "I agree that my details can be used to arrange this meeting.",
    submit: "Request this time",
    sending: "Booking…",
    back: "Choose another time",
    successTitle: "Request received",
    successBody: "That time is held for you. Agota will send a link so you can accept it.",
    successBodySaved: "That time is held for you. Agota will send a link so you can accept it. The notice email did not go out.",
    acceptEyebrow: "Your appointment",
    acceptTitle: "Accept this time",
    acceptBody: "This time is held for you. Accept it to confirm the appointment.",
    acceptButton: "Accept this appointment",
    accepting: "Accepting…",
    acceptedTitle: "You’re confirmed",
    acceptedBody: "This appointment is confirmed. You can add it to your calendar.",
    joinMeeting: "Join the call",
    acceptClosed: "This appointment is no longer available.",
    acceptMissing: "This link does not match an appointment.",
    download: "Add to my calendar",
    again: "Book another time",
    error: "That time could not be booked. Please choose another one.",
    rate: "Too many attempts. Please wait a few minutes and try again.",
  },
  es: {
    metaTitle: "Reserva una llamada · Oracle of Freedom",
    metaDescription: "Elige una hora para conocer a la fotógrafa y videógrafa Agota Urbikaite.",
    eyebrow: "Un momento para conocernos",
    title: "Reserva tiempo con Agota",
    dek: "Elige lo que necesitas y una hora libre. Los horarios siguen tu zona horaria.",
    chooseType: "1. Elige una cita",
    chooseTime: "2. Elige una hora",
    localTime: "Se muestran en {zone}.",
    yourDetails: "3. Tus datos",
    duration: "minutos",
    loading: "Buscando horas libres…",
    unavailable: "No hay horas libres en las próximas semanas. Escríbeme y encontraremos una.",
    name: "Tu nombre",
    email: "Email",
    note: "¿Hay algo que Agota deba saber?",
    notePlaceholder: "Cuéntame un poco sobre tu idea…",
    consent: "Acepto que mis datos se usen para organizar esta cita.",
    submit: "Pedir esta hora",
    sending: "Reservando…",
    back: "Elegir otra hora",
    successTitle: "Solicitud recibida",
    successBody: "Esa hora queda reservada para ti. Agota te enviará un enlace para aceptarla.",
    successBodySaved: "Esa hora queda reservada para ti. Agota te enviará un enlace para aceptarla. El aviso por email no salió.",
    acceptEyebrow: "Tu cita",
    acceptTitle: "Acepta esta hora",
    acceptBody: "Esta hora está reservada para ti. Acéptala para confirmar la cita.",
    acceptButton: "Aceptar esta cita",
    accepting: "Aceptando…",
    acceptedTitle: "Cita confirmada",
    acceptedBody: "Esta cita está confirmada. Puedes añadirla a tu calendario.",
    joinMeeting: "Unirse a la llamada",
    acceptClosed: "Esta cita ya no está disponible.",
    acceptMissing: "Este enlace no corresponde a ninguna cita.",
    download: "Añadir a mi calendario",
    again: "Reservar otra hora",
    error: "No se pudo reservar esa hora. Elige otra.",
    rate: "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  },
  pt: {
    metaTitle: "Marca uma chamada · Oracle of Freedom",
    metaDescription: "Escolhe uma hora para conhecer a fotógrafa e videógrafa Agota Urbikaite.",
    eyebrow: "Um momento para nos conhecermos",
    title: "Marca tempo com a Agota",
    dek: "Escolhe o que precisas e uma hora livre. Os horários seguem o teu fuso horário.",
    chooseType: "1. Escolhe uma marcação",
    chooseTime: "2. Escolhe uma hora",
    localTime: "Mostrados em {zone}.",
    yourDetails: "3. Os teus dados",
    duration: "minutos",
    loading: "A procurar horas livres…",
    unavailable: "Não há horas livres nas próximas semanas. Escreve-me e encontramos uma.",
    name: "O teu nome",
    email: "Email",
    note: "Há algo que a Agota deva saber?",
    notePlaceholder: "Conta-me um pouco sobre a tua ideia…",
    consent: "Aceito que os meus dados sejam usados para organizar esta marcação.",
    submit: "Pedir esta hora",
    sending: "A marcar…",
    back: "Escolher outra hora",
    successTitle: "Pedido recebido",
    successBody: "Essa hora fica reservada para ti. A Agota envia um link para a aceitares.",
    successBodySaved: "Essa hora fica reservada para ti. A Agota envia um link para a aceitares. O aviso por email não saiu.",
    acceptEyebrow: "A tua marcação",
    acceptTitle: "Aceita esta hora",
    acceptBody: "Esta hora está reservada para ti. Aceita-a para confirmar a marcação.",
    acceptButton: "Aceitar esta marcação",
    accepting: "A aceitar…",
    acceptedTitle: "Marcação confirmada",
    acceptedBody: "Esta marcação está confirmada. Podes adicioná-la ao teu calendário.",
    joinMeeting: "Entrar na chamada",
    acceptClosed: "Esta marcação já não está disponível.",
    acceptMissing: "Este link não corresponde a nenhuma marcação.",
    download: "Adicionar ao meu calendário",
    again: "Marcar outra hora",
    error: "Não foi possível marcar essa hora. Escolhe outra.",
    rate: "Demasiadas tentativas. Espera alguns minutos e tenta novamente.",
  },
};
