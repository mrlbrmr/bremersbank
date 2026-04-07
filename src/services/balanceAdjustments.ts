import { supabase } from "@/lib/supabase";

export interface BalanceAdjustment {
  id?: string;
  user_id?: string;
  description: string;
  amount: number;
  adjustment_date: string;
  reason?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all balance adjustments for the authenticated user
 * Ordered by adjustment_date (newest first)
 */
export async function getBalanceAdjustments() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("balance_adjustments")
    .select("*")
    .eq("user_id", session.user.id)
    .order("adjustment_date", { ascending: false });

  if (error) throw error;
  return (data || []) as BalanceAdjustment[];
}

/**
 * Get balance adjustments for a specific month
 * Useful for calculating monthly adjusted balance
 */
export async function getBalanceAdjustmentsByMonth(year: number, month: number) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
  const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("balance_adjustments")
    .select("*")
    .eq("user_id", session.user.id)
    .gte("adjustment_date", monthStart)
    .lte("adjustment_date", monthEnd)
    .order("adjustment_date", { ascending: false });

  if (error) throw error;
  return (data || []) as BalanceAdjustment[];
}

/**
 * Calculate total balance adjustment amount for a given period
 * Returns sum of all adjustments (positive or negative)
 */
export async function calculateTotalAdjustment(year: number, month: number): Promise<number> {
  const adjustments = await getBalanceAdjustmentsByMonth(year, month);
  return adjustments.reduce((sum, adj) => sum + Number(adj.amount), 0);
}

/**
 * Add a new balance adjustment
 * This creates a record that tracks manual balance changes
 * 
 * @param adjustment The balance adjustment details
 * @param adjustmentDate The date when the adjustment should be applied (defaults to today)
 * @param description Why this adjustment was made
 * @param reason Additional reason/note (optional)
 */
export async function addBalanceAdjustment(
  adjustment: Omit<BalanceAdjustment, "id" | "created_at" | "updated_at" | "user_id">
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  // Validate amount is not zero
  if (adjustment.amount === 0) {
    throw new Error("Adjustment amount cannot be zero");
  }

  const { data, error } = await supabase
    .from("balance_adjustments")
    .insert([
      {
        ...adjustment,
        user_id: session.user.id,
      } as any,
    ])
    .select()
    .single();

  if (error) throw error;
  return data as BalanceAdjustment;
}

/**
 * Delete a balance adjustment by ID
 * This removes the adjustment record entirely
 */
export async function deleteBalanceAdjustment(adjustmentId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  // Verify the adjustment belongs to the current user before deleting
  const { data: adjustment, error: fetchError } = await supabase
    .from("balance_adjustments")
    .select("user_id")
    .eq("id", adjustmentId)
    .single();

  if (fetchError || !adjustment) {
    throw new Error("Adjustment not found");
  }

  if (adjustment.user_id !== session.user.id) {
    throw new Error("You can only delete your own adjustments");
  }

  const { error } = await supabase
    .from("balance_adjustments")
    .delete()
    .eq("id", adjustmentId);

  if (error) throw error;
}

/**
 * Update a balance adjustment
 */
export async function updateBalanceAdjustment(
  adjustmentId: string,
  updates: Partial<Omit<BalanceAdjustment, "id" | "user_id" | "created_at">>
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  // Verify the adjustment belongs to the current user
  const { data: adjustment, error: fetchError } = await supabase
    .from("balance_adjustments")
    .select("user_id")
    .eq("id", adjustmentId)
    .single();

  if (fetchError || !adjustment) {
    throw new Error("Adjustment not found");
  }

  if (adjustment.user_id !== session.user.id) {
    throw new Error("You can only update your own adjustments");
  }

  const { data, error } = await supabase
    .from("balance_adjustments")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adjustmentId)
    .select()
    .single();

  if (error) throw error;
  return data as BalanceAdjustment;
}

/**
 * Get the current total balance adjustment for the selected month
 * This sums all adjustments for that month
 */
export async function getCurrentMonthAdjustmentTotal(date: Date): Promise<number> {
  try {
    return await calculateTotalAdjustment(date.getFullYear(), date.getMonth());
  } catch (error) {
    console.error("Error calculating adjustment total:", error);
    return 0;
  }
}
