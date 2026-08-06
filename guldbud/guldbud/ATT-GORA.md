# ⚠️ Att göra innan lansering

En levande checklista med viktiga saker som måste vara på plats innan sidan
släpps till riktiga användare.

---

## 🔴 VIKTIGAST: Egen e-postleverantör (SMTP)

**Problem:** Så länge vi bara använder Supabases inbyggda testmejl stryps
**alla** registreringar och lösenordsåterställningar (`email rate limit
exceeded`) och mejlen hamnar ofta i skräpposten. Riktiga kunder kommer inte
kunna skapa konto eller återställa lösenord.

**Lösning:** Koppla en egen e-postleverantör i Supabase.

1. Skapa ett gratiskonto hos **[Resend](https://resend.com)** (gratis nivå räcker
   för start).
2. Lägg till och verifiera domänen `guldbud.se` (eller `guldbud.com`) i Resend
   (DNS-poster: SPF/DKIM).
3. Skapa en **API-nyckel / SMTP-uppgifter** i Resend.
4. I Supabase: **Authentication → Emails → SMTP Settings** → slå på **Custom SMTP**
   och fyll i:
   - Host: `smtp.resend.com`
   - Port: `465` (eller `587`)
   - Username: `resend`
   - Password: din Resend API-nyckel
   - Sender: t.ex. `noreply@guldbud.se`
5. Testa: registrera ett testkonto och begär lösenordsåterställning — mejlen ska
   komma direkt.

> 💡 Claude kan guida steg för steg när det är dags — säg bara till.

---

## 🟠 Just nu avstängt för test — måste återställas

- [ ] **"Confirm email" är AVSTÄNGD** i Supabase (Authentication → Providers →
      Email). Det gjordes för att kunna testa registrering utan att strypas av
      e-postgränsen. **Slå på den igen innan lansering** — annars kan vem som
      helst registrera sig utan att äga e-postadressen. Gör det tillsammans med
      SMTP-steget ovan så att bekräftelsemejlen faktiskt går fram.

## Övriga saker att komma ihåg

- [ ] **Kör `supabase-schema.sql` en sista gång** i Supabase så att alla nya
      kolumner, `is_admin`, FK-cascade och realtid garanterat är aktiva.
- [ ] **Byt ut adress/kontaktuppgifter** (Storgatan 1, info@guldbud.se) mot
      riktiga uppgifter i footern och på auktions-/accept-sidorna.
- [ ] **Provision/villkor**: fyll i riktiga villkor, integritetspolicy och
      cookies (länkar finns redan i footern men pekar på platshållare).
- [ ] **Godkänn första handlarna** i adminpanelen innan lansering.
