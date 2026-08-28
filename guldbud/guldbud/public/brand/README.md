# Varumärkeslogotyper

## GuldBuds eget märke

Sajten renderar ordmärket som text (`components/Logo.tsx`), så det finns ingen
bildfil i själva gränssnittet. Filerna här är för externa tjänster som kräver en
uppladdad logotyp, t.ex. Stripe Checkout.

- `guldbud-logo-gold.png` — ordmärket i guld, genomskinlig botten, beskuret till
  bokstäverna. För mörkt underlag. Detta är standardvalet.
- `guldbud-logo-espresso.png` — samma ordmärke i espresso, för ljust underlag.
- `guldbud-icon-gold.png` — bara G:et, genomskinligt. För kvadratiska ytor.
- `guldbud-icon-512.png` — G:et i guld på espresso, 512x512 med botten. För
  ytor som behöver en heltäckande ikon (appikon, favicon-underlag).

Satta i Inter SemiBold med `tracking-tight`, samma som `Logo.tsx`. Färgerna
kommer ur `tailwind.config.js`: guld `#e8c766` (`gold-300`, samma som navbaren)
och botten `#1a1208` (`espresso-800`).

## Partnerlogotyper

Officiella logotyper för trygghetsmärkning på startsidan.

Lägg filerna här med exakt dessa namn (så refererar koden dem rätt):

- `bankid-white.png` — BankID, vit version (för mörk bakgrund)
- `swish.png` — Swish-symbolen (färg)

Källor: bankid.com respektive swish.nu (officiella varumärkesportaler).
Visas eftersom GuldBud använder tjänsterna (BankID-verifiering + Swish-utbetalning).
