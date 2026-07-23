import React from 'react';
import PolicyLayout from '@/components/store/PolicyLayout';

const TERMS = [
  'These terms of sale ("Terms") apply to all offers, sales and purchases of organic/natural food and health products and services which are sold through Made in Nagaland store ("Website") by: (a) us, Made in Nagaland (references to "us", "we" or "our" being construed accordingly) the seller, to (b) you, the buyer (references to "you" or "your" being construed accordingly).',
  'All purchases are final, non-cancelable, non-transferable, and non-refundable, except as formally specified in the applicable returns/refund policy.',
  'This Website Made in Nagaland store, is owned and operated by Made in Nagaland (YouthNet), and is offered to you conditioned on your acceptance without modification of the terms, conditions, notices, etc. contained herein. Accessing and continued use of the Website constitutes your binding and conclusive acceptance and agreement of all such terms, conditions, and notices.',
  'Any prices, quotations, and descriptions made or referred to on this Website are subject to availability, and the same does not constitute an offer and may be withdrawn or revised at any time prior to our express acceptance of your order.',
  'While we make every effort to ensure that articles appearing on the Website are available, we do not guarantee that all items are in stock or immediately available when you submit your order. We may reject your order (without any liability) if we are unable to process or fulfill it. If this is the case, we will refund any prior payment that you have made for that article in terms of our Refund Policy.',
  'An order submitted by you constitutes an offer by you to us to purchase articles on these Terms and is subject to our subsequent acceptance thereof.',
  'Prior to such acceptance, an automatic e-mail acknowledgment of your order may be generated. Please note that any such automatic acknowledgment does not constitute a formal acceptance of your order.',
  'Our acceptance of your order takes effect and the contract concluded at the point where such offer is expressly accepted by us dispatching your order and accepting your credit card or other online payment ("Acceptance").',
  'You hereby represent that information provided by you when placing your order is up-to-date, materially accurate and is sufficient for us to fulfill your order.',
  'Before using a product you are unfamiliar with, you are advised to find out its properties, research it thoroughly and/or consult with an appropriately qualified practitioner or expert. If you are taking prescription drugs, or have a medical condition, check with an appropriately qualified practitioner before using products.',
  'The prices payable for products are those in effect at the time of dispatch or delivery, unless otherwise expressly agreed. Unless otherwise specified, prices quoted are exclusive of the costs of shipping or carriage to the agreed place of delivery, and exclusive of GST or any other applicable tax or duty which must be added to the price payable.',
  'Unconditional and irrevocable payment shall be made while placing the order and by such methods as are indicated on the Website. On acceptance of the order by us, the payment shall stand appropriated to our account absolutely.',
  'Delivery timescales/dates specified on the Website, in any order acknowledgment, acceptance or elsewhere are estimates only. While we endeavor to meet such timescales or dates, we do not undertake to dispatch goods by a particular date and shall not be liable to you in respect of delays or failure to do so.',
  'Delivery shall be to a valid address within the Territory submitted by you and subject to Acceptance. You must check the delivery address on any acknowledgment or acceptance we provide and notify us without delay of errors or omissions.',
  'LIMITATION OF LIABILITY: To the maximum extent legally permitted, our aggregate liability shall in no circumstances exceed the cost of the goods you ordered, and we shall not be liable for special, incidental, additional, indirect, or consequential damages, lost profits, lost revenue, or cost of cover.',
];

export default function TermsOfUse() {
  return (
    <PolicyLayout title="Terms of Use">
      <p>
        Welcome to Made in Nagaland Store. This document is an electronic record in terms of the Information
        Technology Act, 2000 and published in accordance with the provisions of the Information Technology
        (Intermediaries guidelines) Rules, 2011. The user hereby states that he has read, understood and
        unconditionally agrees to abide by the following terms and conditions in relation to the Made in Nagaland website:
      </p>
      <ol className="list-decimal pl-5 space-y-3">
        {TERMS.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ol>
    </PolicyLayout>
  );
}