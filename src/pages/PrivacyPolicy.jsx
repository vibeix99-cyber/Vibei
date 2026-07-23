import React from 'react';
import PolicyLayout, { PolicyHeading } from '@/components/store/PolicyLayout';

export default function PrivacyPolicy() {
  return (
    <PolicyLayout title="Privacy Policy">
      <p>
        This Privacy Policy describes how your personal information is collected, used, and shared when you visit
        or make a purchase from Made in Nagaland (the "Site").
      </p>

      <PolicyHeading>Personal Information We Collect</PolicyHeading>
      <p>
        When you visit the Site, we automatically collect certain information about your device, including
        information about your web browser, IP address, time zone, and some of the cookies that are installed on
        your device. As you browse the Site, we collect information about the individual web pages or products
        that you view, what websites or search terms referred you to the Site, and information about how you
        interact with the Site. We refer to this automatically-collected information as "Device Information".
      </p>
      <p>
        Additionally, when you make a purchase or attempt to make a purchase through the Site, we collect certain
        information from you, including your name, billing address, shipping address, payment information, email
        address, and phone number. We refer to this information as "Order Information".
      </p>

      <PolicyHeading>How Do We Use Your Personal Information?</PolicyHeading>
      <p>
        We use the Order Information that we collect generally to fulfill any orders placed through the Site
        (including processing your payment information, arranging for shipping, and providing you with invoices
        and/or order confirmations). Additionally, we use this Order Information to communicate with you, screen
        our orders for potential risk or fraud, and — when in line with the preferences you have shared with us —
        provide you with information or advertising relating to our products or services.
      </p>

      <PolicyHeading>Sharing Your Personal Information</PolicyHeading>
      <p>
        We share your Personal Information with third parties to help us use your Personal Information as described
        above. We may also share your Personal Information to comply with applicable laws and regulations, to
        respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise
        protect our rights.
      </p>

      <PolicyHeading>Data Retention</PolicyHeading>
      <p>
        When you place an order through the Site, we will maintain your Order Information for our records unless
        and until you ask us to delete this information.
      </p>

      <PolicyHeading>Changes</PolicyHeading>
      <p>
        We may update this privacy policy from time to time in order to reflect, for example, changes to our
        practices or for other operational, legal or regulatory reasons.
      </p>

      <PolicyHeading>Contact Us</PolicyHeading>
      <p>
        For more information about our privacy practices, if you have questions, or if you would like to make a
        complaint, please contact us by e-mail at{' '}
        <a href="mailto:madeinnagalandstore@gmail.com" className="text-amber-clay hover:text-terracotta">
          madeinnagalandstore@gmail.com
        </a>{' '}
        or visit us at Made in Nagaland Center, Opposite to Nagaland Civil Secretariat, Kohima.
      </p>
    </PolicyLayout>
  );
}