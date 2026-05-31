import express from 'express';
import { createBooking, getOccupiedSeats } from '../controllers/bookingController.js';
import { protectRoute } from '../middleware/auth.js';   // ← Import this

const bookingRouter = express.Router();

bookingRouter.post('/create', protectRoute, createBooking);     // ← Protected
bookingRouter.get('/seats/:showId', protectRoute, getOccupiedSeats);  // ← Protected

export default bookingRouter;