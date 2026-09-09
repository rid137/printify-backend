/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Payment processing, verification, and Paystack webhooks
 */

/**
 * @swagger
 * /api/payment/initialize:
 *   post:
 *     summary: Initialize a payment transaction
 *     description: |
 *       Creates or reuses a pending local Transaction using the order's stored totalPrice.
 *       The client cannot supply the payment amount. Paystack is initialized with amount in kobo.
 *       Paystack customer email is always the authenticated user's email (`req.user.email`).
 *       The request body must not include `email`.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order to pay for
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Payment initialized successfully
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
 *                   example: Payment initialized successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     authorization_url:
 *                       type: string
 *                       example: "https://checkout.paystack.com/0peioxfhpn"
 *                     reference:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     access_code:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/payment/verify:
 *   get:
 *     summary: Verify a payment transaction
 *     description: |
 *       Server-side verification against Paystack. Confirms status, currency, and amount
 *       (Paystack kobo vs local NGN). Marks the order paid only while it is still unpaid
 *       and `status` is `pending` (a cancelled order cannot become paid). Idempotent if
 *       the order is already paid. Ownership of the order is required.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference (currently the order ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Payment verified successfully (or already paid)
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
 *                   example: Payment verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Paystack webhook receiver
 *     description: |
 *       Public endpoint (no JWT). Authenticated via the `x-paystack-signature` header
 *       (HMAC SHA-512 of the raw request body using the Paystack secret key).
 *       On `charge.success`, the server re-verifies the transaction with Paystack API,
 *       checks amount/currency against the local Transaction, and marks the order paid
 *       only if it is still unpaid and `status` is `pending`. Cancelled orders are not
 *       marked paid. Processing is idempotent for duplicate deliveries.
 *     tags: [Payments]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-paystack-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC SHA-512 hex digest of the raw body
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: charge.success
 *               data:
 *                 type: object
 *                 properties:
 *                   reference:
 *                     type: string
 *                   status:
 *                     type: string
 *                   amount:
 *                     type: integer
 *                     description: Amount in kobo
 *                   currency:
 *                     type: string
 *                     example: NGN
 *     responses:
 *       200:
 *         description: Webhook acknowledged
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
 *                   example: Webhook received
 *                 data:
 *                   type: object
 *                   properties:
 *                     received:
 *                       type: boolean
 *                       example: true
 *                     processed:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Missing or invalid Paystack signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
