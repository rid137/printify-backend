import { PrintingOptions } from '../types/order.types.js';
import { PricingRule } from '../types/pricing.types.js';

export const pricingRules: PricingRule = {
    basePricePerPage: 50,
    colorPremium: 30,
    doubleSidedDiscount: -10,

    paperTypePremium: {
        matte: 0,
        glossy: 20,
        cardstock: 40,
        recycled: 5
    },
    
    bindingCost: {
        none: 0.00,
        stapled: 100, 
        spiral: 300,
        hardcover: 500
    },
    
    finishingCost: {
        none: 0.00,
        lamination: 300
    },
    
    
};

export const calculatePrice = (
  options: PrintingOptions,
  quantity: number,
  pages: number
): number => {
  // Calculate cost PER PAGE
  let pricePerPage = pricingRules.basePricePerPage;

  if (options.color === 'color') {
    pricePerPage += pricingRules.colorPremium;
  }

  if (options.sides === 'double') {
    pricePerPage += pricingRules.doubleSidedDiscount;
  }

  pricePerPage += pricingRules.paperTypePremium[options.paperType];

  const total = (pricePerPage * pages * quantity) 
    + pricingRules.bindingCost[options.binding] 
    + pricingRules.finishingCost[options.finishing];

  return Math.round(total);
};