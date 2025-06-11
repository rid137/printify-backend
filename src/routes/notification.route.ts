import { Router } from 'express';
import {
  registerDevice,
  sendTestNotification
} from '../controllers/notification.controller.js';

const router = Router();

router.post('/:userId/register-device', registerDevice);
router.post('/:userId/send-test', sendTestNotification);

export default router;