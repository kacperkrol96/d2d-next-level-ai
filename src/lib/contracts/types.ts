/** Kontrakt (zasady współpracy) do przeczytania i akceptacji przy pierwszym uruchomieniu. */
export type ContractTrack = "auditor" | "sales";

export interface ContractVersion {
  track: ContractTrack;
  /** Numer wersji (rośnie przy każdej publikacji admina). */
  version: number;
  title: string;
  /** Treść w Markdown. */
  body: string;
  publishedAt: string;
  publishedBy: string;
}

/** Rejestr akceptacji: kto, kiedy, którą wersję, z podpisem palcem. */
export interface ContractAcceptance {
  userId: string;
  track: ContractTrack;
  version: number;
  acceptedAt: string;
  /** Podpis jako obrazek PNG (data URL). */
  signature: string;
}
