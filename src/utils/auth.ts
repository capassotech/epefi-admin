// utils/auth.ts
import { auth } from "@/firebase";

export const getAuthHeader = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      const idToken = await user.getIdToken();
      return { Authorization: `Bearer ${idToken}` };
    } catch (error) {
      console.error("Error getting ID token:", error);
    }
  }
  return {};
};
