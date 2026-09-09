/**
 * @swagger
 * tags:
 *   - name: Upload
 *     description: Authenticated document upload to Cloudinary
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload one or more documents
 *     description: |
 *       Requires JWT authentication. Accepts multipart form field `files`.
 *       Supported formats: PDF, DOCX, PPTX.
 *       Per-file size limit defaults to 10 MB (`MAX_UPLOAD_SIZE_MB`).
 *       At most 10 files per request; extra files are rejected before processing.
 *       Partial success still applies to files within that limit.
 *       Each file is validated (extension + content) and stored on Cloudinary
 *       under a unique public_id `{userId}_{uuid}` in folder `printing-app`.
 *       PDF uploads may include Cloudinary `pages`;
 *       DOCX/PPTX typically do not return page counts without Cloudinary Aspose.
 *       Order create/price uses that Cloudinary page count; it does not trust
 *       a client-supplied `pages` value.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: string
 *                 format: binary
 *                 description: One or more PDF/DOCX/PPTX files
 *     responses:
 *       200:
 *         description: Upload completed (possibly partial)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     count:
 *                       type: integer
 *                     uploadedFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           public_id:
 *                             type: string
 *                           pages:
 *                             type: integer
 *                             nullable: true
 *                           originalFilename:
 *                             type: string
 *                           mimeType:
 *                             type: string
 *                           size:
 *                             type: integer
 *                           format:
 *                             type: string
 *                             enum: [pdf, docx, pptx]
 *                     failedFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           originalFilename:
 *                             type: string
 *                           reason:
 *                             type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
