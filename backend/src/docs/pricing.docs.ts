/**
 * @swagger
 * tags:
 *   - name: Pricing
 *     description: Public price calculation and admin pricing configuration
 */

/**
 * @swagger
 * /api/pricing/calculate:
 *   post:
 *     summary: Calculate print price (public)
 *     description: |
 *       No authentication required. Quote only (does not create an order).
 *       Uses the active PricingConfig from the database.
 *       Accepts client-supplied `pages` (1–10000) and `quantity` (1–100).
 *       Returns total, full breakdown, and rulesVersion for snapshotting later.
 *     tags: [Pricing]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [printingOptions, quantity, pages]
 *             properties:
 *               printingOptions:
 *                 $ref: '#/components/schemas/PrintingOptions'
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               pages:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10000
 *     responses:
 *       201:
 *         description: Price calculated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

/**
 * @swagger
 * /api/admin/pricing:
 *   get:
 *     summary: Get active pricing configuration
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current PricingConfig (rules, version, updatedBy)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   put:
 *     summary: Update active pricing configuration
 *     description: Replaces pricing rules, increments version, and records updatedBy.
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rules]
 *             properties:
 *               rules:
 *                 type: object
 *                 required:
 *                   - basePricePerPage
 *                   - colorPremium
 *                   - doubleSidedDiscount
 *                   - paperTypePremium
 *                   - paperSizePremium
 *                   - bindingCost
 *                   - finishingCost
 *                 properties:
 *                   basePricePerPage:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1000000
 *                   colorPremium:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1000000
 *                   doubleSidedDiscount:
 *                     type: number
 *                     minimum: -1000000
 *                     maximum: 1000000
 *                   paperTypePremium:
 *                     type: object
 *                   paperSizePremium:
 *                     type: object
 *                   bindingCost:
 *                     type: object
 *                   finishingCost:
 *                     type: object
 *     responses:
 *       200:
 *         description: Pricing configuration updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PrintingOptions:
 *       type: object
 *       required: [color, sides, paperType, paperSize, binding, finishing]
 *       properties:
 *         color:
 *           type: string
 *           enum: [black-white, color]
 *         sides:
 *           type: string
 *           enum: [single, double]
 *         paperType:
 *           type: string
 *           enum: [matte, glossy, cardstock, recycled]
 *         paperSize:
 *           type: string
 *           enum: [A3, A4, A5, letter, legal]
 *         binding:
 *           type: string
 *           enum: [none, stapled, spiral, hardcover]
 *         finishing:
 *           type: string
 *           enum: [none, lamination]
 */
