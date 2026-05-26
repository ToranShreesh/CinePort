import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js"

// API to check if user is admin
export const isAdmin = async (req, res) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.json({ success: true, isAdmin: false });
        }

        const user = await clerkClient.users.getUser(userId);

        // Check Private Metadata
        const isAdminUser = user.privateMetadata?.role === "admin";

        console.log("User Role Check:", {   // For debugging
            userId, 
            role: user.privateMetadata?.role,
            isAdmin: isAdminUser 
        });

        res.json({ 
            success: true, 
            isAdmin: isAdminUser 
        });

    } catch (error) {
        console.error("isAdmin Error:", error.message);
        res.json({ 
            success: true, 
            isAdmin: false 
        });
    }
};
// API to get dashboard data
export const getDashboardData = async (req,res) => {
    try {
        const bookings = await Booking.find({isPaid:true});
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie');

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser
        }
        res.json({success:true, dashboardData})
    } catch (error) {
        console.error(error)
        res.json({success:false, message:error.message})   
    }
}

// API to get all show 
export const getAllShows = async (req,res) => {
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1})
        res.json({success:true, shows})
    } catch (error) {
        console.error(error)
        res.json({success:false, message:error.message})   
    }
}

// API to get all bookings
export const getAllBookings = async (req,res) => {
    try {
        const bookings = await Bookings.find({}).populate('user').populate({
            path:"show",
            populate: {path:"movie"}
        }).sort({createdAt: -1})
        res.json({success:true, bookings})
    } catch (error) {
        console.error(error)
        res.json({success:false, message:error.message})   
    }
}