import { MarkBalanceCollectedGlobalActionContext } from "gadget-server";

export const params = {
  orderId: { type: "string" },   // Gadget numeric order ID
  orderTags: { type: "string" }, // JSON stringified current tags array
  remainingBalance: { type: "number" },
  currencyCode: { type: "string" },
};

export const run = async ({
  params,
  logger,
  connections,
}: MarkBalanceCollectedGlobalActionContext) => {
  const shopify = connections.shopify.current;
  if (!shopify) {
    throw new Error("Shopify connection not found");
  }

  const { orderId, orderTags, remainingBalance, currencyCode } = params as any;

  // Parse existing tags and add our collected tag
  const existingTags: string[] = JSON.parse(orderTags || "[]");
  const newTags = [...existingTags, "lockdin-balance-collected"];

  // Build a note recording the collection
  const collectionNote = `lockdIn: Remaining balance of ${currencyCode} ${remainingBalance} collected via Cash on Delivery on ${new Date().toLocaleDateString()}.`;

  // Update the order with new tags and note
  const mutation = `
    mutation updateOrder($input: OrderInput!) {
      orderUpdate(input: $input) {
        order {
          id
          tags
          note
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const result = await shopify.graphql(mutation, {
    input: {
      id: `gid://shopify/Order/${orderId}`,
      tags: newTags,
      note: collectionNote,
    },
  });

  if (result.orderUpdate.userErrors?.length > 0) {
    const errors = result.orderUpdate.userErrors
      .map((e: any) => `${e.field}: ${e.message}`)
      .join(", ");
    throw new Error(`Shopify update errors: ${errors}`);
  }

  logger.info({ orderId }, "Balance marked as collected");

  return {
    success: true,
    orderId: orderId,
    tags: result.orderUpdate.order.tags,
  };
};
