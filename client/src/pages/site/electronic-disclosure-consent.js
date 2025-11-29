'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ElectronicDisclosureConsentPage() {
  const router = useRouter();

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-bf-blue mb-8">Electronic Disclosure Consent Agreement</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Through this Electronic Disclosure Consent Agreement ("E-SIGN Consent"), you agree for this Transaction to (1) electronically receive Communications from Blue Flag Realty Inc ("Company," "we," "us," "our") pursuant to the terms set forth herein and (2) electronically sign agreements, as necessary.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Definitions.</h2>
              <p className="text-gray-700 mb-4">
                "Communications" means any and all disclosures or other information that applicable laws or regulations require we provide you in writing for this Transaction.
              </p>
              <p className="text-gray-700 mb-4">
                "Transaction" means your consent(s) to allow us or a third party on our behalf to deliver marketing and/or nonmarketing calls and text messages (using an automatic telephone dialing system or prerecorded or artificial message, as applicable) to the telephone number(s) you provide.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Duration of Consent.</h2>
              <p className="text-gray-700 mb-4">
                This E-SIGN Consent is effective immediately and applies only to the Transaction. Your E-SIGN Consent expires upon completion of this Transaction; however, the expiration of E-SIGN Consent does not impact the duration or scope of consent(s) obtained as part of the Transaction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Right to Paper Copies.</h2>
              <p className="text-gray-700 mb-4">
                You are not required to provide E-SIGN Consent; however, failure to do so means you cannot execute the Transaction online. If you provide E-SIGN Consent but would also like a paper copy of the Transaction Communication, please contact us at the address below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Methods.</h2>
              <p className="text-gray-700 mb-4">
                We will deliver electronic Communications by making the electronic Communications viewable to you online. We recommend that you print a paper copy of any electronic Communications for your records. You agree that you can access, view, download, save, and print any Communications you receive via electronic delivery for your records.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Signature.</h2>
              <p className="text-gray-700 mb-4">
                You understand that your use of a keyboard, mouse, or other device to select an item, button, icon, or similar action, or to otherwise provide your assent during this Transaction constitutes your signature and acceptance and is the legal equivalent of your physical signature.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hardware and Software Requirements.</h2>
              <p className="text-gray-700 mb-4">
                You understand that in order to receive electronic Communications and provide your electronic signatures on our website, you must have internet access, a supported operating system (most recent version of Windows, Mac OS, Android or iOS), and a supported web browser (most recent version of Edge, Chrome, Firefox, or Safari). Your receipt and acceptance of this E-SIGN Consent demonstrates that you can access the information contained herein and the Communications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security.</h2>
              <p className="text-gray-700 mb-4">
                You acknowledge that the Internet is not a secure network and that electronic Communications transmitted over the Internet may be accessed by unauthorized or unintended third parties. Although we have implemented reasonable technical safeguards to protect our communication systems from unauthorized access, we cannot guarantee network security and you accept that receiving or sending Communications via the Internet is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-4">
                To request an alternative method to receive Communications, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Blue Flag Realty Inc</strong><br />
                  Attn: Electronic Communications<br />
                  755 E Main St, Greenwood , Indiana 46143
                </p>
                <p className="text-gray-700 mt-3">
                  Please include your name, address, and phone number in any written correspondence.
                </p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.back()}
                className="text-bf-blue hover:text-bf-gold font-medium"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

