"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown, HelpCircle, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

const faqs = [
  {
    question: "How does Replytics answer my business calls?",
    answer: "Replytics uses advanced AI technology to answer your calls with a natural-sounding voice. It can understand customer requests, check your calendar availability, and book appointments automatically.",
    icon: "🤖"
  },
  {
    question: "Can I customize how the AI receptionist sounds?",
    answer: "Yes! You can choose from different voice options and customize the greeting, business information, and responses to match your brand personality.",
    icon: "🎤"
  },
  {
    question: "What happens if the AI can't handle a call?",
    answer: "If the AI encounters a complex request it can't handle, it can take a message and notify you immediately via email or SMS. You can also set up call forwarding for specific scenarios.",
    icon: "📞"
  },
  {
    question: "How do SMS reminders work?",
    answer: "When an appointment is booked, Replytics automatically sends SMS reminders to customers at intervals you specify (e.g., 24 hours and 2 hours before). Customers can confirm or reschedule via text.",
    icon: "💬"
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level encryption for all data transmission and storage. We're HIPAA compliant and follow strict privacy guidelines.",
    icon: "🔒"
  },
  {
    question: "How quickly can I get started?",
    answer: "You can be up and running in just 5 minutes! Simply sign up, configure your business details, and we'll provide you with a phone number. No technical skills required.",
    icon: "⚡"
  },
]

export function FAQAccordion() {
  const [headerVisible, setHeaderVisible] = useState(false)
  const [itemsVisible, setItemsVisible] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observerOptions = { threshold: 0.1 }
    
    const headerObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHeaderVisible(true)
      }
    }, observerOptions)

    const itemsObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setItemsVisible(true)
      }
    }, observerOptions)

    if (headerRef.current) headerObserver.observe(headerRef.current)
    if (itemsRef.current) itemsObserver.observe(itemsRef.current)

    return () => {
      if (headerRef.current) headerObserver.unobserve(headerRef.current)
      if (itemsRef.current) itemsObserver.unobserve(itemsRef.current)
    }
  }, [])

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-[0.01]" />
      
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <div ref={headerRef} className="text-center mb-16">
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 transition-all duration-1000",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Got Questions?</span>
          </div>
          
          <h2
            className={cn(
              "text-5xl lg:text-6xl font-black text-gray-900 mb-6 transition-all duration-1000 delay-100",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Frequently Asked
            <span className="text-gradient"> Questions</span>
          </h2>
          
          <p
            className={cn(
              "text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-1000 delay-200",
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            Everything you need to know about Replytics. Can't find what you're looking for? Feel free to contact our support team.
          </p>
        </div>

        {/* FAQ Items */}
        <div ref={itemsRef}>
          <AccordionPrimitive.Root 
            type="single" 
            collapsible 
            className="w-full space-y-4"
          >
            {faqs.map((faq, index) => (
              <AccordionPrimitive.Item
                key={index}
                value={`item-${index}`}
                className={cn(
                  "group transition-all duration-700",
                  itemsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  {/* Gradient border on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <AccordionPrimitive.Header className="relative">
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "flex w-full items-center justify-between p-6 text-left transition-all",
                        "[&[data-state=open]>div>svg]:rotate-180",
                        "[&[data-state=open]]:bg-gray-50/50"
                      )}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{faq.icon}</span>
                        <span className="text-lg font-semibold text-gray-900 pr-4">
                          {faq.question}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <ChevronDown className="h-5 w-5 text-gray-500 shrink-0 transition-transform duration-300" />
                      </div>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  
                  <AccordionPrimitive.Content
                    className={cn(
                      "overflow-hidden text-base transition-all",
                      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                    )}
                  >
                    <div className="px-6 pb-6 pt-2 pl-[4.5rem]">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </AccordionPrimitive.Content>
                </div>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>

        {/* Contact support CTA */}
        <div 
          className={cn(
            "mt-16 text-center transition-all duration-1000 delay-700",
            itemsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl border border-primary/10">
            <MessageCircle className="w-8 h-8 text-primary" />
            <div className="text-center sm:text-left">
              <p className="font-semibold text-gray-900">Still have questions?</p>
              <p className="text-sm text-gray-600">Our support team is here to help</p>
            </div>
            <a
              href="/contact"
              className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 transition-all hover:scale-[1.02] hover:shadow-md"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}