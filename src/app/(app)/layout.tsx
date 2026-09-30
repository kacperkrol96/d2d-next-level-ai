import { AppShell } from "@/components/shell/AppShell";
import { NewCommissionOverlay } from "@/components/motion/NewCommissionOverlay";
import { requireUser } from "@/lib/auth/session";
import { roleLabels } from "@/lib/auth/users";
import { navFor } from "@/lib/nav";
import { getEarnings } from "@/lib/services/orbit";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const earnings = await getEarnings(user);

  return (
    <AppShell items={navFor(user.role)} user={{ name: user.name, roleLabel: roleLabels[user.role] }}>
      {children}
      {earnings && (
        <NewCommissionOverlay
          userId={user.id}
          earnedTotal={earnings.greenTotal}
          latest={earnings.latestGreen ? { amount: earnings.latestGreen.amount, clientName: earnings.latestGreen.clientName } : null}
        />
      )}
    </AppShell>
  );
}
