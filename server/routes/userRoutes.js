import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import { updateFavorite, getFavorites, getUserBookings } from '../controllers/userController.js';

const router = express.Router();

router.post('/update-favorite', protectRoute, updateFavorite);
router.get('/favorites', protectRoute, getFavorites);
router.get('/bookings', protectRoute, getUserBookings);

export default router;