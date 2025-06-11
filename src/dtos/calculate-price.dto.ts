import { PrintingOptions } from "../types/order.types.js";

export interface CalculatePriceDto {
  printingOptions: PrintingOptions;
  quantity: number;
  pages: number;
}