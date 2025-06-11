/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management endpoints
 *   - name: Admin Orders
 *     description: Admin-only order management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         user:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         file:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               example: "uploads/file123.pdf"
 *             pages:
 *               type: integer
 *               example: 10
 *             fileName:
 *               type: string
 *               example: "file123.pdf"
 *         printingOptions:
 *           type: object
 *           properties:
 *             color:
 *               type: string
 *               example: "color"
 *             sides:
 *               type: string
 *               example: "double"
 *             paperType:
 *               type: string
 *               example: "glossy"
 *             paperSize:
 *               type: string
 *               example: "A4"
 *             binding:
 *               type: string
 *               example: "spiral"
 *             finishing:
 *               type: string
 *               example: "lamination"
 *         quantity:
 *           type: integer
 *           example: 5
 *         totalPrice:
 *           type: number
 *           example: 24.99
 *         status:
 *           type: string
 *           example: "pending"
 *         isPaid:
 *           type: boolean
 *           default: false
 *         paidAt:
 *           type: string
 *           format: date-time
 *         isDelivered:
 *           type: boolean
 *           default: false
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *         paymentResult:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "PAYID-LKJH12345"
 *             status:
 *               type: string
 *               example: "COMPLETED"
 *             update_time:
 *               type: string
 *               format: date-time
 *               example: "2023-03-15T10:00:00Z"
 *             email_address:
 *               type: string
 *               format: email
 *               example: "payer@example.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /orders/calculate-price:
 *   post:
 *     summary: Calculate the price of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - printingOptions
 *               - quantity
 *               - pages
 *             properties:
 *               printingOptions:
 *                 type: object
 *                 required:
 *                   - color
 *                   - sides
 *                   - paperType
 *                   - paperSize
 *                   - binding
 *                   - finishing
 *                 properties:
 *                   color:
 *                     type: string
 *                     enum: [black-white, color]
 *                     description: Color option for printing
 *                     example: "color"
 *                   sides:
 *                     type: string
 *                     enum: [single, double]
 *                     description: Single or double-sided printing
 *                     example: "double"
 *                   paperType:
 *                     type: string
 *                     enum: [matte, glossy, cardstock, recycled]
 *                     description: Type of paper
 *                     example: "glossy"
 *                   paperSize:
 *                     type: string
 *                     enum: [A3, A4, A5, letter, legal]
 *                     description: Size of the paper
 *                     example: "A4"
 *                   binding:
 *                     type: string
 *                     enum: [none, stapled, spiral, hardcover]
 *                     description: Binding type
 *                     example: "spiral"
 *                   finishing:
 *                     type: string
 *                     enum: [none, lamination]
 *                     description: Finishing option
 *                     example: "lamination"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the order
 *                 example: 5
 *               pages:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of pages in the file
 *                 example: 10
 *     responses:
 *       200:
 *         description: Price calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Price calculated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPrice:
 *                       type: number
 *                       example: 24.99
 *                     currency:
 *                       type: string
 *                       example: "NGN"
 *                     pricePerUnit:
 *                       type: number
 *                       example: 4.99
 *                     totalPages:
 *                       type: integer
 *                       example: 50
 *                     breakdown:
 *                       type: object
 *                       properties:
 *                         baseCost:
 *                           type: number
 *                           example: 20.00
 *                         colorPremium:
 *                           type: number
 *                           example: 2.00
 *                         paperPremium:
 *                           type: number
 *                           example: 1.50
 *                         bindingCost:
 *                           type: number
 *                           example: 0.99
 *                         finishingCost:
 *                           type: number
 *                           example: 0.50
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - printingOptions
 *               - quantity
 *             properties:
 *               file:
 *                 type: object
 *                 required:
 *                   - url
 *                   - pages
 *                   - fileName
 *                 properties:
 *                   url:
 *                     type: string
 *                     description: Path to the uploaded file
 *                     example: "uploads/file123.pdf"
 *                   pages:
 *                     type: integer
 *                     description: Number of pages in the file
 *                     example: 10
 *                   fileName:
 *                     type: string
 *                     description: Name of the uploaded file
 *                     example: "file123.pdf"
 *               printingOptions:
 *                 type: object
 *                 required:
 *                   - color
 *                   - sides
 *                   - paperType
 *                   - paperSize
 *                   - binding
 *                   - finishing
 *                 properties:
 *                   color:
 *                     type: string
 *                     description: Color option for printing
 *                     example: "color"
 *                   sides:
 *                     type: string
 *                     description: Single or double-sided printing
 *                     example: "double"
 *                   paperType:
 *                     type: string
 *                     description: Type of paper
 *                     example: "glossy"
 *                   paperSize:
 *                     type: string
 *                     description: Size of the paper
 *                     example: "A4"
 *                   binding:
 *                     type: string
 *                     description: Binding type
 *                     example: "spiral"
 *                   finishing:
 *                     type: string
 *                     description: Finishing option
 *                     example: "lamination"
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the order
 *                 example: 5
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: User orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User orders retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     totalDocuments:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /orders/{id}/pay:
 *   put:
 *     summary: Mark order as paid
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - status
 *               - update_time
 *             properties:
 *               id:
 *                 type: string
 *                 description: Payment ID
 *               status:
 *                 type: string
 *                 description: Payment status
 *               update_time:
 *                 type: string
 *                 format: date-time
 *               payer:
 *                 type: object
 *                 properties:
 *                   email_address:
 *                     type: string
 *                     format: email
 *     responses:
 *       200:
 *         description: Order marked as paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order marked as paid
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Orders retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     perPage:
 *                       type: integer
 *                     totalDocuments:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */

/**
 * @swagger
 * /admin/orders/count:
 *   get:
 *     summary: Get total order count (Admin only)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total orders count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Total orders count retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                       example: 42
 */

/**
 * @swagger
 * /admin/orders/total-sales:
 *   get:
 *     summary: Calculate total sales (Admin only)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total sales calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Total sales calculated
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSales:
 *                       type: number
 *                       example: 1250.75
 */

/**
 * @swagger
 * /admin/orders/{id}/deliver:
 *   put:
 *     summary: Mark order as delivered (Admin only)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order marked as delivered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order marked as delivered
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */