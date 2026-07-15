import { useEffect } from "react";
import { useNavigate, useSubmit, useActionData, useNavigation, useOutletContext } from "react-router";
import type { Route } from "./+types/_app._index";

export const loader = async ({ context }: Route.LoaderArgs) => {
  const shopify = context.connections.shopify.current;
  if (!shopify) {
    return {
      hasActivePlan: false,
      hasRules: false,
      shopId: null,
    };
  }

  // 1. Fetch active Shopify subscriptions to check for active paid plan
  const billingResult = await shopify.graphql(`
    query {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
        }
      }
    }
  `);

  const activeSubscriptions = billingResult?.currentAppInstallation?.activeSubscriptions || [];
  const hasActivePlan = activeSubscriptions.some(
    (sub: any) => sub.status === "ACTIVE"
  );

  // 2. Check if at least one depositRule record exists for the current shop
  const rules = await context.api.depositRule.findMany({
    filter: {
      shop: {
        id: {
          equals: context.connections.shopify.currentShopId?.toString(),
        },
      },
    },
    select: {
      id: true,
    },
  });
  const hasRules = rules.length > 0;

  // Redirect immediately if they have both plan and rules configured
  if (hasActivePlan && hasRules) {
    throw new Response("", {
      status: 302,
      headers: { Location: "/app" },
    });
  }

  return {
    hasActivePlan,
    hasRules,
    shopId: context.connections.shopify.currentShopId,
  };
};

export const action = async ({ context, request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "upgrade") {
    const shopify = context.connections.shopify.current;
    if (!shopify) {
      throw new Error("Missing Shopify connection");
    }

    const host = request.headers.get("host") || "lockdin.gadget.app";
    const returnUrl = `https://${host}/`;

    const CREATE_SUBSCRIPTION_QUERY = `
      mutation CreateSubscription($name: String!, $price: Decimal!, $returnUrl: URL!) {
        appSubscriptionCreate(
          name: $name,
          test: true,
          returnUrl: $returnUrl,
          lineItems: [{
            plan: {
              appRecurringPricingDetails: {
                price: { amount: $price, currencyCode: USD }
                interval: EVERY_30_DAYS
              }
            }
          }]
        ) {
          userErrors {
            field
            message
          }
          confirmationUrl
          appSubscription {
            id
          }
        }
      }
    `;

    const result = await shopify.graphql(CREATE_SUBSCRIPTION_QUERY, {
      name: "Pro Growth",
      price: 14.99,
      returnUrl,
    });

    const userErrors = result?.appSubscriptionCreate?.userErrors || [];
    if (userErrors.length > 0) {
      throw new Error(userErrors.map((e: any) => e.message).join(", "));
    }

    const confirmationUrl = result?.appSubscriptionCreate?.confirmationUrl;
    return { confirmationUrl };
  }

  if (actionType === "downgrade") {
    const shopify = context.connections.shopify.current;
    if (!shopify) {
      throw new Error("Missing Shopify connection");
    }

    // Get current active subscription
    const billingResult = await shopify.graphql(`
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            status
          }
        }
      }
    `);

    const activeSubscriptions = billingResult?.currentAppInstallation?.activeSubscriptions || [];
    const activeSub = activeSubscriptions.find((sub: any) => sub.status === "ACTIVE");

    if (activeSub) {
      const cancelResult = await shopify.graphql(`
        mutation appSubscriptionCancel($id: ID!) {
          appSubscriptionCancel(id: $id) {
            appSubscription {
              id
              status
            }
            userErrors {
              field
              message
            }
          }
        }
      `, { id: activeSub.id });

      const userErrors = cancelResult?.appSubscriptionCancel?.userErrors || [];
      if (userErrors.length > 0) {
        throw new Error(userErrors.map((e: any) => e.message).join(", "));
      }
    }

    return { success: true };
  }

  return null;
};

export default function Index({ loaderData }: Route.ComponentProps) {
  const { hasActivePlan, hasRules } = loaderData;
  const navigate = useNavigate();
  const submit = useSubmit();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const outletContext = useOutletContext<{ csrfToken?: string } | undefined>();
  const csrfToken = outletContext?.csrfToken;

  const isUpgrading = navigation.state === "submitting" && navigation.formData?.get("actionType") === "upgrade";
  const isDowngrading = navigation.state === "submitting" && navigation.formData?.get("actionType") === "downgrade";

  // Handle billing redirect breakout
  useEffect(() => {
    if (actionData && (actionData as any).confirmationUrl) {
      const url = (actionData as any).confirmationUrl;
      window.open(url, "_top");
    } else if (actionData && (actionData as any).success) {
      window.location.reload();
    }
  }, [actionData]);

  const handleUpgrade = () => {
    submit(
      csrfToken ? { actionType: "upgrade", csrfToken } : { actionType: "upgrade" },
      { method: "post" }
    );
  };

  const handleDowngrade = () => {
    if (confirm("Are you sure you want to cancel your Pro Growth subscription and downgrade to the Free Tier?")) {
      submit(
        csrfToken ? { actionType: "downgrade", csrfToken } : { actionType: "downgrade" },
        { method: "post" }
      );
    }
  };

  return (
    <s-page heading="Welcome to lockdIn!">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "40px" }}>

        {/* Banner Section */}
        <s-banner heading="Secure your Cash on Delivery (COD) orders by collecting automated upfront deposits at checkout." tone="info" />

        {/* Onboarding Checklist Card */}
        <s-card>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#202223", margin: 0 }}>Getting Started Checklist</h2>

            <s-stack gap="base">
              {/* Step 1 */}
              <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e1e3e5", paddingBottom: "16px", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#e1e3e5", color: "#202223", fontWeight: "600", fontSize: "13px", flexShrink: 0 }}>
                  1
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <s-text type="strong">Configure Deposit Settings</s-text>
                  <s-text color="subdued">Check out the instructions below to configure your store's upfront deposit settings.</s-text>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid #e1e3e5", paddingBottom: "16px", alignItems: "center", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#e1e3e5", color: "#202223", fontWeight: "600", fontSize: "13px", flexShrink: 0 }}>
                  2
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <s-text type="strong">Enable Theme App Extension</s-text>
                  <s-text color="subdued">Enable the lockdIn widget in your Theme Editor so the deposit badge shows on your product page.</s-text>
                </div>
                <s-button href="https://admin.shopify.com/themes/current/editor?context=apps" target="_blank" variant="secondary">
                  Enable Theme App Extension
                </s-button>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: "16px", alignItems: "center", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#e1e3e5", color: "#202223", fontWeight: "600", fontSize: "13px", flexShrink: 0 }}>
                  3
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <s-text type="strong">Create your First Rule</s-text>
                  <s-text color="subdued">Set up your first purchase option with custom deposit rules.</s-text>
                </div>
                <s-button onClick={() => navigate("/app/create")} variant="primary">
                  Create your First Rule
                </s-button>
              </div>
            </s-stack>
          </div>
        </s-card>

        {/* Pricing Plans Grid Section */}
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#202223", margin: 0 }}>Select a Plan</h2>

          <s-grid gridTemplateColumns="1fr 1fr" gap="base">

            {/* Plan 1: Starter */}
            <s-grid-item>
              <s-card>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", height: "100%", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <s-heading>Starter Plan</s-heading>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#202223", margin: "8px 0" }}>$0.00 / month</div>
                    <s-divider />
                    <ul style={{ listStyleType: "none", padding: 0, margin: "12px 0 0 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> 10 secured COD orders/mo
                      </li>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> Custom percentage deposits
                      </li>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> Standard analytics
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <s-button
                      disabled={!hasActivePlan || isDowngrading}
                      onClick={handleDowngrade}
                      style={{ width: "100%" }}
                    >
                      {isDowngrading ? "Downgrading..." : hasActivePlan ? "Downgrade to Free" : "Current Plan"}
                    </s-button>
                  </div>
                </div>
              </s-card>
            </s-grid-item>

            {/* Plan 2: Pro Growth */}
            <s-grid-item>
              <s-card>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", height: "100%", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <s-heading>Pro Growth</s-heading>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", backgroundColor: "#e2f1e5", color: "#108043", fontSize: "12px", fontWeight: "600", borderRadius: "4px" }}>
                        Popular
                      </span>
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: "700", color: "#202223", margin: "8px 0" }}>$14.99 / month</div>
                    <s-divider />
                    <ul style={{ listStyleType: "none", padding: 0, margin: "12px 0 0 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> Unlimited secured COD orders
                      </li>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> Advanced targeting layer (by variant, tag, or store)
                      </li>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> Automated balance due date reminders
                      </li>
                      <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4f5359" }}>
                        <span style={{ color: "#008060" }}>✓</span> Shopify Flow integration
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginTop: "16px" }}>
                    <s-button
                      disabled={hasActivePlan || isUpgrading}
                      variant="primary"
                      onClick={handleUpgrade}
                      loading={isUpgrading}
                      style={{ width: "100%" }}
                    >
                      {hasActivePlan ? "Current Plan" : "Upgrade to Pro"}
                    </s-button>
                  </div>
                </div>
              </s-card>
            </s-grid-item>

          </s-grid>
        </div>
      </div>
    </s-page>
  );
}
