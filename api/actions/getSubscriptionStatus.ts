import { GetSubscriptionStatusGlobalActionContext } from "gadget-server";

export const run = async ({ api, connections, logger }: GetSubscriptionStatusGlobalActionContext) => {
    const shopify = connections.shopify.current;

    if (!shopify) {
        throw new Error("No Shopify connection found.");
    }

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

    const proSubscription = activeSubscriptions.find(
        (sub: any) =>
            sub.name === "lockdIn Pro" &&
            sub.status === "ACTIVE"
    );

    const isPro = !!proSubscription;

    const shopId = connections.shopify.currentShopId;

    let purchaseOptionCount = 0;

    if (shopId) {
        const rules = await api.depositRule.findMany({
            filter: {
                shop: { id: { equals: String(shopId) } }
            }
        });
        purchaseOptionCount = rules.length;
    }

    let monthlyOrderCount = 0;

    if (shopId) {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        try {
            const orders = await api.shopifyOrder.findMany({
                filter: {
                    shop: { id: { equals: String(shopId) } },
                    createdAt: { greaterThanOrEqual: firstOfMonth.toISOString() }
                }
            });

            // Tags is JSON in Gadget — filter in JavaScript
            monthlyOrderCount = orders.filter((order: any) => {
                const tags = order.tags;
                if (!tags) return false;
                if (typeof tags === "string") return tags.includes("lockdin");
                if (Array.isArray(tags)) return tags.some((t: string) => t.includes("lockdin"));
                return false;
            }).length;

        } catch (e) {
            logger.warn(
                { error: e },
                "Could not count orders — Protected Customer Data may not be approved yet."
            );
            monthlyOrderCount = 0;
        }
    }

    const FREE_ORDER_LIMIT = 25;
    const FREE_PURCHASE_OPTION_LIMIT = 3;

    const isOrderLimitHit = !isPro && monthlyOrderCount >= FREE_ORDER_LIMIT;
    const isPurchaseOptionLimitHit = !isPro && purchaseOptionCount >= FREE_PURCHASE_OPTION_LIMIT;

    return {
        isPro,
        plan: isPro ? "Pro" : "Free",
        subscription: proSubscription ?? null,
        monthlyOrderCount,
        purchaseOptionCount,
        FREE_ORDER_LIMIT,
        FREE_PURCHASE_OPTION_LIMIT,
        isOrderLimitHit,
        isPurchaseOptionLimitHit,
        canUseReminders: isPro
    };
};

export const options = {
    actionType: "custom" as const,
    triggers: { api: true }
};