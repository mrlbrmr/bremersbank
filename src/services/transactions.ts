import { supabase } from "@/lib/supabase";

export interface Transaction {
  id?: string;
  description: string;
  amount: number;
  type: string;
  category?: string;
  date: string;
  user_id?: string;
  realized?: boolean;
  created_at?: string;
}

export async function getTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw error;
  return data as Transaction[];
}

export async function addTransaction(transaction: Omit<Transaction, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([transaction as any])
    .select()
    .single();

  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}
