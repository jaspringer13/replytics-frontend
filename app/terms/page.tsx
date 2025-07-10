'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-400 mb-12">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Introduction */}
            <section className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
              <p className="text-gray-300 leading-relaxed">
                These Terms of Use (or "Terms") are a binding contract between you and Replytics, our AI phone receptionist technology and related services ("Replytics," "us" or "we") and you as a subscriber to our Services as defined in Section 2 ("you"). Any capitalized terms used herein without defining them have the definitions given in the Privacy Notice. Additional, separate terms may apply to our Services, including without limitation our Data Processing Addendum, each of which will be considered to form part of these Terms.
              </p>
              
              <p className="text-gray-300 leading-relaxed mt-4 font-semibold">
                THESE TERMS INCLUDE A CLASS ACTION WAIVER AND AN ARBITRATION PROVISION THAT GOVERNS ANY DISPUTES BETWEEN YOU AND REPLYTICS.
              </p>

              <p className="text-gray-300 leading-relaxed mt-4">
                If you have questions about these Terms, please contact support@replytics.ai.
              </p>
            </section>

            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Eligibility & Acceptance</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed mb-4">
                  To be eligible to use the Services, you must (a) be at least 18 years of age; (b) reside in a jurisdiction where we offer our Services and where the use of our Services is lawful; and (c) represent that you have read, understood, and agree to be bound by the Terms. You may not use the Services if you have previously been suspended or removed from any of our Services. By using the Services, you represent and warrant that you meet all the foregoing eligibility requirements. If you do not meet these eligibility requirements or if you do not agree to these Terms, you may not use the Services.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  By accessing or using any of our Services, you agree to be unconditionally bound by these Terms. Where the option is made available to you, you may accept the Terms by your statement or by clicking to accept or agree to the Terms over the phone or in any agreement, electronic form, or on the Services. You must be of legal age and capacity to form a binding contract to accept the Terms. If you do not agree with any of these Terms, do not use our Services. If you are using or accessing the Services on behalf of a company or other entity ("Entity"), you represent, agree, and warrant that you are authorized to act on behalf of the Entity and to bind such Entity to these Terms. ACCEPTANCE OF THESE TERMS IS REQUIRED FOR USE OF THE SERVICES AND ANY USE OF THE SERVICES SHALL CONSTITUTE YOUR ACCEPTANCE OF THESE TERMS.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. The Services</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Our Services</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics offers the following Services: (i) our AI phone receptionist to answer your calls and set appointments for you ("AI Receptionist"); (ii) a dashboard, software and applications (collectively, the "Application") integrated with the existing systems of the subscribing business or individual (each a "Subscriber"); and (iv) replytics.ai and other websites or online channels we own or operate (collectively, the "Site") (altogether, with the Site and Application, the "Services"). The Services will create an audio recording of each call between callers to your business (your "Callers") and the AI Receptionist ("Recordings") and will generate transcripts of such Recordings ("Transcripts"). Recordings and Transcripts are posted to your Account and available to you on your Dashboard. You will receive the Services at your subscribed-to Services level as described on the Site and subject to these Terms.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Registration</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To become a Subscriber, you must first register with Replytics, create an account on the Services (your "Account"), and select an available Subscription level. You must always maintain a valid email address and phone number on your account. Some Services may not be available to you; we will explain which Services are available to you during the sign-up process. You represent and warrant that: (i) you will maintain the accuracy of all data associated with your Account; (ii) you will not do anything that might jeopardize the security of your Account; and (iii) you will notify us immediately of any unauthorized access to or use of your login credentials or any other breach of security.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Google Registration</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics's use and transfer to any other app of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Telephone Numbers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you subscribe, we will host your established telephone number or assign you a forwarding telephone number. Replytics reserves the right to release or reassign any telephone numbers not ported back within three months after termination of the applicable subscription.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">e. Caller Payments</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You can setup the Services to take payment information from your customers, for example to secure an appointment or prepay a service fee. You are solely responsible for collecting any required authorizations from your Callers to receive their payment information or charge their payment method on or through the Services. You understand and agree that Replytics is not a bank, payment institution, payment processor, or money services business. Replytics does not collect or process your payment information.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">f. Recordings and Transcripts</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You understand and agree that the Services include creation of Recordings and Transcripts of calls with your Callers for your reference and business use and to allow Replytics to monitor quality, improve performance of our Services, and for training purposes. Call recording and monitoring practices are subject to various federal, state, and local laws and limitations. Replytics will provide courtesy template notices to inform your Callers that their call is being recorded so that the Caller can consent by continuing with the call or withhold consent by ending the call.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">g. SMS Features</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics offers features to the Services that allow your AI Receptionist to send SMS messages to the Caller's wireless phone number with additional information or resources related to the call ("SMS Features"). The AI Receptionist will obtain the Caller's permission before sending an SMS message to their wireless number and will only send the requested SMS message.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">h. AI Features</h3>
                <p className="text-gray-300 leading-relaxed">
                  Replytics provides you with certain features of the Services through artificial intelligence, machine learning, or similar technologies ("AI Technology") made available within AI-enabled features of the Services ("AI Features"). Your Caller will interact with the Services through an AI Feature through prompts in the form of the Caller's conversation with the AI Receptionist ("Inputs") and the Caller will receive outputs generated and returned by the AI Receptionist based on those Inputs and the data used to train the AI Features ("Outputs"). Replytics makes no representations whatsoever as to Outputs, including without limitation legality, distinctiveness, accuracy, completeness, consistency, or ability to be protected under intellectual property laws. It is your responsibility to evaluate Outputs and confirm they are appropriate for your Callers.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Subscriptions</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Your Subscription</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The Services are offered on a subscription basis subject to these Terms of Use (your "Subscription"). The duration of your Subscription with Replytics is 30 days. Your Subscription starts the day you sign up and automatically renews every 30 days unless cancelled or changed as provided in these Terms.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Subscription Fees</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Your Subscription is subject to two types of Fees: (i) a non-refundable fixed fee based on the package of Services you purchase, due in advance on or before the first day of each monthly billing period and (ii) variable overage fees if your usage exceeds the base usage units included with your subscription, due in arrears on or around the first business day following each monthly billing period.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Changes in Subscription Level</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may change your Subscription level as specified in this paragraph. You can request to upgrade your subscription level at any time. Upgrades are effective immediately and apply to the then-current monthly billing period and at least the subsequent two consecutive billing periods. Any resulting additional fees for the then-current billing period are due at the time of upgrade. If you request a downgrade, the downgrade will be effective beginning on the first day of the next monthly billing period.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Free Trial</h3>
                <p className="text-gray-300 leading-relaxed">
                  Replytics may offer new Subscribers to start their subscription with a free trial. Free trials may vary in duration and may not be available to everyone. The duration of the free trial, if granted to you, is stated at signup. Free trials are only available to new Subscribers who have never previously subscribed to the Services, unless we expressly state otherwise related to a specific free trial.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Fees & Payment</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Fees</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You agree to use the Services only as permitted by these Terms and to pay the fees associated with the Services to which you subscribe ("Fees") and any changes you make to your selections from time to time, as well as any and all applicable sales and use taxes for the purchase of your subscription based on the address that you provide when you register. All Fees are quoted in United States dollars. Billing for your Subscription starts on the day you sign up, even if some Services are not immediately available.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Payment Method</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To receive subscription or free trial Services, you must maintain a valid payment method associated with your Account. You hereby expressly authorize Replytics to charge your payment method every 30 days for the Fees due hereunder, along with any sales and use taxes and any late fees or interest. You represent and warrant that the payment information you provide to us is correct and accurate and you are using a payment method that you are legally authorized to use for this purpose.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Late Payment</h3>
                <p className="text-gray-300 leading-relaxed">
                  If you do not pay on time or if we cannot charge the payment method you have on file for any reason, we reserve the right to either suspend or terminate your access to the Services. In addition, if any payment is not received within 30 days after the due date, then we may charge a late fee of $10 and we may assess interest at the rate of 1.5% of the outstanding balance per month (18% per year), or the maximum rate permitted by law, whichever is lower, from 30 days after the due date until the date paid.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Privacy</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Privacy Notice</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You acknowledge that you have read and understand our Privacy Notice.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Services Announcements</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics may use your contact information to communicate with you about your use of our Services. For example, we may send you service announcements or administrative communications by email, phone, text, mail, or other means.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Texting Consent</h3>
                <p className="text-gray-300 leading-relaxed">
                  By providing us with your wireless phone number, you consent to Replytics sending you informational text messages related to the products, Services, or information you have requested from us. The number of texts that we send to you will be based on your circumstances and requests. You can unsubscribe from text messages by text replying STOP or UNSUBSCRIBE. Messaging and data charges may apply to any text message you receive or send.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Replytics Property</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. The Services</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Unless otherwise expressly indicated, the Services (including without limitation all AI Features, the Site, and the Site Contents) and all data, images, logos, source code, content, non-public APIs, and other materials contained in the Services (collectively, the "Replytics Property") are copyrights, trademarks, trade dress or other intellectual property owned, controlled, or licensed by Replytics. The Replytics Property is protected by U.S. and foreign copyright, trademark, trade dress, or other proprietary rights laws and international conventions.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. The Site</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You have a revocable, non-transferable, non-exclusive license to access, use, display, download, and print in hardcopy format the images, illustrations, designs, photographs, video clips, text, graphics, icons, designs, software code, written information and screens appearing on the Site, and other materials, as well as names, logos, taglines, trade dress, and other trademarks displayed on the Site ("Site Contents") for the purposes of using the Site as an internal or personal business resource.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Copyright</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You do not have permission to copy, reproduce, make derivative works from, distribute, republish, download, display, perform, post electronically or mechanically, transmit, record, or mirror any of the Replytics Property without the prior written permission of Replytics.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Trademarks</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All logos, trademarks, service marks, product names and trade names associated with Replytics including names, logos, taglines, trade dress, and other trademarks are the intellectual property of Replytics and may not be copied, imitated, or used, whether in whole, partial or modified form, without the prior written permission of Replytics.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">e. Feedback</h3>
                <p className="text-gray-300 leading-relaxed">
                  You may from time-to-time provide us materials, communications, suggestions, comments, improvements, ideas or other feedback related to the Site or our Services ("Feedback"). You hereby additionally grant us all rights, titles and interests in and to any Feedback you provide.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Data</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Your Data</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  As between you and Replytics, Your Data belongs to you. Replytics does not claim any ownership rights to Your Data. You are solely responsible, and Replytics shall have no liability, for Your Data on the Services, including without limitation all processing, use, security, disclosure, and disposition thereof.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Your Data License</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By providing Your Data to the Services, you grant Replytics a perpetual, worldwide, non-exclusive, transferable, sublicensable (through multiple tiers), and royalty-free, fully paid-up, right to use, copy, modify, distribute, display publicly, or process Your Data for the purpose of (i) facilitating your use of the Services; (ii) developing, training, or enhancing artificial intelligence or machine learning models that are part of the Services; (iii) marketing Replytics or the Services; (iv) enforcing these Terms; (v) for any other purpose to which you specifically consent; or (vi) for any other legally permissible purpose.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Responsibility for Your Data</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You agree that the Services are a passive conduit for Your Data. You acknowledge and agree that Replytics does not and will not: (i) have any responsibility or liability for Your Data; (ii) monitor or evaluate Your Data whether or not on the Services; or (iii) have any obligation to review Your Data and does not guarantee the accuracy, integrity, or quality of any of Your Data.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Your Data Restrictions</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You agree to not submit any of Your Data to the services that:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Contains any material that is false, defamatory, libelous, obscene, harassing, threatening, discriminatory, bigoted, hateful, violent, vulgar, profane, pornographic or otherwise offensive, inappropriate, damaging, unlawful, disruptive or harmful</li>
                  <li>Violates Replytics's or any other person's or entity's legal rights</li>
                  <li>Creates or threatens harm to any person or loss or damage to property</li>
                  <li>Infringes any patent, trademark, trade secret, copyright, or other intellectual property</li>
                  <li>Seeks to harm or exploit children</li>
                  <li>Misrepresents your identity or affiliation</li>
                  <li>Seeks to interfere with, disrupt or create an undue burden on Replytics</li>
                  <li>Is otherwise objectionable as determined by Replytics at our sole discretion</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">e. Prohibited Data</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We understand that the Services may be used to design websites for a variety of industries. You acknowledge that the Services are not designed for processing the following categories of information: (a) sensitive Personal Data, such as health information, financial information, or government identification data; (b) data that is classified and or used on the U.S. Munitions list; (c) articles, services and related technical data designated as defense articles or defense services; and (d) ITAR (International Traffic in Arms Regulations) related data, (each of the foregoing, "Prohibited Data").
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">f. AI Features</h3>
                <p className="text-gray-300 leading-relaxed">
                  As between you and Replytics, and to the extent permitted by applicable law, in all Inputs and Outputs to and from the AI Features from your Callers' interaction with the Services is Your Data; we hereby assign to you all our right, title, and interest, if any, in and to such Inputs and Outputs.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Acceptable Use</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Your Callers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  A Callers' use of the Services does not change your legal relationship with the Caller nor does it make Replytics a party to any transactions or obligations between you and the Caller. You, not Replytics, are responsible for your obligations to your Callers and any products, services, or payment transactions with the Caller.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Your Privacy Practices</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You understand and agree that you are solely responsible for your privacy practices with respect to all data made available to you through the Dashboard or related to your Account and your use thereof and your Callers and other consumers who interact with the Services through your assigned telephone number or otherwise related to your business.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Covered Entities</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You understand and agree that if you are a covered entity under the United States Health Insurance Portability and Accountability Act of 1996 ("HIPAA"), it is your responsibility to ensure that you have executed and at all times comply with a HIPAA Business Associate Agreement with Replytics.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Prohibited Use</h3>
                <p className="text-gray-300 leading-relaxed">
                  You are strictly prohibited from using the Services: (i) in a manner that violates any applicable law, rule or regulation; (ii) to transmit, store, or process health information in violation of the HIPAA, unless expressly agreed via a separate written agreement; (iii) to promote any goods or services or send communications that are illegal; (iv) to advertise or promote adult services, illegal gambling, counterfeit or pirated goods or services; (v) to defraud, deceive or mislead anyone; (vi) to communicate or transmit content that is defamatory, dishonest, obscene, sexually explicit, pornographic, vulgar or offensive; (vii) to promote or engage in discrimination, racism, harassment or hate speech; or (viii) to threaten or promote violence.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Services Access</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Availability</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics will use commercially reasonable efforts to (i) support your efforts to integrate the Services into your existing systems and (ii) maintain availability of the Services during your subscribed-to Service times. You are responsible for your own costs and expenses integrating the Services to your existing Systems.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Software Requirements</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You must have a compatible device, internet access (if required by the App), and the necessary minimum specifications ("Software Requirements") to use the Services. The Software Requirements are posted on the Site and the mobile application Software Requirements are posted on the relevant App Store page.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Updates</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  From time to time, we may, in our sole discretion, develop and provide updates to our Services, which may include upgrades, bug fixes, patches, other error corrections, and/or new features (collectively, including related documentation, "Updates"). Updates may modify or delete certain features or functionality.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Mobile Application</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  By downloading our mobile application, registering or creating a profile on the mobile application, or submitting information via the mobile application, you acknowledge Replytics's Privacy Notice, and you consent to the collection and use of information as described therein.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">e. Accuracy</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Occasionally there may be information available through the Services that contains typographical errors, inaccuracies or omissions related to product descriptions, pricing, promotions, offers, availability, and other topics. We have no obligation to update, amend, or clarify information in the Services, including without limitation, pricing information, except as required by law.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">f. Third-Party Services</h3>
                <p className="text-gray-300 leading-relaxed">
                  The Services will integrate with your information systems or third-party software, applications, or platforms of your choosing (collectively, "Third-Party Services"). You are solely responsible for your use of the Services with any Third-Party Services, including their functionality, legality, and compatibility with the Services.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Security</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed mb-4">
                  You are strictly prohibited from violating or trying to violate our security features, such as by:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                  <li>Accessing data not intended for you or logging onto a server or an account which you are not authorized to access</li>
                  <li>Attempting to probe, scan or test the vulnerability of a system or network</li>
                  <li>Attempting to interfere with service to any user, host or network</li>
                  <li>Sending unsolicited email, including promotions and/or advertising</li>
                  <li>Using any device, software, or routine to interfere or try to interfere with the proper working of the Services</li>
                </ul>
                <p className="text-gray-300 leading-relaxed mt-4">
                  If you violate our system or network security, you may face civil or criminal liability. We will investigate occurrences that may involve such violations. We may involve or cooperate with law enforcement authorities in prosecuting users who are involved in such violations.
                </p>
              </div>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Disclaimer of Warranties</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed uppercase">
                  YOUR USE OF THE SERVICES IS AT YOUR OWN RISK. REPLYTICS MAKES NO EXPRESS, IMPLIED OR STATUTORY REPRESENTATIONS, WARRANTIES, OR GUARANTEES IN CONNECTION WITH THE SERVICES OR RELATING TO THE AVAILABILITY, QUALITY, RELIABILITY, SUITABILITY, TIMELINESS, TRUTH, ACCURACY OR COMPLETENESS OF THE SERVICES. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICES ARE PROVIDED TO YOU ON AN "AS IS," "AS AVAILABLE" AND "WHERE-IS" BASIS WITH NO EXPRESS OR IMPLIED WARRANTY OF ANY KIND, INCLUDING WITHOUT LIMITATION ANY WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT OF THIRD-PARTY RIGHTS. REPLYTICS DOES NOT WARRANT THAT THE SERVICES WILL MEET ALL OF YOUR REQUIREMENTS OR THAT ITS OPERATIONS WILL BE UNINTERRUPTED OR ERROR FREE, OR THAT ANY DEFECT WITHIN THE SERVICES WILL BE CORRECTED. NO ORAL OR WRITTEN INFORMATION, REPRESENTATION OR ADVICE GIVEN BY REPLYTICS SHALL CREATE A WARRANTY WITHOUT A WRITING SIGNED BY REPLYTICS REFLECTING THE CREATION OF SUCH WARRANTY.
                </p>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Limitation of Liability</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed uppercase">
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL REPLYTICS BE LIABLE TO YOU OR ANY THIRD PARTY UNDER ANY THEORY OF LIABILITY - WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), AGENCY, WARRANTY, STATUTE, OR OTHERWISE - FOR ANY INDIRECT, EXTRAORDINARY, EXEMPLARY, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, ANY LOSS OF DATA, REVENUE, PROFITS, USE, OR OTHER ECONOMIC ADVANTAGE, OR ANY OTHER LOSSES OR DAMAGES OF ANY KIND, HOWEVER ARISING, EVEN IF REPLYTICS KNEW OR SHOULD HAVE KNOWN THAT THERE WAS A POSSIBILITY OF SUCH LOSSES OR DAMAGES. IN NO EVENT SHALL REPLYTICS BE LIABLE TO YOU FOR ANY AMOUNTS THAT, TOGETHER WITH AMOUNTS ASSOCIATED WITH ALL OTHER CLAIMS, EXCEED THE AGGREGATE OF THE FEES PAID BY YOU TO REPLYTICS FOR SERVICES DURING THE THREE MONTHS PRIOR TO THE ACT THAT GAVE RISE TO THE LIABILITY OR, IF NO FEES WERE PAID DURING SUCH THREE-MONTH PERIOD, ONE HUNDRED US DOLLARS ($100), IN EACH CASE, WHETHER OR NOT REPLYTICS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
              </div>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Indemnification</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed uppercase">
                  YOU AGREE TO DEFEND, INDEMNIFY, AND HOLD REPLYTICS, OUR SUBSIDIARIES, PARENTS, AFFILIATES, AND SERVICE PROVIDERS, AND THEIR RESPECTIVE MEMBERS, DIRECTORS, OFFICERS, AGENTS, PARTNERS, AND EMPLOYEES HARMLESS FROM AND AGAINST ANY DIRECT OR THIRD- PARTY CLAIMS, LOSSES, LIABILITIES, COSTS, EXPENSES, DAMAGES, OR DEMANDS, INCLUDING WITHOUT LIMITATION REASONABLE ATTORNEYS' FEES DUE TO, RELATING TO, OR ARISING OUT OF (I) YOUR USE OF THE SERVICES IN VIOLATION OF THESE TERMS OR IN A MANNER THAT VIOLATES OR RESULTS IN A VIOLATION OF APPLICABLE LAW; (II) OUR PROVISION OF THE SERVICES TO YOU; (III) YOUR DATA; (IV) THE RESULT OR OUTCOME OF YOUR USE OF OUR TECHNOLOGY OR ANY OUTPUTS; (V) YOUR BREACH OR ALLEGED BREACH OF ANY REPRESENTATIONS OR WARRANTIES MADE BY YOU HEREUNDER OR YOUR VIOLATION OF ANY OTHER PROVISION OF THESE TERMS; OR (VI) YOUR VIOLATION OF ANY LAW OR THE RIGHTS OF A THIRD PARTY.
                </p>
              </div>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Cancellation & Termination</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Cancellation</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may cancel your Subscription at any time through your Dashboard and your cancellation will be effective at the end of the then-current monthly billing cycle. Replytics may in our sole discretion cancel your Subscription or otherwise terminate these Terms at any time by giving you notice via the Services or otherwise in writing (email to suffice).
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Credits and Fees</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you cancel your Subscription or we terminate these Terms, we will: (i) apply any credits you may have to your Account balance and your remaining balance will be due upon cancellation and (ii) retain any Fees you have already paid to us under these Terms unless otherwise set forth herein.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Effect of Termination</h3>
                <p className="text-gray-300 leading-relaxed">
                  Upon cancellation of your Subscription, (i) you automatically lose all licenses and the right to access or use the Services available under a Subscription and you may only visit the Site; (ii) Replytics's obligations to you under these Terms are terminated; and (iii) you will have 30 days to access Your Data on the Services to download or port it to another system after which time Replytics will permanently delete all of Your Data on the Services.
                </p>
              </div>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Dispute Resolution</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <p className="text-gray-300 leading-relaxed mb-4 font-semibold">
                  PLEASE READ THIS SECTION CAREFULLY BECAUSE IT CONTAINS A CLASS ACTION WAIVER, REQUIRES YOU TO ARBITRATE CERTAIN DISPUTES AND LIMITS THE MANNER IN WHICH YOU CAN SEEK RELIEF FROM US.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">a. Informal Dispute Resolution</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We want to address your concerns without the necessity of a formal legal case. Before filing a claim against Replytics, you agree to try to resolve the Dispute informally by contacting Replytics at support@replytics.ai.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Arbitration Agreement</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You and Replytics each agree to resolve any Disputes through final and binding arbitration administered by the American Arbitration Association (AAA) under its commercial arbitration rules. The arbitration will be held in the United States, or any other location we agree to.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Class Action Waiver</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may only resolve Disputes with Replytics on an individual basis and may not bring a claim as a plaintiff or a class member in a class, consolidated, or representative action. Class arbitrations, class actions, private attorney general actions, and consolidation with other arbitrations are not allowed under these Terms.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Governing Law; Limitation on Claims</h3>
                <p className="text-gray-300 leading-relaxed">
                  Except as otherwise required by applicable law, the Terms and the resolution of any Disputes shall be governed by and construed in accordance with the laws of the State of Delaware, the Federal Arbitration Act, and applicable U.S. federal law, as applicable, in each case without regard to its conflict of laws principles. Regardless of any statute or law to the contrary, any claim or cause of action arising out of or related to your use of the Services must be filed within one (1) year after such claim or cause of action arose, or else that claim, or cause of action will be barred forever.
                </p>
              </div>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">16. General Terms</h2>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-3">a. Relationship of Parties</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The parties' relationship, as established by these Terms, is solely that of independent contractors. These Terms do not create any partnership, joint venture, or similar business relationship between the parties.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">b. Geographic Restrictions</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics is owned and operated in the United States. The Services are permitted for use in the United States and Canada only; you are prohibited from making the AI Receptionist or our other Services available to Callers in other jurisdictions.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">c. Responsibility for Legal Compliance</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When using the Services, you agree to comply with all applicable laws, including, but not limited to privacy, intellectual property, ecommerce, export controls, and applicable laws governing privacy and data security and their requirements related to verifiable consent, parental consent, consumer privacy rights, recordkeeping, international data transfer laws and other requirements.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">d. Void Where Prohibited</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Although the Services are accessible in multiple countries, not all features, products or services discussed, referenced, provided, or offered via the Services are available to all persons or in all geographic locations, or appropriate or available for use outside the United States.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">e. Entire Agreement</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The Services are owned and offered to you by Replytics, Inc. Except as otherwise stated herein, these Terms and the agreements incorporated by reference herein constitute the entire and exclusive understanding and agreement between Replytics and you regarding the Services and supersede and replace all prior oral or written understandings or agreements between Replytics and you regarding the Services.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">f. Enforcement</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics reserves the right, but is not required, to remove or disable your access to the Services, disable any login credentials or account, whether chosen by you or provided by us, remove Your Data at any time and without notice, and at our sole discretion, if we determine that your use of our Services is in any way objectionable or in violation of these Terms.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">g. Assignment</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You may not assign, delegate, or transfer these Terms, by operation of law or otherwise, without our prior written consent, but Replytics may freely assign or transfer these Terms without restriction. Subject to the foregoing, these Terms will bind and inure to the benefit of the Parties, their successors, and permitted assigns.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">h. Waiver; Severability</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics's failure to enforce any right or provision of these Terms will not be considered a waiver of such right or provision. If for any reason a court of competent jurisdiction finds any provision of these Terms invalid or unenforceable, that provision will be enforced to the maximum extent permissible, and the other provisions of these Terms will remain in full force and effect to the greatest extent permitted by law.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">i. Notices</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Any notices or other communications provided under these Terms will be given to Replytics at the email address above and to you via email to the email address on your Account or by posting the notice to the Services.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">j. Amendments</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Replytics reserves the right to revise these Terms by updating this posting without prior notice. Your continued use of the Services following the posting of changes constitutes your acceptance of such changes.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">k. Consent to Electronic Signature</h3>
                <p className="text-gray-300 leading-relaxed">
                  By accessing or using the Services, typing your name into any of our electronic forms and indicating your acceptance or clicking a box, you consent to (a) us communicating with you electronically; (b) receiving all applications, notices, disclosures, and authorizations (collectively, "Records") from us electronically; and (c) entering into agreements and transactions using electronic Records and signatures. Federal law treats electronic signatures as having the same legal force and effect as if they were signed on paper by hand, and online contracts have the same legal force as signing an equivalent paper contract in ink.
                </p>
              </div>
            </section>

            {/* Footer */}
            <section>
              <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700/50 text-center">
                <p className="text-gray-300 font-semibold">
                  You agree to be unconditionally bound by these Terms of Service by clicking to accept these Terms or by accessing or using the Services in any manner.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}