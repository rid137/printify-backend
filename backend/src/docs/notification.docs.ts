/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Device registration and notification services
 */

/**
 * @swagger
 * /api/notification/register-device:
 *   post:
 *     summary: Register a device for push notifications
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 maxLength: 4096
 *                 example: "fcm_token_example_here"
 *               platform:
 *                 type: string
 *                 enum: [web, android, ios]
 *                 example: "web"
 *     responses:
 *       200:
 *         description: Device registered or already exists
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
 *                   example: Device registered for notifications
 *                 data:
 *                   type: object
 *                   example: {}
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /api/notification/send-test:
 *   post:
 *     summary: Send a test push notification to the authenticated user's device(s)
 *     description: |
 *       Requires FCM to be configured. If Firebase is unavailable, returns 500
 *       and does not claim that a notification was sent.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
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
 *                   example: Test notification sent
 *                 data:
 *                   type: object
 *                   example: {}
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
