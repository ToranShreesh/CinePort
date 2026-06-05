import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";   // ← Added missing import

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "movie-ticket-booking" 
});

// SYNC USER CREATION 
const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: [{ event: "clerk/user.created" }]
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const userData = {
            _id: id,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            email: email_addresses?.[0]?.email_address,
            image: image_url,
        };

        await User.create(userData);
    }
);

// SYNC USER DELETION
const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-from-clerk",
        triggers: [{ event: "clerk/user.deleted" }]
    },
    async ({ event }) => {
        const { id } = event.data;
        await User.findByIdAndDelete(id);
    }
);

// SYNC USER UPDATION 
const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: [{ event: "clerk/user.updated" }]
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const userData = {
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            email: email_addresses?.[0]?.email_address,
            image: image_url,
        };

        await User.findByIdAndUpdate(id, userData);
    }
);

// Release seats and delete booking after 10 minutes if not paid
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {
        id: "release-seats-delete-booking",
        triggers: [{ event: "app/checkpayment" }]     // ← Fixed (new syntax)
    },
    async ({ event, step }) => {
        const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
        
        await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

        await step.run('check-payment-status', async () => {
            const bookingId = event.data.bookingId;
            const booking = await Booking.findById(bookingId);

            if (!booking?.isPaid) {
                const show = await Show.findById(booking.show);
                
                if (show) {
                    booking.bookedSeats.forEach((seat) => {
                        delete show.occupiedSeats[seat];
                    });
                    
                    show.markModified('occupiedSeats');   // ← Fixed typo
                    await show.save();
                    await Booking.findByIdAndDelete(booking._id);
                }
            }
        });
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking
];