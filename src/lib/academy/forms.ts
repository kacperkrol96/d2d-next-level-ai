import type { FormId } from "./types";

/**
 * Karty wypełniane przez managera w aplikacji (z docs/tresci/NLE_Onboarding_Komplet.md):
 * checklista scenki D2 (ocena 1–5), karty obserwacji D3 i D4.
 * Opcje decyzji D4 — założenie do potwierdzenia przez Zarząd (karta w źródle nie ma decyzji).
 */
export type FormItem =
  | { id: string; label: string; type: "text" | "number" | "time" }
  | { id: string; label: string; type: "choice"; options: string[] }
  | { id: string; label: string; type: "scale"; hint?: string };

export interface FormDef {
  id: FormId;
  title: string;
  purpose: string;
  sections: { title: string; items: FormItem[] }[];
  /** Karta punktowana (suma ocen 1–5). */
  scored: boolean;
  /** Decyzja managera; `pass` = decyzja zaliczająca etap. */
  decision: { options: string[]; pass: string } | null;
}

export const SCALE_LABELS = ["brak", "słabo", "przeciętnie", "dobrze", "wzorcowo"] as const;

export const forms: FormDef[] = [
  {
    "id": "d3",
    "title": "Karta obserwacji D3",
    "purpose": "Nowy audytor na bieżąco notuje, co obserwuje u seniora podczas shadowingu (pukanie od drzwi do drzwi i audyty 6 Tajemnic), robi debrief po spotkaniach i podsumowuje dzień. Manager czyta kartę przed rozmową z audytorem przed D4, żeby wiedzieć, czego się boi i co wzmocnić przed pierwszym samodzielnym dniem.",
    "sections": [
      {
        "title": "Część A — Przed wyjściem w teren (odprawa 8:30)",
        "items": [
          {
            "id": "d3.a.senior",
            "label": "Senior",
            "type": "text"
          },
          {
            "id": "d3.a.rejon",
            "label": "Rejon",
            "type": "text"
          },
          {
            "id": "d3.a.dlaczegoRejon",
            "label": "Dlaczego ten rejon — co powiedział senior",
            "type": "text"
          },
          {
            "id": "d3.a.trasa",
            "label": "Jak senior zaplanował trasę (od której ulicy, w którą stronę)",
            "type": "text"
          },
          {
            "id": "d3.a.liczbaDomow",
            "label": "Szacowana liczba domów w rejonie",
            "type": "number"
          },
          {
            "id": "d3.a.godzina12",
            "label": "Planowana godzina 12 leadów",
            "type": "time"
          }
        ]
      },
      {
        "title": "Część B — Dom 1",
        "items": [
          {
            "id": "d3.b.dom1.ktoOtworzyl",
            "label": "Kto otworzył",
            "type": "text"
          },
          {
            "id": "d3.b.dom1.wiek",
            "label": "Wiek",
            "type": "text"
          },
          {
            "id": "d3.b.dom1.wynik",
            "label": "Wynik",
            "type": "choice",
            "options": [
              "Umówiony",
              "Odmowa",
              "Powrót"
            ]
          },
          {
            "id": "d3.b.dom1.icebreaker",
            "label": "Icebreaker seniora",
            "type": "text"
          },
          {
            "id": "d3.b.dom1.obiekcja",
            "label": "Obiekcja, która padła",
            "type": "text"
          },
          {
            "id": "d3.b.dom1.jakOddalil",
            "label": "Jak senior oddalił obiekcję",
            "type": "text"
          },
          {
            "id": "d3.b.dom1.zapamietalem",
            "label": "Co zapamiętałem",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część B — Dom 2",
        "items": [
          {
            "id": "d3.b.dom2.ktoOtworzyl",
            "label": "Kto otworzył",
            "type": "text"
          },
          {
            "id": "d3.b.dom2.wiek",
            "label": "Wiek",
            "type": "text"
          },
          {
            "id": "d3.b.dom2.wynik",
            "label": "Wynik",
            "type": "choice",
            "options": [
              "Umówiony",
              "Odmowa",
              "Powrót"
            ]
          },
          {
            "id": "d3.b.dom2.icebreaker",
            "label": "Icebreaker seniora",
            "type": "text"
          },
          {
            "id": "d3.b.dom2.obiekcja",
            "label": "Obiekcja, która padła",
            "type": "text"
          },
          {
            "id": "d3.b.dom2.jakOddalil",
            "label": "Jak senior oddalił obiekcję",
            "type": "text"
          },
          {
            "id": "d3.b.dom2.zapamietalem",
            "label": "Co zapamiętałem",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część B — Dom 3",
        "items": [
          {
            "id": "d3.b.dom3.ktoOtworzyl",
            "label": "Kto otworzył",
            "type": "text"
          },
          {
            "id": "d3.b.dom3.wiek",
            "label": "Wiek",
            "type": "text"
          },
          {
            "id": "d3.b.dom3.wynik",
            "label": "Wynik",
            "type": "choice",
            "options": [
              "Umówiony",
              "Odmowa",
              "Powrót"
            ]
          },
          {
            "id": "d3.b.dom3.icebreaker",
            "label": "Icebreaker seniora",
            "type": "text"
          },
          {
            "id": "d3.b.dom3.obiekcja",
            "label": "Obiekcja, która padła",
            "type": "text"
          },
          {
            "id": "d3.b.dom3.jakOddalil",
            "label": "Jak senior oddalił obiekcję",
            "type": "text"
          },
          {
            "id": "d3.b.dom3.zapamietalem",
            "label": "Co zapamiętałem",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część C — Audyt 1: obserwacja 6 Tajemnic (wypełnij w aucie po każdym spotkaniu)",
        "items": [
          {
            "id": "d3.c.audyt1.imie",
            "label": "Imię klienta",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.miejscowosc",
            "label": "Miejscowość",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.radosna",
            "label": "Radosna — icebreaker, przejęcie przestrzeni, alfa domu i gdzie usiadł",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.bolesna",
            "label": "Bolesna — koszty ogrzewania, obowiązek wymiany pieca, dyrektywy UE",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.swiatla",
            "label": "Światła — które realizacje pokazał i dlaczego akurat te",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.chwalebna",
            "label": "Chwalebna — jaki przykład klienta senior przywołał, jak klient zareagował",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.ekon.osoby",
            "label": "Ekonomiczna — liczba osób",
            "type": "number"
          },
          {
            "id": "d3.c.audyt1.ekon.dochod",
            "label": "Ekonomiczna — łączny dochód",
            "type": "number"
          },
          {
            "id": "d3.c.audyt1.ekon.dochodNaOsobe",
            "label": "Ekonomiczna — = dochód/os.: ___ zł/os.",
            "type": "number"
          },
          {
            "id": "d3.c.audyt1.ekon.jakPytal",
            "label": "Jak senior pytał o dodatkowe osoby w gospodarstwie",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.ekon.dodatkoweOsoby",
            "label": "Dodatkowe osoby wykryte (zagraniczne, dzieci, etc.)",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.ekon.przedDochod",
            "label": "PRZED: (dochód/os. przed dopytaniem o dodatkowe osoby)",
            "type": "number"
          },
          {
            "id": "d3.c.audyt1.ekon.przedProg",
            "label": "Próg (PRZED)",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.ekon.poDochod",
            "label": "PO: (dochód/os. po dopytaniu)",
            "type": "number"
          },
          {
            "id": "d3.c.audyt1.ekon.poProg",
            "label": "Próg (PO)",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.zmianaProgu",
            "label": "Czy zmiana progu miała wpływ na zamknięcie",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.pewnosci",
            "label": "Pewności — ptaszki na kartce, jak padło „To rozumiem, że sprawdzamy?”",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.obiekcja",
            "label": "Obiekcja przy audycie",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.jakOddalil",
            "label": "Jak oddalił",
            "type": "text"
          },
          {
            "id": "d3.c.audyt1.wynik",
            "label": "Wynik audytu",
            "type": "choice",
            "options": [
              "Umowa podpisana",
              "Przełożone",
              "Odmowa"
            ]
          },
          {
            "id": "d3.c.audyt1.inaczejNizSkrypt",
            "label": "Co senior zrobił inaczej niż skrypt i dlaczego",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część C — Audyt 2: obserwacja 6 Tajemnic (wypełnij w aucie po każdym spotkaniu)",
        "items": [
          {
            "id": "d3.c.audyt2.imie",
            "label": "Imię klienta",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.miejscowosc",
            "label": "Miejscowość",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.radosna",
            "label": "Radosna — icebreaker, przejęcie przestrzeni, alfa domu i gdzie usiadł",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.bolesna",
            "label": "Bolesna — koszty ogrzewania, obowiązek wymiany pieca, dyrektywy UE",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.swiatla",
            "label": "Światła — które realizacje pokazał i dlaczego akurat te",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.chwalebna",
            "label": "Chwalebna — jaki przykład klienta senior przywołał, jak klient zareagował",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.ekon.osoby",
            "label": "Ekonomiczna — liczba osób",
            "type": "number"
          },
          {
            "id": "d3.c.audyt2.ekon.dochod",
            "label": "Ekonomiczna — łączny dochód",
            "type": "number"
          },
          {
            "id": "d3.c.audyt2.ekon.dochodNaOsobe",
            "label": "Ekonomiczna — = dochód/os.: ___ zł/os.",
            "type": "number"
          },
          {
            "id": "d3.c.audyt2.ekon.jakPytal",
            "label": "Jak senior pytał o dodatkowe osoby w gospodarstwie",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.ekon.dodatkoweOsoby",
            "label": "Dodatkowe osoby wykryte (zagraniczne, dzieci, etc.)",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.ekon.przedDochod",
            "label": "PRZED: (dochód/os. przed dopytaniem o dodatkowe osoby)",
            "type": "number"
          },
          {
            "id": "d3.c.audyt2.ekon.przedProg",
            "label": "Próg (PRZED)",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.ekon.poDochod",
            "label": "PO: (dochód/os. po dopytaniu)",
            "type": "number"
          },
          {
            "id": "d3.c.audyt2.ekon.poProg",
            "label": "Próg (PO)",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.zmianaProgu",
            "label": "Czy zmiana progu miała wpływ na zamknięcie",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.pewnosci",
            "label": "Pewności — ptaszki na kartce, jak padło „To rozumiem, że sprawdzamy?”",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.obiekcja",
            "label": "Obiekcja przy audycie",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.jakOddalil",
            "label": "Jak oddalił",
            "type": "text"
          },
          {
            "id": "d3.c.audyt2.wynik",
            "label": "Wynik audytu",
            "type": "choice",
            "options": [
              "Umowa podpisana",
              "Przełożone",
              "Odmowa"
            ]
          },
          {
            "id": "d3.c.audyt2.inaczejNizSkrypt",
            "label": "Co senior zrobił inaczej niż skrypt i dlaczego",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część D — Debrief w aucie (5 minut po każdym spotkaniu)",
        "items": [
          {
            "id": "d3.d.audyt1.najlepiej",
            "label": "Debrief po audycie 1 — Co zadziałało najlepiej",
            "type": "text"
          },
          {
            "id": "d3.d.audyt1.inaczej",
            "label": "Debrief po audycie 1 — Co zrobiłbym inaczej",
            "type": "text"
          },
          {
            "id": "d3.d.audyt1.jutro",
            "label": "Debrief po audycie 1 — Jedna rzecz, którą jutro wdrożę",
            "type": "text"
          },
          {
            "id": "d3.d.audyt2.najlepiej",
            "label": "Debrief po audycie 2 — Co zadziałało najlepiej",
            "type": "text"
          },
          {
            "id": "d3.d.audyt2.inaczej",
            "label": "Debrief po audycie 2 — Co zrobiłbym inaczej",
            "type": "text"
          },
          {
            "id": "d3.d.audyt2.jutro",
            "label": "Debrief po audycie 2 — Jedna rzecz, którą jutro wdrożę",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część E — Podsumowanie dnia (wypełnij wieczorem przed raportem CRM)",
        "items": [
          {
            "id": "d3.e.domow",
            "label": "Domów z seniorem",
            "type": "number"
          },
          {
            "id": "d3.e.leadow",
            "label": "Umówionych leadów",
            "type": "number"
          },
          {
            "id": "d3.e.audytow",
            "label": "Audytów przeprowadzonych",
            "type": "number"
          },
          {
            "id": "d3.e.umow",
            "label": "Podpisanych umów",
            "type": "number"
          },
          {
            "id": "d3.e.technika",
            "label": "Najlepsza technika, którą dziś zobaczyłem — opisz jednym zdaniem",
            "type": "text"
          },
          {
            "id": "d3.e.najtrudniejszy",
            "label": "Najtrudniejszy moment dnia — co się wydarzyło i jak senior to rozwiązał",
            "type": "text"
          },
          {
            "id": "d3.e.boje",
            "label": "Czego się boję najbardziej przed jutrzejszym D4",
            "type": "text"
          },
          {
            "id": "d3.e.pytanie",
            "label": "Moje pytanie do managera przed D4",
            "type": "text"
          }
        ]
      },
      {
        "title": "Podpisy",
        "items": [
          {
            "id": "d3.p.audytorData",
            "label": "Data",
            "type": "text"
          },
          {
            "id": "d3.p.managerData",
            "label": "Data",
            "type": "text"
          }
        ]
      }
    ],
    "scored": false,
    "decision": null
  },
  {
    "id": "d4",
    "title": "Karta obserwacji D4",
    "purpose": "Pierwszy dzień audytowy: w pierwszej połowie audytor obserwuje audyty seniora (jak w D3), w drugiej prowadzi audyty samodzielnie, a senior milczy i notuje. Karta dokumentuje obie części i podsumowanie dnia.",
    "sections": [
      {
        "title": "Dane podstawowe",
        "items": [
          {
            "id": "d4.0.senior",
            "label": "Senior / Manager",
            "type": "text"
          },
          {
            "id": "d4.0.rejon",
            "label": "Rejon",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część A — Obserwacja: audyt seniora 1 (6 Tajemnic; wypełnij w aucie po wyjściu od klienta)",
        "items": [
          {
            "id": "d4.a.audyt1.imie",
            "label": "Imię klienta",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.miejscowosc",
            "label": "Miejscowość",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.radosna",
            "label": "Radosna — icebreaker, przejęcie przestrzeni, gdzie usiadł klient, kto jest alfą",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.bolesna",
            "label": "Bolesna — koszty ogrzewania, obowiązek wymiany, dyrektywy UE",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.swiatla",
            "label": "Światła — które realizacje pokazał senior i dlaczego akurat te",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.chwalebna",
            "label": "Chwalebna — jaki przykład klienta przywołał, jak klient zareagował",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.ekon.osoby",
            "label": "Ekonomiczna — liczba osób",
            "type": "number"
          },
          {
            "id": "d4.a.audyt1.ekon.dochod",
            "label": "Ekonomiczna — łączny dochód",
            "type": "number"
          },
          {
            "id": "d4.a.audyt1.ekon.dochodNaOsobe",
            "label": "Ekonomiczna — = dochód/os.: ___ zł/os.",
            "type": "number"
          },
          {
            "id": "d4.a.audyt1.ekon.jakPytal",
            "label": "Jak senior pytał o dodatkowe osoby",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.ekon.przedDochod",
            "label": "PRZED: (dochód/os. przed dopytaniem o dodatkowe osoby)",
            "type": "number"
          },
          {
            "id": "d4.a.audyt1.ekon.przedProg",
            "label": "Próg (PRZED)",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.ekon.poDochod",
            "label": "PO: (dochód/os. po dopytaniu)",
            "type": "number"
          },
          {
            "id": "d4.a.audyt1.ekon.poProg",
            "label": "Próg (PO)",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.zmianaProgu",
            "label": "Czy zmiana progu miała wpływ na zamknięcie",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.pewnosci",
            "label": "Pewności — ptaszki na kartce, zamknięcie „To rozumiem, że sprawdzamy?”",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.obiekcja",
            "label": "Obiekcja przy audycie",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.jakOddalil",
            "label": "Jak senior oddalił",
            "type": "text"
          },
          {
            "id": "d4.a.audyt1.wynik",
            "label": "Wynik audytu seniora",
            "type": "choice",
            "options": [
              "Umowa podpisana",
              "Przełożone",
              "Odmowa"
            ]
          }
        ]
      },
      {
        "title": "Część A — Obserwacja: audyt seniora 2 (6 Tajemnic; wypełnij w aucie po wyjściu od klienta)",
        "items": [
          {
            "id": "d4.a.audyt2.imie",
            "label": "Imię klienta",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.miejscowosc",
            "label": "Miejscowość",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.radosna",
            "label": "Radosna — icebreaker, przejęcie przestrzeni, gdzie usiadł klient, kto jest alfą",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.bolesna",
            "label": "Bolesna — koszty ogrzewania, obowiązek wymiany, dyrektywy UE",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.swiatla",
            "label": "Światła — które realizacje pokazał senior i dlaczego akurat te",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.chwalebna",
            "label": "Chwalebna — jaki przykład klienta przywołał, jak klient zareagował",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.ekon.osoby",
            "label": "Ekonomiczna — liczba osób",
            "type": "number"
          },
          {
            "id": "d4.a.audyt2.ekon.dochod",
            "label": "Ekonomiczna — łączny dochód",
            "type": "number"
          },
          {
            "id": "d4.a.audyt2.ekon.dochodNaOsobe",
            "label": "Ekonomiczna — = dochód/os.: ___ zł/os.",
            "type": "number"
          },
          {
            "id": "d4.a.audyt2.ekon.jakPytal",
            "label": "Jak senior pytał o dodatkowe osoby",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.ekon.przedDochod",
            "label": "PRZED: (dochód/os. przed dopytaniem o dodatkowe osoby)",
            "type": "number"
          },
          {
            "id": "d4.a.audyt2.ekon.przedProg",
            "label": "Próg (PRZED)",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.ekon.poDochod",
            "label": "PO: (dochód/os. po dopytaniu)",
            "type": "number"
          },
          {
            "id": "d4.a.audyt2.ekon.poProg",
            "label": "Próg (PO)",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.zmianaProgu",
            "label": "Czy zmiana progu miała wpływ na zamknięcie",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.pewnosci",
            "label": "Pewności — ptaszki na kartce, zamknięcie „To rozumiem, że sprawdzamy?”",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.obiekcja",
            "label": "Obiekcja przy audycie",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.jakOddalil",
            "label": "Jak senior oddalił",
            "type": "text"
          },
          {
            "id": "d4.a.audyt2.wynik",
            "label": "Wynik audytu seniora",
            "type": "choice",
            "options": [
              "Umowa podpisana",
              "Przełożone",
              "Odmowa"
            ]
          }
        ]
      },
      {
        "title": "Część B — Mój audyt 1, samodzielny (wypełnij w aucie po wyjściu od klienta)",
        "items": [
          {
            "id": "d4.b.audyt1.imie",
            "label": "Imię klienta",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.miejscowosc",
            "label": "Miejscowość",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.radosna",
            "label": "Radosna — jak przejąłeś przestrzeń? Gdzie usiadł klient? Kto był alfą?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.bolesna",
            "label": "Bolesna — jak przedstawiłeś koszty i obowiązek wymiany?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.swiatla",
            "label": "Światła — które realizacje pokazałeś i dlaczego?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.chwalebna",
            "label": "Chwalebna — jaki przykład klienta przywołałeś?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.pewnosci",
            "label": "Pewności — jak narysowałeś ptaszki? Jak padło zamknięcie?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.ekon.osoby",
            "label": "Ekonomiczna (wyliczenie) — liczba osób",
            "type": "number"
          },
          {
            "id": "d4.b.audyt1.ekon.dochod",
            "label": "Ekonomiczna — dochód",
            "type": "number"
          },
          {
            "id": "d4.b.audyt1.ekon.dochodNaOsobe",
            "label": "Ekonomiczna — = dochód/os.: ___ zł/os.",
            "type": "number"
          },
          {
            "id": "d4.b.audyt1.ekon.dodatkoweOsoby",
            "label": "Jakie dodatkowe osoby wykryłem pytaniami",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.ekon.przedDochod",
            "label": "PRZED",
            "type": "number"
          },
          {
            "id": "d4.b.audyt1.ekon.przedProg",
            "label": "Próg (PRZED)",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.ekon.poDochod",
            "label": "PO",
            "type": "number"
          },
          {
            "id": "d4.b.audyt1.ekon.poProg",
            "label": "Próg (PO)",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.obiekcja",
            "label": "Obiekcja, która padła",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.jakOddaliles",
            "label": "Jak oddaliłeś",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.wynik",
            "label": "Wynik mojego audytu",
            "type": "choice",
            "options": [
              "Umowa podpisana",
              "Przełożone",
              "Odmowa"
            ]
          },
          {
            "id": "d4.b.audyt1.dobrze",
            "label": "Co zrobiłem dobrze",
            "type": "text"
          },
          {
            "id": "d4.b.audyt1.inaczej",
            "label": "Co następnym razem zrobię inaczej",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część B — Mój audyt 2, samodzielny (wypełnij w aucie po wyjściu od klienta)",
        "items": [
          {
            "id": "d4.b.audyt2.imie",
            "label": "Imię klienta",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.miejscowosc",
            "label": "Miejscowość",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.radosna",
            "label": "Radosna — jak przejąłeś przestrzeń? Gdzie usiadł klient? Kto był alfą?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.bolesna",
            "label": "Bolesna — jak przedstawiłeś koszty i obowiązek wymiany?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.swiatla",
            "label": "Światła — które realizacje pokazałeś i dlaczego?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.chwalebna",
            "label": "Chwalebna — jaki przykład klienta przywołałeś?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.pewnosci",
            "label": "Pewności — jak narysowałeś ptaszki? Jak padło zamknięcie?",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.ekon.osoby",
            "label": "Ekonomiczna (wyliczenie) — liczba osób",
            "type": "number"
          },
          {
            "id": "d4.b.audyt2.ekon.dochod",
            "label": "Ekonomiczna — dochód",
            "type": "number"
          },
          {
            "id": "d4.b.audyt2.ekon.dochodNaOsobe",
            "label": "Ekonomiczna — = dochód/os.: ___ zł/os.",
            "type": "number"
          },
          {
            "id": "d4.b.audyt2.ekon.dodatkoweOsoby",
            "label": "Jakie dodatkowe osoby wykryłem pytaniami",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.ekon.przedDochod",
            "label": "PRZED",
            "type": "number"
          },
          {
            "id": "d4.b.audyt2.ekon.przedProg",
            "label": "Próg (PRZED)",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.ekon.poDochod",
            "label": "PO",
            "type": "number"
          },
          {
            "id": "d4.b.audyt2.ekon.poProg",
            "label": "Próg (PO)",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.obiekcja",
            "label": "Obiekcja, która padła",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.jakOddaliles",
            "label": "Jak oddaliłeś",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.wynik",
            "label": "Wynik mojego audytu",
            "type": "choice",
            "options": [
              "Umowa podpisana",
              "Przełożone",
              "Odmowa"
            ]
          },
          {
            "id": "d4.b.audyt2.dobrze",
            "label": "Co zrobiłem dobrze",
            "type": "text"
          },
          {
            "id": "d4.b.audyt2.inaczej",
            "label": "Co następnym razem zrobię inaczej",
            "type": "text"
          }
        ]
      },
      {
        "title": "Część C — Podsumowanie dnia D4 (wypełnij wieczorem przed raportem CRM)",
        "items": [
          {
            "id": "d4.c.obserwowane",
            "label": "Audytów obserwowanych",
            "type": "number"
          },
          {
            "id": "d4.c.samodzielne",
            "label": "Audytów samodzielnych",
            "type": "number"
          },
          {
            "id": "d4.c.umowy",
            "label": "Umów podpisanych",
            "type": "number"
          },
          {
            "id": "d4.c.odmowy",
            "label": "Odmów",
            "type": "number"
          },
          {
            "id": "d4.c.tajemnica",
            "label": "Która tajemnica sprawiała mi dziś najwięcej trudności i dlaczego",
            "type": "text"
          },
          {
            "id": "d4.c.technika",
            "label": "Którą technikę seniora chcę wdrożyć od jutra — opisz konkretnie",
            "type": "text"
          },
          {
            "id": "d4.c.panel",
            "label": "Mój wynik panelu dochodowego — czy pytałem o dodatkowe osoby",
            "type": "text"
          }
        ]
      }
    ],
    "scored": false,
    "decision": {
      "options": [
        "Gotowy na samodzielność — start Ignition",
        "Potrzebuje jeszcze jednego dnia D4"
      ],
      "pass": "Gotowy na samodzielność — start Ignition"
    }
  },
  {
    "id": "d2-scenki",
    "title": "Checklist scenki D2 — ocena roleplay",
    "purpose": "Manager ocenia realne zachowanie nowego audytora w scence roleplay (pukanie D2D i/lub pełny audyt 6 Tajemnic) — nie to, czy mówi idealne zdania ze skryptu słowo w słowo. Wynik decyduje, czy audytor przechodzi do D3.",
    "sections": [
      {
        "title": "Nagłówek",
        "items": [
          {
            "id": "d2.0.scena",
            "label": "Scena",
            "type": "choice",
            "options": [
              "D2D",
              "Pełny audyt"
            ]
          }
        ]
      },
      {
        "title": "Pukanie D2D — elementy do oceny",
        "items": [
          {
            "id": "d2.d2d.postawa",
            "label": "Postawa i pierwsze wrażenie",
            "type": "scale",
            "hint": "Wyprostowany, uśmiechnięty, ręce widoczne, stoi z boku drzwi — nie frontalnie"
          },
          {
            "id": "d2.d2d.icebreaker",
            "label": "Icebreaker",
            "type": "scale",
            "hint": "Naturalny, jeden komentarz do otoczenia klienta, nie wyreżyserowany"
          },
          {
            "id": "d2.d2d.przedstawienie",
            "label": "Przedstawienie bez pauzy",
            "type": "scale",
            "hint": "Fundusz Remontowy, gmina, zlecenie — przechodzi płynnie bez momentu na odmowę"
          },
          {
            "id": "d2.d2d.kwalifikacja",
            "label": "Kwalifikacja — 4 pytania",
            "type": "scale",
            "hint": "Wszystkie 4 pytania, naturalna kolejność rozmowy, nie sztywna ankieta"
          },
          {
            "id": "d2.d2d.kwalifikacjaHak",
            "label": "Kwalifikacja pozytywna + hak",
            "type": "scale",
            "hint": "„Spełniają jedne z kryteriów”, jutro sprawdzą kolejne, duże pieniądze do uzyskania"
          },
          {
            "id": "d2.d2d.pozornyWybor",
            "label": "Domknięcie pozornym wyborem",
            "type": "scale",
            "hint": "„13 czy 17?” — nie „czy chce Pan/Pani?”. Czeka na odpowiedź w ciszy."
          },
          {
            "id": "d2.d2d.rodo",
            "label": "RODO + karteczka potwierdzenia",
            "type": "scale",
            "hint": "Imię, telefon, adres, podpis RODO, karteczka wydana klientowi"
          }
        ]
      },
      {
        "title": "Pełny audyt — 6 Tajemnic",
        "items": [
          {
            "id": "d2.audyt.radosna",
            "label": "Radosna — przejęcie salonu",
            "type": "scale",
            "hint": "Zasiada przy stole, wskazuje miejsce klientowi, identyfikuje alfę domu"
          },
          {
            "id": "d2.audyt.bolesna",
            "label": "Bolesna — koszty i obowiązek",
            "type": "scale",
            "hint": "Konkretne liczby kosztów, dyrektywy UE, „kiedy i za ile”, a nie „czy”"
          },
          {
            "id": "d2.audyt.swiatla",
            "label": "Światła — realizacje i partnerzy",
            "type": "scale",
            "hint": "Otwiera katalog, lista ZUM, pokazuje realizacje podobne do domu klienta"
          },
          {
            "id": "d2.audyt.chwalebna",
            "label": "Chwalebna — przykład klienta",
            "type": "scale",
            "hint": "Konkretny case (Pan Stanisław lub inny), konkretna kwota, konkretne oszczędności"
          },
          {
            "id": "d2.audyt.ekonomiczna",
            "label": "Ekonomiczna — panel dochodowy",
            "type": "scale",
            "hint": "Liczy na kartce przy kliencie, pyta o dodatkowe osoby, zakreślony próg procentowy"
          },
          {
            "id": "d2.audyt.pewnosci",
            "label": "Pewności — ptaszki i zamknięcie",
            "type": "scale",
            "hint": "Rysuje listę ptaszków i znaków zapytania przy kliencie, „to rozumiem, że sprawdzamy?”"
          },
          {
            "id": "d2.audyt.umowa",
            "label": "Podpisanie umowy na pomiar",
            "type": "scale",
            "hint": "Pozorny wybór daty, wypełnia umowę, „proszę tu o podpis”, zostawia kartkę klientowi"
          }
        ]
      },
      {
        "title": "Podsumowanie oceny",
        "items": [
          {
            "id": "d2.s.swietnie",
            "label": "Co zrobił świetnie",
            "type": "text"
          },
          {
            "id": "d2.s.poprawic",
            "label": "Co musi poprawić przed D3",
            "type": "text"
          }
        ]
      }
    ],
    "scored": true,
    "decision": {
      "options": [
        "Gotowy do D3",
        "Potrzebuje dodatkowej scenki"
      ],
      "pass": "Gotowy do D3"
    }
  }
];

export function formById(id: string): FormDef | undefined {
  return forms.find((f) => f.id === id);
}

/** Szablon Launch Pad (bez danych osobowych — plany osób tworzy manager). Liczby pomiarów to cele ze źródła. */
export const launchPad = {
  "title": "Launch Pad — plan 90 dni",
  "purpose": "Indywidualny plan 90 dni audytora: cel zarobkowy przeliczony na pomiary, cele na każdy miesiąc (M1 Ignition, M2 Orbit, M3 Next Level), nawyki do opanowania i wskaźniki dzienne; kończy się zobowiązaniem podpisanym przez audytora i managera.",
  "phases": [
    {
      "id": "M1",
      "name": "Ignition",
      "days": "1–30",
      "managerCadence": "Weekly 1:1 (styl S1 dyrektywny); codzienna kontrola CRM nowego",
      "minMeasurements": 4,
      "habits": [
        "12 leadów dziennie — bez wyjątków",
        "Sołtys jako krok zerowy w każdym rejonie",
        "CRM uzupełniony tego samego dnia (w zespole 2: „przed 21:00”)",
        "Odprawa 8:30 dni leadowe + pon. 8:00",
        "Weekly 1:1 z managerem — obowiązkowy",
        "GOPS następnego dnia rano o 9:00",
        "Re-test CP w dniu 14 — min. 90%"
      ]
    },
    {
      "id": "M2",
      "name": "Orbit",
      "days": "31–60",
      "managerCadence": "Bi-weekly 1:1 (styl S2/S3 wspierający); peer coaching; snapshot co 2 tyg.",
      "minMeasurements": 6,
      "habits": [
        "3 spotkania audytowe dziennie — cel",
        "Skrypt R2 bez zaglądania do papieru",
        "Panel dochodowy — pytaj o każdą osobę",
        "Follow-up 7 punktów po każdej umowie",
        "Konwersja spotkanie → umowa min. 33%",
        "Zero zaległości w CRM i follow-upie",
        "Bi-weekly 1:1 z managerem"
      ]
    },
    {
      "id": "M3",
      "name": "Next Level",
      "days": "61–90",
      "managerCadence": "Monthly 1:1 (styl S4 delegujący); audytor mentoruje nowych",
      "minMeasurements": 8,
      "habits": [
        "Samodzielne planowanie trasy w przydzielonym rejonie",
        "Ocena 360 po zakończeniu Launch Pad"
      ]
    }
  ],
  "after90": "Ocena 360 — trzy ścieżki: Senior, Mentor/Manager lub pożegnanie.",
  "followUp": [
    "D0 SMS po umówieniu — potwierdzenie terminu",
    "D1 zdjęcie spod GOPS na Workspace",
    "D3–4 telefon do klienta",
    "D7 SMS przypominający",
    "POMIAR umówienie terminu pomiaru",
    "D-1 SMS dzień przed pomiarem",
    "D+1 telefon po pomiarze — domknięcie"
  ]
} as const;
