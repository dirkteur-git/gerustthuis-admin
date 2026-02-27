# GerustThuis Admin Portaal

Vue 3 admin portaal voor intern gebruik — projectplan, huishoudenbeheer, rapportages.

> Scope en architectuur: [gerustthuis-docs/docs/product/admin-portaal.md](https://github.com/dirkteur-git/gerustthuis-docs/blob/main/docs/product/admin-portaal.md)

---

## Setup

```bash
npm install
npm run dev        # Ontwikkelserver
npm run build      # Productie build
```

---

## Tech stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vite**
- **Tailwind CSS**
- **Supabase** (auth + database)

---

## Environment

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

---

## Modules (gepland)

| Module | Status | Beschrijving |
|--------|--------|-------------|
| Projectplan | In ontwikkeling | Fases, criteria, aankopen, beslissingen |
| Huishoudenbeheer | Gepland | Overzicht alle huishoudens, gebruikers |
| Systeemstatus | Gepland | Sensor health, Edge Function logs |
| Rapportages | Gepland | Gebruiksstatistieken, trends |

---

## Documentatie

| Document | Inhoud |
|----------|--------|
| [admin-portaal.md](https://github.com/dirkteur-git/gerustthuis-docs/blob/main/docs/product/admin-portaal.md) | Scope, database schema, implementatiefases |
| [database/design.md](https://github.com/dirkteur-git/gerustthuis-docs/blob/main/docs/database/design.md) | Volledige database inclusief projecttabellen |
