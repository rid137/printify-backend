export interface PricingRule {
    basePricePerPage: number;
    colorPremium: number;
    doubleSidedDiscount: number;
    paperTypePremium: {
        matte: number;
        glossy: number;
        cardstock: number;
        recycled: number;
    };
    bindingCost: {
        none: number;
        stapled: number;
        spiral: number;
        hardcover: number;
    };
    finishingCost: {
        none: number;
        lamination: number;
    };
    // bulkDiscount: {
    //     threshold: number;
    //     percentage: number;
    // }[];
}