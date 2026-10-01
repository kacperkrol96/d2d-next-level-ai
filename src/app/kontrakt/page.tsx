import { redirect } from "next/navigation";
import { ContractScroll } from "@/components/contract/ContractScroll";
import { Markdown } from "@/components/ui/Markdown";
import { requireUser } from "@/lib/auth/session";
import { getDataSource } from "@/lib/data";
import { pendingContract } from "@/lib/services/contract";
import { acceptContract } from "./actions";

export const metadata = { title: "Kontrakt — D2D Next Level AI" };

export default async function KontraktPage({ searchParams }: PageProps<"/kontrakt">) {
  const user = await requireUser();
  const pending = await pendingContract(user);
  if (!pending) redirect("/kokpit");
  const [{ contractScrollTheme }, params] = await Promise.all([getDataSource().getConfig(), searchParams]);
  const error = typeof params.blad === "string" ? params.blad : null;

  return (
    <>
      {error && <p className="fixed inset-x-4 top-4 z-50 rounded-2xl bg-danger/90 px-4 py-3 text-center text-sm">{error}</p>}
      <ContractScroll
        theme={contractScrollTheme}
        title={pending.contract.title}
        version={pending.contract.version}
        previousAccepted={pending.previousAccepted}
        action={acceptContract}
      >
        <Markdown>{pending.contract.body}</Markdown>
      </ContractScroll>
    </>
  );
}
