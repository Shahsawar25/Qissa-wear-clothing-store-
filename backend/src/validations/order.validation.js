import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid address ID.",
  });

export const checkoutSchema = z.object({
  addressId: objectId,
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["Paid"], {
    errorMap: () => ({ message: "Payment status must be 'Paid'." }),
  }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ["Confirmed", "Shipped", "Delivered", "Cancelled"],
    {
      errorMap: () => ({
        message:
          "Status must be one of: Confirmed, Shipped, Delivered, Cancelled.",
      }),
    }
  ),
});
