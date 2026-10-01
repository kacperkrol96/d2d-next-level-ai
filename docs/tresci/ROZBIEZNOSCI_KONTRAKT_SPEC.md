# Rozbieżności: „Kontrakt audytora” a zasady obowiązujące (SPEC.md + decyzje zarządu)

**Dla:** prawnika Next Level Energy
**Od:** zespół aplikacji D2D Next Level AI (na zlecenie Kacpra Króla)
**Stan na:** 2026-10-01

## Skąd ten dokument

- **Kontrakt** = tekst „Zasady Współpracy Audytora” (4 filary) z sekcji „Kontrakt audytora” pliku `NLE_Onboarding_Komplet.md` — wersja ORYGINALNA z repozytorium (gałąź `tresci-akademii`, commit `908cfd2`). Cytaty są dosłowne (tekst skonwertowany z PDF, bez polskich znaków).
- **Zasady obowiązujące** = specyfikacja aplikacji `docs/SPEC.md` oraz decyzje właściciela z 2026-10-01 (rozliczenia, KPI, Safety/Next Level, kwoty przed pomiarem, rytm pracy, kartki, teren). Aplikacja będzie liczyć wynagrodzenia, KPI i kartki według tych zasad — dlatego kontrakt powinien mówić to samo.
- **Umowa handlowca:** w materiałach **nie ma** kontraktu ani regulaminu dla handlowców (ani managerów). Jest wyłącznie kontrakt audytora. Zasady wynagradzania handlowców (Solo/Duet, nadmarża, „sam VAT”, flota, KPI handlowca) istnieją tylko w SPEC.md i w części szkoleniowej — rekomendujemy przygotowanie osobnego dokumentu (punkt C).
- Rekomendowane brzmienia są **propozycjami do weryfikacji** — nie są opinią prawną. Kwoty i progi w rekomendacjach pochodzą ze SPEC.md; w aplikacji admin może je zmieniać, więc warto, by kontrakt odsyłał do aktualnego „Regulaminu wynagradzania” (załącznik), a nie wpisywał liczb na stałe.

---

## A. Rozbieżności (kontrakt mówi coś innego niż obowiązujące zasady)

### A1. Wybór rejonu
- **Kontrakt:** „Kazdy audytor samodzielnie wybiera i planuje rejon zgodnie z zasadami przekazanymi podczas onboardingu.”
- **Obowiązuje:** rejon (obszar na mapie) wyznacza manager w aplikacji (panel Terytorium / Wieża). Ten sam rejon — maksymalnie raz na 30 dni. Pierwsza wizyta w nowym rejonie zaczyna się od sołtysa.
- **Rekomendacja:** „Audytor pracuje w rejonie wyznaczonym przez managera w aplikacji. W jego granicach samodzielnie planuje trasę. Ten sam rejon może być odwiedzany nie częściej niż raz na 30 dni. Pierwsza wizyta w nowym rejonie rozpoczyna się od wizyty u sołtysa.”
- *Uwaga dla prawnika:* przydział rejonu przez managera to element kierownictwa — ważne przy ocenie ryzyka uznania umowy B2B/zlecenia za stosunek pracy (patrz A12).

### A2. Raportowanie i termin 21:00
- **Kontrakt:** „Brak raportu w CRM = brak pracy. Raport tego samego dnia, przed 21:00.” oraz „CRM to warunek konieczny: brak raportu = brak dnia.”
- **Obowiązuje:** raport składa się w aplikacji przyciskiem „Zamknij dzień” (podsumowanie: domy, otwarcia, leady) — obowiązkowo do 21:00. Brak raportu = **dzień niezaliczony + automatyczna żółta kartka**. Czas pracy liczy aplikacja w „aktywnych blokach” (blok 15 min aktywny, gdy odhaczono min. 1 dom).
- **Rekomendacja:** „Audytor codziennie, do godz. 21:00, zamyka dzień w aplikacji („Zamknij dzień”). Brak zamknięcia dnia w terminie oznacza, że dzień nie jest zaliczany do statystyk i KPI, oraz skutkuje żółtą kartką.” — Prosimy o ocenę, co prawnie oznacza „dzień niezaliczony” (czy ma wpływ na wynagrodzenie — w Safety przy umowie zlecenia liczą się godziny z aplikacji).

### A3. Mówienie klientowi o kwotach
- **Kontrakt (Filar 2 — co wolno):** „Mowisz prawde o programie — kwotach, progach, procesie. Pokazujesz realne realizacje i realne liczby.”
- **Kontrakt (Filar 2 — czego nie wolno):** „Nie obiecujesz zadnej konkretnej kwoty dofinansowania przed wynikiem pomiaru. Mowisz ze wyjdzie to po pomiarach — nie podajesz nawet kwoty "do".”
- **Obowiązuje:** audytor przed pomiarem nie podaje klientowi **żadnej** kwoty dofinansowania — ani konkretnej, ani „do X zł”, ani „program przewiduje do 170 100 zł” — bo nie zna progu dochodowego. Mówi: „Wysokość dofinansowania poznamy po pomiarze — zależy od progu dochodowego.” Złamanie = żółta kartka. Kontrakt jest wewnętrznie sprzeczny (pierwsze zdanie pozwala mówić o kwotach).
- **Rekomendacja:** „Audytor przedstawia rzetelnie program i proces. Przed wykonaniem pomiaru nie podaje klientowi żadnej kwoty dofinansowania, w tym kwot maksymalnych („do …”). Naruszenie skutkuje żółtą kartką.”

### A4. Zgoda RODO i potwierdzenie wizyty
- **Kontrakt:** „Kazde umowione spotkanie przy drzwiach konczy sie podpisem RODO i wydaniem potwierdzenia klientowi.”
- **Obowiązuje:** formularz leada w aplikacji — klient podpisuje zgodę **palcem na ekranie**, potwierdzenie wizyty idzie do klienta **SMS-em lub e-mailem**. Aplikacja nie zbiera PESEL, nr księgi wieczystej, nr działki.
- **Rekomendacja:** „Każde umówione spotkanie audytor rejestruje w aplikacji (formularz leada) wraz ze zgodą klienta złożoną odręcznie na ekranie urządzenia; klient otrzymuje potwierdzenie SMS lub e-mail.”
- *Do sprawdzenia:* treść klauzuli i podstawa prawna (zgoda vs. art. 6 ust. 1 lit. b/f RODO), wartość dowodowa podpisu palcem, czy potrzebna zgoda na kontakt SMS/e-mail (prawo telekomunikacyjne / PKE).

### A5. System KPI — lista wskaźników i wagi
- **Kontrakt:** 5 KPI — Spotkania audytowe (waga 6), Komplet leadów/cykl (4), Realizacja targetu spółki (4), **Odstąpienia (3; 60/55/50/45/40%)**, **Terminowość zadań CRM (3; 85/87,5/90/92,5/95%)**; „Kazdy ocenia sie levelem 0-5”.
- **Obowiązuje (SPEC.md):** każde KPI oceniane na poziomie I–V (1–5 pkt) × waga, suma wag 20 → max 100 pkt:

  | KPI | Waga | I | II | III | IV | V |
  |---|---|---|---|---|---|---|
  | Liczba unikalnych spotkań | 6 | 3 | 3,25 | 3,5 | 3,75 | 4 |
  | Komplet leadów na cykl | 4 | 9 | 9,5 | 10 | 11 | 11,5 |
  | Realizacja targetu spółki | 4 | 90% | 95% | 100% | 105% | 110% |
  | Raportowanie (z aplikacji) — % aktywnych bloków w czasie pracy | 4 | 85% | 90% | 92,5% | 95% | 100% |
  | Termin realizacji zadań w CRM | 2 | 48h | 36h | 24h | 12h | 0h |

  „Odstąpienia” nie są już KPI. KPI bez danych jest pomijane, a wynik przeskalowany do 100 pkt.
- **Rekomendacja:** w kontrakcie tylko zasada („wynagrodzenie jest mnożone przez współczynnik KPI wg Regulaminu KPI; KPI liczy aplikacja na podstawie danych z aplikacji i CRM”), a tabela w załączniku, który zarząd może aktualizować z wyprzedzeniem (np. 14 dni) — bo wagi i progi są edytowalne w panelu admina.

### A6. Przedziały punktów i mnożnik wynagrodzenia
- **Kontrakt:** V 91–100 = 110%; IV 76–90 = 100%; III 61–75 = 90%; II 51–60 = 80%; I 30–50 = 75%.
- **Obowiązuje:** 90–100 = 110%; 70–89 = 100%; 59–69 = 90%; 46–58 = 80%; 30–45 = 75%; **0–29 = 75% + alert do managera + żółta kartka**.
- **Rekomendacja:** wpisać nowe przedziały (w załączniku) i wskazać, do czego mnożnik się stosuje: w Next Level — do stawki za pomiar i bonusu; w Safety — do całej wypłaty miesięcznej (domyślnie). Wynagrodzenie za opiekę nad zespołem — bez mnożnika.

### A7. Wynik poniżej 30 pkt
- **Kontrakt:** „Ponizej 30 punktow = level 0 — rozstajemy sie. Zwolnienie i czerwona kartka od razu, niezaleznie od pojedynczych KPI.”
- **Obowiązuje:** poniżej 30 pkt = mnożnik 75%, alert do managera i **żółta** kartka (zapis w historii). Brak automatycznego rozstania.
- **Rekomendacja:** „Wynik KPI poniżej 30 pkt w okresie rozliczeniowym skutkuje zastosowaniem współczynnika 75% oraz żółtą kartką.” Słowo „zwolnienie” nie pasuje do umowy B2B / zlecenia — jeśli spółka chce mieć prawo wypowiedzenia, należy to opisać jako przesłankę wypowiedzenia umowy (z terminem).

### A8. Częstotliwość ocen i rozliczeń
- **Kontrakt:** „Snapshot pozycji co 2 tygodnie.”
- **Obowiązuje:** okresy rozliczeniowe: **1–15 dnia miesiąca** (rozliczenie/akceptacja do 20., wypłata 25.) oraz **16–ostatni dzień miesiąca** (akceptacja do 5. następnego miesiąca, wypłata 10. następnego miesiąca). KPI są liczone na żywo w aplikacji.
- **Rekomendacja:** „Rozliczenie następuje w dwóch okresach miesięcznie: od 1. do 15. dnia (płatność do 25. dnia) oraz od 16. do ostatniego dnia miesiąca (płatność do 10. dnia następnego miesiąca). Terminy mogą zostać zmienione przez spółkę z wyprzedzeniem.” Safety rozlicza się miesięcznie (wg liczby pomiarów w miesiącu) — trzeba wskazać, w którym okresie wypłacana jest część Safety.

### A9. Kartki
- **Kontrakt:** „Zolta kartka: spoznienia, brak CRM, brak GOPS, obietnica kwoty przed pomiarem, presja na kliencie. Czerwona kartka: 3 spoznienia, 2 nieobecnosci lub 2 zolte kartki.”
- **Obowiązuje:** żółta — spóźnienie, **brak raportu w CRM/aplikacji**, brak GOPS, obietnica kwoty przed pomiarem, presja na kliencie, **wynik KPI < 30 pkt**; czerwona — 3 spóźnienia, 2 nieobecności lub 2 żółte kartki.
- **Brakuje w kontrakcie:** (1) **skutek czerwonej kartki** (rozwiązanie umowy? utrata wariantu? — nigdzie nie napisano); (2) **okres liczenia** kartek (aplikacja ma ustawienie domyślne 90 dni — do potwierdzenia przez zarząd); (3) czy kartka wpływa na wynagrodzenie; (4) tryb odwołania / wyjaśnienia; (5) definicje „spóźnienia” i „nieobecności” przy umowie cywilnoprawnej.
- **Rekomendacja:** pełna lista przewinień, okres, w którym kartki się sumują, skutek czerwonej kartki i prawo audytora do wyjaśnień (np. 3 dni), zapis kartki w historii w aplikacji.

### A10. Odprawy
- **Kontrakt:** „Odprawy: co drugi dzien rano 8:30 w dni leadowe. W kazdy poniedzialek wszyscy o 8:00 do biura.”
- **Obowiązuje:** odprawy **pon/śr/pt o 8:30**; w każdy poniedziałek o 8:00 wszyscy w biurze.
- **Rekomendacja:** wpisać dni wprost (bez „co drugi dzień”). Obowiązkowy udział w odprawach o stałej godzinie — patrz A12.

### A11. Rytm pracy — doprecyzowanie
- **Kontrakt:** „Cykl trwa dwa dni — jeden dzien pukanie (leadowy), jeden dzien audyty… Pracujesz od 9:00 rowno do momentu umowienia 12 leadow — czasem skonczysz o 12, czasem bedziesz do 21.”
- **Obowiązuje:** pon/śr/pt — dzień leadowy (12 leadów, umawianie co godzinę 9–20); wt/czw/sob — audytor sam odbywa 6 spotkań. Cel cyklu 12/6/2/1, tygodnia 36 umówionych / 18 odbytych. Kontrakt jest zgodny co do idei, ale nie podaje dni tygodnia ani celu tygodniowego.
- **Rekomendacja:** dopisać dni i cele jako **standard / cel**, a nie obowiązek godzinowy (patrz A12).

### A12. Wynagrodzenie minimalne i charakter umowy (ważne)
- **Kontrakt:** nie określa rodzaju umowy ani wynagrodzenia (tytuł mówi „poziomy wynagrodzenia”, ale treść ich nie zawiera).
- **Obowiązuje:** w systemie **Safety 0–4 pomiary w miesiącu = 0 zł**; przy umowie zlecenia — co najmniej minimalna stawka godzinowa × godziny pracy z aplikacji (decyzja „do potwierdzenia z prawnikiem”). Aplikacja przechowuje rodzaj umowy (B2B / zlecenie), datę końca i wariant.
- **Pytania do prawnika:**
  1. Czy przy umowie zlecenia (i B2B osoby samozatrudnionej bez pracowników) obowiązuje minimalna stawka godzinowa, skoro kontrakt narzuca dni, godzinę rozpoczęcia (9:00), odprawy i rejon? (Wyjątek dla wynagrodzenia wyłącznie prowizyjnego dotyczy sytuacji, gdy wykonawca sam decyduje o miejscu i czasie.)
  2. Czy liczenie godzin „z aplikacji” (aktywne bloki 15 min) jest wystarczającym potwierdzeniem liczby godzin?
  3. Ryzyko uznania współpracy za stosunek pracy (stałe godziny, odprawy, przydział rejonu, kary-kartki, GPS) — jak sformułować zapisy, żeby to ograniczyć.

---

## B. Czego w kontrakcie brakuje (a aplikacja to stosuje)

### B1. System wynagrodzenia: Safety albo Next Level
Kontrakt nie zawiera żadnych zasad wynagradzania. Obowiązuje:
- **SAFETY** (miesięcznie, wg liczby pomiarów): 0–4 = 0 zł (przy zleceniu min. stawka godzinowa — do potwierdzenia); 5–9 = 3 750 zł + 200 zł za każdy pomiar powyżej 5; 10–14 = 7 000 zł + 250 zł za każdy powyżej 10; 15+ = 10 000 zł + 300 zł za każdy powyżej 15. Bez bonusu za zamknięcie. Mnożnik KPI na całość (domyślnie).
- **NEXT LEVEL** — tabela 10 poziomów: stawka za pomiar wg progu dochodowego klienta (np. poziom 1: 600 / 800 / 1 200 zł; poziom 10: 1 275 / 1 700 / 2 325 zł) + bonus za zamknięcie (250–1 375 zł), gdy prowizja handlowca u tego klienta jest „zielona”; awanse wg liczby klientów (0/3/10/30/50/100/200/350/600/1000; od poziomu 5 także aktywne osoby w strukturze); poziom zdobyty raz zostaje; manager dostaje dyferencję.
- **Awans obowiązuje od następnej umowy** — umowa, która daje awans, jest płatna jeszcze po starej stawce.
- Wybór systemu na starcie; zmiana tylko **Safety → Next Level** (decyzja managera); wyjątek — manager może czasowo przenieść z powrotem na Safety (choroba, wypadek). Pomiary z Safety liczą się do poziomu po przejściu.
- **Audytor nie ma udziału w nadmarży** (mają go wyłącznie handlowcy).
- **Rekomendacja:** dodać rozdział „Wynagrodzenie” z zasadami + załącznik z tabelami; wskazać, kto i jak zmienia stawki (aplikacja pozwala adminowi edytować wszystkie liczby).

### B2. Kiedy wynagrodzenie jest należne (statusy w CRM)
- Prowizja audytora (Next Level) jest „szara” od statusu umowy audytowej „DOKUMENTACJA POMIAROWA”, a „zielona” (należna) od „TWORZENIE OFERTY”. Bonus — gdy prowizja handlowca u klienta jest zielona.
- Stawka liczona wg poziomu, który audytor miał tuż przed danym klientem.
- **Rekomendacja:** zapisać, że podstawą jest status w systemie CRM spółki, a nierozpoznane przypadki trafiają do wyjaśnienia (wstrzymanie wypłaty do czasu wyjaśnienia).

### B3. Reguła „Nie ma w aplikacji = nie ma klienta”
- Prowizja i zaliczenie do awansu tylko dla klientów, których lead powstał w aplikacji **przed** umową; reguła włączana od daty ustalonej przez zarząd (bez działania wstecz); manager może zatwierdzić wyjątek z podaniem powodu.
- **Rekomendacja:** wprost w kontrakcie — inaczej odmowa prowizji może być sporna.

### B4. Potrącenia i korekty
- Spadek umowy w status negatywny po wypłacie = **potrącenie** w rozliczeniu okresu, w którym nastąpił spadek; potrącenie większe niż wypłata → wypłata 0 zł, reszta na kolejny okres; przy odejściu osoby — rozliczenie ręczne przez zarząd.
- Rezygnacja klienta odejmuje go z licznika awansu (poziom zostaje).
- **Rekomendacja:** zapis o prawie do potrącenia / zwrotu (dla B2B — korekta faktury lub nota; dla zlecenia — zgoda na potrącenie z kolejnego wynagrodzenia), z oceną zgodności z prawem.

### B5. Akceptacja rozliczenia i dokument rozliczeniowy
- Proces: aplikacja liczy → zarząd akceptuje/koryguje (z powodem) → audytor akceptuje w aplikacji. B2B: audytor wystawia fakturę na podstawie danych z aplikacji. Zlecenie: aplikacja generuje rachunek PDF i wysyła go mailem do biura i księgowości.
- **Rekomendacja:** opisać termin na akceptację/zgłoszenie zastrzeżeń i skutek braku akceptacji.

### B6. Nagrywanie rozmów z klientami
- Aplikacja ma przycisk „Nagraj”; przed nagraniem obowiązkowa formuła informacyjna dla klienta i potwierdzenie „Klient poinformowany o nagrywaniu”. **Minimum 20% odbytych spotkań** ma być nagrane. Nagrania odsłuchuje manager; usuwane automatycznie po X dniach (domyślnie 30). W wersji 1.1: transkrypcja i ocena przez AI (dostawca: OpenAI), po transkrypcji audio usuwane, zostaje transkrypcja z ukrytymi danymi osobowymi.
- **Rekomendacja / do ustalenia:** obowiązek nagrywania i informowania klienta w kontrakcie; treść formuły informacyjnej; podstawa prawna wobec klienta i wobec audytora (jego głos też jest nagrywany); okres przechowywania; przekazanie danych do dostawcy AI (umowa powierzenia, transfer poza EOG).

### B7. GPS i czas pracy w aplikacji
- Przycisk „Rozpocznij dzień” uruchamia czas pracy i GPS. GPS **tylko w godzinach pracy** i tylko przy otwartej aplikacji; służy do potwierdzenia obecności przy domu (np. 30 m) i do alertu „puste przejścia” (GPS minął X domów, odhaczono Y). Czas pracy = aktywne bloki.
- **Rekomendacja:** klauzula informacyjna dla audytora (art. 13 RODO), cel i zakres lokalizacji, ograniczenie do godzin pracy, okres przechowywania danych lokalizacyjnych, kto ma dostęp (manager w panelu Wieża). Obowiązek korzystania z aplikacji podczas pracy w terenie.

### B8. Przechowywanie i usuwanie danych
- Nagrania — domyślnie 30 dni; screenshoty opinii i zdjęcia z klientem (dotyczy handlowców) — usuwane 90 dni po zaliczeniu; z CRM nigdy nie pobieramy PESEL, nr ksiąg wieczystych, nr działek. Tryb offline — dane chwilowo na urządzeniu.
- **Rekomendacja:** zapis o obowiązku zabezpieczenia urządzenia (blokada ekranu), zakaz kopiowania danych klientów poza aplikację, okresy retencji w polityce danych spółki; dyktowanie leadów głosem (AI) — dane klienta trafiają do dostawcy AI.

### B9. Zasady pracy w terenie (standard)
- Przy drzwiach maksymalnie **3 pytania kwalifikacyjne**; na jedną obiekcję maksymalnie **3 odbicia** (potem audytor odchodzi); rejon raz na 30 dni; sołtys przy pierwszej wizycie.
- **Rekomendacja:** dopisać jako standard etyczny (ochrona przed zarzutem nachalnej sprzedaży; zgodne z „presja na kliencie” = żółta kartka).

### B10. Dane o umowie w aplikacji
- Aplikacja pokazuje rodzaj umowy (B2B / zlecenie), datę końca i wariant (pole od admina). Kontrakt ma tylko „Data rozpoczęcia współpracy”.
- **Rekomendacja:** w metryczce kontraktu: rodzaj umowy, data końca (lub czas nieokreślony), wybrany system wynagrodzenia (Safety / Next Level).

### B11. Lojalność i poufność (uwaga porządkowa)
- Kontrakt zakazuje działalności konkurencyjnej „w trakcie wspolpracy” i mówi, że baza leadów jest własnością firmy — brak skutków naruszenia, okresu po zakończeniu współpracy i zasad zwrotu danych/urządzeń. Nie wynika to ze SPEC.md, ale warto uzupełnić przy okazji.

---

## C. Umowa / regulamin handlowca — nie istnieje

W materiałach nie ma kontraktu handlowca. Aplikacja liczy handlowcom m.in.: stawki Solo/Duet wg 10 poziomów, „Dopłatę do Duetu”, udział w nadmarży (30–75%, limit 10% wartości netto umów termo + źródło ciepła, bez REK), cięcie prowizji o 75% dla klienta „sam VAT”, prowizję należną od statusu „W TRAKCIE SKŁADANIA WNIOSKU DO WFOŚiGW”, awans od następnej umowy, klientów zespołu od poziomu 5, wynagrodzenie za opiekę nad zespołem (bez mnożnika KPI), KPI handlowca (6 wskaźników), koszt floty (0–1 klient = 1 500 zł, 2–3 = 750 zł, 4+ = 0 zł, potrącany w najbliższym rozliczeniu — forma księgowa do ustalenia z księgowym), zasadę 3 dni w Radarze, wymóg zgody klienta na zdjęcie (opinie 5★) oraz nagrywanie spotkań domykających. Rekomendujemy przygotowanie osobnego kontraktu handlowca z tymi zasadami (SPEC: „mechanizm kartek dla handlowców zdefiniujemy później”).
