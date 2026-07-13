import { useState } from "react";

export default function Settings() {
  const [badgeText, setBadgeText] = useState("Deposit only due at checkout");
  const [emailNotification, setEmailNotification] = useState(true);
  const [reminderDays, setReminderDays] = useState("3");

  const handleSave = () => {
    // Show success toast on client side
    if (window.shopify) {
      window.shopify.toast.show("Preferences saved successfully");
    }
  };

  return (
    <s-page heading="Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
        
        {/* Card 1: Text Customizations */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Cart & Checkout Text Defaults</h3>
            
            <s-text-field 
              label="Line item badge text" 
              value={badgeText}
              onChange={(e: any) => setBadgeText(e.target.value)}
              placeholder="e.g. Deposit due now"
            />
            <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "-8px" }}>
              Appears on cart items and invoice sheets when a deposit purchase option is used.
            </p>
          </div>
        </s-card>

        {/* Card 2: Notifications */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Customer Notifications</h3>
            
            <s-checkbox 
              label="Send balance due reminder emails" 
              checked={emailNotification}
              onChange={(e: any) => setEmailNotification(e.target.checked)}
            />
            
            {emailNotification && (
              <s-text-field 
                label="Days before balance due to send email" 
                type="number"
                value={reminderDays}
                onChange={(e: any) => setReminderDays(e.target.value)}
              />
            )}
            <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "-8px" }}>
              Notifies customers that the balance of their deposit order will be charged soon.
            </p>
          </div>
        </s-card>

        {/* Save Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {/* @ts-expect-error s-button needs to be recognized */}
          <s-button variant="primary" onClick={handleSave}>Save settings</s-button>
        </div>

      </div>
    </s-page>
  );
}
