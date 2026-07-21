import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api } from "../api";

// WHAT: This is the page Shopify redirects the merchant to after
// they approve the Pro subscription on Shopify's billing page.
//
// WHY: Shopify appends ?charge_id=XXX to our returnUrl after approval.
// We must read that charge_id and call confirmSubscription to
// activate the subscription. Without this step, the merchant
// approved but their plan never actually activates.
//
// FLOW:
// 1. Merchant approves billing on Shopify's page
// 2. Shopify redirects to /app/billing/confirm?charge_id=XXX
// 3. This page reads the charge_id
// 4. Calls our confirmSubscription Gadget action
// 5. On success → redirects to dashboard with success banner
// 6. On failure → shows error message

export default function BillingConfirm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Track what state we are in so we show the right UI
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        // Read the charge_id Shopify appended to the URL
        // Example URL: /app/billing/confirm?charge_id=gid://shopify/AppSubscription/123
        const chargeId = searchParams.get("charge_id");

        if (!chargeId) {
            // If there is no charge_id, something went wrong with the redirect
            setStatus("error");
            setErrorMessage("No charge ID found in URL. Please try upgrading again.");
            return;
        }

        // Call our confirmSubscription Gadget action with the charge_id
        // This tells Shopify to move the subscription from PENDING to ACTIVE
        const confirm = async () => {
            try {
                await (api as any).confirmSubscription({ chargeId });

                // Success — subscription is now ACTIVE
                setStatus("success");

                // Redirect to dashboard after 2 seconds
                // We pass a query param so the dashboard can show a success banner
                setTimeout(() => {
                    navigate("/app?upgraded=true");
                }, 2000);

            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err.message ?? "Something went wrong confirming your subscription.");
            }
        };

        confirm();
    }, []);

    // LOADING STATE — shown while we call confirmSubscription
    if (status === "loading") {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                gap: "16px",
                fontFamily: "sans-serif"
            }}>
                <div style={{
                    width: "48px",
                    height: "48px",
                    border: "4px solid #e4e5e7",
                    borderTop: "4px solid #008060",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#6d7175", fontSize: "16px" }}>
                    Activating your Pro subscription...
                </p>
                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // SUCCESS STATE — shown briefly before redirect
    if (status === "success") {
        return (
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                gap: "16px",
                fontFamily: "sans-serif"
            }}>
                <div style={{
                    width: "64px",
                    height: "64px",
                    background: "#008060",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <span style={{ color: "white", fontSize: "32px" }}>✓</span>
                </div>
                <h2 style={{ color: "#202223", fontSize: "20px", margin: 0 }}>
                    You're now on lockdIn Pro!
                </h2>
                <p style={{ color: "#6d7175", fontSize: "14px", margin: 0 }}>
                    Redirecting you to the dashboard...
                </p>
            </div>
        );
    }

    // ERROR STATE — shown if something goes wrong
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "16px",
            fontFamily: "sans-serif",
            padding: "24px"
        }}>
            <div style={{
                width: "64px",
                height: "64px",
                background: "#d72c0d",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <span style={{ color: "white", fontSize: "32px" }}>✕</span>
            </div>
            <h2 style={{ color: "#202223", fontSize: "20px", margin: 0 }}>
                Subscription activation failed
            </h2>
            <p style={{ color: "#6d7175", fontSize: "14px", margin: 0, textAlign: "center" }}>
                {errorMessage}
            </p>
            <button
                onClick={() => navigate("/app/settings")}
                style={{
                    background: "#008060",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                    marginTop: "8px"
                }}
            >
                Back to Settings
            </button>
        </div>
    );
}