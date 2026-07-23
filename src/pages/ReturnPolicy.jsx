import React from 'react';
import PolicyLayout, { PolicyHeading } from '@/components/store/PolicyLayout';

export default function ReturnPolicy() {
  return (
    <PolicyLayout title="Return, Refund, and Order Cancellation Policy">
      <p>Thanks for shopping at Made in Nagaland store. If you are not entirely satisfied with your purchase, we're here to help.</p>

      <PolicyHeading>Returns</PolicyHeading>
      <ul className="list-disc pl-5 space-y-2">
        <li>You have 30 calendar days to return an item from the date you received it.</li>
        <li>To be eligible for a return, your item must be unused and in the same condition that you received it.</li>
        <li>Your item must be in the original packaging.</li>
        <li>Your item needs to have the receipt or proof of purchase.</li>
      </ul>

      <PolicyHeading>Refunds</PolicyHeading>
      <ul className="list-disc pl-5 space-y-2">
        <li>Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item.</li>
        <li>If your return is approved, we will initiate a refund to your credit card (or original method of payment).</li>
        <li>You will receive the credit within a certain amount of days, depending on your card issuer's policies.</li>
      </ul>

      <PolicyHeading>Shipping</PolicyHeading>
      <ul className="list-disc pl-5 space-y-2">
        <li>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are nonrefundable.</li>
        <li>If you receive a refund, the cost of return shipping will be deducted from your refund.</li>
      </ul>

      <PolicyHeading>Contact Us</PolicyHeading>
      <p>
        If you have any questions on how to return your item to us, contact us at Made in Nagaland Center. Phone:
        +91-7005592538 · Email:{' '}
        <a href="mailto:madeinnagalandstore@gmail.com" className="text-amber-clay hover:text-terracotta">
          madeinnagalandstore@gmail.com
        </a>
      </p>

      <PolicyHeading>Order Cancellation Policy</PolicyHeading>
      <p>
        All orders are automatically processed on our secure merchant processor and sent for shipment as soon as
        they are placed. During this process we incur irreversible fees. Therefore, while we understand that orders
        might need to be changed sometimes, we are unable to do it free of charge after a certain point. We
        strictly adhere to the following cancellation policy:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li>If you cancel your order BEFORE it has been shipped, you will be assessed a 15% cancellation fee before credit is issued.</li>
        <li>If you cancel your order AFTER it has been shipped, please follow our Return Policies & Procedures. The cancellation will have to be treated as a Return with all applicable fees.</li>
        <li>Orders which are REFUSED AT DELIVERY will be assessed all of the applicable fees listed above — including restocking, cancellation and other applicable fees.</li>
      </ul>
    </PolicyLayout>
  );
}