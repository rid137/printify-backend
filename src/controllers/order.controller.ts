import { CalculatePriceDto } from "../dtos/calculate-price.dto.js";
import asyncHandler from "../middlewares/async-handler.middleware.js";
import Order from "../models/order.model.js";
import { calculatePrice, pricingRules } from "../services/pricing.service.js";
import { createdResponse, paginatedResponse, successResponse } from "../utils/apiResponse.js";
import { BadRequest, NotFound } from "../utils/error/httpErrors.js";


const calculateOrderPrice = asyncHandler(async (req, res) => {
    const { printingOptions, quantity, pages } = req.body as CalculatePriceDto;

    if (!pages) {
        throw BadRequest("File pages are required.");
    }
    
    if (!printingOptions) {
        throw BadRequest("Printing options are required.");
    }
    if (!printingOptions.color) {
        throw BadRequest("Printing option 'color' is required.");
    }
    if (!printingOptions.sides) {
        throw BadRequest("Printing option 'sides' is required.");
    }
    if (!printingOptions.paperType) {
        throw BadRequest("Printing option 'paperType' is required.");
    }
    if (!printingOptions.paperSize) {
        throw BadRequest("Printing option 'paperSize' is required.");
    }
    if (!printingOptions.binding) {
        throw BadRequest("Printing option 'binding' is required.");
    }
    if (!printingOptions.finishing) {
        throw BadRequest("Printing option 'finishing' is required.");
    }

    // Validate quantity
    if (!quantity) {
        throw BadRequest("Quantity is required.");
    }
    if (quantity < 1) {
        throw BadRequest("Quantity must be greater than or equal to one.");
    }

    const totalPrice = calculatePrice(printingOptions, quantity, pages);

    const data = {
      totalPrice,
      currency: "NGN",
      pricePerUnit: totalPrice / quantity,
      totalPages: pages * quantity,
      breakdown: {
          baseCost: pricingRules.basePricePerPage * pages * quantity,
          colorPremium: printingOptions.color === 'color' 
              ? pricingRules.colorPremium * pages * quantity 
              : 0,
          paperPremium: pricingRules.paperTypePremium[printingOptions.paperType] * pages * quantity,
          bindingCost: pricingRules.bindingCost[printingOptions.binding],
          finishingCost: pricingRules.finishingCost[printingOptions.finishing]
      }
    };

    createdResponse(res, data, "Price calculated successfully");
});


const createOrder = asyncHandler(async (req, res) => {
    const { file, printingOptions, quantity } = req.body;

    if (!file) {
      throw BadRequest("File details are required.");
    }
    if (!file.url) {
      throw BadRequest("File URL is required.");
    }
    if (!file.pages) {
      throw BadRequest("File pages are required.");
    }
    if (!file.fileName) {
      throw BadRequest("File name is required.");
    }

    if (!printingOptions) {
      throw BadRequest("Printing options are required.");
    }
    if (!printingOptions.color) {
      throw BadRequest("Printing option 'color' is required.");
    }
    if (!printingOptions.sides) {
      throw BadRequest("Printing option 'sides' is required.");
    }
    if (!printingOptions.paperType) {
      throw BadRequest("Printing option 'paperType' is required.");
    }
    if (!printingOptions.paperSize) {
      throw BadRequest("Printing option 'paperSize' is required.");
    }
    if (!printingOptions.binding) {
      throw BadRequest("Printing option 'binding' is required.");
    }
    if (!printingOptions.finishing) {
      throw BadRequest("Printing option 'finishing' is required.");
    }

    if (!quantity) {
      throw BadRequest("Quantity is required.");
    }
    if (quantity < 1) {
      throw BadRequest("Quantity must be greater than or equal to one.");
    }
      
    const totalPrice = calculatePrice(printingOptions, quantity, file.pages);

    const order = new Order({
        file,
        printingOptions,
        user: req.user._id as string,
        quantity,
        totalPrice,
    });

    const createdOrder = await order.save();
    createdResponse(res, createdOrder, "Order created successfully");
});

const getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.size as string) || 10;
    
    const [orders, total] = await Promise.all([
        Order.find({})
        .populate("user", "username")
        .skip((page - 1) * perPage) 
        .limit(perPage),
        Order.countDocuments()
    ]);

    paginatedResponse(res, orders, {
        currentPage: page,
        perPage,
        totalDocuments: total,
        totalPages: Math.ceil(total / perPage),
    }, "Orders retrieved successfully");
});

const getUserOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.size as string) || 20;
    
    const [orders, total] = await Promise.all([
        Order.find({ user: req.user._id })
        .skip((page - 1) * perPage)
        .limit(perPage),
        Order.countDocuments({ user: req.user._id })
    ]);

    paginatedResponse(res, orders, {
        currentPage: page,
        perPage,
        totalDocuments: total,
        totalPages: Math.ceil(total / perPage),
    }, "User orders retrieved successfully");
});

const countTotalOrders = asyncHandler(async (_req, res) => {
  const totalOrders = await Order.countDocuments();
  successResponse(res, { totalOrders }, "Total orders count retrieved");
});

const findOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "username email")
    // .populate("orderItems.product", "name images");

  if (!order) {
    throw NotFound("Order not found");
  }

  successResponse(res, order, "Order retrieved successfully");
});

const markOrderAsPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw NotFound("Order not found");
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer?.email_address || "",
  };

  const updatedOrder = await order.save();
  successResponse(res, updatedOrder, "Order marked as paid");
});

const markOrderAsDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        throw NotFound("Order not found");
    }

    order.isDelivered = true;
    order.deliveredAt = new Date();

    const updatedOrder = await order.save();
    successResponse(res, updatedOrder, "Order marked as delivered");
});

const calculateTotalSales = asyncHandler(async (_req, res) => {
    const orders = await Order.find({ isPaid: true });
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    successResponse(res, { totalSales }, "Total sales calculated");
});

export {
  calculateOrderPrice,
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
};