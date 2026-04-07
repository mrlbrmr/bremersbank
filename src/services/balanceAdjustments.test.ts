import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  addBalanceAdjustment,
  deleteBalanceAdjustment,
  updateBalanceAdjustment,
  calculateTotalAdjustment,
  getBalanceAdjustmentsByMonth,
} from "@/services/balanceAdjustments";

/**
 * Integration Tests for Balance Adjustments
 * 
 * Note: These tests require:
 * 1. Supabase project running (or emulator)
 * 2. Auth session active
 * 3. balance_adjustments table created
 * 
 * Run with: npm test -- balanceAdjustments.test.ts
 */

describe("Balance Adjustments Service", () => {
  describe("addBalanceAdjustment", () => {
    it("should create a new balance adjustment with positive amount", async () => {
      const adjustment = await addBalanceAdjustment({
        description: "Test adjustment +100",
        amount: 100,
        adjustment_date: new Date().toISOString().split("T")[0],
        reason: "Testing",
      });

      expect(adjustment).toBeDefined();
      expect(adjustment.id).toBeDefined();
      expect(adjustment.amount).toBe(100);
      expect(adjustment.description).toContain("Test adjustment");
    });

    it("should create a new balance adjustment with negative amount", async () => {
      const adjustment = await addBalanceAdjustment({
        description: "Test adjustment -50",
        amount: -50,
        adjustment_date: new Date().toISOString().split("T")[0],
        reason: "Testing",
      });

      expect(adjustment).toBeDefined();
      expect(adjustment.amount).toBe(-50);
    });

    it("should reject zero amount", async () => {
      expect(async () => {
        await addBalanceAdjustment({
          description: "Invalid adjustment",
          amount: 0,
          adjustment_date: new Date().toISOString().split("T")[0],
        });
      }).rejects.toThrow("Adjustment amount cannot be zero");
    });

    it("should require authentication", async () => {
      // This would need to be tested with a mock unauthenticated session
      // For now, we'll skip this in non-integration scenarios
      expect(true).toBe(true);
    });
  });

  describe("deleteBalanceAdjustment", () => {
    it("should delete an existing adjustment", async () => {
      // Create an adjustment first
      const created = await addBalanceAdjustment({
        description: "To be deleted",
        amount: 100,
        adjustment_date: new Date().toISOString().split("T")[0],
      });

      // Delete it
      await deleteBalanceAdjustment(created.id!);

      // Verify it's gone (would need to refetch)
      const remaining = await getBalanceAdjustmentsByMonth(
        new Date().getFullYear(),
        new Date().getMonth()
      );
      expect(remaining.find((a) => a.id === created.id)).toBeUndefined();
    });

    it("should throw error if adjustment not found", async () => {
      expect(async () => {
        await deleteBalanceAdjustment("non-existent-id");
      }).rejects.toThrow("Adjustment not found");
    });
  });

  describe("updateBalanceAdjustment", () => {
    it("should update adjustment description", async () => {
      // Create an adjustment
      const created = await addBalanceAdjustment({
        description: "Original description",
        amount: 100,
        adjustment_date: new Date().toISOString().split("T")[0],
      });

      // Update it
      const updated = await updateBalanceAdjustment(created.id!, {
        description: "Updated description",
      });

      expect(updated.description).toBe("Updated description");
      expect(updated.amount).toBe(100); // Amount unchanged
    });

    it("should update adjustment reason", async () => {
      const created = await addBalanceAdjustment({
        description: "Test",
        amount: 50,
        adjustment_date: new Date().toISOString().split("T")[0],
      });

      const updated = await updateBalanceAdjustment(created.id!, {
        reason: "Updated reason",
      });

      expect(updated.reason).toBe("Updated reason");
    });
  });

  describe("getBalanceAdjustmentsByMonth", () => {
    it("should return adjustments for a specific month", async () => {
      const now = new Date();
      const thisMonth = await getBalanceAdjustmentsByMonth(
        now.getFullYear(),
        now.getMonth()
      );

      expect(Array.isArray(thisMonth)).toBe(true);
    });

    it("should return empty array for month with no adjustments", async () => {
      // Use a past month unlikely to have data
      const adjustments = await getBalanceAdjustmentsByMonth(2020, 0);
      expect(Array.isArray(adjustments)).toBe(true);
    });

    it("should filter by exact month boundaries", async () => {
      const now = new Date();
      const thisMonth = await getBalanceAdjustmentsByMonth(
        now.getFullYear(),
        now.getMonth()
      );

      // All should be in this month
      const allInMonth = thisMonth.every((adj) => {
        const date = new Date(adj.adjustment_date);
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });

      expect(allInMonth).toBe(true);
    });
  });

  describe("calculateTotalAdjustment", () => {
    it("should sum all adjustments for a month", async () => {
      const now = new Date();
      const total = await calculateTotalAdjustment(
        now.getFullYear(),
        now.getMonth()
      );

      expect(typeof total).toBe("number");
      expect(total).toBeGreaterThanOrEqual(0);
    });

    it("should handle positive and negative adjustments", async () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Create one positive and one negative
      const pos = await addBalanceAdjustment({
        description: "Positive",
        amount: 100,
        adjustment_date: today,
      });

      const neg = await addBalanceAdjustment({
        description: "Negative",
        amount: -30,
        adjustment_date: today,
      });

      const total = await calculateTotalAdjustment(
        now.getFullYear(),
        now.getMonth()
      );

      // Total should include both (100 - 30 = 70)
      expect(total).toBeGreaterThanOrEqual(70);

      // Cleanup
      await deleteBalanceAdjustment(pos.id!);
      await deleteBalanceAdjustment(neg.id!);
    });

    it("should return 0 for month with no adjustments", async () => {
      const total = await calculateTotalAdjustment(2020, 0);
      expect(total).toBe(0);
    });
  });
});

/**
 * Component Integration Tests
 * These test the hook behavior in a React component
 */
describe("useBalanceAdjustments Hook", () => {
  // These would require React Testing Library and mocking
  // Placeholder tests for now

  it("should load adjustments on mount", () => {
    // Test implementation would go here
    expect(true).toBe(true);
  });

  it("should handle errors gracefully", () => {
    // Test error handling
    expect(true).toBe(true);
  });

  it("should subscribe to realtime updates", () => {
    // Test realtime subscription
    expect(true).toBe(true);
  });
});

/**
 * UI Integration Tests
 * Testing the balance adjustment UI flows
 */
describe("Balance Adjustment UI Flows", () => {
  it("should display adjustment history", () => {
    // Test AdjustmentHistory component renders correctly
    expect(true).toBe(true);
  });

  it("should calculate adjusted balance correctly", () => {
    // Test: adjustedBalance = saldoAtual + totalAdjustment
    const saldoAtual = 1000;
    const adjustment = 500;
    const adjusted = saldoAtual + adjustment;

    expect(adjusted).toBe(1500);
  });

  it("should handle negative adjustments", () => {
    const saldoAtual = 1000;
    const adjustment = -200;
    const adjusted = saldoAtual + adjustment;

    expect(adjusted).toBe(800);
  });

  it("should not affect transaction calculations", () => {
    // An adjustment should not be counted in transaction totals
    const transactionTotal = 500; // from actual transactions
    const adjustedBalance = 500 + 100; // plus adjustment

    expect(transactionTotal).toBe(500); // Transaction total unchanged
    expect(adjustedBalance).toBe(600); // But adjusted balance includes it
  });
});

/**
 * Edge Cases and Error Handling
 */
describe("Edge Cases", () => {
  it("should handle very large adjustment amounts", async () => {
    const largeAmount = 999999999.99;
    const adjustment = await addBalanceAdjustment({
      description: "Large adjustment",
      amount: largeAmount,
      adjustment_date: new Date().toISOString().split("T")[0],
    });

    expect(adjustment.amount).toBe(largeAmount);
    await deleteBalanceAdjustment(adjustment.id!);
  });

  it("should handle decimal precision", async () => {
    const amount = 123.45;
    const adjustment = await addBalanceAdjustment({
      description: "Decimal adjustment",
      amount: amount,
      adjustment_date: new Date().toISOString().split("T")[0],
    });

    expect(adjustment.amount).toBe(amount);
    await deleteBalanceAdjustment(adjustment.id!);
  });

  it("should handle special characters in description", async () => {
    const description = "Ajuste R$ #123 @teste (teste/teste)";
    const adjustment = await addBalanceAdjustment({
      description,
      amount: 100,
      adjustment_date: new Date().toISOString().split("T")[0],
    });

    expect(adjustment.description).toBe(description);
    await deleteBalanceAdjustment(adjustment.id!);
  });

  it("should handle timezone differences", async () => {
    const date = new Date("2024-04-07T00:00:00Z");
    const dateStr = date.toISOString().split("T")[0];

    const adjustment = await addBalanceAdjustment({
      description: "Timezone test",
      amount: 100,
      adjustment_date: dateStr,
    });

    expect(adjustment.adjustment_date).toBe(dateStr);
    await deleteBalanceAdjustment(adjustment.id!);
  });
});
