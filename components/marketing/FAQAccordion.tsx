"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    question: "How does Replytics answer my business calls?",
    answer: "Replytics uses advanced AI technology to answer your calls with a natural-sounding voice. It can understand customer requests, check your calendar availability, and book appointments automatically.",
  },
  {
    question: "Can I customize how the AI receptionist sounds?",
    answer: "Yes! You can choose from different voice options and customize the greeting, business information, and responses to match your brand personality.",
  },
  {
    question: "What happens if the AI can't handle a call?",
    answer: "If the AI encounters a complex request it can't handle, it can take a message and notify you immediately via email or SMS. You can also set up call forwarding for specific scenarios.",
  },
  {
    question: "How do SMS reminders work?",
    answer: "When an appointment is booked, Replytics automatically sends SMS reminders to customers at intervals you specify (e.g., 24 hours and 2 hours before). Customers can confirm or reschedule via text.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level encryption for all data transmission and storage. We're HIPAA compliant and follow strict privacy guidelines.",
  },
]

export function FAQAccordion() {
  return (
    <section className="py-20 px-4 bg-background-light">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-text-secondary">
          Frequently Asked Questions
        </h2>
        <AccordionPrimitive.Root type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionPrimitive.Item
              key={index}
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  className={cn(
                    "flex flex-1 items-center justify-between p-4 text-left font-medium transition-all hover:bg-gray-50",
                    "[&[data-state=open]>svg]:rotate-180"
                  )}
                >
                  {faq.question}
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content
                className={cn(
                  "overflow-hidden text-sm transition-all",
                  "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                )}
              >
                <div className="px-4 pb-4 pt-0 text-gray-600">{faq.answer}</div>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </div>
    </section>
  )
}