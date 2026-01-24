import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

/* =========================
   Helpers
========================= */
function formatINR(n) {
  const num = Number(n || 0);
  return `INR ${num.toLocaleString("en-IN")}`;
}


function safeText(v) {
  return String(v ?? "").trim();
}

function drawText(page, text, x, y, opts = {}) {
  const {
    size = 10,
    font,
    color = rgb(0.1, 0.1, 0.1),
    maxWidth,
  } = opts;

  if (!text) return;
  const t = safeText(text);

  if (!maxWidth) {
    page.drawText(t, { x, y, size, font, color });
    return;
  }

  // Simple wrap
  const words = t.split(" ");
  let line = "";
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const width = font.widthOfTextAtSize(testLine, size);

    if (width > maxWidth) {
      page.drawText(line, { x, y: curY, size, font, color });
      curY -= size + 3;
      line = words[i];
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: curY, size, font, color });
  }
}

function drawLine(page, x1, y1, x2, y2, thickness = 1, color = rgb(0.9, 0.9, 0.9)) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color,
  });
}

function drawBox(page, x, y, w, h, fill, border = rgb(0.9, 0.9, 0.9)) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: fill,
    borderColor: border,
    borderWidth: 1,
  });
}

/* =========================
   GET INVOICE
========================= */
export async function GET(req, { params }) {
  try {
    await connectMongo();

    const { id } = await params;
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const address = order.shippingAddress || order.address || null;

    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const total = Number(order.total || 0);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4

    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const M = 50; // margin
    let y = height - 50;

    // Colors
    const black = rgb(0.05, 0.05, 0.05);
    const gray = rgb(0.45, 0.45, 0.45);
    const lightGray = rgb(0.96, 0.97, 0.98);
    const border = rgb(0.88, 0.88, 0.88);

    // ===== Header Bar =====
    drawBox(page, M, y - 55, width - M * 2, 55, lightGray, border);

    drawText(page, "TikauFashion", M + 16, y - 28, {
      size: 14,
      font: bold,
      color: black,
    });

    drawText(page, "INVOICE", width - M - 16 - 80, y - 28, {
      size: 16,
      font: bold,
      color: black,
    });

    y -= 80;

    // ===== Invoice Meta =====
    const placedOn = order?.createdAt
      ? new Date(order.createdAt).toLocaleString()
      : "-";

    const invoiceNo = `INV-${String(order._id).slice(-6).toUpperCase()}`;
    const orderId = String(order._id);

    const metaXLeft = M;
    const metaXRight = width - M - 260;

    drawText(page, "Invoice Details", metaXLeft, y, { size: 12, font: bold });
    drawText(page, "Order Details", metaXRight, y, { size: 12, font: bold });

    y -= 16;

    // Left meta
    drawText(page, `Invoice No: ${invoiceNo}`, metaXLeft, y, {
      size: 10,
      font,
      color: black,
    });

    drawText(page, `Date: ${placedOn}`, metaXLeft, y - 14, {
      size: 10,
      font,
      color: black,
    });

    // Right meta
    drawText(page, `Order ID: ${orderId}`, metaXRight, y, {
      size: 10,
      font,
      color: black,
      maxWidth: 260,
    });

    drawText(
      page,
      `Payment: ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}`,
      metaXRight,
      y - 14,
      { size: 10, font, color: black }
    );

    drawText(
      page,
      `Payment Status: ${(order.paymentStatus || "PENDING").toUpperCase()}`,
      metaXRight,
      y - 28,
      { size: 10, font, color: black }
    );

    y -= 48;

    drawLine(page, M, y, width - M, y, 1, border);
    y -= 20;

    // ===== Bill From / Ship To =====
    const colW = (width - M * 2 - 20) / 2;
    const leftX = M;
    const rightX = M + colW + 20;

    drawBox(page, leftX, y - 110, colW, 110, rgb(1, 1, 1), border);
    drawBox(page, rightX, y - 110, colW, 110, rgb(1, 1, 1), border);

    // Bill From
    drawText(page, "BILL FROM", leftX + 12, y - 18, {
      size: 10,
      font: bold,
      color: gray,
    });

    drawText(page, "TikauFashion Pvt. Ltd.", leftX + 12, y - 36, {
      size: 11,
      font: bold,
      color: black,
    });

    drawText(page, "Gurugram, Haryana, India", leftX + 12, y - 52, {
      size: 10,
      font,
      color: gray,
    });

    drawText(page, "Email: support@tikaufashion.com", leftX + 12, y - 68, {
      size: 10,
      font,
      color: gray,
    });

    drawText(page, "Phone: +91-XXXXXXXXXX", leftX + 12, y - 84, {
      size: 10,
      font,
      color: gray,
    });

    // Ship To
    drawText(page, "SHIP TO", rightX + 12, y - 18, {
      size: 10,
      font: bold,
      color: gray,
    });

    if (!address) {
      drawText(page, "Address not found", rightX + 12, y - 36, {
        size: 10,
        font,
        color: black,
      });
    } else {
      drawText(page, address.fullName || order.customer?.name || "-", rightX + 12, y - 36, {
        size: 11,
        font: bold,
        color: black,
      });

      drawText(page, `Phone: ${address.phone || order.customer?.phone || "-"}`, rightX + 12, y - 52, {
        size: 10,
        font,
        color: gray,
      });

      drawText(
        page,
        `${address.line1 || address.address1 || "-"}` +
          `${address.line2 || address.address2 ? `, ${address.line2 || address.address2}` : ""}`,
        rightX + 12,
        y - 68,
        { size: 10, font, color: gray, maxWidth: colW - 24 }
      );

      drawText(
        page,
        `${address.city || "-"}, ${address.state || "-"} ${address.pincode ? `- ${address.pincode}` : ""}`,
        rightX + 12,
        y - 96,
        { size: 10, font, color: gray, maxWidth: colW - 24 }
      );
    }

    y -= 130;

    // ===== Items Table =====
    drawText(page, "Items", M, y, { size: 12, font: bold, color: black });
    y -= 14;

    // Header row
    drawBox(page, M, y - 24, width - M * 2, 24, lightGray, border);

    drawText(page, "Product", M + 12, y - 16, { size: 10, font: bold, color: black });
    drawText(page, "Price", width - M - 210, y - 16, { size: 10, font: bold, color: black });
    drawText(page, "Qty", width - M - 130, y - 16, { size: 10, font: bold, color: black });
    drawText(page, "Amount", width - M - 70, y - 16, { size: 10, font: bold, color: black });

    y -= 34;

    const items = order.items || [];
    const rowH = 36;

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      const price = Number(it.price || 0);
      const qty = Number(it.qty || 0);
      const amount = price * qty;

      // Row outline
      drawBox(page, M, y - rowH + 6, width - M * 2, rowH, rgb(1, 1, 1), border);

      // Product name + options
      const name = safeText(it.name || "Product");
      drawText(page, name, M + 12, y - 16, { size: 10, font: bold, color: black, maxWidth: 290 });

      const options =
        it.selectedOptions && Object.keys(it.selectedOptions).length > 0
          ? Object.entries(it.selectedOptions)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" | ")
          : "";

      if (options) {
        drawText(page, options, M + 12, y - 30, {
          size: 8.5,
          font,
          color: gray,
          maxWidth: 290,
        });
      }

      // columns
      drawText(page, formatINR(price), width - M - 210, y - 20, { size: 10, font, color: black });
      drawText(page, String(qty), width - M - 120, y - 20, { size: 10, font, color: black });
      drawText(page, formatINR(amount), width - M - 78, y - 20, { size: 10, font, color: black });

      y -= rowH;

      // Page break
      if (y < 220) {
        // Add new page and reset y
        const p2 = pdfDoc.addPage([595.28, 841.89]);
        y = p2.getSize().height - 60;
      }
    }

    // ===== Totals Box =====
    y -= 16;

    const totalsW = 260;
    const totalsH = 110;
    const totalsX = width - M - totalsW;

    drawBox(page, totalsX, y - totalsH, totalsW, totalsH, lightGray, border);

    drawText(page, "Summary", totalsX + 14, y - 20, {
      size: 11,
      font: bold,
      color: black,
    });

    drawText(page, "Subtotal", totalsX + 14, y - 42, { size: 10, font, color: gray });
    drawText(page, formatINR(subtotal), totalsX + totalsW - 14 - 70, y - 42, {
      size: 10,
      font: bold,
      color: black,
    });

    drawText(page, "Discount", totalsX + 14, y - 58, { size: 10, font, color: gray });
    drawText(page, `- ${formatINR(discount)}`, totalsX + totalsW - 14 - 70, y - 58, {
      size: 10,
      font: bold,
      color: black,
    });

    drawLine(page, totalsX + 14, y - 72, totalsX + totalsW - 14, y - 72, 1, border);

    drawText(page, "Total Payable", totalsX + 14, y - 92, {
      size: 11,
      font: bold,
      color: black,
    });
    drawText(page, formatINR(total), totalsX + totalsW - 14 - 70, y - 92, {
      size: 11,
      font: bold,
      color: black,
    });

    // ===== Payment Reference (Razorpay) =====
    const payBoxX = M;
    const payBoxW = width - M * 2 - totalsW - 20;
    const payBoxH = totalsH;

    drawBox(page, payBoxX, y - payBoxH, payBoxW, payBoxH, rgb(1, 1, 1), border);

    drawText(page, "Payment Reference", payBoxX + 14, y - 20, {
      size: 11,
      font: bold,
      color: black,
    });

    drawText(
      page,
      `Payment Method: ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}`,
      payBoxX + 14,
      y - 42,
      { size: 10, font, color: gray }
    );

    drawText(
      page,
      `Payment Status: ${(order.paymentStatus || "PENDING").toUpperCase()}`,
      payBoxX + 14,
      y - 58,
      { size: 10, font, color: gray }
    );

    if (order.razorpayOrderId) {
      drawText(page, `Razorpay Order ID: ${order.razorpayOrderId}`, payBoxX + 14, y - 74, {
        size: 10,
        font,
        color: gray,
        maxWidth: payBoxW - 28,
      });
    }

    if (order.razorpayPaymentId) {
      drawText(page, `Razorpay Payment ID: ${order.razorpayPaymentId}`, payBoxX + 14, y - 90, {
        size: 10,
        font,
        color: gray,
        maxWidth: payBoxW - 28,
      });
    }

    // ===== Footer =====
    page.drawText("This is a computer generated invoice and does not require signature.", {
      x: M,
      y: 50,
      size: 9,
      font,
      color: gray,
    });

    page.drawText("Thank you for shopping with TikauFashion.", {
      x: M,
      y: 34,
      size: 9,
      font: bold,
      color: black,
    });

    const bytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice_${order._id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("INVOICE ERROR:", err);
    return NextResponse.json(
      { message: "Failed to generate invoice", error: err?.message },
      { status: 500 }
    );
  }
}
