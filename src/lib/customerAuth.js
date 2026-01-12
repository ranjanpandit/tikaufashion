import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function getCustomerFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}
