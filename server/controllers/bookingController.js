import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

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
        const { userId } = req;           // ← Changed from req.auth

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

        res.json({ success: true, message: 'Booked Successfully' });

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