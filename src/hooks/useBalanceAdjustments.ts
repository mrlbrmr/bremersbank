import { useEffect, useState, useCallback, useRef } from "react";
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
  
  // Use ref to store current year/month for realtime callback
  const dateRef = useRef({ year, month });
  const isMountedRef = useRef(true);

  // Update ref when date changes
  useEffect(() => {
    dateRef.current = { year, month };
  }, [year, month]);

  // Fetch adjustments for the selected month
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { year: currentYear, month: currentMonth } = dateRef.current;

      const [adjustmentsData, total] = await Promise.all([
        getBalanceAdjustmentsByMonth(currentYear, currentMonth),
        calculateTotalAdjustment(currentYear, currentMonth),
      ]);

      if (isMountedRef.current) {
        setAdjustments(adjustmentsData);
        setTotalAdjustment(total);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch adjustments";
      if (isMountedRef.current) {
        setError(message);
      }
      console.error("Error fetching balance adjustments:", err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch when month changes
  useEffect(() => {
    fetchAdjustments();
  }, [year, month, fetchAdjustments]);

  // Subscribe to realtime changes - only created once
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (!session || !isMountedRef.current) return;

        const { year: currentYear, month: currentMonth } = dateRef.current;
        const channelName = `balance-adjustments-${currentYear}-${currentMonth}-${session.user.id}`;
        
        // Create channel with all .on() callbacks BEFORE subscribe()
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "balance_adjustments",
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload) => {
              console.log("Balance adjustment realtime update:", payload);
              if (isMountedRef.current) {
                // Refetch when there are changes
                void fetchAdjustments();
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log(`Subscribed to ${channelName}`);
            }
          });
      } catch (err) {
        console.error("Error setting up subscription:", err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [fetchAdjustments]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
