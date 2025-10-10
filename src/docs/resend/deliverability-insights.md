# Deliverability Insights

> Improve your deliverability with tailored insights based on your sending.

When you view your email within Resend, there is a "Insights" option. When selected, this will run eight deliverability best practice checks on your email and recommend possible changes to improve deliverability.

<img alt="Deliverability Insights" src="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=78f3941a7a90d4546200c6cba6607270" data-og-width="3357" width="3357" data-og-height="2101" height="2101" data-path="images/deliverability-insights-1.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?w=280&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=10cbd1aec848ad402ae285984ee33c74 280w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?w=560&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=8e503253073f8943cd8ebebeb917daad 560w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?w=840&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=1dea6f4d95e439047c40fadb11df21a7 840w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?w=1100&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=1c625d077d36c6c95833fa043b9e0f49 1100w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?w=1650&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=b705bffec5f0cce119f2c90e73ab5efe 1650w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-1.jpg?w=2500&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=09087699e0b0b4de5f341a179ba8373c 2500w" />

If a check passes, you'll get a nice green check. Resend will provide advice if it fails. We break these into two categories: Attention and Improvements.

## Attention Insights

Changes to your email that can improve deliverability.

<img alt="Attention Insights" src="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=158b0b42d45e7172f150a8818671a03e" data-og-width="2058" width="2058" data-og-height="714" height="714" data-path="images/deliverability-insights-2.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?w=280&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=3cbdb326168584456f2a793c79387c86 280w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?w=560&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=07bb0c4f63026da319c189047137a8d6 560w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?w=840&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=d1a074eefceefdad5b445b2cf543b3eb 840w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?w=1100&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=b931088f6b83c347decd6361efd24168 1100w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?w=1650&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=d6ee6b74301f50a183e43ccddd9dd551 1650w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-2.jpg?w=2500&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=c5e4b12221c033d54d12dd689bcd0203 2500w" />

#### Link URLs match sending domain

Ensure that the URLs in your email match the sending domain. Mismatched URLs can trigger spam filters.

For example, if your sending domain is `@widgets.com`, ensure links within the message point back to `https://widgets.com`.

#### DMARC Record is Valid

DMARC is a TXT record published in the DNS that specifies how email receivers should handle messages from your domain that don’t pass SPF or DKIM validation. [A valid DMARC record](/dashboard/domains/dmarc) can help improve email deliverability.

Starting in 2024, Gmail and Yahoo require senders to have a DMARC record published. When [viewing your domain](https://resend.com/domains) in Resend, we provide a suggested DMARC record if you’re unsure what to publish.

#### Include Plain Text Version

Including a plain text version of your email ensures that your message is accessible to all recipients, including those who have email clients that do not support HTML.

If you're using Resend's API, [plain text is passed via the `text` parameter](https://resend.com/docs/api-reference/emails/send-email).

This can also generate plain text using [React Email](https://react.email/docs/utilities/render#4-convert-to-plain-text).

#### Don't use "no-reply"

Indicating that this is a one-way communication decreases trust. Some email providers use engagement (email replies) when deciding how to filter your email. A valid email address allows you to communicate with your recipients easily if they have questions.

#### Keep email body size small

Gmail limits the size of each email message to 102 KB. Once that limit is reached, the remaining content is clipped and hidden behind a link to view the entire message. Keep your email body size small to avoid this issue.

This check will show the current size of your email.

## Improvement Insights

If you're diagnosing a deliverability issue, changing your email practices could be helpful.

<img alt="Improvement Insights" src="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=64e4640b71c022a296f423ce4afdfbc8" data-og-width="2058" width="2058" data-og-height="844" height="844" data-path="images/deliverability-insights-3.jpg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?w=280&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=b6cc20f063c66c7cc88487c5b7269d8c 280w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?w=560&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=d9ac8759f9c69dfec8d4bcea3e77cd60 560w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?w=840&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=34990ef6c6f425948f777f2267e5fdcc 840w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?w=1100&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=cb2c2ae6bc5cb02d217b65b04cc66081 1100w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?w=1650&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=c408a0b614cf29bfcc33fa7a56c4a551 1650w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/deliverability-insights-3.jpg?w=2500&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=27d1aa0f9db84c83b034020c28c06fd5 2500w" />

#### Use a Subdomain

Using a subdomain instead of the root domain helps segment your sending by purpose. This protects different types of sending from impacting the reputation of others and clearly shows the sending purpose.

#### Disable Click Tracking

Click tracking modifies links, sometimes causing spam filters to flag emails as suspicious or phishing attempts. Disabling click tracking can help with email deliverability, especially for sensitive transactional emails like login or email verification.

If on, you can [disable click tracking on your domain in Resend](https://resend.com/domains).

#### Disable Open Tracking

Spam filters are sensitive to tracking pixels, flagging them as potential spam. Without these tracking elements, emails may bypass these filters more effectively, especially for sensitive transactional emails like login or email verification.

If on, you can [disable open tracking on your domain in Resend](https://resend.com/domains).