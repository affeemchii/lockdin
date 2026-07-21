import { useCallback } from "react";

// WHAT: The hard block upgrade modal.
// Shown when a free merchant hits a plan limit.
//
// WHY A SEPARATE COMPONENT:
// We show this modal in 3 places:
// - Create page (purchase option limit)
// - Orders page (order count limit)
// - Settings page (COD reminders)
// Building it once and importing it keeps the UI consistent
// and means we only have to update one file if design changes.
//
// PROPS:
// - isOpen: whether to show the modal
// - onClose: called when merchant clicks the X or backdrop
//   NOTE: for hard blocks we may disable closing — see usage
// - title: the heading shown in the modal
// - message: the explanation of why they are blocked
// - startUpgrade: the function from useBilling hook
// - limitType: which limit was hit (used to show correct stats)
// - billing: the full billing object from useBilling hook

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    startUpgrade: () => Promise<void>;
    limitType: "orders" | "purchaseOptions" | "reminders";
    billing: {
        monthlyOrderCount: number;
        purchaseOptionCount: number;
        FREE_ORDER_LIMIT: number;
        FREE_PURCHASE_OPTION_LIMIT: number;
    } | null;
}

export function UpgradeModal({
    isOpen,
    onClose,
    title,
    message,
    startUpgrade,
    limitType,
    billing
}: UpgradeModalProps) {
    // Do not render anything if modal is closed
    if (!isOpen) return null;

    // Build the usage stat line shown in the modal
    // so merchants can see exactly where they stand
    const getUsageLine = () => {
        if (!billing) return null;

        if (limitType === "orders") {
            return (
                <div style={styles.usageBadge}>
                    <span style={styles.usageNumber}>
                        {billing.monthlyOrderCount}/{billing.FREE_ORDER_LIMIT}
                    </span>
                    <span style={styles.usageLabel}> deposit orders used this month</span>
                </div>
            );
        }

        if (limitType === "purchaseOptions") {
            return (
                <div style={styles.usageBadge}>
                    <span style={styles.usageNumber}>
                        {billing.purchaseOptionCount}/{billing.FREE_PURCHASE_OPTION_LIMIT}
                    </span>
                    <span style={styles.usageLabel}> purchase options created</span>
                </div>
            );
        }

        return null;
    };

    return (
        // BACKDROP
        // Clicking the backdrop calls onClose.
        // For hard blocks, the parent passes a no-op function
        // so the merchant cannot dismiss without upgrading.
        <div
            style={styles.backdrop}
            onClick={onClose}
        >
            {/* MODAL CARD
          stopPropagation prevents clicks inside the modal
          from bubbling up to the backdrop and closing it */}
            <div
                style={styles.modal}
                onClick={(e) => e.stopPropagation()}
            >
                {/* LOCK ICON */}
                <div style={styles.iconWrapper}>
                    <span style={styles.icon}>🔒</span>
                </div>

                {/* PRO BADGE */}
                <div style={styles.proBadge}>
                    <span style={styles.proBadgeText}>lockdIn Pro</span>
                </div>

                {/* TITLE */}
                <h2 style={styles.title}>{title}</h2>

                {/* USAGE STAT */}
                {getUsageLine()}

                {/* MESSAGE */}
                <p style={styles.message}>{message}</p>

                {/* WHAT YOU GET ON PRO */}
                <div style={styles.featureList}>
                    <div style={styles.featureItem}>
                        <span style={styles.checkmark}>✓</span>
                        <span>Unlimited deposit orders per month</span>
                    </div>
                    <div style={styles.featureItem}>
                        <span style={styles.checkmark}>✓</span>
                        <span>Unlimited purchase options</span>
                    </div>
                    <div style={styles.featureItem}>
                        <span style={styles.checkmark}>✓</span>
                        <span>Automated COD balance reminders</span>
                    </div>
                    <div style={styles.featureItem}>
                        <span style={styles.checkmark}>✓</span>
                        <span>Priority support</span>
                    </div>
                </div>

                {/* PRICE */}
                <div style={styles.priceRow}>
                    <span style={styles.price}>$14.99</span>
                    <span style={styles.pricePer}>/month</span>
                </div>

                {/* UPGRADE BUTTON */}
                <button
                    style={styles.upgradeButton}
                    onClick={startUpgrade}
                >
                    Upgrade to Pro
                </button>

                {/* DISMISS LINK
            We show this so merchants do not feel completely trapped.
            They can close and keep using free features.
            The hard block only applies to the specific action they tried. */}
                <button
                    style={styles.dismissButton}
                    onClick={onClose}
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}

// STYLES
// Inline styles so this component has zero external dependencies.
// No CSS file needed, no Polaris components needed.
const styles: Record<string, React.CSSProperties> = {
    backdrop: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px"
    },
    modal: {
        background: "white",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "420px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
    },
    iconWrapper: {
        width: "64px",
        height: "64px",
        background: "#fff4e5",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    icon: {
        fontSize: "28px"
    },
    proBadge: {
        background: "#008060",
        borderRadius: "20px",
        padding: "4px 12px"
    },
    proBadgeText: {
        color: "white",
        fontSize: "12px",
        fontWeight: "600",
        letterSpacing: "0.5px"
    },
    title: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#202223",
        margin: 0,
        textAlign: "center"
    },
    usageBadge: {
        background: "#fef3cd",
        border: "1px solid #ffc453",
        borderRadius: "8px",
        padding: "8px 16px",
        textAlign: "center"
    },
    usageNumber: {
        fontWeight: "700",
        color: "#916a00",
        fontSize: "16px"
    },
    usageLabel: {
        color: "#916a00",
        fontSize: "14px"
    },
    message: {
        color: "#6d7175",
        fontSize: "14px",
        textAlign: "center",
        margin: 0,
        lineHeight: "1.5"
    },
    featureList: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        background: "#f6f6f7",
        borderRadius: "8px",
        padding: "16px"
    },
    featureItem: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        color: "#202223"
    },
    checkmark: {
        color: "#008060",
        fontWeight: "700",
        fontSize: "16px"
    },
    priceRow: {
        display: "flex",
        alignItems: "baseline",
        gap: "4px"
    },
    price: {
        fontSize: "32px",
        fontWeight: "700",
        color: "#202223"
    },
    pricePer: {
        fontSize: "16px",
        color: "#6d7175"
    },
    upgradeButton: {
        width: "100%",
        background: "#008060",
        color: "white",
        border: "none",
        borderRadius: "8px",
        padding: "14px",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer"
    },
    dismissButton: {
        background: "none",
        border: "none",
        color: "#6d7175",
        fontSize: "14px",
        cursor: "pointer",
        textDecoration: "underline",
        padding: 0
    }
};