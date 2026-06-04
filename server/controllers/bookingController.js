import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import stripe from 'stripe';

const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats || {};
    return !selectedSeats.some(seat => occupiedSeats[seat]);
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

export const createBooking = async (req, res) => {
    try {
        const { userId } = req;     
        const {origin} = req.headers;      

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized - Please login" 
            });
        }

        const { showId, selectedSeats } = req.body;

        if (!showId || !selectedSeats?.length) {
            return res.status(400).json({ 
                success: false, 
                message: "Show ID and seats are required" 
            });
        }

        const isAvailable = await checkSeatsAvailability(showId, selectedSeats);
        if (!isAvailable) {
            return res.json({ success: false, message: 'Selected seats are not available.' });
        }

        const showData = await Show.findById(showId).populate('movie');
        if (!showData) {
            return res.status(404).json({ success: false, message: "Show not found" });
        }

        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        });

        selectedSeats.forEach(seat => {
            showData.occupiedSeats[seat] = userId;
        });

        showData.markModified('occupiedSeats');
        await showData.save();

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // Creating line items for Stripe
        const line_items = [{
            price_data: {
                currency:'usd',
                product_data:{
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity:1
        }]
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment', 
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() /1000) + 30 * 60, // Expires in 30 minutes
        })

        booking.paymentLink = session.url
        await booking.save()
    
    // Run Inngest Sheduler Function to check payment status after 10 minutes
    await inngest.send({
        name: "app/checkpayment",
        data: {
            bookingId: booking._id.toString()
        }
    })
        res.json({ success: true, url: session.url });

    } catch (error) {
        console.error("Booking Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    if (!showData) {
      return res.status(404).json({ success: false, message: "Show not found" });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats || {});

    res.json({ success: true, occupiedSeats });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};