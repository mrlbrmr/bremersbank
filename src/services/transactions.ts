import { supabase } from "@/lib/supabase";

export interface Transaction {
  id?: string;
  valor: number;
  tipo: "entrada" | "saida";
  pessoa: string;
  data: string;
  descricao?: string;
  created_at?: string;
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("data", { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(transaction)
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
