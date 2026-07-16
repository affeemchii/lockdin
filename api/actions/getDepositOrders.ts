export const params = {};

export const run: ActionRun = async ({ logger, api }) => {
  try {
    // Query ALL recent shopifyOrder records from Gadget DB
    // We filter by lockdin-deposit tag in JavaScript after fetching
    // because Gadget's JSON filter does not support string contains
    // on JSON array fields like tags
    const orders = await api.shopifyOrder.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        financialStatus: true,
        totalPrice: true,
        totalOutstanding: true,
        tags: true,
        note: true,
        email: true,
        currency: true,
      },
      sort: { createdAt: "Descending" },
      first: 250,
    });

    logger.info({ totalFetched: orders.length }, "Fetched orders from Gadget DB");

    // Filter in JavaScript for orders tagged with lockdin-deposit
    // tags can be a string "tag1,tag2" or an array depending on
    // how Gadget stores the Shopify tags field
    const depositOrders = orders.filter((order: any) => {
      const tags = order.tags;
      if (!tags) return false;
      if (Array.isArray(tags)) return tags.includes("lockdin-deposit");
      if (typeof tags === "string") return tags.includes("lockdin-deposit");
      return false;
    });

    logger.info({ count: depositOrders.length }, "Filtered lockdIn deposit orders");

    // Format orders for the frontend
    const formattedOrders = depositOrders.map((order: any) => {
      const totalPrice = parseFloat(order.totalPrice || "0");
      const totalOutstanding = parseFloat(order.totalOutstanding || "0");
      const totalReceived = totalPrice - totalOutstanding;

      // Check if balance already marked as collected
      const tags = order.tags;
      let balanceCollected = false;
      if (Array.isArray(tags)) {
        balanceCollected = tags.includes("lockdin-balance-collected");
      } else if (typeof tags === "string") {
        balanceCollected = tags.includes("lockdin-balance-collected");
      }

      return {
        id: order.id,
        gadgetId: order.id,
        orderNumber: order.name || "—",
        createdAt: order.createdAt,
        customerEmail: order.email || "",
        financialStatus: order.financialStatus || "",
        totalPrice: totalPrice,
        totalReceived: totalReceived > 0 ? totalReceived : 0,
        remainingBalance: totalOutstanding > 0 ? totalOutstanding : 0,
        currencyCode: order.currency || "USD",
        balanceCollected: balanceCollected,
        tags: tags || [],
      };
    });

    return { orders: formattedOrders };

  } catch (err: any) {
    logger.error({ error: err.message }, "Error fetching deposit orders from Gadget DB");
    return { orders: [], error: err.message };
  }
};
