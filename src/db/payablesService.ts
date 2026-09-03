import { isTauriEnvironment, memoryStore, getSqlDb } from "./client";
import {
  PayableParty,
  PayableLedgerEntry,
  CreatePayablePartyInput,
  CreatePayableLedgerInput,
  ItemTitle,
} from "./schema";
import { addInventoryItem } from "./inventoryService";

export async function getPayableParties(): Promise<PayableParty[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>(
        "SELECT * FROM payable_parties ORDER BY name ASC"
      );
      return rows.map((r) => ({
        id: Number(r.id),
        name: String(r.name || ""),
        phone: String(r.phone || ""),
        address: String(r.address || ""),
        totalDebit: Math.round(Number(r.total_debit ?? r.totalDebit ?? 0)),
        totalCredit: Math.round(Number(r.total_credit ?? r.totalCredit ?? 0)),
        currentBalance: Math.round(Number(r.current_balance ?? r.currentBalance ?? 0)),
        notes: String(r.notes || ""),
        createdAt: Number(r.created_at ?? r.createdAt ?? Math.floor(Date.now() / 1000)),
      }));
    } catch (err) {
      console.error("Failed to query payable_parties from SQLite:", err);
    }
  }

  return [...memoryStore.payableParties].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPayablePartyById(id: number): Promise<PayableParty | null> {
  const parties = await getPayableParties();
  return parties.find((p) => p.id === id) || null;
}

export async function createPayableParty(input: CreatePayablePartyInput): Promise<PayableParty> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const now = Math.floor(Date.now() / 1000);
  const openingBal = Math.round(Number(input.openingBalance) || 0);

  if (isTauri && sqlDb) {
    const res = await sqlDb.execute(
      `INSERT INTO payable_parties (name, phone, address, total_debit, total_credit, current_balance, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        input.name.trim(),
        input.phone?.trim() || "",
        input.address?.trim() || "",
        0,
        openingBal > 0 ? openingBal : 0,
        openingBal,
        input.notes?.trim() || "",
        now,
      ]
    );
    const newId = Number(res.lastInsertId) || 1;

    if (openingBal > 0) {
      await sqlDb.execute(
        `INSERT INTO payable_ledger (party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at)
         VALUES ($1, $2, 'PURCHASE', 'OPENING', 'Opening Balance', 0, $3, $4, $5)`,
        [newId, now, openingBal, openingBal, now]
      );
    }

    return {
      id: newId,
      name: input.name.trim(),
      phone: input.phone?.trim() || "",
      address: input.address?.trim() || "",
      totalDebit: 0,
      totalCredit: openingBal > 0 ? openingBal : 0,
      currentBalance: openingBal,
      notes: input.notes?.trim() || "",
      createdAt: now,
    };
  }

  const newId = memoryStore.payableParties.length > 0
    ? Math.max(...memoryStore.payableParties.map((p) => p.id)) + 1
    : 1;

  const party: PayableParty = {
    id: newId,
    name: input.name.trim(),
    phone: input.phone?.trim() || "",
    address: input.address?.trim() || "",
    totalDebit: 0,
    totalCredit: openingBal > 0 ? openingBal : 0,
    currentBalance: openingBal,
    notes: input.notes?.trim() || "",
    createdAt: now,
  };

  memoryStore.payableParties.push(party);

  if (openingBal > 0) {
    const entryId = memoryStore.payableLedger.length > 0
      ? Math.max(...memoryStore.payableLedger.map((l) => l.id)) + 1
      : 1;
    memoryStore.payableLedger.push({
      id: entryId,
      partyId: newId,
      txDate: now,
      txType: "PURCHASE",
      refNo: "OPENING",
      description: "Opening Balance",
      debit: 0,
      credit: openingBal,
      balance: openingBal,
      createdAt: now,
    });
  }

  return party;
}

export async function updatePayableParty(
  id: number,
  input: Partial<CreatePayablePartyInput>
): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute(
      `UPDATE payable_parties
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           notes = COALESCE($4, notes)
       WHERE id = $5`,
      [input.name?.trim(), input.phone?.trim(), input.address?.trim(), input.notes?.trim(), id]
    );
    return;
  }

  const p = memoryStore.payableParties.find((party) => party.id === id);
  if (p) {
    if (input.name !== undefined) p.name = input.name.trim();
    if (input.phone !== undefined) p.phone = input.phone.trim();
    if (input.address !== undefined) p.address = input.address.trim();
    if (input.notes !== undefined) p.notes = input.notes.trim();
  }
}

export async function deletePayableParty(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    await sqlDb.execute("DELETE FROM payable_ledger WHERE party_id = $1", [id]);
    await sqlDb.execute("DELETE FROM payable_parties WHERE id = $1", [id]);
    return;
  }

  memoryStore.payableParties = memoryStore.payableParties.filter((p) => p.id !== id);
  memoryStore.payableLedger = memoryStore.payableLedger.filter((l) => l.partyId !== id);
}

export async function getPartyLedger(partyId: number): Promise<PayableLedgerEntry[]> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    try {
      const rows = await sqlDb.select<any[]>(
        "SELECT * FROM payable_ledger WHERE party_id = $1 ORDER BY tx_date DESC, id DESC",
        [partyId]
      );
      return rows.map((r) => ({
        id: Number(r.id),
        partyId: Number(r.party_id ?? r.partyId),
        txDate: Number(r.tx_date ?? r.txDate),
        txType: r.tx_type || r.txType || "PURCHASE",
        refNo: String(r.ref_no || r.refNo || ""),
        description: String(r.description || ""),
        debit: Math.round(Number(r.debit) || 0),
        credit: Math.round(Number(r.credit) || 0),
        balance: Math.round(Number(r.balance) || 0),
        createdAt: Number(r.created_at ?? r.createdAt ?? r.tx_date ?? r.txDate),
      }));
    } catch (err) {
      console.error("Failed to query payable_ledger from SQLite:", err);
    }
  }

  return memoryStore.payableLedger
    .filter((l) => l.partyId === partyId)
    .sort((a, b) => b.txDate - a.txDate || b.id - a.id);
}

export async function addLedgerEntry(
  input: CreatePayableLedgerInput,
  inventoryData?: {
    title: ItemTitle;
    name: string;
    sku: string;
    price: number;
    costPrice: number;
    quantity: number;
  }
): Promise<PayableLedgerEntry> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();
  const now = Math.floor(Date.now() / 1000);
  const debit = Math.max(0, Math.round(Number(input.debit) || 0));
  const credit = Math.max(0, Math.round(Number(input.credit) || 0));

  // Get current party balance
  const party = await getPayablePartyById(input.partyId);
  const currentBal = party ? party.currentBalance : 0;
  const newBalance = currentBal + credit - debit;

  // Optional: add to inventory if inventoryData is passed on PURCHASE
  if (inventoryData && inventoryData.name.trim()) {
    try {
      await addInventoryItem({
        title: inventoryData.title,
        name: inventoryData.name.trim(),
        sku: inventoryData.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        quantity: inventoryData.quantity || 1,
        price: inventoryData.price || 0,
        costPrice: inventoryData.costPrice || credit,
        isSerialized: 0,
      });
    } catch (invErr) {
      console.warn("Could not auto-add inventory item from purchase:", invErr);
    }
  }

  if (isTauri && sqlDb) {
    const res = await sqlDb.execute(
      `INSERT INTO payable_ledger (party_id, tx_date, tx_type, ref_no, description, debit, credit, balance, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        input.partyId,
        input.txDate || now,
        input.txType,
        input.refNo?.trim() || "",
        input.description.trim(),
        debit,
        credit,
        newBalance,
        now,
      ]
    );

    // Update running totals in party
    await sqlDb.execute(
      `UPDATE payable_parties
       SET total_debit = total_debit + $1,
           total_credit = total_credit + $2,
           current_balance = $3
       WHERE id = $4`,
      [debit, credit, newBalance, input.partyId]
    );

    return {
      id: Number(res.lastInsertId) || 1,
      partyId: input.partyId,
      txDate: input.txDate || now,
      txType: input.txType,
      refNo: input.refNo?.trim() || "",
      description: input.description.trim(),
      debit,
      credit,
      balance: newBalance,
      createdAt: now,
    };
  }

  const newId = memoryStore.payableLedger.length > 0
    ? Math.max(...memoryStore.payableLedger.map((l) => l.id)) + 1
    : 1;

  const entry: PayableLedgerEntry = {
    id: newId,
    partyId: input.partyId,
    txDate: input.txDate || now,
    txType: input.txType,
    refNo: input.refNo?.trim() || "",
    description: input.description.trim(),
    debit,
    credit,
    balance: newBalance,
    createdAt: now,
  };

  memoryStore.payableLedger.push(entry);

  if (party) {
    party.totalDebit += debit;
    party.totalCredit += credit;
    party.currentBalance = newBalance;
  }

  return entry;
}

export async function deleteLedgerEntry(id: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  let partyId: number | null = null;
  if (isTauri && sqlDb) {
    const entry = await sqlDb.select<any[]>("SELECT party_id FROM payable_ledger WHERE id = $1", [id]);
    if (entry && entry.length > 0) {
      partyId = Number(entry[0].party_id);
    }
    await sqlDb.execute("DELETE FROM payable_ledger WHERE id = $1", [id]);
  } else {
    const idx = memoryStore.payableLedger.findIndex((l) => l.id === id);
    if (idx !== -1) {
      partyId = memoryStore.payableLedger[idx].partyId;
      memoryStore.payableLedger.splice(idx, 1);
    }
  }

  if (partyId) {
    await recalculatePartyLedger(partyId);
  }
}

export async function recalculatePartyLedger(partyId: number): Promise<void> {
  const isTauri = isTauriEnvironment();
  const sqlDb = await getSqlDb();

  if (isTauri && sqlDb) {
    const entries = await sqlDb.select<any[]>(
      "SELECT * FROM payable_ledger WHERE party_id = $1 ORDER BY tx_date ASC, id ASC",
      [partyId]
    );

    let runningBal = 0;
    let totDebit = 0;
    let totCredit = 0;

    for (const e of entries) {
      const debit = Number(e.debit) || 0;
      const credit = Number(e.credit) || 0;
      runningBal = runningBal + credit - debit;
      totDebit += debit;
      totCredit += credit;

      await sqlDb.execute("UPDATE payable_ledger SET balance = $1 WHERE id = $2", [
        runningBal,
        e.id,
      ]);
    }

    await sqlDb.execute(
      "UPDATE payable_parties SET total_debit = $1, total_credit = $2, current_balance = $3 WHERE id = $4",
      [totDebit, totCredit, runningBal, partyId]
    );
    return;
  }

  const entries = memoryStore.payableLedger
    .filter((l) => l.partyId === partyId)
    .sort((a, b) => a.txDate - b.txDate || a.id - b.id);

  let runningBal = 0;
  let totDebit = 0;
  let totCredit = 0;

  for (const e of entries) {
    runningBal = runningBal + e.credit - e.debit;
    e.balance = runningBal;
    totDebit += e.debit;
    totCredit += e.credit;
  }

  const p = memoryStore.payableParties.find((party) => party.id === partyId);
  if (p) {
    p.totalDebit = totDebit;
    p.totalCredit = totCredit;
    p.currentBalance = runningBal;
  }
}

export async function getPayablesSummary(): Promise<{
  totalOutstanding: number;
  activeSuppliersCount: number;
  totalPurchases: number;
  totalPaid: number;
}> {
  const parties = await getPayableParties();
  const totalOutstanding = parties.reduce((sum, p) => sum + p.currentBalance, 0);
  const totalPurchases = parties.reduce((sum, p) => sum + p.totalCredit, 0);
  const totalPaid = parties.reduce((sum, p) => sum + p.totalDebit, 0);
  const activeSuppliersCount = parties.filter((p) => p.currentBalance !== 0).length;

  return {
    totalOutstanding,
    activeSuppliersCount,
    totalPurchases,
    totalPaid,
  };
}
