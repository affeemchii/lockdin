export const params = {};

export const run: ActionRun = async ({ logger, api, connections }) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found");
  }

  const shopId = connections.shopify.currentShopId;
  if (!shopId) {
    throw new Error("Could not determine current shop ID");
  }

  // Fetch the shop record with our custom lockdIn settings fields
  const shop = await api.shopifyShop.findOne(String(shopId), {
    select: {
      id: true,
      name: true,
      customerEmail: true,
      lockdinDefaultDepositPercentage: true,
      lockdinDefaultLineItemText: true,
      lockdinBalanceDueReminders: true,
      lockdinReminderDays: true,
    },
  });

  return {
    defaultDepositPercentage: shop.lockdinDefaultDepositPercentage ?? 20,
    defaultLineItemText: shop.lockdinDefaultLineItemText ?? "Deposit only due at checkout",
    balanceDueReminders: shop.lockdinBalanceDueReminders ?? true,
    reminderDays: shop.lockdinReminderDays ?? 3,
    shopName: shop.name,
    shopEmail: shop.customerEmail ?? "",
  };
};
