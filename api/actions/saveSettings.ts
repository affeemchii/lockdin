export const params = {
  defaultDepositPercentage: { type: "number" },
  defaultLineItemText: { type: "string" },
  balanceDueReminders: { type: "boolean" },
  reminderDays: { type: "number" },
};

export const run: ActionRun = async ({ params, logger, api, connections }) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found");
  }

  const {
    defaultDepositPercentage,
    defaultLineItemText,
    balanceDueReminders,
    reminderDays,
  } = params as any;

  // Get the current shop record from Gadget
  // connections.shopify.currentShopId gives us the shop's Gadget ID
  const shopId = connections.shopify.currentShopId;
  if (!shopId) {
    throw new Error("Could not determine current shop ID");
  }

  // Update the shop record with new settings
  await api.shopifyShop.update(String(shopId), {
    lockdinDefaultDepositPercentage: Number(defaultDepositPercentage),
    lockdinDefaultLineItemText: String(defaultLineItemText),
    lockdinBalanceDueReminders: Boolean(balanceDueReminders),
    lockdinReminderDays: Number(reminderDays),
  });

  logger.info({ shopId }, "lockdIn settings saved successfully");

  return { success: true };
};
