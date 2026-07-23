import React from 'react';
import { Truck } from 'lucide-react';

const DELIVERY_TIMES = [
  'For Kohima Region, the delivery time is approximately 0–2 days.',
  'For Dimapur Region, the delivery time is estimated to be around 1–3 days.',
  'For Rest of Nagaland Region, you can expect delivery within approximately 2–5 days.',
  'For PAN India, you can expect delivery within approximately 5–10 days.',
];

const CHARGES = [
  { region: 'Dimapur Region', text: 'Rs 100 for delivery is to be applied.' },
  { region: 'Kohima Region', text: 'Rs 60 – Rs 100 for delivery may be applied.' },
  {
    region: 'PAN India',
    text: 'Rs 150 for delivery may be applied for orders weighing less than 500 grams. If the product weight is more than 500 grams, an additional Rs 150 per Kg will be applied.',
  },
];

export default function Delivery() {
  return (
    <div className="max-w-[900px] mx-auto px-5 md:px-8 py-14">
      <h1 className="font-heading font-bold text-3xl md:text-5xl text-terracotta text-center">
        Shipping and Delivery
      </h1>
      <div className="thread-line my-10" />

      {/* Order tracking */}
      <p className="text-charcoal/85 leading-relaxed">
        To track the status of your order for the products you purchased from us, kindly click on the button
        'Order Tracking', where you can find detailed information and updates on your shipment.
      </p>
      <div className="text-center my-8">
        <a
          href="https://www.delhivery.com/tracking"
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-amber-clay text-white font-semibold uppercase tracking-wider text-sm px-8 py-3.5 rounded-full hover:bg-terracotta transition-colors"
        >
          Order Tracking
        </a>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Please note that to track your order, you will be redirected to the website of our delivery partner,{' '}
        <a href="https://www.delhivery.com/tracking" target="_blank" rel="noreferrer" className="text-amber-clay hover:text-terracotta">
          Delhivery.com
        </a>
        . There, you will be able to access the necessary information and updates regarding your shipment.
      </p>

      <div className="thread-line my-10" />

      {/* Estimated delivery time */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="font-heading font-bold text-2xl text-charcoal">Estimated Delivery Time</h2>
          <p className="text-sm text-muted-foreground mt-2">The estimated delivery time to specific areas is as follows:</p>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-charcoal/85">
            {DELIVERY_TIMES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Please note that these delivery times are estimates and may be subject to change.
          </p>
        </div>
        <Truck className="hidden md:block w-16 h-16 text-forest shrink-0 mt-8" />
      </div>

      <div className="thread-line my-10" />

      {/* Delivery charges */}
      <h2 className="font-heading font-bold text-2xl text-charcoal">What are the delivery charges?</h2>
      <p className="text-sm text-muted-foreground mt-2">For products listed on Made In Nagaland,</p>
      <ul className="mt-4 space-y-2 list-disc pl-5 text-charcoal/85">
        {CHARGES.map((c) => (
          <li key={c.region}>
            <span className="font-semibold">{c.region}:</span> {c.text}
          </li>
        ))}
      </ul>

      <div className="thread-line my-10" />

      {/* FAQ */}
      <div className="space-y-8">
        <div>
          <h3 className="font-heading font-bold text-lg text-charcoal">
            Why does the delivery date not correspond to the delivery timeline of X–Y business days?
          </h3>
          <p className="text-charcoal/85 mt-2 leading-relaxed">
            It is possible that our courier partner Delhivery have a holiday between the day you placed your order and
            the date of delivery. The details of the delivery will be available on their "Track Your Order" page on{' '}
            <a href="https://www.delhivery.com/tracking" target="_blank" rel="noreferrer" className="text-amber-clay hover:text-terracotta">
              Delhivery.com
            </a>
            .
          </p>
        </div>
        <div>
          <h3 className="font-heading font-bold text-lg text-charcoal">Is CoD option available in my location?</h3>
          <p className="text-charcoal/85 mt-2">Sorry, we do not provide CoD.</p>
        </div>
      </div>
    </div>
  );
}