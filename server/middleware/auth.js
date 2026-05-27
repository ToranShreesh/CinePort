import { verifyToken } from "@clerk/backend";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const protectAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const verified = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
            clockSkewInMs: 60000,
        });

        const userId = verified.sub || verified.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        const user = await clerkClient.users.getUser(userId);

        if (user.privateMetadata?.role !== "admin") {
            return res.status(403).json({ success: false, message: "Admin access only" });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("ProtectAdmin Error:", error.message);
        return res.status(401).json({ success: false, message: "Authentication failed" });
    }
};