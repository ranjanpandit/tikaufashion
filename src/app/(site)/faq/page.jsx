import Faq from "@/components/common/Faq";

export default function FaqPage() {
  const faqs = [
    {
      question: "How long does delivery take?",
      answer:
        "Orders are typically delivered within 3-7 business days depending on your location.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We provide 7-day easy returns. Items must be unused and in original packaging.",
    },
    {
      question: "Do you support Cash on Delivery?",
      answer:
        "Yes, COD is available for most pin codes. You can also pay online using Razorpay.",
    },
    {
      question: "How can I track my order?",
      answer:
        "Go to My Orders page to view your order status and details.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Faq
        title="FAQ"
        subtitle="Everything you need to know about orders, shipping & payments."
        items={faqs}
        defaultOpenIndex={0}
      />
    </div>
  );
}
