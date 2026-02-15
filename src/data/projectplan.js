// GerustThuis Projectplan Data
// 4 Mijlpalen met epics en tickets

export const initialData = {
  project: {
    name: "GerustThuis",
    description: "Privacy-first monitoring systeem voor ouderen",
    totalBudget: 0,
    currency: "EUR"
  },
  phases: [
    {
      id: 1,
      name: "Test the Market",
      description: "Valideer marktvraag: website live, eerste campagne, eerste aanmeldingen",
      goal: "Valideer of er marktvraag is voor GerustThuis",
      targetDate: "2025-09-01",
      measurement: "50+ wachtlijst aanmeldingen, 5+ concrete gesprekken",
      status: "actief",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "1-1", description: "Website live met wachtlijst", completed: false },
        { id: "1-2", description: "Tracking en cookie consent werken", completed: false },
        { id: "1-3", description: "Instagram profiel + 5 posts live", completed: false },
        { id: "1-4", description: "Minimaal 2 video's klaar met ondertiteling", completed: false },
        { id: "1-5", description: "Eerste ad campagne draait 7+ dagen", completed: false },
        { id: "1-6", description: "Eerste wachtlijst aanmeldingen binnen", completed: false }
      ],
      noGoAction: "Boodschap resoneert niet, propositie aanpassen"
    },
    {
      id: 2,
      name: "Test the Product",
      description: "Valideer product: pilot draaien, monitoring testen, feedback verzamelen",
      goal: "Bewijs dat het product werkt bij echte gebruikers",
      targetDate: "2025-12-01",
      measurement: "3+ huishoudens actief, 90%+ uptime, positieve feedback",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "2-1", description: "Pilot huishouden draait met sensoren", completed: false },
        { id: "2-2", description: "Patroonherkenning gevalideerd met echte data", completed: false },
        { id: "2-3", description: "Feedback sessie met pilot gebruiker gedaan", completed: false }
      ],
      noGoAction: "Product nog niet klaar, meer itereren op monitoring"
    },
    {
      id: 3,
      name: "Scale Market",
      description: "Groei: campagnes optimaliseren, nurture, content schalen",
      goal: "Schaal marketing naar grotere doelgroep",
      targetDate: "2026-03-01",
      measurement: "500+ wachtlijst, CAC < \u20AC25, 10%+ conversie",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "3-1", description: "Nurture email sequence actief", completed: false },
        { id: "3-2", description: "Retargeting audience actief", completed: false },
        { id: "3-3", description: "Cost per lead onder target", completed: false }
      ],
      noGoAction: "Unit economics kloppen niet, kanaal heroverwegen"
    },
    {
      id: 4,
      name: "Scale Product",
      description: "Opschalen: meerdere huishoudens, installer flow, app store",
      goal: "Schaal product naar betalende klanten",
      targetDate: "2026-06-01",
      measurement: "25+ betalende huishoudens, <5% churn, NPS 50+",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "4-1", description: "Tweede huishouden succesvol live", completed: false },
        { id: "4-2", description: "iOS app in TestFlight of App Store", completed: false },
        { id: "4-3", description: "Pricing model bepaald", completed: false }
      ],
      noGoAction: "Nog niet schaalbaar, eerst processen optimaliseren"
    }
  ],
  tickets: [
    // ===== FASE 1: TEST THE MARKET =====

    // Epic: Foundation
    { id: 101, ticketNumber: "TM-01", title: "GerustThuis als handelsnaam toevoegen aan BoostiX bij KVK", phaseId: 1, epic: "Foundation", status: "in-progress", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 102, ticketNumber: "TM-02", title: "BTW-nummer bevestigen (loopt via BoostiX)", phaseId: 1, epic: "Foundation", status: "in-progress", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 103, ticketNumber: "TM-03", title: "Domeinnaam gerustthuis.care registreren", phaseId: 1, epic: "Foundation", status: "done", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 104, ticketNumber: "TM-04", title: "Privacyverklaring opstellen en publiceren", phaseId: 1, epic: "Foundation", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 105, ticketNumber: "TM-05", title: "Cookieverklaring opstellen", phaseId: 1, epic: "Foundation", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 106, ticketNumber: "TM-06", title: "Verwerkersovereenkomst Supabase (DPA) ondertekenen", phaseId: 1, epic: "Foundation", status: "in-progress", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 107, ticketNumber: "TM-07", title: "Email opzetten: info@gerustthuis.care + email service kiezen en koppelen", phaseId: 1, epic: "Foundation", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 109, ticketNumber: "TM-08", title: "Brandbook v3 definitief maken (Deep Sage & Amber)", phaseId: 1, epic: "Foundation", status: "done", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Website
    { id: 110, ticketNumber: "TM-10", title: "Branding doorvoeren op website + portaal (sage palet, DM Serif + DM Sans, logo)", phaseId: 1, epic: "Website", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 111, ticketNumber: "TM-11", title: "Landingspagina herschrijven met StoryBrand structuur", phaseId: 1, epic: "Website", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 112, ticketNumber: "TM-12", title: "Wachtlijst-formulier bouwen en testen (Supabase + Edge Function)", phaseId: 1, epic: "Website", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 113, ticketNumber: "TM-13", title: "Double opt-in flow bouwen (AVG-verplicht)", phaseId: 1, epic: "Website", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 114, ticketNumber: "TM-14", title: "Bevestigingspagina na aanmelding", phaseId: 1, epic: "Website", status: "done", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 115, ticketNumber: "TM-15", title: "Responsive mobiel + tablet", phaseId: 1, epic: "Website", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 116, ticketNumber: "TM-16", title: "Testen op echte devices", phaseId: 1, epic: "Website", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 117, ticketNumber: "TM-17", title: "KVK-nummer en handelsnaam in footer", phaseId: 1, epic: "Website", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 118, ticketNumber: "TM-18", title: "Laadtijd onder 3 seconden", phaseId: 1, epic: "Website", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 119, ticketNumber: "TM-19", title: "Welkomstmail automatisering instellen (Zoho SMTP via Edge Function)", phaseId: 1, epic: "Website", status: "in-progress", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: SEO & Tracking
    { id: 120, ticketNumber: "TM-20", title: "Cookiebot installeren en configureren", phaseId: 1, epic: "SEO & Tracking", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 121, ticketNumber: "TM-21", title: "Meta Pixel installeren (na cookie consent)", phaseId: 1, epic: "SEO & Tracking", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 122, ticketNumber: "TM-22", title: "Google Analytics 4 of Plausible installeren", phaseId: 1, epic: "SEO & Tracking", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 123, ticketNumber: "TM-23", title: "Conversie-event: wachtlijst aanmelding", phaseId: 1, epic: "SEO & Tracking", status: "in-progress", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 124, ticketNumber: "TM-24", title: "Meta title en description op alle pagina's", phaseId: 1, epic: "SEO & Tracking", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 125, ticketNumber: "TM-25", title: "Open Graph tags instellen (social sharing)", phaseId: 1, epic: "SEO & Tracking", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 126, ticketNumber: "TM-26", title: "Favicon en app-icoon instellen", phaseId: 1, epic: "SEO & Tracking", status: "done", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 127, ticketNumber: "TM-27", title: "Sitemap.xml + Google Search Console", phaseId: 1, epic: "SEO & Tracking", status: "in-progress", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 128, ticketNumber: "TM-28", title: "Schema.org structured data", phaseId: 1, epic: "SEO & Tracking", status: "done", priority: "nice", dependsOn: [], blockedBy: [] },
    { id: 129, ticketNumber: "TM-29", title: "WhatsApp preview testen", phaseId: 1, epic: "SEO & Tracking", status: "in-progress", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Social Media
    { id: 130, ticketNumber: "TM-30", title: "Instagram Business account aanmaken", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 131, ticketNumber: "TM-31", title: "Facebook Business Page aanmaken", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 132, ticketNumber: "TM-32", title: "Meta Business Suite opzetten", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 133, ticketNumber: "TM-33", title: "Instagram profiel inrichten (bio, link, logo)", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 134, ticketNumber: "TM-34", title: "Instagram Lead Form activeren", phaseId: 1, epic: "Social Media", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 135, ticketNumber: "TM-35", title: "Post 1: Introductie - wie zijn we", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 136, ticketNumber: "TM-36", title: "Post 2: Het probleem - mantelzorgmoment", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 137, ticketNumber: "TM-37", title: "Post 3: Hoe het werkt", phaseId: 1, epic: "Social Media", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 138, ticketNumber: "TM-38", title: "Post 4: Privacy - geen camera's", phaseId: 1, epic: "Social Media", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 139, ticketNumber: "TM-39", title: "Post 5: Wachtlijst CTA", phaseId: 1, epic: "Social Media", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Video
    { id: 140, ticketNumber: "TM-40", title: "HeyGen of Synthesia account aanmaken", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 141, ticketNumber: "TM-41", title: "Avatar kiezen (vrouw 45-55, warme uitstraling, NL stem)", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 142, ticketNumber: "TM-42", title: "Testvideo maken om kwaliteit te beoordelen", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 143, ticketNumber: "TM-43", title: "Video 1: De Vraag (28s) - emotionele hook", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 144, ticketNumber: "TM-44", title: "Video 2: Geen Camera's (22s) - privacy", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 145, ticketNumber: "TM-45", title: "Video 3: Geen Bericht = Goed Bericht (25s)", phaseId: 1, epic: "Video", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 146, ticketNumber: "TM-46", title: "Ondertiteling toevoegen aan alle video's", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 147, ticketNumber: "TM-47", title: "Eindkaart + thumbnails maken", phaseId: 1, epic: "Video", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 148, ticketNumber: "TM-48", title: "Video's testen op mobiel (9:16)", phaseId: 1, epic: "Video", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },

    // Epic: Eerste Campagne
    { id: 149, ticketNumber: "TM-49", title: "Meta Ads Manager account activeren", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 150, ticketNumber: "TM-50", title: "Betaalmethode toevoegen", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 151, ticketNumber: "TM-51", title: "Ad Set 1: interesse targeting (vrouwen 40-65, mantelzorg)", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 152, ticketNumber: "TM-52", title: "Ad Set 2: gedragstargeting", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 153, ticketNumber: "TM-53", title: "Ad copy schrijven (3 varianten)", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 154, ticketNumber: "TM-54", title: "Video's uploaden als ad creative", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 155, ticketNumber: "TM-55", title: "A/B test opzetten: 2-3 video's per ad set", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 156, ticketNumber: "TM-56", title: "Budget instellen: 15-20 euro per dag", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 157, ticketNumber: "TM-57", title: "Campagne live zetten", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 158, ticketNumber: "TM-58", title: "Na 3 dagen: eerste resultaten checken", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 159, ticketNumber: "TM-59", title: "Na 7 dagen: slechte performers uitzetten", phaseId: 1, epic: "Eerste Campagne", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },

    // ===== FASE 2: TEST THE PRODUCT =====

    // Epic: Pilot Setup
    { id: 201, ticketNumber: "TP-01", title: "Pilot huishouden werven (eerste gebruiker)", phaseId: 2, epic: "Pilot Setup", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 202, ticketNumber: "TP-02", title: "Hue Bridge + sensoren installeren bij pilot", phaseId: 2, epic: "Pilot Setup", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 203, ticketNumber: "TP-03", title: "Portaal account aanmaken voor pilot mantelzorger", phaseId: 2, epic: "Pilot Setup", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 204, ticketNumber: "TP-04", title: "Bewonersprofiel invullen en testen", phaseId: 2, epic: "Pilot Setup", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },

    // Epic: Monitoring
    { id: 205, ticketNumber: "TP-05", title: "Monitoring 2 weken laten draaien", phaseId: 2, epic: "Monitoring", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 206, ticketNumber: "TP-06", title: "Patroonherkenning valideren met echte data", phaseId: 2, epic: "Monitoring", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 207, ticketNumber: "TP-07", title: "Dashboard bruikbaarheid testen met mantelzorger", phaseId: 2, epic: "Monitoring", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },

    // Epic: Feedback
    { id: 208, ticketNumber: "TP-08", title: "Feedback sessie met pilot gebruiker", phaseId: 2, epic: "Feedback", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 209, ticketNumber: "TP-09", title: "Top 5 verbeterpunten prioriteren", phaseId: 2, epic: "Feedback", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 210, ticketNumber: "TP-10", title: "Iteratie op basis van feedback doorvoeren", phaseId: 2, epic: "Feedback", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // ===== FASE 3: SCALE MARKET =====

    // Epic: Nurture
    { id: 301, ticketNumber: "SM-01", title: "Nurture-sequence bouwen (3-5 mails)", phaseId: 3, epic: "Nurture", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 302, ticketNumber: "SM-02", title: "Mail 1 (dag 0): Welkom + wat is GerustThuis", phaseId: 3, epic: "Nurture", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 303, ticketNumber: "SM-03", title: "Mail 2 (dag 3): Waarom we dit bouwen", phaseId: 3, epic: "Nurture", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 304, ticketNumber: "SM-04", title: "Mail 3 (dag 7): Hoe het werkt", phaseId: 3, epic: "Nurture", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 305, ticketNumber: "SM-05", title: "Mail 4 (dag 14): Privacy - waarom geen camera's", phaseId: 3, epic: "Nurture", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 306, ticketNumber: "SM-06", title: "Mail 5 (dag 21): Update + vraag om feedback", phaseId: 3, epic: "Nurture", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Ads Optimalisatie
    { id: 307, ticketNumber: "SM-07", title: "Custom Audience: website bezoekers (retargeting)", phaseId: 3, epic: "Ads Optimalisatie", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 308, ticketNumber: "SM-08", title: "Lookalike Audience aanmaken (na 50+ aanmeldingen)", phaseId: 3, epic: "Ads Optimalisatie", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 309, ticketNumber: "SM-09", title: "Wekelijks ads dashboard checken en optimaliseren", phaseId: 3, epic: "Ads Optimalisatie", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 310, ticketNumber: "SM-10", title: "Maandelijks rapportage: aanmeldingen, kosten, CPL", phaseId: 3, epic: "Ads Optimalisatie", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 311, ticketNumber: "SM-11", title: "Advertentieteksten verversen (elke 2-3 weken)", phaseId: 3, epic: "Ads Optimalisatie", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Content
    { id: 312, ticketNumber: "SM-12", title: "Video 4 en 5 produceren op basis van learnings", phaseId: 3, epic: "Content", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 313, ticketNumber: "SM-13", title: "Instagram organisch blijven posten (1-2x per week)", phaseId: 3, epic: "Content", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 314, ticketNumber: "SM-14", title: "UTM-parameters voorbereiden voor campagnes", phaseId: 3, epic: "Content", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // ===== FASE 4: SCALE PRODUCT =====

    // Epic: Onboarding
    { id: 401, ticketNumber: "SP-01", title: "Installer onboarding flow bouwen", phaseId: 4, epic: "Onboarding", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 402, ticketNumber: "SP-02", title: "Tweede huishouden live zetten", phaseId: 4, epic: "Onboarding", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 403, ticketNumber: "SP-03", title: "Installatie handleiding voor installateurs", phaseId: 4, epic: "Onboarding", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Product Features
    { id: 404, ticketNumber: "SP-04", title: "Alert systeem: notificaties bij afwijkingen", phaseId: 4, epic: "Product Features", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 405, ticketNumber: "SP-05", title: "iOS app naar TestFlight / App Store", phaseId: 4, epic: "Product Features", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },

    // Epic: Business
    { id: 406, ticketNumber: "SP-06", title: "Pricing model bepalen", phaseId: 4, epic: "Business", status: "todo", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 407, ticketNumber: "SP-07", title: "Betaalflow integreren", phaseId: 4, epic: "Business", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },
    { id: 408, ticketNumber: "SP-08", title: "SLA en support proces opzetten", phaseId: 4, epic: "Business", status: "todo", priority: "should", dependsOn: [], blockedBy: [] },

    // Epic: Auth & Accounts (Fase 1 — Foundation)
    { id: 160, ticketNumber: "TM-60", title: "Wachtwoord vergeten flow in portaal login", phaseId: 1, epic: "Foundation", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 161, ticketNumber: "TM-61", title: "2-staps email verificatie bij account aanmaken", phaseId: 1, epic: "Foundation", status: "done", priority: "must", dependsOn: [], blockedBy: [] },
    { id: 162, ticketNumber: "TM-62", title: "Zoho secrets configureren in Supabase Edge Functions", phaseId: 1, epic: "Website", status: "todo", priority: "must", dependsOn: [], blockedBy: [], description: "Supabase Dashboard → Settings → Edge Functions → Secrets. Voeg toe: ZOHO_MAIL_ACCESS_TOKEN, ZOHO_MAIL_ACCOUNT_ID, ZOHO_CAMPAIGNS_CLIENT_ID, ZOHO_CAMPAIGNS_CLIENT_SECRET, ZOHO_CAMPAIGNS_REFRESH_TOKEN, ZOHO_CAMPAIGNS_LIST_KEY, SITE_URL (https://gerustthuis.nl). Zonder deze secrets werkt de waitlist INSERT + rate limiting al, maar worden bevestigingsmail en Zoho Campaigns sync overgeslagen." }
  ],
  nextTicketNumber: 63
}
