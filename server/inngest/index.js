import { Inngest } from "inngest";
import User from "../models/User.js";

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "movie-ticket-booking" 
});

// ====================== SYNC USER CREATION ======================
const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: [{ event: "clerk/user.created" }]   // ← Fixed for v4
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const userData = {
            _id: id,
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            email: email_addresses?.[0]?.email_address,   // ← Fixed
            image: image_url,
        };

        await User.create(userData);   // ← Was using UserActivation (wrong)
    }
);

// ====================== SYNC USER DELETION ======================
const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-from-clerk",
        triggers: [{ event: "clerk/user.deleted" }]   // ← Fixed
    },
    async ({ event }) => {
        const { id } = event.data;
        await User.findByIdAndDelete(id);
    }
);

// ====================== SYNC USER UPDATION ======================
const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: [{ event: "clerk/user.updated" }]   // ← Fixed
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const userData = {
            name: `${first_name || ''} ${last_name || ''}`.trim(),
            email: email_addresses?.[0]?.email_address,   // ← Fixed
            image: image_url,
        };

        await User.findByIdAndUpdate(id, userData);
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];