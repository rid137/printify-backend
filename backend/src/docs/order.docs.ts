/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Multi-item order management endpoints
 *   - name: Admin Orders
 *     description: Admin-only order management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItemFile:
 *       type: object
 *       required: [url, publicId, fileName, pages]
 *       properties:
 *         url:
 *           type: string
 *         publicId:
 *           type: string
 *         fileName:
 *           type: string
 *         pages:
 *           type: integer
 *           minimum: 1
 *           maximum: 10000
 *           description: Server-trusted page count stored on the order (not client-supplied)
 *         mimeType:
 *           type: string
 *         size:
 *           type: number
 *         format:
 *           type: string
 *           enum: [pdf, docx, pptx]
 *     OrderItem:
 *       type: object
 *       properties:
 *         file:
 *           $ref: '#/components/schemas/OrderItemFile'
 *         printingOptions:
 *           $ref: '#/components/schemas/PrintingOptions'
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         unitPrice:
 *           type: number
 *           description: Server-calculated unit price (do not send on create)
 *         subtotal:
 *           type: number
 *           description: Server-calculated line subtotal
 *         pricingSnapshot:
 *           type: object
 *           properties:
 *             rulesVersion:
 *               type: integer
 *             rules:
 *               type: object
 *             breakdown:
 *               type: object
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         items:
 *           type: array
 *           minItems: 1
 *           maxItems: 20
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         itemsSubtotal:
 *           type: number
 *         totalPrice:
 *           type: number
 *         currency:
 *           type: string
 *           example: NGN
 *         status:
 *           type: string
 *           enum: [pending, received, processing, completed, delivered, cancelled]
 *           example: pending
 *           description: |
 *             Forward-only machine: pending → received → processing → completed → delivered.
 *             Unpaid pending orders may be cancelled by the owner only.
 *             Payment does not advance status. Same-status (no-op) updates are rejected.
 *         statusHistory:
 *           type: array
 *           description: Persisted transition events only; empty when none exist
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, received, processing, completed, delivered, cancelled]
 *               at:
 *                 type: string
 *                 format: date-time
 *               by:
 *                 type: string
 *                 description: User or admin who performed the transition
 *               note:
 *                 type: string
 *         isPaid:
 *           type: boolean
 *         paidAt:
 *           type: string
 *           format: date-time
 *         isDelivered:
 *           type: boolean
 *           description: Derived compatibility field; true only when status is delivered
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *         paymentResult:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/user/orders/calculate-price:
 *   post:
 *     summary: Calculate price for one or more order items
 *     description: |
 *       Authenticated multi-item cart calculator. JWT + verified user required.
 *       Server uses PricingService; client must not send unitPrice/subtotal/totalPrice.
 *       Each item requires Cloudinary `publicId` owned by the caller. Page counts come
 *       from Cloudinary (trusted). Client-supplied `pages` is ignored.
 *       Returns 201. Quantity 1–100; at most 20 items.
 *       Authenticated calculation/creation returns 400 when Cloudinary does not
 *       provide a trusted page count (typical for DOCX/PPTX). Page counts are never invented.
 *       For the public quote calculator use POST /api/pricing/calculate.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   required: [file, printingOptions, quantity]
 *                   properties:
 *                     file:
 *                       type: object
 *                       required: [publicId]
 *                       properties:
 *                         publicId:
 *                           type: string
 *                           description: Cloudinary public id of a file this user uploaded
 *                         public_id:
 *                           type: string
 *                     printingOptions:
 *                       $ref: '#/components/schemas/PrintingOptions'
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 100
 *     responses:
 *       201:
 *         description: Multi-item price calculated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/user/orders:
 *   post:
 *     summary: Create a multi-item order
 *     description: |
 *       Submit previously uploaded file metadata plus per-item printing options (`items[]`).
 *       All pricing is calculated server-side and snapshotted per item.
 *       Do not send `unitPrice`, `subtotal`, `totalPrice`, or trusted `pages`.
 *       `publicId` must belong to the authenticated user. Client `pages` and
 *       `url` are not trusted; the server uses Cloudinary metadata.
 *       PDF page counts come from Cloudinary. Authenticated create returns 400 when
 *       Cloudinary does not provide a trusted page count (typical for DOCX/PPTX).
 *       Page counts are never invented. At most 20 items; quantity 1–100.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   required: [file, printingOptions, quantity]
 *                   properties:
 *                     file:
 *                       type: object
 *                       required: [fileName, publicId]
 *                       properties:
 *                         url:
 *                           type: string
 *                           description: Ignored; replaced with the Cloudinary secure URL
 *                         publicId:
 *                           type: string
 *                           description: Cloudinary public id of a file this user uploaded
 *                         public_id:
 *                           type: string
 *                         fileName:
 *                           type: string
 *                         pages:
 *                           type: integer
 *                           description: Ignored; replaced with Cloudinary page count when available
 *                         mimeType:
 *                           type: string
 *                         size:
 *                           type: number
 *                         format:
 *                           type: string
 *                           enum: [pdf, docx, pptx]
 *                     printingOptions:
 *                       $ref: '#/components/schemas/PrintingOptions'
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 100
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   get:
 *     summary: List current user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, received, processing, completed, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Paginated orders (items[] shape; legacy orders normalized)
 */

/**
 * @swagger
 * /api/user/orders/{id}:
 *   get:
 *     summary: Get order by ID (owner only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/admin/orders:
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
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, received, processing, completed, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Paginated orders
 */

/**
 * @swagger
 * /api/admin/orders/count:
 *   get:
 *     summary: Count total orders (Admin)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total order count
 */

/**
 * @swagger
 * /api/admin/orders/total-sales:
 *   get:
 *     summary: Calculate total sales from paid orders (Admin)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sum of paid order totalPrice values
 */

/**
 * @swagger
 * /api/user/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an unpaid pending order (owner)
 *     description: |
 *       Authenticated owner only. Cancels the order when status is pending and isPaid is false.
 *       Another user's order returns 403. Paid, received, processing, completed, delivered,
 *       or already-cancelled orders return 400. Cancellation is not available on the admin status API.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Invalid id, illegal cancellation (not unpaid pending), or no-op
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   get:
 *     summary: Get order by ID (Admin)
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order retrieved with persisted status history
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   put:
 *     summary: Transition order status (Admin)
 *     description: |
 *       Admin allowed targets: received, processing, completed, delivered.
 *       Admin cannot set `pending` or `cancelled`.
 *       `received` requires the order to be paid.
 *       `cancelled` is not an admin target; owners cancel via POST /api/user/orders/{id}/cancel.
 *       Invalid transitions and same-status (no-op) requests are rejected with 400.
 *       The write is atomic on the expected current status (concurrent stale updates return 409).
 *       `isDelivered` is set only when status becomes delivered.
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [received, processing, completed, delivered]
 *               note:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid ObjectId, invalid body, illegal transition, or no-op
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */

/**
 * @swagger
 * /api/admin/orders/{id}/deliver:
 *   put:
 *     summary: Mark order as delivered (Admin)
 *     description: |
 *       Convenience shortcut for PUT /api/admin/orders/{id}/status with status=delivered.
 *       Order must already be completed. Already-delivered orders are rejected (no-op).
 *     tags: [Admin Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked delivered
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
