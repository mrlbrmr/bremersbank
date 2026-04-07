import { useEffect, useState, useCallback } from "react";
import {
  getBalanceAdjustmentsByMonth,
  addBalanceAdjustment,
  deleteBalanceAdjustment,
  updateBalanceAdjustment,
  calculateTotalAdjustment,
  type BalanceAdjustment,
} from "@/services/balanceAdjustments";
import { supabase } from "@/lib/supabase";

/**
 * Custom hook for managing balance adjustments
 * Handles fetching, adding, deleting, and updating adjustments for a given month
 */
export function useBalanceAdjustments(date: Date) {
  const [adjustments, setAdjustments] = useState<BalanceAdjustment[]>([]);
  const [totalAdjustment, setTotalAdjustment] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const year = date.getFullYear();
  const month = date.getMonth();

  // Fetch adjustments for the selected month
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [adjustmentsData, total] = await Promise.all([
        getBalanceAdjustmentsByMonth(year, month),
        calculateTotalAdjustment(year, month),
      ]);

      setAdjustments(adjustmentsData);
      setTotalAdjustment(total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch adjustments";
      setError(message);
      console.error("Error fetching balance adjustments:", err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  // Initial fetch
  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // Subscribe to realtime changes
  useEffect(() => {
    const subscribeToChanges = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) return;

      const channel = supabase
        .channel(`balance-adjustments-${year}-${month}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "balance_adjustments",
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            // Refetch when there are changes
            fetchAdjustments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = subscribeToChanges();
    cleanup.then((cleanup) => {
      return () => {
        cleanup?.();
      };
    });
  }, [year, month, fetchAdjustments]);

  // Add a new adjustment
  const addAdjustment = useCallback(
    async (
      description: string,
      amount: number,
      adjustmentDate: string,
      reason?: string
    ) => {
      try {
        setError(null);
        const adjustment = await addBalanceAdjustment({
          description,
          amount,
          adjustment_date: adjustmentDate,
          reason,
        });
        return adjustment;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add adjustment";
        setError(message);
        throw err;
      }
    },
    []
  );

  // Delete an adjustment
  const deleteAdjustment = useCallback(async (adjustmentId: string) => {
    try {
      setError(null);
      await deleteBalanceAdjustment(adjustmentId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete adjustment";
      setError(message);
      throw err;
    }
  }, []);

  // Update an adjustment
  const updateAdjustment = useCallback(
    async (
      adjustmentId: string,
      updates: Partial<Omit<BalanceAdjustment, "id" | "user_id" | "created_at">>
    ) => {
      try {
        setError(null);
        const adjustment = await updateBalanceAdjustment(adjustmentId, updates);
        return adjustment;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update adjustment";
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    adjustments,
    totalAdjustment,
    loading,
    error,
    addAdjustment,
    deleteAdjustment,
    updateAdjustment,
    refetch: fetchAdjustments,
  };
}
