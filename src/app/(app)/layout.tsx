import { AppShell } from "@/components/shell/AppShell";
import { AutoRefresh } from "@/components/shell/AutoRefresh";
import { NewCommissionOverlay } from "@/components/motion/NewCommissionOverlay";
import { OfficeMovesToast } from "@/components/trajectory/OfficeMovesToast";
import { requireUser } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/users";
import { navFor } from "@/lib/nav";
import { getOrbitData } from "@/lib/services/orbit";
import { loadContext } from "@/lib/services/portfolio";
import { getOfficeMoves } from "@/lib/services/trajectory";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const ctx = await loadContext();
  const [orbit, moves] = await Promise.all([getOrbitData(user, ctx.now, ctx), getOfficeMoves(user, 14, ctx)]);
  const earnings = orbit?.earnings;

  return (
    <AppShell items={navFor(user.role)} user={{ name: user.name, roleLabel: roleLabels[user.role] }}>
      {children}
      <AutoRefresh minutes={ctx.config.crm.refreshMinutes} />
      {earnings && (
        <NewCommissionOverlay
          userId={user.id}
          earnedTotal={earnings.greenTotal}
          latest={earnings.latestGreen ? { amount: earnings.latestGreen.amount, clientName: earnings.latestGreen.clientName } : null}
        />
      )}
      {moves.length > 0 && <OfficeMovesToast userId={user.id} moves={moves} />}
    </AppShell>
  );
}
