// Approved concierge copy in the five v1 languages (FR-02). Marketing owns
// these strings; the legal advisor signs off the disclosure and handoff lines.

import type { Language } from "../types";

type Key =
  | "greeting"
  | "consent"
  | "unsure"
  | "ask_purpose"
  | "ask_budget"
  | "ask_timeline"
  | "ask_ownership"
  | "ask_financing"
  | "ask_name"
  | "ask_email"
  | "offer_call"
  | "booked"
  | "handoff_human"
  | "handoff_hot"
  | "handoff_negotiation"
  | "handoff_legal"
  | "handoff_complaint"
  | "opted_out"
  | "brief_ready"
  | "assets"
  | "en_note"
  | "service_down"
  | "advisor_active"
  | "thanks";

export const copy: Record<Language, Record<Key, string>> = {
  en: {
    greeting: "Hi! I'm NGH's AI assistant. I can answer questions about Uluwatu Paradise in English, Bahasa Indonesia, Nederlands, Русский or Español — and you can ask for a person at any time.",
    consent: "To help you, I'll store the details you share so an NGH advisor can follow up. You can ask us to delete them at any time.",
    unsure: "Good question — I don't want to guess, so I'll check with the team and an advisor will get back to you.",
    ask_purpose: "Are you looking to live there, rent it out, or hold it as an investment?",
    ask_budget: "What budget range are you considering?",
    ask_timeline: "When are you hoping to buy — within 3 months, 6 months, or later?",
    ask_ownership: "Do you have a preference for ownership structure — leasehold, or a company (PT PMA)?",
    ask_financing: "Would you be paying in cash, or using financing?",
    ask_name: "May I have your name?",
    ask_email: "What's the best email to send your personal brief to?",
    offer_call: "You'd be a great fit for a short call with {advisor}. Here are some times in your time zone ({tz}):",
    booked: "Booked: a call with {advisor} on {when} ({tz}). You'll get reminders 24 hours and 1 hour before.",
    handoff_human: "Of course — I've asked an advisor to join this chat. They'll reply here shortly.",
    handoff_hot: "I've also let {advisor} know you're interested, so they can help you personally.",
    handoff_negotiation: "Pricing terms are handled by our sales team, so I've passed your question to {advisor}, who will reply here.",
    handoff_legal: "I've passed this to NGH's legal and corporate advisor via {advisor}. This is general information, not legal advice.",
    handoff_complaint: "I'm sorry about this. I've flagged it to the team and an advisor will contact you personally.",
    opted_out: "Understood — you won't receive any more automated messages from us. If you write again, a person will reply.",
    brief_ready: "I've prepared your personal investment brief with matching units and indicative scenarios (indicative, not a guarantee):",
    assets: "Here you go:",
    en_note: "(Our approved answer is in English:)",
    service_down: "Thanks for your message! Our assistant is briefly unavailable, so I've alerted an advisor who will reply here soon.",
    advisor_active: "An advisor is handling this conversation and will reply here.",
    thanks: "Thank you — that helps.",
  },
  nl: {
    greeting: "Hallo! Ik ben de AI-assistent van NGH. Ik beantwoord vragen over Uluwatu Paradise in het Nederlands, Engels, Indonesisch, Russisch of Spaans — en u kunt altijd om een medewerker vragen.",
    consent: "Om u te helpen bewaar ik de gegevens die u deelt, zodat een NGH-adviseur contact kan opnemen. U kunt altijd vragen om ze te verwijderen.",
    unsure: "Goede vraag — ik wil niet gokken, dus ik check het bij het team en een adviseur komt bij u terug.",
    ask_purpose: "Wilt u er zelf wonen, het verhuren of aanhouden als belegging?",
    ask_budget: "Aan welk budget denkt u?",
    ask_timeline: "Wanneer wilt u kopen — binnen 3 maanden, 6 maanden of later?",
    ask_ownership: "Heeft u een voorkeur voor eigendomsstructuur — leasehold of via een bedrijf (PT PMA)?",
    ask_financing: "Betaalt u contant of met financiering?",
    ask_name: "Mag ik uw naam?",
    ask_email: "Naar welk e-mailadres mag ik uw persoonlijke brief sturen?",
    offer_call: "Een kort gesprek met {advisor} zou goed passen. Hier zijn enkele tijden in uw tijdzone ({tz}):",
    booked: "Geboekt: gesprek met {advisor} op {when} ({tz}). U ontvangt 24 uur en 1 uur vooraf een herinnering.",
    handoff_human: "Natuurlijk — ik heb een adviseur gevraagd deel te nemen aan dit gesprek. Die reageert hier zo snel mogelijk.",
    handoff_hot: "Ik heb {advisor} ook laten weten dat u interesse heeft, zodat u persoonlijk geholpen wordt.",
    handoff_negotiation: "Prijsafspraken lopen via ons salesteam, dus ik heb uw vraag doorgegeven aan {advisor}, die hier reageert.",
    handoff_legal: "Ik heb dit via {advisor} doorgezet naar de juridisch adviseur van NGH. Dit is algemene informatie, geen juridisch advies.",
    handoff_complaint: "Het spijt me. Ik heb dit doorgegeven aan het team en een adviseur neemt persoonlijk contact met u op.",
    opted_out: "Begrepen — u ontvangt geen automatische berichten meer. Schrijft u opnieuw, dan reageert een medewerker.",
    brief_ready: "Ik heb uw persoonlijke investeringsbrief gemaakt met passende units en indicatieve scenario's (indicatief, geen garantie):",
    assets: "Alstublieft:",
    en_note: "(Ons goedgekeurde antwoord is in het Engels:)",
    service_down: "Bedankt voor uw bericht! Onze assistent is even niet beschikbaar; ik heb een adviseur gewaarschuwd die hier snel reageert.",
    advisor_active: "Een adviseur behandelt dit gesprek en reageert hier.",
    thanks: "Dank u, dat helpt.",
  },
  id: {
    greeting: "Halo! Saya asisten AI NGH. Saya bisa menjawab pertanyaan tentang Uluwatu Paradise dalam Bahasa Indonesia, Inggris, Belanda, Rusia, atau Spanyol — dan Anda bisa minta bicara dengan staf kapan saja.",
    consent: "Untuk membantu Anda, saya akan menyimpan data yang Anda bagikan agar advisor NGH bisa menindaklanjuti. Anda bisa meminta penghapusan kapan saja.",
    unsure: "Pertanyaan bagus — saya tidak mau menebak, jadi saya akan cek ke tim dan advisor akan menghubungi Anda.",
    ask_purpose: "Apakah Anda ingin menempati, menyewakan, atau menyimpannya sebagai investasi?",
    ask_budget: "Berapa kisaran budget yang Anda pertimbangkan?",
    ask_timeline: "Kapan Anda berencana membeli — dalam 3 bulan, 6 bulan, atau lebih lama?",
    ask_ownership: "Apakah Anda punya preferensi struktur kepemilikan — leasehold atau melalui perusahaan (PT PMA)?",
    ask_financing: "Apakah pembayaran tunai atau dengan pembiayaan?",
    ask_name: "Boleh saya tahu nama Anda?",
    ask_email: "Ke email mana saya kirimkan brief pribadi Anda?",
    offer_call: "Panggilan singkat dengan {advisor} akan sangat membantu. Berikut beberapa waktu di zona waktu Anda ({tz}):",
    booked: "Terjadwal: panggilan dengan {advisor} pada {when} ({tz}). Anda akan menerima pengingat 24 jam dan 1 jam sebelumnya.",
    handoff_human: "Tentu — saya sudah meminta advisor bergabung di chat ini. Mereka akan segera membalas di sini.",
    handoff_hot: "Saya juga sudah memberi tahu {advisor} agar bisa membantu Anda secara pribadi.",
    handoff_negotiation: "Ketentuan harga ditangani tim sales, jadi pertanyaan Anda sudah saya teruskan ke {advisor}.",
    handoff_legal: "Saya sudah meneruskan ini ke penasihat hukum NGH melalui {advisor}. Ini informasi umum, bukan nasihat hukum.",
    handoff_complaint: "Mohon maaf atas hal ini. Sudah saya laporkan ke tim dan advisor akan menghubungi Anda langsung.",
    opted_out: "Baik — Anda tidak akan menerima pesan otomatis lagi dari kami. Jika Anda menulis lagi, staf kami yang akan membalas.",
    brief_ready: "Saya sudah menyiapkan brief investasi pribadi Anda dengan unit yang cocok dan skenario indikatif (indikatif, bukan jaminan):",
    assets: "Silakan:",
    en_note: "(Jawaban resmi kami dalam bahasa Inggris:)",
    service_down: "Terima kasih atas pesan Anda! Asisten kami sedang tidak tersedia, jadi saya sudah memberi tahu advisor yang akan segera membalas.",
    advisor_active: "Advisor sedang menangani percakapan ini dan akan membalas di sini.",
    thanks: "Terima kasih, informasinya sangat membantu.",
  },
  ru: {
    greeting: "Здравствуйте! Я ИИ-ассистент NGH. Отвечаю на вопросы об Uluwatu Paradise на русском, английском, индонезийском, нидерландском и испанском — и вы в любой момент можете попросить живого консультанта.",
    consent: "Чтобы помочь вам, я сохраню данные, которыми вы поделитесь, чтобы консультант NGH мог связаться с вами. Вы можете в любой момент попросить их удалить.",
    unsure: "Хороший вопрос — не хочу гадать, поэтому уточню у команды, и консультант вам ответит.",
    ask_purpose: "Вы планируете жить там, сдавать в аренду или держать как инвестицию?",
    ask_budget: "Какой бюджет вы рассматриваете?",
    ask_timeline: "Когда планируете покупку — в ближайшие 3 месяца, 6 месяцев или позже?",
    ask_ownership: "Есть ли предпочтения по форме владения — лизхолд или через компанию (PT PMA)?",
    ask_financing: "Оплата наличными или с финансированием?",
    ask_name: "Как к вам обращаться?",
    ask_email: "На какой email отправить вашу персональную подборку?",
    offer_call: "Вам подойдёт короткий звонок с консультантом {advisor}. Вот несколько вариантов по вашему времени ({tz}):",
    booked: "Забронировано: звонок с {advisor} — {when} ({tz}). Напоминания придут за 24 часа и за 1 час.",
    handoff_human: "Конечно — я пригласила консультанта в этот чат. Он скоро ответит здесь.",
    handoff_hot: "Я также сообщила {advisor} о вашем интересе, чтобы вам помогли лично.",
    handoff_negotiation: "Условия цены обсуждает отдел продаж, поэтому я передала ваш вопрос консультанту {advisor}.",
    handoff_legal: "Я передала вопрос юристу NGH через {advisor}. Это общая информация, а не юридическая консультация.",
    handoff_complaint: "Приношу извинения. Я передала это команде, и консультант свяжется с вами лично.",
    opted_out: "Понятно — автоматических сообщений больше не будет. Если напишете снова, ответит сотрудник.",
    brief_ready: "Я подготовила вашу персональную инвестиционную подборку с подходящими юнитами и ориентировочными сценариями (ориентировочно, не гарантия):",
    assets: "Пожалуйста:",
    en_note: "(Наш утверждённый ответ на английском:)",
    service_down: "Спасибо за сообщение! Ассистент временно недоступен, я уведомила консультанта — он скоро ответит здесь.",
    advisor_active: "С вами работает консультант, он ответит здесь.",
    thanks: "Спасибо, это помогает.",
  },
  es: {
    greeting: "¡Hola! Soy el asistente de IA de NGH. Respondo preguntas sobre Uluwatu Paradise en español, inglés, indonesio, neerlandés o ruso — y puede pedir hablar con una persona cuando quiera.",
    consent: "Para ayudarle, guardaré los datos que comparta para que un asesor de NGH pueda darle seguimiento. Puede pedir que los borremos en cualquier momento.",
    unsure: "Buena pregunta — no quiero adivinar, así que lo consultaré con el equipo y un asesor le responderá.",
    ask_purpose: "¿Busca vivir allí, alquilarlo o mantenerlo como inversión?",
    ask_budget: "¿Qué rango de presupuesto está considerando?",
    ask_timeline: "¿Cuándo piensa comprar — en 3 meses, 6 meses o más adelante?",
    ask_ownership: "¿Tiene preferencia de estructura de propiedad — leasehold o mediante una empresa (PT PMA)?",
    ask_financing: "¿Pagaría al contado o con financiación?",
    ask_name: "¿Me dice su nombre?",
    ask_email: "¿A qué email le envío su brief personalizado?",
    offer_call: "Una llamada corta con {advisor} le vendría muy bien. Estos son algunos horarios en su zona horaria ({tz}):",
    booked: "Reservado: llamada con {advisor} el {when} ({tz}). Recibirá recordatorios 24 h y 1 h antes.",
    handoff_human: "Por supuesto — he pedido a un asesor que se una al chat. Le responderá aquí en breve.",
    handoff_hot: "También he avisado a {advisor} de su interés para que le atienda personalmente.",
    handoff_negotiation: "Las condiciones de precio las gestiona el equipo comercial, así que he pasado su pregunta a {advisor}.",
    handoff_legal: "He trasladado esto al asesor legal de NGH a través de {advisor}. Es información general, no asesoramiento legal.",
    handoff_complaint: "Lamento lo ocurrido. Lo he comunicado al equipo y un asesor le contactará personalmente.",
    opted_out: "Entendido — no recibirá más mensajes automáticos. Si vuelve a escribir, le responderá una persona.",
    brief_ready: "He preparado su brief de inversión personalizado con unidades adecuadas y escenarios indicativos (indicativos, no garantizados):",
    assets: "Aquí tiene:",
    en_note: "(Nuestra respuesta aprobada está en inglés:)",
    service_down: "¡Gracias por su mensaje! Nuestro asistente no está disponible un momento; he avisado a un asesor que le responderá aquí.",
    advisor_active: "Un asesor está atendiendo esta conversación y le responderá aquí.",
    thanks: "Gracias, eso me ayuda.",
  },
};

export function t(lang: Language, key: Key, vars: Record<string, string> = {}) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), copy[lang][key]);
}
