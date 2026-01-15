import { Suspense } from "react";
import OrderSuccessClient from "./OrderSuccessClient";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center">
          Loading order details...
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
