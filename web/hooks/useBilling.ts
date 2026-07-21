import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

// WHAT: This is the shape of data returned by getSubscriptionStatus.
// We define it here so TypeScript knows exactly what fields exist
// and every page that uses this hook gets full autocomplete.
export interface BillingStatus {
    // Is the merchant on Pro?
    isPro: boolean;

    // "Free" or "Pro"
    plan: string;

    // Raw subscription object from Shopify (null if on free)
    subscription: any | null;

    // How many deposit orders they have used this month
    monthlyOrderCount: number;

    // How many purchase options they have created
    purchaseOptionCount: number;

    // The hard limits for free plan
    FREE_ORDER_LIMIT: number;
    FREE_PURCHASE_OPTION_LIMIT: number;

    // Boolean gates — use these to decide what to block
    isOrderLimitHit: boolean;
    isPurchaseOptionLimitHit: boolean;

    // Whether COD reminders are available
    canUseReminders: boolean;
}

// WHAT: This is the full shape returned by this hook.
// Pages destructure what they need from this.
export interface UseBillingReturn {
    // The billing data itself (null while loading)
    billing: BillingStatus | null;

    // True while we are fetching from Gadget
    loading: boolean;

    // Any error that occurred during fetch
    error: string | null;

    // Call this to redirect merchant to Shopify billing page
    // Use this when merchant clicks "Upgrade to Pro"
    startUpgrade: () => Promise<void>;

    // Call this to refresh billing status after a change
    refetch: () => Promise<void>;
}

export function useBilling(): UseBillingReturn {
    const [billing, setBilling] = useState<BillingStatus | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // FETCH BILLING STATUS
    // This calls our getSubscriptionStatus Gadget action.
    // We wrap it in useCallback so pages can call refetch()
    // after making changes (like creating a new purchase option).
    const fetchBillingStatus = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Call the Gadget action we built in Step 2
            const result = await (api as any).getSubscriptionStatus();
            setBilling(result as BillingStatus);
        } catch (err: any) {
            setError(err.message ?? "Failed to load billing status.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on mount — every page that uses this hook
    // will automatically check billing status when it loads
    useEffect(() => {
        fetchBillingStatus();
    }, [fetchBillingStatus]);

    // START UPGRADE
    // This calls our createSubscription Gadget action,
    // gets the confirmationUrl from Shopify, and redirects
    // the merchant to Shopify's billing approval page.
    //
    // WHY window.open with _top:
    // Our app runs inside a Shopify iframe. Normal navigation
    // would try to open Shopify's billing page inside the iframe
    // which breaks. _top breaks out of the iframe and opens
    // the billing page in the full browser window.
    const startUpgrade = useCallback(async () => {
        try {
            const result = await (api as any).createSubscription();

            if (result?.confirmationUrl) {
                // Break out of Shopify iframe to show billing page
                window.open(result.confirmationUrl, "_top");
            } else {
                throw new Error("No confirmation URL returned from Shopify.");
            }
        } catch (err: any) {
            setError(err.message ?? "Failed to start upgrade process.");
        }
    }, []);

    return {
        billing,
        loading,
        error,
        startUpgrade,
        refetch: fetchBillingStatus
    };
}