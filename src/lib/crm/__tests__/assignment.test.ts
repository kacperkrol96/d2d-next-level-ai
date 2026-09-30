import { describe, expect, it } from "vitest";
import { seedConfig as config } from "@/lib/config/seed";
import { reachedStatusAt, resolveAssignment } from "../assignment";
import { buildMockClients, mockEmployees } from "../mock-data";

describe("ustalanie przypisań z historii CRM", () => {
  const client = buildMockClients(new Date("2026-09-30T12:00:00Z"))[0];

  it("audytor = pierwszy przypisany audytor, handlowiec = ostatni przypisany handlowiec", () => {
    expect(resolveAssignment(client, mockEmployees)).toEqual({ auditorId: "e-ola", salesId: "e-marek" });
  });

  it("brak handlowca, gdy klient jest jeszcze tylko u audytora", () => {
    const onlyAudit = { ...client, assignmentHistory: client.assignmentHistory.slice(0, 1) };
    expect(resolveAssignment(onlyAudit, mockEmployees)).toEqual({ auditorId: "e-ola", salesId: null });
  });

  it("data osiągnięcia statusu progowego z historii", () => {
    const at = reachedStatusAt(client.salesStatusHistory, config.rules.salesGreenFromStatus, config.pipelines.sales);
    expect(at).toBeInstanceOf(Date);
  });

  it("dane testowe nie zawierają pól wrażliwych (RODO)", () => {
    const json = JSON.stringify(buildMockClients()).toLowerCase();
    for (const forbidden of ["pesel", "ksiega", "księga", "dzialka", "działka"]) expect(json).not.toContain(forbidden);
  });
});
