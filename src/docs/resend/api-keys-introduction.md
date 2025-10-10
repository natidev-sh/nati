# Introduction

> Understand general concepts, response codes, and authentication strategies.

## Base URL

The Resend API is built on **REST** principles. We enforce **HTTPS** in every request to improve data security, integrity, and privacy. The API does not support **HTTP**.

All requests contain the following base URL:

```
https://api.resend.com
```

## Authentication

To authenticate you need to add an *Authorization* header with the contents of the header being `Bearer re_xxxxxxxxx` where `re_xxxxxxxxx` is your [API Key](https://resend.com/api-keys).

```
Authorization: Bearer re_xxxxxxxxx
```

## Response codes

Resend uses standard HTTP codes to indicate the success or failure of your requests.

In general, `2xx` HTTP codes correspond to success, `4xx` codes are for user-related failures, and `5xx` codes are for infrastructure issues.

| Status | Description                             |
| ------ | --------------------------------------- |
| `200`  | Successful request.                     |
| `400`  | Check that the parameters were correct. |
| `401`  | The API key used was missing.           |
| `403`  | The API key used was invalid.           |
| `404`  | The resource was not found.             |
| `429`  | The rate limit was exceeded.            |
| `5xx`  | Indicates an error with Resend servers. |

<Info>
  Check [Error Codes](/api-reference/errors) for a comprehensive breakdown of
  all possible API errors.
</Info>

## Rate limit

The default maximum rate limit is **2 requests per second**. This number can be increased for trusted senders by request. After that, you'll hit the rate limit and receive a `429` response error code.

Learn more about our [rate limits](/api-reference/rate-limit).

## FAQ

<AccordionGroup>
  <Accordion title="How does pagination work with the API?">
    At this moment, there are no pagination parameters since we don't provide a
    way to fetch data via API yet. We plan to add pagination capabilities in the
    future.
  </Accordion>

  <Accordion title="How do you handle API versioning?">
    Currently, there's no versioning system in place. We plan to add versioning
    via calendar-based headers in the future.
  </Accordion>
</AccordionGroup>