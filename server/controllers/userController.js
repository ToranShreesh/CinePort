import { populate } from "dotenv";
import Booking from "../models/Booking.js";
import { clerkClient } from "@clerk/express";
import Movie from "../models/Movie.js";

// API Controller Function to Get User Bookings
export const getUserBookings = async (req, res) => {
    try {
        // Correct way with Clerk Express
        const userId = req.auth?.userId || req.userId;   // Support both patterns

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized - Please login" 
            });
        }

        const bookings = await Booking.find({ user: userId })
            .populate({
                path: "show",
                populate: { path: "movie" }
            })
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            bookings: bookings || [] 
        });
        
    } catch (error) {
        console.error("Get Bookings Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// API Controller Function to Update Favorite Movie in Clerk User Metadata
export const updateFavorite = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.userId;        // ← From middleware

        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized" 
            });
        }

        const user = await clerkClient.users.getUser(userId);

        let favorites = user.privateMetadata?.favorites || [];

        if (favorites.includes(movieId)) {
            favorites = favorites.filter(id => id !== movieId);
        } else {
            favorites.push(movieId);
        }

        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: { favorites }
        });

        res.json({ success: true, message: 'Favorite updated successfully' });
    } catch (error) {
        console.error("Update Favorite Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API to get Favorite Movies from the database

export const getFavorites = async (req, res) => {
    try {
        const { userId } = req.auth();

        // 🔥 Most Important Fix
        if (!userId) {
            return res.json({ 
                success: true, 
                movies: [] 
            });
        }

        const user = await clerkClient.users.getUser(userId);
        
        const favorites = user.privateMetadata?.favorites || [];

        // Getting movies from database
        const movies = await Movie.find({ _id: { $in: favorites } });

        res.json({ success: true, movies });
        
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
};