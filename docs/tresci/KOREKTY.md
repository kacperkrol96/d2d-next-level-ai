# Korekty materiałów onboardingowych względem SPEC.md

Plik: `docs/tresci/NLE_Onboarding_Komplet.md` (wersja oryginalna: gałąź `tresci-akademii`, commit `908cfd2`).
Źródła prawdy: `docs/SPEC.md` + decyzje Kacpra (właściciel) z dnia 2026-10-01, oznaczone niżej jako **D1–D8**:

- **D1** — rozliczenia: okresy 1–15 (rozliczenie do 20., wypłata 25.) i 16–koniec miesiąca (akceptacja do 5., wypłata 10. następnego miesiąca), NIE „co 2 tygodnie”.
- **D2** — KPI audytora wg SPEC.md (nazwy, wagi, progi I–V, 0–100 pkt, przedziały mnożnika); KPI „Raportowanie” = % aktywnych bloków z aplikacji.
- **D3** — nowe Safety / Next Level; awans od NASTĘPNEJ umowy; nadmarża tylko dla handlowców.
- **D4** — maksymalne dofinansowanie zawsze 170 100 zł.
- **D5** — audytor nie podaje klientowi ŻADNEJ kwoty przed pomiarem (nawet „do”).
- **D6** — rytm pracy (cykl 2-dniowy, odprawy, „Zamknij dzień” do 21:00, nagrania min. 20%).
- **D7** — kartki żółte i czerwone.
- **D8** — teren (rejon raz na 30 dni, sołtys, RODO palcem + SMS/e-mail, max 3 pytania, max 3 odbicia).
- **SPEC** — inna reguła z `docs/SPEC.md` (podano sekcję).

Tekst w dokumencie zostaje bez polskich znaków tam, gdzie był bez nich (konwersja z PDF); nowe wstawki w częściach technicznych mają polskie znaki.

---

## Podsumowanie liczbowe

| Kategoria | Liczba zmian |
|---|---|
| Kwoty przed pomiarem (D5) — skrypty, sceny, prezentacja, notatki „wiedza wewnętrzna” | 22 |
| Wynagrodzenia: Safety / Next Level / stawki / awanse / nadmarża (D3 + SPEC) | 28 |
| KPI i mnożnik (D2) | 8 |
| Rytm pracy, raport „Zamknij dzień”, odprawy, nagrania (D6) | 25 |
| Teren i RODO (D8 + SPEC Terytorium) | 22 |
| Kartki (D7) | 3 |
| Okresy rozliczeń i flota (D1 + SPEC) | 4 |
| Maks. dofinansowanie 170 100 zł (D4) | 3 |
| Nagłówek dokumentu | 1 |
| **Razem** | **116** |

(Jedna edycja może dotyczyć kilku reguł — liczona jest w kategorii głównej.)

---

## 0. Nagłówek dokumentu

| # | Przed | Po | Reguła |
|---|---|---|---|
| 1 | — | Dopisano: „Wersja poprawiona względem SPEC.md — lista zmian w docs/tresci/KOREKTY.md” | polecenie |
| 2 | „audytor nigdy nie obiecuje korzysci ani kwoty przed weryfikacja” | + „przed pomiarem nie podaje klientowi zadnej kwoty dofinansowania (nawet "do")” | D5 |

## 1. Kontrakt audytora (CZĘŚĆ I)

| # | Fragment | Przed | Po | Reguła |
|---|---|---|---|---|
| 3 | Czas pracy | Tylko „cykl 12/6/2/1 na dwa dni” | Dopisano rytm: pon/śr/pt — 12 leadów (co godzinę 9–20); wt/czw/sob — 6 spotkań; tydzień 36 umówionych / 18 odbytych | D6 |
| 4 | Rejon | „Kazdy audytor samodzielnie wybiera i planuje rejon” | „Obowiązuje SPEC.md — rejon wyznacza manager w aplikacji (Terytorium); w jego ramach samodzielnie planujesz ulice” + rejon max raz na 30 dni + max 3 pytania kwalifikacyjne + max 3 odbicia | D8, SPEC (Terytorium) |
| 5 | Raportowanie | „Brak raportu w CRM = brak pracy. Raport tego samego dnia, przed 21:00.” | Wpisy w aplikacji na bieżąco; „Zamknij dzień” obowiązkowe do 21:00; brak = dzień niezaliczony + automatyczna żółta kartka | D6 |
| 6 | Nowy akapit „Nagrania” | — | Min. 20% odbytych spotkań nagrywanych w aplikacji, po poinformowaniu klienta | D6, SPEC (Nagrywanie) |
| 7 | Co wolno mówić | „Mowisz prawde o programie — kwotach, progach, procesie. Pokazujesz realne realizacje i realne liczby.” | „Mowisz prawde o programie i procesie… Zadnej kwoty dofinansowania ani progu dochodowego klienta nie podajesz przed pomiarem — "Wysokosc dofinansowania poznamy po pomiarze…"” | D5 |
| 8 | Czego nie wolno | „nie podajesz nawet kwoty "do"” | + „ani "program przewiduje do ..."” | D5 |
| 9 | Dokumenty i RODO | „podpisem RODO i wydaniem potwierdzenia klientowi” | Formularz leada w aplikacji: zgoda RODO podpisana palcem + potwierdzenie SMS/e-mail | D8 |
| 10 | Filar 3 — KPI | Rozsypana tabela z PDF: KPI „Odstapienia” (waga 3, 60→40%), „Terminowosc zadan CRM” (waga 3, 85→95%), „level 0-5”, progi łącznego wyniku 30-50 / 51-60 / 61-75 / 76-90 / 91-100 | Czytelna tabela wg SPEC.md: spotkania 6, komplet leadów 4, target 4, **Raportowanie z aplikacji 4** (85/90/92,5/95/100%), termin zadań w CRM 2 (48h→0h); poziomy I–V (1–5 pkt); mnożnik 0–29 / 30–45 / 46–58 / 59–69 / 70–89 / 90–100 | D2 |
| 11 | Filar 3 — poniżej 30 pkt | „level 0 — rozstajemy sie. Zwolnienie i czerwona kartka od razu” | „mnoznik 75%, alert do managera i zolta kartka (zapis w historii)” | D2, SPEC (KPI) |
| 12 | Filar 3 — snapshot | „Snapshot pozycji co 2 tygodnie. CRM to warunek konieczny: brak raportu = brak dnia.” | „Rozliczenie w okresach 1-15 i 16-koniec miesiaca. Raport w aplikacji to warunek konieczny: brak raportu = dzien niezaliczony.” | D1, D6 |
| 13 | System kartek | Żółta: „spoznienia, brak CRM, brak GOPS, obietnica kwoty przed pomiarem, presja na kliencie” | + „brak raportu w CRM/aplikacji”, + „wynik KPI ponizej 30 pkt”; czerwona bez zmian | D7 |
| 14 | Komunikacja wewnętrzna | „Odprawy: co drugi dzien rano 8:30 w dni leadowe. W kazdy poniedzialek wszyscy o 8:00 do biura.” | „Odprawy: pon/sr/pt o 8:30 (dni leadowe). W kazdy poniedzialek wszyscy o 8:00 w biurze.” | D6 |

## 2. System wynagrodzeń i awansów (CZĘŚĆ I)

| # | Fragment | Przed | Po | Reguła |
|---|---|---|---|---|
| 15 | Zasada przewodnia | Poziom „po liczbie umów” | Poziom po liczbie **klientów**; rezygnacja odejmuje klienta, poziom zostaje; dopisano „Obowiązuje SPEC.md… W razie rozbieżności rozstrzyga SPEC.md” | SPEC (Zasady prowizji) |
| 16 | 1. Model — MNOZNIK_KPI | `{0.75, 0.80, 0.90, 1.00, 1.10}` wg „level I..V” | Przedziały wg wyniku 0–100 pkt (0–29 = 0,75 + alert + żółta kartka itd.) | D2 |
| 17 | 1. Model — SCIEZKA_AUDYT | `{safety, next_level, levelowy}` | `{safety, next_level}` — next_level = tabela 10 poziomów | D3 |
| 18 | 1. Zależności statusu | Audytor: prowizja i bonus przy `po_pomiarach` | Prowizja szara od „DOKUMENTACJA POMIAROWA”, zielona od „TWORZENIE OFERTY”; bonus, gdy prowizja handlowca zielona | SPEC (Zasady prowizji) |
| 19 | 2. Tabela handlowców | Kolumna `umow_do_awansu`; „skumulowana liczba umów” | `klientow_do_awansu`; od poz. 5 klienci całego zespołu (edytowalne) | SPEC (Tabela handlowców) |
| 20 | Reguły handlowca | „sam VAT” bez definicji; nadmarża „limit 10% wartości umowy netto”; KPI „do części prowizyjnej”; opieka „2–15 osób” | Definicja „sam VAT”; Solo/Duet + „Dopłata do Duetu”; limit 10% umów termo + źródło (bez REK); nadmarża WYŁĄCZNIE handlowcy; awans od następnej umowy; opieka bez mnożnika KPI (kwoty wpisuje admin) | D3, SPEC |
| 21 | 3. Nagłówek | „AUDYTORZY — ścieżka levelowa” | „AUDYTORZY — system NEXT LEVEL (10 poziomów)”; kolumna `klientow_do_awansu` | D3 |
| 22 | Reguły audytora | Bonus „zawsze, gdy handlowiec zamknie”; status `po_pomiarach`; „umowy całej struktury”; nadmarża „[DO POTWIERDZENIA]” | Bonus, gdy prowizja handlowca zielona; statusy wg SPEC; awans od następnej umowy; klienci struktury; nadmarża — rozstrzygnięte: audytorzy nie mają | D3, SPEC |
| 23 | 4. Safety / Next Level | „(BEZ ZMIAN)”: safety = 3 750 + 200 zł/pomiar powyżej 5; next_level = 1 000 zł/pomiar; uwaga „do rozstrzygnięcia” | Nowa tabela Safety (0–4 = 0 zł / min. stawka godzinowa przy zleceniu; 5–9 = 3 750 + 200; 10–14 = 7 000 + 250; 15+ = 10 000 + 300), bez bonusu, KPI na całość; Next Level = tabela 10 poziomów; awans od następnej umowy; przejście tylko Safety → NL (wyjątek: czasowo z powrotem przy chorobie/wypadku); pomiary z Safety liczą się do poziomu; brak nadmarży | D3 |
| 24 | 5. Mnożnik KPI | Tabela level_kpi I–V → mnożnik; KPI handlowca „Opinie 5★ od min. 90%”, „Komplet dokumentów w 24h” itd. bez wag | Przedziały punktowe wg SPEC; pełne listy KPI audytora i handlowca z wagami i progami; KPI bez danych pomijane | D2, SPEC (KPI) |
| 25 | 6. Pseudokod handlowca | `prowizja * KPI + nadmarza` (nadmarża bez KPI); limit od całej wartości | `(prowizja + nadmarża) * KPI`; nadmarża ≥ 0, limit od umów termo + źródło (bez REK); komentarz o stawce sprzed klienta | SPEC (Zasady prowizji) |
| 26 | 6. Pseudokod audytora | `stawka * KPI + bonus` (bonus bez KPI, przy `po_pomiarach`) | `(stawka + bonus) * KPI`, bonus gdy prowizja handlowca zielona; poziom sprzed klienta | D3, SPEC |
| 27 | 6. Pseudokod Safety/NL | `3750 + 200 * max(0, n-5)`; `1000 * n` | Nowe progi Safety × KPI; NL = suma `wyplata_audytora` | D3 |
| 28 | 7. Progi awansu | `umowy_all_time` | `klienci_all_time`, zespół od poz. 5, nowa stawka od następnej umowy | D3, SPEC |
| 29 | 8. Kwestie otwarte | 4 pytania „do decyzji zarządu” | „ROZSTRZYGNIĘTE” — progi różne; nadmarża tylko handlowcy; brak degradacji; Safety i NL to dwa systemy do wyboru | D3, SPEC |
| 30 | 9. Rozliczenia | „Cykl rozliczeń: co 2 tygodnie.” | Okresy 1–15 (do 20. / 25.) i 16–koniec (do 5. / 10. następnego miesiąca) | D1 |
| 31 | 9. Flota | „< 2 → 1500 zł”, „klientów doprowadzonych do końca” | „0–1 klient → 1500 zł”, status jak przy prowizji; potrącenie w okresie 1–15 następnego miesiąca jako „Flota” | SPEC (Flota) |
| 32 | 9. Źródło danych | „CRM + potwierdzenia z raportów umów (Google Workspace)” | „CRM (statusy umów) + dane z aplikacji” | SPEC (Mennica, CRM) |

## 3. Checklista audytora (CZĘŚĆ II)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 33 | „Druki RODO do podpisu przez klienta przy umawianiu.” | Aplikacja — formularz leada: zgoda RODO palcem + potwierdzenie SMS/e-mail (działa offline) | D8, SPEC (offline) |
| 34 | „najpierw zapisujesz na papierze, potem przepisujesz do CRM” | Aplikacja działa offline; papier tylko awaryjnie | SPEC (Raportowanie w terenie) |
| 35 | „klient podpisuje druk RODO” | Zgoda RODO palcem w aplikacji + potwierdzenie SMS/e-mail | D8 |
| 36 | „PRZEPISANIE DO CRM … przed 21:00” | „PRZEPISANIE DO APLIKACJI … "Zamknij dzien" do 21:00. Brak raportu = dzien niezaliczony + automatyczna zolta kartka.” | D6, D7 |
| 37 | „Papierowa lista nie zwalnia z CRM … kompletem leadow w CRM” | „…nie zwalnia z aplikacji … kompletem leadow w aplikacji” | D6 |

## 4. Systemy awansów (CZĘŚĆ II)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 38 | Zasada: awans „po okreslonej liczbie umow” | Dopisek „Obowiązuje SPEC.md”; „liczbie klientow” | SPEC |
| 39 | Tabela handlowców: „Umow do awansu” | „Klientow do awansu” | SPEC |
| 40 | Zasady handlowców: „sam VAT”, nadmarża „10% wartosci umowy”, opieka „2-15 osob” | Definicja „sam VAT”; limit termo + źródło (bez REK); nadmarża WYŁĄCZNIE handlowcy; zespół od poz. 5; awans od następnej umowy; wypłata = prowizja × KPI | D3, SPEC |
| 41 | „AUDYTORZY — stawki i progi awansu”, „Umow do awansu” | „… (system NEXT LEVEL)”, „Klientow do awansu” | D3 |
| 42 | Zasady audytorów: bonus „ZAWSZE”; status „po pomiarach”; KPI „75/80/90/100/110%” | Bonus gdy prowizja handlowca zielona; statusy wg SPEC; mnożnik wg przedziałów punktowych; awans od następnej umowy; brak nadmarży | D2, D3, SPEC |
| 43 | — | Nowa podsekcja „AUDYTORZY — system SAFETY” (progi, brak bonusu, KPI na całość, zasady przejścia) | D3 |
| 44 | „Kwestie otwarte — do decyzji zarzadu” (3 punkty z rekomendacjami) | „ROZSTRZYGNIETE” — te same punkty jako decyzje | D3 |

## 5. Prezentacja Czyste Powietrze (CZĘŚĆ III)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 45 | Slajd 2 „Progi dochodowe — trzy poziomy” | + „(wiedza wewnętrzna — nie mówimy klientowi przed pomiarem)” | D5 |
| 46 | Slajd 3 „Kwoty dofinansowania” | + „(wiedza wewnętrzna — nie mówimy klientowi przed pomiarem)” | D5 |
| 47 | „nawet do 170 tysiecy zlotych” | „maksymalnie 170 100 zlotych. To wiedza dla Was — klientowi tych kwot nie mowimy.” | D4, D5 |
| 48 | „audytor NIGDY nie obiecuje konkretnej kwoty przed pomiarem. Mowimy o widelach "do", liczby wychodza po pomiarze.” | „…NIGDY nie podaje klientowi zadnej kwoty przed pomiarem — nawet "do". Mowimy tylko: "Wysokosc dofinansowania poznamy po pomiarze — zalezy od progu dochodowego."” | D5 |

## 6. Skrypt R1 — Pukanie (CZĘŚĆ IV)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 49 | Krok 5: „dopiero po audycie bede wiedziec czy i ile Panstwo moga dostac” | „po audycie bede wiedziec czy Panstwo sie kwalifikuja, a wysokosc dofinansowania poznamy po pomiarze” | D5 |
| 50 | Krok 6 (nagłówek): „+ RODO + karteczka” | „+ RODO w aplikacji + potwierdzenie SMS/e-mail” | D8 |
| 51 | Krok 6 pkt 4: „RODO + KARTECZKA: podpis zgody na audyt + wydajesz karteczke” | Formularz leada: zgoda RODO palcem, potwierdzenie SMS/e-mail (karteczka dodatkowo) | D8 |
| 52 | Krok 7: „umawiasz: pozorny wybor, RODO, karteczka” | „…RODO w aplikacji, potwierdzenie SMS/e-mail” | D8 |
| 53 | Zasada trzech prób: „12 leadow dziennie” | „12 leadow w dzien leadowy” | D6 |
| 54 | Złote zasady: „RODO + karteczka…”, „Nigdy nie obiecuj kwoty przed weryfikacja. CRM tego samego dnia — brak wpisu = brak dnia.” | RODO palcem + SMS/e-mail; „Nigdy nie podawaj kwoty przed pomiarem”; „Zamknij dzień” do 21:00, brak = brak dnia + żółta kartka; dopisano: rejon raz na 30 dni, max 3 pytania, max 3 odbicia | D5, D6, D7, D8 |

## 7. Skrypt R2 — Audyt (6 tajemnic)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 55 | CEL: „NIE obiecujesz kwoty przed pomiarem — pokazujesz prog, ale ostateczna kwota wychodzi dopiero po pomiarze” | „NIE podajesz zadnej kwoty przed pomiarem (nawet "do") — pokazujesz tylko wstepny prog” | D5 |
| 56 | „PROGI DOFINANSOWANIA (orientacyjnie — do potwierdzenia):” | + „wiedza wewnętrzna — nie mówimy klientowi przed pomiarem kwot” | D5 |
| 57 | [AUDYTOR]: „Na podstawie dochodow plasuja sie Panstwo na poziomie [X] procent. Przy kompleksowym remoncie program przewiduje nawet do 170 100 zlotych.” | „Wstepnie, na podstawie dochodow, plasuja sie Panstwo na poziomie [X] procent. Wysokosc dofinansowania poznamy po pomiarze — zalezy od progu dochodowego.” | D5 |
| 58 | ZASADA: „mowisz o progu i o tym, co program PRZEWIDUJE” | „Nie podajesz klientowi ZADNEJ kwoty — ani konkretnej, ani "do", ani "program przewiduje do ..."” | D5 |

## 8. Skrypt R2 — wersja słowna

| # | Przed | Po | Reguła |
|---|---|---|---|
| 59 | Tajemnica Chwalebna: „Dofinansowanie: sto trzydziesci osiem tysiecy zlotych.” | „Wysokosc dofinansowania poznal dopiero po pomiarze — zalezala od jego progu dochodowego.” | D5 |
| 60 | „dochody Panstwa kwalifikuja sie do poziomu [X] procent dofinansowania.” | „wstepnie … [X] procent … Wysokosc dofinansowania poznamy po pomiarze — zalezy od progu dochodowego.” | D5 |

## 9. Scena Etap 1 — umówienie (wzorcowa i z oporem)

| # | Scena | Przed | Po | Reguła |
|---|---|---|---|---|
| 61 | Wzorcowa, scena 4 | „policze — czy i na ile budynek sie lapie. Wszystko bezplatnie, bez zadnych zobowiazan…” | „sprawdze, czy budynek sie lapie. Wysokosc dofinansowania poznamy po pomiarze… Audyt jest bezplatny, bez ukrytych kosztow.” (też usunięte „bez zobowiązań” — zakazane w prezentacji i kontrakcie) | D5 |
| 62 | Wzorcowa, wskazówka | „Audytor nie obiecuje kwoty — mowi "czy i na ile sie lapie"” | „Audytor nie podaje zadnej kwoty — mowi "czy sie lapie", a kwote odsyla do pomiaru” | D5 |
| 63–64 | Wzorcowa i z oporem, scena 5/6 | „podpis tutaj — to standardowe RODO… karteczka z godzina” | „podpis palcem tutaj na ekranie — standardowa zgoda RODO… Potwierdzenie… przyjdzie SMS-em” | D8 |
| 65–66 | Obie, zamknięcie | „12 leadow dziennie to matematyka” | „12 leadow w dzien leadowy to matematyka” | D6 |
| 67 | Z oporem, scena 5 | „powiem Panu wprost czy i ile moze Pan dostac” | „powiem Panu wprost, czy dom sie lapie. Wysokosc dofinansowania poznamy po pomiarze…” | D5 |

## 10. Banki obiekcji (CZĘŚĆ VI)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 68 | „12 leadow dziennie bierze sie z…” | „12 leadow w dzien leadowy…” | D6 |

## 11. Prospecting terenu i Walkthrough (CZĘŚĆ VII)

| # | Fragment | Przed | Po | Reguła |
|---|---|---|---|---|
| 69 | Prospecting — wstęp | „bez przydzialu od managera” | Dopisek: „Obowiązuje SPEC.md — rejon wyznacza manager w aplikacji (Terytorium); przewodnik służy do planowania ulic i propozycji nowych rejonów” | SPEC (Terytorium, Wieża) |
| 70 | Polska w liczbach | „140 300 — max dotacja zl na jeden dom” | „170 100 — … (wiedza wewnętrzna — nie mówimy klientowi przed pomiarem)” | D4, D5 |
| 71 | Matematyka lejka | „To jest Twoj dzienny cel — jeden cykl, dwa dni pracy” | „cel na cykl — dwa dni pracy (dzien leadowy pon/sr/pt + dzien audytowy wt/czw/sob)” | D6 |
| 72 | Krok 2 | „Cel dzienny: minimum 100 domow = 12 leadow.” | „Cel dnia leadowego (pon/sr/pt)…” | D6 |
| 73 | Krok 3 | Sołtys „pozorny wybor, RODO, karteczka” | „RODO palcem w aplikacji, potwierdzenie SMS/e-mail” | D8 |
| 74 | Omijaj | „Rejon gdzie inny audytor NLE byl w ostatnim czasie” | „…ktos z NLE byl w ostatnich 30 dniach” | D8 |
| 75 | Checklista | „Sprawdzilem w CRM czy ktos z NLE nie byl w tym rejonie ostatnio” | „…w aplikacji (Terytorium) … w ostatnich 30 dniach” | D8 |
| 76 | Ćwiczenie — podsumowanie | „CRM uzupelniasz tego samego dnia przed 21:00… Brak wpisu = brak dnia = brak prowizji.” | „Zamknij dzień” do 21:00; brak raportu = dzień niezaliczony + automatyczna żółta kartka; klient bez leadu w aplikacji = brak prowizji (reguła „Nie ma w aplikacji = nie ma klienta”) | D6, D7, SPEC |
| 77 | Walkthrough — wstęp | „Manager nie bedzie juz wybierac za Ciebie rejonow” | „Obowiązuje SPEC.md — rejon wyznacza manager w aplikacji (Terytorium)…” | SPEC (Terytorium) |
| 78 | Walkthrough — krok 5 | „W CRM masz date ostatniej wizyty” | „W aplikacji (Terytorium)…” | D8, SPEC |
| 79 | Walkthrough — checklista | „Sprawdzilem w CRM ze rejon nie byl odwiedzany…” | „…w aplikacji (Terytorium)…” | D8 |

## 12. Egzaminy i klucze (CZĘŚĆ VIII)

| # | Fragment | Przed | Po | Reguła |
|---|---|---|---|---|
| 80–81 | Egzamin D1 i Klucz D1, pyt. 4 (maks. kwota) | bez uwagi | + „(wiedza wewnętrzna — nie mówimy klientowi przed pomiarem)”; poprawna odpowiedź 170 100 zł bez zmian | D4, D5 |
| 82 | Klucz D1, pyt. 15 | „(pozorny wybor, RODO, karteczka)” | „(pozorny wybor, RODO palcem w aplikacji, potwierdzenie SMS/e-mail)” | D8 |
| 83 | Egzamin D2, część 1 pyt. 3 | „Czwarte pytanie kwalifikacyjne (o wlasnosc i liczbe osob)” | „Trzecie (ostatnie — przy drzwiach max 3) pytanie kwalifikacyjne (o docieplenie)” | D8 |
| 84 | Egzamin D2, kroki R1 | „Domkniecie … + RODO + karteczka” | „… + RODO (palcem w aplikacji) + potwierdzenie SMS/e-mail” | D8 |
| 85 | Egzamin D2, kroki R1 | „Kwalifikacja — 4 pytania” | „Kwalifikacja — maks. 3 pytania” | D8 |
| 86 | Klucz managera, case 3 | „zolta kartka jesli sie powtarza” | „Brak raportu ("Zamknij dzien" do 21:00) = dzien niezaliczony + automatyczna zolta kartka” | D6, D7 |

## 13. Podręcznik Managera (CZĘŚĆ IX)

| # | Przed | Po | Reguła |
|---|---|---|---|
| 87 | Poniedziałek: „Odprawa tygodniowa 8:00 offline… Przeglad snapshotow KPI.” | „…8:00 offline w biurze (wszyscy)… Przeglad KPI zespolu (na zywo w aplikacji)… Dzien leadowy — odprawa 8:30.” | D6, SPEC (KPI na żywo) |
| 88 | Wt/czw/sob: „Rano odprawa 8:30.” | „(bez odprawy — odprawy sa pon/sr/pt o 8:30)” | D6 |
| 89 | Codziennie: „czy wszyscy zaraportowali przed 21:00” | „…zamkneli dzien w aplikacji ("Zamknij dzien") do 21:00. Brak raportu = dzien niezaliczony + automatyczna zolta kartka.” | D6, D7 |
| 90 | Karta snapshotu KPI: „Co 2 tygodnie” | „Na koniec kazdego okresu rozliczeniowego (1-15 i 16-koniec miesiaca) … KPI na zywo w aplikacji” | D1, D2 |
| 91 | Orbit (M2): „Snapshot co 2 tyg.” | „Przeglad KPI co okres rozliczeniowy (1-15, 16-koniec miesiaca)” | D1 |

## 14. Launch Pad — plany 90 dni (zespół 1 i 2)

| # | Osoba / fragment | Przed | Po | Reguła |
|---|---|---|---|---|
| 92–97 | Wszystkie 6 planów | „12 leadow dziennie — bez wyjatkow” | „12 leadow w dzien leadowy (pon/sr/pt) — bez wyjatkow” | D6 |
| 98 | Monika (NL) | „15 000 zl = 15 pomiarow / miesiac; 20 000 zl = 20 pomiarow”; zarobki 6 000 / 10 000 / 15 000 zł; tabela 6k / 10k / 15-20k | Opis Next Level wg SPEC (poz. 1: 600/800/1 200 zł za pomiar + 250 zł bonusu, × KPI); zarobki „wg tabeli Next Level” (kwotę liczy aplikacja) | D3 |
| 99 | Jakub (NL) | „10 000 zl = 10 pomiarow…”; 4 000 / 7 000 / 10 000 zł; tabela 4k / 7k / 10-15k | jw. | D3 |
| 100 | Julia (Safety) | „3 750 + 200 zł powyżej 5; 10 000 zl wymaga 31 pomiarow… = 36/msc; REALNE M3: 4 750-5 750 zl”; M1 (4 pomiary) = 3 750 zł | Nowe progi Safety; „10 000 zl wymaga 15 pomiarow”; „REALNE M3: 4 350 – 7 000 zl”; M1 (4 pomiary) = **0 zł** (przy zleceniu min. stawka godzinowa); M2 = 3 950 zł; M3 = 4 350 zł; tabela 0 / 3950 / 4350 | D3 |
| 101 | Julia — uwaga | „Next Level gdzie 10 pomiarow = 10 000 zl” | „Next Level (stawki wg tabeli 10 poziomow; pomiary z Safety licza sie do poziomu)” | D3 |
| 102 | Kacper (NL) | „Next Level: 1 000 zl za pomiar… 4 pomiary = 4 000 zl… 7 000 zl”; tabela 4k / 5-6k / 7k→10k | Opis NL wg SPEC; podłoga/marzenie w pomiarach (4 / 10), bez przeliczenia 1 pomiar = 1 000 zł; zarobki „wg tabeli Next Level” | D3 |
| 103 | Natalia (NL) | „1 000 zl za pomiar… 15 000 zl = 15 weryfikacji”; 6 000 / 10 000 / 15 000 zł; tabela 6k / 10k / 15k | jw. | D3 |
| 104 | Jarek (Safety) | „7 300 zl netto wymaga ok. 23 pomiarow”; „REALNE M3: 4 350 - 4 750 zl netto”; M1 = 3 750 zł | Nowe progi Safety; „10 000 zl brutto wymaga 15 pomiarow”; M1 = **0 zł**; M3 = 4 350 – 7 000 zł; tabela 0 / 3950 / 4350-7000 | D3 |
| 105 | Jarek — uwaga | „8 pomiarow na NL = 8 000 zl, czyli wiecej niz cel brutto” | Safety: 8 pomiarów = 4 350 zł, 10 = 7 000 zł; NL wg tabeli 10 poziomów (poz. 1: 600/800/1 200 zł + 250 zł bonusu, × KPI); pomiary z Safety liczą się do poziomu | D3 |

## 15. Checklist scenki D2

| # | Przed | Po | Reguła |
|---|---|---|---|
| 106 | „Kwalifikacja — 4 pytania / Wszystkie 4 pytania” | „Kwalifikacja — 3 pytania / Maksymalnie 3 pytania (piec, wlasnosc, docieplenie)” | D8 |
| 107 | „RODO + karteczka potwierdzenia / … podpis RODO, karteczka wydana klientowi” | „RODO + potwierdzenie wizyty / … podpis RODO palcem w aplikacji, potwierdzenie SMS/e-mail” | D8 |
| 108 | Chwalebna: „konkretna kwota, konkretne oszczednosci” | „konkretne koszty ogrzewania i oszczednosci — bez kwoty dofinansowania” | D5 |

## 16. Scenariusze handlowiec

| # | Fragment | Przed | Po | Reguła |
|---|---|---|---|---|
| 109 | 2. Wariant D „Nie mam pieniędzy” | „Im mniej ktos ma — tym wiecej dotacji mu przysluguje…” | „…wlasnie po to jest ten program… Wysokosc dofinansowania poznamy po pomiarze — zalezy od progu dochodowego.” + zakaz obietnicy „im mniej, tym więcej” (spójne z Bankiem obiekcji) | D5 |
| 110 | 3. Chwalebna | „Pan Stanislaw z Podkarpacia, 138 000 zl dotacji, dzis placi 160 zl” | „…placil 11 tys. zl rocznie, dzis placi 160 zl miesiecznie. Konkret — bez kwoty dofinansowania” | D5 |
| 111 | 7. Slajd 2 | „dotacje 100/70/40%” | + „(wiedza wewnętrzna — nie mówimy klientowi przed pomiarem)” | D5 |
| 112 | 7. Slajd 3 | „Maksymalne kwoty — do 140 300 zl” | „do 170 100 zl … (wiedza wewnętrzna — nie mówimy klientowi przed pomiarem)” | D4, D5 |
| 113 | 8. Widget | „4 KPI z wagami, levele 0-5” | „5 KPI z wagami (wg SPEC.md), poziomy I-V i mnoznik” + uwaga „do aktualizacji” | D2 |
| 114 | 9. Animacja KPI | 4 KPI (bez Raportowania), „CRM jako warunek konieczny — nie KPI”, „Progi 0-5, 75/80/90/100/110%”, kartki ogólnie | 5 KPI wg SPEC (z Raportowaniem z aplikacji, waga 4; termin CRM waga 2); „Zamknij dzień” do 21:00; przedziały mnożnika; pełna lista kartek | D2, D6, D7 |
| 115 | 5. CRM workflow | „Raport dzienny przed 21:00” | „"Zamknij dzien" w aplikacji do 21:00 … brak = dzien niezaliczony + automatyczna zolta kartka” | D6, D7 |
| 116 | 6. GOPS | „bez zdjecia z GOPS pomiar nie liczy sie do prowizji” | „brak GOPS = zolta kartka (prowizja liczona wg statusow umowy w CRM — SPEC.md)” | D7, SPEC |
| — | 10. Launch Pad | „3 KPI uproszczone” / „5 KPI pelnych” / „5 KPI wyzsze progi” | „KPI wg SPEC.md (5 KPI, te same progi)” z adnotacją „nieaktualne, do potwierdzenia” | D2 (liczone w #113–114) |
| — | 11. Follow-up | „brak udokumentowanego follow-up = pomiar nie liczy sie do KPI i prowizji” | Follow-up = obowiązek egzekwowany przez managera; KPI i prowizja wg danych z aplikacji i statusów CRM (SPEC.md) | SPEC (liczone w #116) |

---

## Czego NIE zmieniono (świadomie) — do decyzji Kacpra

1. **Procent dofinansowania w R2** — ROZSTRZYGNIĘTE (Kacper): przed pomiarem audytor nie podaje ani kwot, ani procentów; zdania z „[X] procent” usunięte (R2 i wersja słowna). To nie jest kwota, ale decyzja D5 mówi, że próg dochodowy przed pomiarem nie jest znany. Jeśli audytor ma też nie mówić procentu — trzeba przebudować Tajemnicę Ekonomiczną (liczenie z klientem na kartce).
2. **Safety 0–4 pomiary = 0 zł a cele Launch Pad M1 = 4 pomiary** (Julia, Jarek) — po zmianie audytor Safety, który zrobi plan na M1, zarobi 0 zł (poza minimalną stawką przy zleceniu). Warto podnieść cel M1 do 5 pomiarów albo zmienić próg.
3. **Wybór rejonu** — kontrakt i przewodniki mówiły „audytor sam wybiera rejon”, SPEC mówi „rejon od managera” (Terytorium/Wieża). Wstawiono pointer do SPEC.md; Launch Pady („Samodzielny wybor rejonow bez [managera]”) zostały bez zmian — do potwierdzenia, czy chodzi o planowanie ulic w rejonie od managera.
4. **„3 KPI uproszczone” w Ignition i „wyższe progi” w M3** — oznaczone jako nieaktualne; SPEC nie przewiduje osobnych KPI dla nowych osób.
5. **Kwoty orientacyjne 66 / 99 / 135 tys. zł** dla progów (slajd 3) — zostawione jako wiedza wewnętrzna; nie weryfikowano ich z aktualnym regulaminem programu.
6. **„Do niczego nie zobowiązuje”** w Banku obiekcji — zostawione (dotyczy audytu, a zakaz z kontraktu dotyczy pomiaru „niezobowiązującego”); do ujednolicenia językowego.
7. **Czas procesu „dwa tygodnie”** (R2, Bank obiekcji) — dotyczy procesu klienta, nie rozliczeń; bez zmian.


## Decyzje Kacpra po paczce zbiorczej

- Przed pomiarem audytor nie podaje klientowi ani kwot, ani procentów — usunięto „[X] procent” z R2 i R2 słownej.
- Adresy oficjalnych stron (czystepowietrze.gov.pl) przywrócone w lekcjach.
- Launch Pad: cel M1 podniesiony z 4 do 5 pomiarów (próg Safety).
