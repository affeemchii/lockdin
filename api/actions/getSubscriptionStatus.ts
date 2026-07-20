import { ActionOptions } from "gadget-server";

// WHAT: Checks whether the current merchant has an active Pro
// subscription. Returns their plan name, status, and usage counts.
//
// WHY: Every page needs to know the merchant's plan to decide
// what to show, block, or gate. This is our single source of truth.
//
// WHY WE ASK SHOPIFY DIRECTLY:
// Shopify is the payment processor. If we stored plan status in our
// own DB, it could go stale — merchant cancels, charge fails, etc.
// Asking Shopify directly means we always have the real status.

export const run: ActionRun = async ({ api, connections, logger }) => {
  const shopify = await connections.shopify.current;

  if (!shopify) {
    throw new Error("No Shopify connection found.");
  }

  // Step 1: Ask Shopify for all active app subscriptions for this shop.
  // currentAppInstallation gives us data about THIS app's installation
  // on THIS merchant's shop — including any active subscriptions.
  const result = await shopify.graphql(`
    query getAppSubscription {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          test
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price {
                    amount
                    currencyCode
                  }
                  interval
                }
              }
            }
          }
        }
      }
    }
  `);

  const activeSubscriptions =
    result.currentAppInstallation?.activeSubscriptions ?? [];

  // Step 2: Determine if merchant is on Pro.
  // A merchant is Pro if they have at least one ACTIVE subscription
  // named "lockdIn Pro". We check the name because a shop could
  // theoretically have other app subscriptions.
  const proSubscription = activeSubscriptions.find(
    (sub: any) =>
      sub.name === "lockdIn Pro" &&
      sub.status === "ACTIVE"
  );

  const isPro = !!proSubscription;

  // Step 3: Count their current purchase options.
  // We check our own Gadget DB for this — Shopify doesn't store
  // this count, we do via the depositRule model.
  // This tells us if they are approaching or over the free limit.
  const shopId = connections.shopify.currentShopId?.toString();

  let purchaseOptionCount = 0;

  if (shopId) {
    // Count how many depositRule records exist for this shop
    const rules = await api.depositRule.findMany({
      filter: {
        shop: {
          id: { equals: shopId }
        }
      }
    });
    purchaseOptionCount = rules.length;
  }

  // Step 4: Get their order count for this month.
  // We query shopifyOrder records that have the lockdin tag.
  // IMPORTANT: This count will be 0 until Protected Customer Data
  // is approved and order webhooks are active. That is expected.
  // Once approved, this count automatically becomes accurate.
  let monthlyOrderCount = 0;

  if (shopId) {
    // Get first day of current month to filter orders
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const orders = await api.shopifyOrder.findMany({
        filter: {
          shop: {
            id: { equals: shopId }
          },
          createdAt: { greaterThanOrEqual: firstOfMonth.toISOString() }
        }
      });
      // Filter by lockdin tag in JavaScript (JSON array field)
      monthlyOrderCount = orders.filter((order: any) => {
        const tags = order.tags;
        if (!tags) return false;
        if (Array.isArray(tags)) return tags.includes("lockdin");
        if (typeof tags === "string") return tags.includes("lockdin");
        return false;
      }).length;
    } catch (e) {
      // If Protected Customer Data not approved, this will fail silently.
      // We default to 0 so free merchants are not incorrectly blocked.
      logger.warn({ error: e }, "Could not count orders — Protected Customer Data may not be approved yet.");
      monthlyOrderCount = 0;
    }
  }

  // Step 5: Calculate what limits apply and whether they are hit.
  // FREE LIMITS:
  // - 25 deposit orders per month
  // - 3 purchase options max
  // - No COD reminders
  const FREE_ORDER_LIMIT = 25;
  const FREE_PURCHASE_OPTION_LIMIT = 3;

  const isOrderLimitHit = !isPro && monthlyOrderCount >= FREE_ORDER_LIMIT;
  const isPurchaseOptionLimitHit = !isPro && purchaseOptionCount >= FREE_PURCHASE_OPTION_LIMIT;

  // Return everything the frontend needs to make gating decisions.
  return {
    // Core plan info
    isPro,
    plan: isPro ? "Pro" : "Free",

    // Subscription details (useful for settings page display)
    subscription: proSubscription ?? null,

    // Usage counts
    monthlyOrderCount,
    purchaseOptionCount,

    // Limits
    FREE_ORDER_LIMIT,
    FREE_PURCHASE_OPTION_LIMIT,

    // Boolean gates — frontend checks these to decide what to block
    isOrderLimitHit,
    isPurchaseOptionLimitHit,

    // COD reminders are always locked on free
    canUseReminders: isPro
  };
};

export const options: ActionOptions = {
  actionType: "custom",
  triggers: {
    api: true
  }
};
