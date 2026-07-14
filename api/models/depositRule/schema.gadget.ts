import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "depositRule" model, go to https://lockdin.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-DepositRule",
  fields: {
    allocationType: {
      type: "string",
      storageKey: "DataModel-DepositRule-allocationType",
    },
    balanceDueTrigger: {
      type: "string",
      storageKey: "DataModel-DepositRule-balanceDueTrigger",
    },
    depositType: {
      type: "string",
      storageKey: "DataModel-DepositRule-depositType",
    },
    depositValue: {
      type: "number",
      storageKey: "DataModel-DepositRule-depositValue",
    },
    displaySettings: {
      type: "string",
      storageKey: "DataModel-DepositRule-displaySettings",
    },
    lineItemHelpText: {
      type: "string",
      storageKey: "DataModel-DepositRule-lineItemHelpText",
    },
    name: {
      type: "string",
      validations: { required: true },
      storageKey: "DataModel-DepositRule-name",
    },
    payInFull: {
      type: "boolean",
      storageKey: "DataModel-DepositRule-payInFull",
    },
    shop: {
      type: "belongsTo",
      parent: { model: "shopifyShop" },
      storageKey: "DataModel-DepositRule-shop",
    },
    shopifySellingPlanGroupId: {
      type: "string",
      storageKey: "DataModel-DepositRule-sellingPlanGroupId",
    },
    shopifySellingPlanId: {
      type: "string",
      storageKey: "DataModel-DepositRule-sellingPlanId",
    },
  },
};
