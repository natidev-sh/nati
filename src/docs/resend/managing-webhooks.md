# Managing Webhooks

> Use webhooks to notify your application about email events.

## What is a webhook?

Resend uses webhooks to push real-time notifications to you about your email sending. All webhooks use HTTPS and deliver a JSON payload that can be used by your application. You can use webhook feeds to do things like:

* Automatically remove bounced email addresses from mailing lists
* Create alerts in your messaging or incident tools based on event types
* Store all send events in your own database for custom reporting/retention

## Steps to receive webhooks

You can start receiving real-time events in your app using the steps:

1. Create a local endpoint to receive requests
2. Register your development webhook endpoint
3. Test that your webhook endpoint is working properly
4. Deploy your webhook endpoint to production
5. Register your production webhook endpoint

## 1. Create a local endpoint to receive requests

In your local application, create a new route that can accept POST requests.

For example, you can add an API route on Next.js:

```js pages/api/webhooks.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const payload = req.body;
    console.log(payload);
    res.status(200);
  }
};
```

On receiving an event, you should respond with an `HTTP 200 OK` to signal to Resend that the event was successfully delivered.

## 2. Register your development webhook endpoint

Register your publicly accessible HTTPS URL in the Resend dashboard.

<Tip>
  You can create a tunnel to your localhost server using a tool like
  [ngrok](https://ngrok.com/download). For example:
  `https://8733-191-204-177-89.sa.ngrok.io/api/webhooks`
</Tip>

<img alt="Add Webhook" src="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=be7984a828fbb7aadc9cc569c93d870a" data-og-width="3024" width="3024" data-og-height="1888" height="1888" data-path="images/dashboard-webhooks-add.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?w=280&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=d631dc2c58be10985c4894248a7012a1 280w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?w=560&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=bacfc1672f42b4a2d12bc77b43efec55 560w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?w=840&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=6c056d838016ab6c56892e0a4325ffbc 840w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?w=1100&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=f579cb16562ecfe95f9cb507151c3314 1100w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?w=1650&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=97291fae3000588d1268732eb6347384 1650w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhooks-add.png?w=2500&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=182556bb387968b12492459fbeabd049 2500w" />

## 3. Test that your webhook endpoint is working properly

Send a few test emails to check that your webhook endpoint is receiving the events.

<img alt="Webhook Events List" src="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=6da567f951a367bd93d5512fefa89a36" data-og-width="3024" width="3024" data-og-height="1888" height="1888" data-path="images/dashboard-webhook-events-list.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?w=280&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=9b7746385929930776e0c203912daeed 280w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?w=560&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=84b775511cde83fe54e20428aea2318f 560w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?w=840&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=5dc887d9ff12babe568831bcabb481a4 840w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?w=1100&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=65eb39d64c7dc0f4f268d5cbfe69fc8d 1100w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?w=1650&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=f365c05c4f7749d8fc68609067e5abbf 1650w, https://mintcdn.com/resend/OWNnQaVDyqcGyhhN/images/dashboard-webhook-events-list.png?w=2500&fit=max&auto=format&n=OWNnQaVDyqcGyhhN&q=85&s=dd782f49b6f6541d8dd6f23dd78b2dc9 2500w" />

## 4. Deploy your webhook endpoint

After you're done testing, deploy your webhook endpoint to production.

## 5. Register your production webhook endpoint

Once your webhook endpoint is deployed to production, you can register it in the Resend dashboard.

## FAQ

<AccordionGroup>
  <Accordion title="What is the retry schedule?">
    If Resend does not receive a 200 response from a webhook server, we will retry the webhooks.

    Each message is attempted based on the following schedule, where each period is started following the failure of the preceding attempt:

    * 5 seconds
    * 5 minutes
    * 30 minutes
    * 2 hours
    * 5 hours
    * 10 hours
  </Accordion>

  <Accordion title="What happens after all the retries fail?">
    After the conclusion of the above attempts the message will be marked as failed, and you will get a webhook of type `message.attempt.exhausted` notifying you of this error.
  </Accordion>

  <Accordion title="What IPs do webhooks POST from?">
    If your server requires an allowlist, our webhooks come from the following IP addresses:

    * `44.228.126.217`
    * `50.112.21.217`
    * `52.24.126.164`
    * `54.148.139.208`
    * `2600:1f24:64:8000::/52`
  </Accordion>

  <Accordion title="Can I retry webhook events manually?">
    Yes. You can retry webhook events manually from the dashboard.

    To retry a webhook event, click to see your webhook details
    and then click the link to the event you want to retry.

    On that page, you will see both the payload for the event
    and a button to replay the webhook event and get it sent to
    the configured webhook endpoint.
  </Accordion>
</AccordionGroup>

## Try it yourself

<Card title="Webhook Code Example" icon="arrow-up-right-from-square" href="https://github.com/resend/resend-examples/tree/main/with-webhooks">
  See an example of how to receive webhooks events for Resend emails.
</Card>