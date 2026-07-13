import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";

export default function CreatePurchaseOption() {
  const navigate = useNavigate();

  // Card 1: Details
  const [name, setName] = useState("");
  const [lineItemHelpText, setLineItemHelpText] = useState("Deposit only due at checkout");

  // Card 2: Product Allocation
  const [allocationType, setAllocationType] = useState("products");
  const [selectedProducts, setSelectedProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedVariants, setSelectedVariants] = useState<Array<{ id: string; title: string; productTitle?: string }>>([]);
  const [productTags, setProductTags] = useState("");
  const [excludedProducts, setExcludedProducts] = useState<Array<{ id: string; title: string }>>([]);

  // Card 3: Deposit Options
  const [depositType, setDepositType] = useState("percentage");
  const [depositValue, setDepositValue] = useState("");
  const [payInFull, setPayInFull] = useState(true);
  const [depositError, setDepositError] = useState("");

  // Card 4: Deposit Option Display
  const [displaySettings, setDisplaySettings] = useState("always");

  // Card 5: Payment Collection Type
  const [paymentCollection, setPaymentCollection] = useState("manual");

  // Card 6: Balance Due Date
  const [balanceDueTrigger, setBalanceDueTrigger] = useState("fulfillment");
  const [balanceDueDays, setBalanceDueDays] = useState("");
  const [balanceDueDate, setBalanceDueDate] = useState("");

  // General
  const [generalError, setGeneralError] = useState("");
  const [fetching, setFetching] = useState(false);

  const handleDepositValueChange = (val: string) => {
    setDepositValue(val);
    const num = Number(val);
    if (depositType === "percentage") {
      if (val.trim() === "" || isNaN(num) || num < 0 || num > 99) {
        setDepositError("A number between 0 and 99.");
      } else {
        setDepositError("");
      }
    } else {
      if (val.trim() === "" || isNaN(num) || num < 0) {
        setDepositError("Please enter a valid amount.");
      } else {
        setDepositError("");
      }
    }
  };

  const handleSelectProducts = async () => {
    if (window.shopify) {
      const selected = await window.shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectedProducts.map(p => ({ id: p.id }))
      });
      if (selected) {
        setSelectedProducts(selected.map((p: any) => ({ id: p.id, title: p.title })));
      }
    }
  };

  const handleSelectVariants = async () => {
    if (window.shopify) {
      const selected = await window.shopify.resourcePicker({
        type: "variant",
        multiple: true,
        selectionIds: selectedVariants.map(v => ({ id: v.id }))
      });
      if (selected) {
        setSelectedVariants(selected.map((v: any) => ({
          id: v.id,
          title: v.title,
          productTitle: v.product?.title || ""
        })));
      }
    }
  };

  const handleSelectExcludedProducts = async () => {
    if (window.shopify) {
      const selected = await window.shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: excludedProducts.map(p => ({ id: p.id }))
      });
      if (selected) {
        setExcludedProducts(selected.map((p: any) => ({ id: p.id, title: p.title })));
      }
    }
  };

  const handleSave = async () => {
    setGeneralError("");

    // Validate Name
    if (!name.trim()) {
      setGeneralError("Please enter a purchase option name.");
      return;
    }

    // Validate Deposit Value
    const depNum = Number(depositValue);
    if (depositValue.trim() === "" || isNaN(depNum) || depNum < 0) {
      setDepositError("A number between 0 and 99.");
      setGeneralError("Please enter a valid deposit amount.");
      return;
    }
    if (depositType === "percentage" && depNum > 99) {
      setDepositError("A number between 0 and 99.");
      setGeneralError("Please enter a valid deposit amount.");
      return;
    }

    setFetching(true);
    try {
      const result = await api.createSellingPlanGroup({
        name,
        lineItemHelpText,
        allocationType,
        selectedProducts: JSON.stringify(selectedProducts),
        selectedVariants: JSON.stringify(selectedVariants),
        productTags,
        excludedProducts: JSON.stringify(excludedProducts),
        depositType,
        depositValue: depNum,
        payInFull,
        displaySettings,
        paymentCollection,
        balanceDueTrigger,
        balanceDueDays: balanceDueDays ? Number(balanceDueDays) : 0,
        balanceDueDate: balanceDueDate || ""
      });

      if (result && (result as any).success) {
        if (window.shopify) {
          window.shopify.toast.show("Purchase option saved successfully");
        }
        navigate("/app");
      }
    } catch (err: any) {
      setGeneralError(err.message || "An error occurred while saving.");
    } finally {
      setFetching(false);
    }
  };

  return (
    <s-page heading="Create purchase option">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "40px" }}>

        <div style={{ marginBottom: "4px" }}>
          <s-button onClick={() => navigate("/app")}>← Back to Dashboard</s-button>
        </div>

        {generalError && (
          <s-banner heading="Failed to save purchase option" tone="critical">
            <p>{generalError}</p>
          </s-banner>
        )}

        {/* Card 1: Purchase Option Basic Details */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Purchase Option Basic Details</h3>

            <div>
              <s-text-field
                label="Purchase option name"
                placeholder="e.g. Autumn Pre-order"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
              />
              <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "4px" }}>
                Added as an order tag to all orders made using this purchase option.
              </p>
            </div>

            <div>
              <s-text-field
                label="Line item help text"
                maxLength={29}
                value={lineItemHelpText}
                onChange={(e: any) => setLineItemHelpText(e.target.value)}
              />
              <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "4px" }}>
                Identifies line items using this purchase option in customer carts and checkouts. ({lineItemHelpText.length}/29)
              </p>
            </div>
          </div>
        </s-card>

        {/* Card 2: Product Selection Type */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Product Selection Type</h3>

            {/* Segmented tab control */}
            <div style={{ display: "flex", border: "1px solid #e1e3e5", borderRadius: "8px", overflow: "hidden", cursor: "pointer" }}>
              <div
                onClick={() => setAllocationType("products")}
                style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: allocationType === "products" ? "600" : "400", backgroundColor: allocationType === "products" ? "#ebebeb" : "#fff", color: "#202223" }}
              >
                Products
              </div>
              <div
                onClick={() => setAllocationType("variants")}
                style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: allocationType === "variants" ? "600" : "400", backgroundColor: allocationType === "variants" ? "#ebebeb" : "#fff", color: "#202223", borderLeft: "1px solid #e1e3e5" }}
              >
                Variants
              </div>
              <div
                onClick={() => setAllocationType("tags")}
                style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: allocationType === "tags" ? "600" : "400", backgroundColor: allocationType === "tags" ? "#ebebeb" : "#fff", color: "#202223", borderLeft: "1px solid #e1e3e5" }}
              >
                Tags
              </div>
              <div
                onClick={() => setAllocationType("whole_store")}
                style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: "13px", fontWeight: allocationType === "whole_store" ? "600" : "400", backgroundColor: allocationType === "whole_store" ? "#ebebeb" : "#fff", color: "#202223", borderLeft: "1px solid #e1e3e5" }}
              >
                Whole store
              </div>
            </div>

            {/* Products tab */}
            {allocationType === "products" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <s-banner heading="Product Selection Limit" tone="warning">
                  <p style={{ fontSize: "13px" }}>
                    Only 250 products can be added using the Select products button. For larger catalogs, assign by Tag, Whole store, or use Shopify Flow integration.
                  </p>
                </s-banner>
                <div>
                  <s-button onClick={handleSelectProducts}>Select products</s-button>
                </div>
                {selectedProducts.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                    {selectedProducts.map(p => (
                      <span key={p.id} style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#f1f1f1", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #e1e3e5" }}>
                        {p.title}
                        <button type="button" onClick={() => setSelectedProducts(selectedProducts.filter(x => x.id !== p.id))} style={{ marginLeft: "6px", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Variants tab */}
            {allocationType === "variants" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <s-banner heading="Variant Selection Limit" tone="warning">
                  <p style={{ fontSize: "13px" }}>
                    Only 250 variants can be added using the Select variants button. For larger catalogs use Shopify Flow.
                  </p>
                </s-banner>
                <div>
                  <s-button onClick={handleSelectVariants}>Select variants</s-button>
                </div>
                {selectedVariants.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                    {selectedVariants.map(v => (
                      <span key={v.id} style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#f1f1f1", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #e1e3e5" }}>
                        {v.productTitle ? `${v.productTitle} - ` : ""}{v.title}
                        <button type="button" onClick={() => setSelectedVariants(selectedVariants.filter(x => x.id !== v.id))} style={{ marginLeft: "6px", border: "none", background: "none", cursor: "pointer", fontWeight: "bold" }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags tab */}
            {allocationType === "tags" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <s-text-field
                  label="Product tags"
                  placeholder="Enter product tags to enable this purchase option for them"
                  value={productTags}
                  onChange={(e: any) => setProductTags(e.target.value)}
                />
                <s-banner heading="Tag Application Details" tone="info">
                  <p style={{ fontSize: "13px" }}>Adding products by tag starts after saving and the time it takes depends on the amount of products in your catalog.</p>
                </s-banner>
              </div>
            )}

            {/* Whole store tab */}
            {allocationType === "whole_store" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "13px", color: "#6d7175" }}>
                  Selecting this option will be applied on the entire store. You may wish to exclude some items, such as gift cards.
                </p>
                <div>
                  <s-button onClick={handleSelectExcludedProducts}>Select products to exclude</s-button>
                </div>
                {excludedProducts.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                    {excludedProducts.map(p => (
                      <span key={p.id} style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#fdf1f1", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", border: "1px solid #f9d2d2", color: "#b91c1c" }}>
                        {p.title}
                        <button type="button" onClick={() => setExcludedProducts(excludedProducts.filter(x => x.id !== p.id))} style={{ marginLeft: "6px", border: "none", background: "none", cursor: "pointer", fontWeight: "bold", color: "#b91c1c" }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </s-card>

        {/* Card 3: Deposit Options */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Deposit Options</h3>

            <s-choice-list
              label="Deposit Calculation"
              name="depositType"
              values={[depositType]}
              onChange={(e: any) => {
                const val = e.target.values ? e.target.values[0] : e.target.value;
                setDepositType(val);
                setDepositError("");
              }}
            >
              <s-choice value="percentage">Percentage of the total product price</s-choice>
              <s-choice value="exact_amount">Exact amount</s-choice>
            </s-choice-list>

            <div style={{ marginTop: "8px" }}>
              <s-text-field
                label="Deposit amount"
                type="number"
                value={depositValue}
                onChange={(e: any) => handleDepositValueChange(e.target.value)}
                prefix={depositType === "exact_amount" ? "$" : undefined}
                suffix={depositType === "percentage" ? "%" : undefined}
                error={depositError || undefined}
              />
              <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "4px" }}>
                A number between 0 and 99.
              </p>
            </div>

            <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: "12px", marginTop: "8px" }}>
              <s-checkbox
                label="Give customers the option to pay in full"
                checked={payInFull}
                onChange={(e: any) => setPayInFull(e.target.checked)}
              />
              <p style={{ fontSize: "11px", color: "#6d7175", marginTop: "4px", paddingLeft: "24px" }}>
                Checked means customers can either leave a deposit or pay in full up front.
              </p>
            </div>
          </div>
        </s-card>

        {/* Card 4: Deposit Option Display */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Deposit Option Display Settings</h3>

            <s-choice-list
              label="Display deposit option on product page"
              name="displaySettings"
              values={[displaySettings]}
              onChange={(e: any) => {
                const val = e.target.values ? e.target.values[0] : e.target.value;
                setDisplaySettings(val);
              }}
            >
              <s-choice value="always">Always</s-choice>
              <s-choice value="out_of_stock">When variant is out of stock</s-choice>
            </s-choice-list>
          </div>
        </s-card>

        {/* Card 5: Payment Collection Type */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Payment Collection Type</h3>

            <s-choice-list
              label="Collection mechanism for remaining balance"
              name="paymentCollection"
              values={[paymentCollection]}
              onChange={(e: any) => {
                const val = e.target.values ? e.target.values[0] : e.target.value;
                setPaymentCollection(val);
              }}
            >
              <s-choice value="manual">Manual - Collect payment from the card on file using the button on the Shopify order details page</s-choice>
            </s-choice-list>

            <p style={{ fontSize: "12px", color: "#6d7175", marginTop: "4px" }}>
              Enable automatic payment collection with lockdIn's collect payment action in Shopify Flow.
            </p>
          </div>
        </s-card>

        {/* Card 6: Balance Due Date */}
        <s-card>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a" }}>Balance Due Date</h3>

            <s-banner heading="Fixed Setting Caution" tone="warning">
              <p style={{ fontSize: "13px" }}>This setting can't be changed after the purchase option is saved. To use a different balance due date, create a new purchase option.</p>
            </s-banner>

            <s-choice-list
              label="When is the balance payment due?"
              name="balanceDueTrigger"
              values={[balanceDueTrigger]}
              onChange={(e: any) => {
                const val = e.target.values ? e.target.values[0] : e.target.value;
                setBalanceDueTrigger(val);
              }}
            >
              <s-choice value="fulfillment">On fulfillment - The balance is due when the order is fulfilled. Best used when dates are unknown.</s-choice>
              <s-choice value="days">Number of days after checkout - The balance is due a fixed number of days after the order is placed.</s-choice>
              <s-choice value="date">On a specific date - The balance is due on the calendar date you choose.</s-choice>
            </s-choice-list>

            {balanceDueTrigger === "days" && (
              <div style={{ marginTop: "12px", paddingLeft: "16px", borderLeft: "2px solid #e1e3e5" }}>
                <s-text-field
                  label="Number of days after checkout"
                  type="number"
                  placeholder="e.g. 14"
                  value={balanceDueDays}
                  onChange={(e: any) => setBalanceDueDays(e.target.value)}
                />
              </div>
            )}

            {balanceDueTrigger === "date" && (
              <div style={{ marginTop: "12px", paddingLeft: "16px", borderLeft: "2px solid #e1e3e5", display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: "500", color: "#202223" }}>Select calendar due date</label>
                <input
                  type="date"
                  value={balanceDueDate}
                  onChange={(e: any) => setBalanceDueDate(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    borderRadius: "4px",
                    border: "1px solid #8c9196",
                    outline: "none",
                    width: "200px"
                  }}
                />
              </div>
            )}
          </div>
        </s-card>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #e1e3e5", paddingTop: "16px" }}>
          <s-button onClick={() => navigate("/app")}>Cancel</s-button>
          <s-button variant="primary" onClick={handleSave} disabled={fetching}>
            {fetching ? "Saving..." : "Save purchase option"}
          </s-button>
        </div>

      </div>
    </s-page>
  );
}
