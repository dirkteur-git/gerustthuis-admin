// GerustThuis Projectplan Data
// Fases met go/no-go criteria en tickets

export const initialData = {
  project: {
    name: "GerustThuis",
    description: "Privacy-first monitoring systeem voor ouderen",
    totalBudget: 6500,
    currency: "EUR"
  },
  phases: [
    {
      id: 0,
      name: "Foundation",
      description: "Testopstelling, data verzamelen, algoritme verbeteren",
      status: "actief",
      budget: 500,
      spent: 0,
      goNoGoCriteria: [
        { id: "0-1", description: "Testopstelling draait stabiel 7+ dagen zonder handmatige interventie", completed: false },
        { id: "0-2", description: "Minimaal 2 weken data verzameld van testhuishouden", completed: false },
        { id: "0-3", description: "Wakker/slaap detectie werkt met >80% accuraatheid (handmatig gevalideerd)", completed: false },
        { id: "0-4", description: "Algoritme draait real-time, niet alleen op historische data", completed: false },
        { id: "0-5", description: "Architectuurdocumentatie basis staat (dataflow, componenten)", completed: false },
        { id: "0-6", description: "Domeinnaam geregistreerd", completed: false }
      ],
      noGoAction: "Meer itereren op hardware/software stabiliteit voordat we uitbreiden"
    },
    {
      id: 1,
      name: "Hardware Expansion",
      description: "Meerdere device types ondersteunen",
      status: "niet gestart",
      budget: 1000,
      spent: 0,
      goNoGoCriteria: [
        { id: "1-1", description: "Minimaal 3 verschillende sensor-types succesvol geïntegreerd (motion, contact, light)", completed: false },
        { id: "1-2", description: "Devices van minimaal 2 verschillende fabrikanten werken", completed: false },
        { id: "1-3", description: "Onboarding nieuwe device duurt <30 minuten", completed: false },
        { id: "1-4", description: "Geen vendor lock-in: documentatie hoe nieuw device toe te voegen", completed: false }
      ],
      noGoAction: "Terugschalen naar 1 device type, eerst stabiliteit"
    },
    {
      id: 2,
      name: "WhatsApp Integratie",
      description: "Notificaties naar mantelzorgers via WhatsApp",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "2-1", description: "WhatsApp Business API of Twilio integratie werkend", completed: false },
        { id: "2-2", description: "Alerts komen binnen 2 minuten aan op telefoon", completed: false },
        { id: "2-3", description: "Mantelzorger kan via WhatsApp bevestigen (acknowledge alert)", completed: false },
        { id: "2-4", description: "Getest met 3+ mantelzorgers (niet-technisch)", completed: false },
        { id: "2-5", description: "Kosten per bericht in kaart gebracht", completed: false }
      ],
      noGoAction: "Alternatief kanaal onderzoeken (SMS, e-mail, of toch app)"
    },
    {
      id: 3,
      name: "Alert & UX",
      description: "Alert-logica, configuratie per bewoner, onboarding flow",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "3-1", description: "Alert-regels configureerbaar per bewoner (bijv. 'geen activiteit na 10:00')", completed: false },
        { id: "3-2", description: "False positive rate <20% over testperiode van 2 weken", completed: false },
        { id: "3-3", description: "Onboarding flow getest met 2+ niet-technische mensen", completed: false },
        { id: "3-4", description: "Snooze functie werkt (tijdelijk alerts uitzetten)", completed: false },
        { id: "3-5", description: "Baseline learning periode geïmplementeerd (systeem leert normaal patroon)", completed: false }
      ],
      noGoAction: "UX nog niet intuïtief genoeg voor doelgroep"
    },
    {
      id: 4,
      name: "Compliance",
      description: "AVG, juridisch, aansprakelijkheid",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "4-1", description: "Privacy policy geschreven en juridisch gereviewed", completed: false },
        { id: "4-2", description: "Verwerkersovereenkomst template klaar", completed: false },
        { id: "4-3", description: "Algemene voorwaarden opgesteld", completed: false },
        { id: "4-4", description: "Data retention policy bepaald (hoe lang bewaren we data?)", completed: false },
        { id: "4-5", description: "Aansprakelijkheid afgedekt (disclaimer + verzekering verkend)", completed: false },
        { id: "4-6", description: "AVG register van verwerkingen aangelegd", completed: false },
        { id: "4-7", description: "Besluit: BV nodig voor pilot? (waarschijnlijk niet)", completed: false }
      ],
      noGoAction: "Niet starten met echte kwetsbare mensen zonder juridische basis"
    },
    {
      id: 5,
      name: "Pilot",
      description: "Gratis plaatsing bij kwetsbare mensen, feedback verzamelen",
      status: "niet gestart",
      budget: 5000,
      spent: 0,
      goNoGoCriteria: [
        { id: "5-1", description: "Minimaal 5 huishoudens actief gedurende 4+ weken", completed: false },
        { id: "5-2", description: "NPS score >7 van mantelzorgers", completed: false },
        { id: "5-3", description: "Minimaal 1 'echte' alert succesvol afgehandeld", completed: false },
        { id: "5-4", description: "Installatie door niet-teamlid mogelijk (test schaalbaarheid)", completed: false },
        { id: "5-5", description: "Churn: geen pilot-deelnemer gestopt vanwege product-problemen", completed: false },
        { id: "5-6", description: "Verzameld: 3+ testimonials of quotes", completed: false }
      ],
      noGoAction: "Product nog niet klaar voor betalende klanten"
    },
    {
      id: 6,
      name: "Iteration",
      description: "Verwerken pilot-learnings, product aanscherpen",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "6-1", description: "Alle kritieke bugs uit pilot opgelost", completed: false },
        { id: "6-2", description: "Top 3 feature requests uit pilot geëvalueerd (build/park/kill)", completed: false },
        { id: "6-3", description: "Algoritme verbeterd op basis van pilot-data", completed: false },
        { id: "6-4", description: "Installatie-tijd teruggebracht naar <1 uur", completed: false },
        { id: "6-5", description: "Support-proces gedefinieerd (wat als iets kapot gaat?)", completed: false },
        { id: "6-6", description: "Besluit: native app nodig of WhatsApp voldoende?", completed: false }
      ],
      noGoAction: "Nog een iteratieronde nodig"
    },
    {
      id: 7,
      name: "Go-to-Market",
      description: "Pricing, propositie, website, BV oprichten",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "7-1", description: "Pricing model bepaald en gevalideerd met 5+ potentiële klanten", completed: false },
        { id: "7-2", description: "Landingspagina live met duidelijke propositie", completed: false },
        { id: "7-3", description: "Propositie uitgewerkt voor minimaal 2 doelgroepen (mantelzorger, thuiszorg)", completed: false },
        { id: "7-4", description: "Bestelflow/aanmeldflow werkt end-to-end", completed: false },
        { id: "7-5", description: "Unit economics berekend (CAC, LTV, margin op hardware)", completed: false },
        { id: "7-6", description: "Merknaam GerustThuis geregistreerd", completed: false },
        { id: "7-7", description: "BV opgericht of activiteiten afgesplitst van BoostiX", completed: false },
        { id: "7-8", description: "IP overdracht van BoostiX naar GerustThuis vastgelegd (indien van toepassing)", completed: false }
      ],
      noGoAction: "Nog geen marketing euro's uitgeven"
    },
    {
      id: 8,
      name: "Marketing",
      description: "Bekendheid genereren, content, partnerships",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "8-1", description: "Eerste 100 website bezoekers via organisch/paid", completed: false },
        { id: "8-2", description: "Minimaal 10 leads (aanmeldingen/contactverzoeken)", completed: false },
        { id: "8-3", description: "Cost per lead <€50", completed: false },
        { id: "8-4", description: "1+ partnership gesprek met zorgorganisatie of branchevereniging (bijv. ActiZ)", completed: false },
        { id: "8-5", description: "Content aanwezig: minimaal 3 blogposts/cases/video's", completed: false }
      ],
      noGoAction: "Boodschap resoneert niet, terug naar propositie"
    },
    {
      id: 9,
      name: "Sales",
      description: "Kanalen inrichten, eerste betalende klanten",
      status: "niet gestart",
      budget: null,
      spent: 0,
      goNoGoCriteria: [
        { id: "9-1", description: "Eerste 3 betalende klanten", completed: false },
        { id: "9-2", description: "Salesproces gedocumenteerd (van lead tot klant)", completed: false },
        { id: "9-3", description: "Minimaal 1 kanaal bewezen (direct, via partner, via zorginstelling)", completed: false },
        { id: "9-4", description: "Churn eerste 3 maanden: 0", completed: false },
        { id: "9-5", description: "Upsell/referral: minimaal 1 klant via mond-tot-mond", completed: false }
      ],
      noGoAction: "Product-market fit nog niet bewezen, terug naar pilot of iteratie"
    }
  ],
  tickets: [],
  nextTicketNumber: 1
}
