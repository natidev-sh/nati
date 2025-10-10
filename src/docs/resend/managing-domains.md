# Managing Domains

> Visualize all the domains on the Resend Dashboard.

<Warning>
  Domain not verifying? [Try
  this](/knowledge-base/what-if-my-domain-is-not-verifying).
</Warning>

## Verifying a domain

Resend sends emails using a domain you own.

We recommend using subdomains (e.g., `updates.yourdomain.com`) to isolate your sending reputation and communicate your intent. Learn more about [using subdomains](/knowledge-base/is-it-better-to-send-emails-from-a-subdomain-or-the-root-domain).

In order to verify a domain, you must set two DNS entries:

1. [SPF](#what-are-spf-records): list of IP addresses authorized to send email on behalf of your domain
2. [DKIM](#what-are-dkim-records): public key used to verify email authenticity

These two DNS entries grant Resend permission to send email on your behalf. Once SPF and DKIM verify, you can optionally add a [DMARC record](/dashboard/domains/dmarc) to build additional trust with mailbox providers.

<Info>
  Resend requires you own your domain (i.e., not a shared or public domain).
</Info>

## View domain details

The [Domains dashboard](https://resend.com/domains) shows information about your domain name, its verification status, and history.

<img alt="Domain Details" src="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=feb6b86344d63199055cdaa7b15735fa" data-og-width="2992" width="2992" data-og-height="1868" height="1868" data-path="images/dashboard-domains-resend.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?w=280&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=01bfefe3ccfc517526d62fa7f953cbb4 280w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?w=560&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=1d9b94d0b98deb3adf26892f8294a949 560w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?w=840&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=3feef54fa5b87f256d7a7f247bf82289 840w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?w=1100&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=749db4f0ded23725640b0633256960e4 1100w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?w=1650&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=fc74fbaa93b361f06a0ef8862e4b1c72 1650w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend.png?w=2500&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=556ccbb31468c59963c254facc26d3f7 2500w" />

<Info>
  Need specific help with a provider? View our [knowledge base DNS
  Guides](/knowledge-base).
</Info>

## What are SPF records

Sender Policy Framework (SPF) is an email authentication standard that allows you to list all the IP addresses that are authorized to send email on behalf of your domain.

The SPF configuration is made of a TXT record that lists the IP addresses approved by the domain owner. It also includes a MX record that allows the recipient to send bounce and complaint feedback to your domain.

<img alt="SPF Records" src="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=630f500feba7768e05a69340e8a6dae5" data-og-width="2992" width="2992" data-og-height="1868" height="1868" data-path="images/dashboard-domains-resend-spf.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?w=280&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=c84bbc00070408bc9992bb4302ab605f 280w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?w=560&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=48a6d69dac78090d26fc6d6bd6db6b5d 560w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?w=840&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=23232666700bb7832fba8de233c95130 840w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?w=1100&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=f5b8d20b6e72a1a4128b32ec4fe9c5a9 1100w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?w=1650&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=585c800c0cb33341d0cf468bf9a9bb68 1650w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-spf.png?w=2500&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=d61e747071d3485f0aff6bb239db1a7a 2500w" />

## Custom Return Path

By default, Resend will use the `send` subdomain for the Return-Path address. You can change this by setting the optional `custom_return_path` parameter when [creating a domain](/api-reference/domains/create-domain) via the API or under **Advanced options** in the dashboard.

<img alt="Custom Return Path" src="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=569a75fc160aad18116efc93bcebe148" data-og-width="3360" width="3360" data-og-height="2100" height="2100" data-path="images/dashboard-domains-resend-custom-return-path.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?w=280&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=6f4593ecf243990f3742f45a856a906f 280w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?w=560&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=b254d6c6d522a55d5c912ab300b9d21c 560w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?w=840&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=bddc91c1f027754433e5214d0089423a 840w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?w=1100&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=6d2bc0b11c21688ff53fc1717b21f507 1100w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?w=1650&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=e89880c546dd1b49f6349401ce2c267a 1650w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-custom-return-path.png?w=2500&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=88da06a234074796583c544f4373440c 2500w" />

For the API, optionally pass the custom return path parameter.

<CodeGroup>
  ```ts Node.js
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  resend.domains.create({ name: 'example.com', customReturnPath: 'outbound' });
  ```

  ```php PHP
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->domains->create([
    'name' => 'example.com',
    'custom_return_path' => 'outbound'
  ]);
  ```

  ```python Python
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Domains.CreateParams = {
    "name": "example.com",
    "custom_return_path": "outbound"
  }

  resend.Domains.create(params)
  ```

  ```ruby Ruby
  Resend.api_key = ENV["RESEND_API_KEY"]

  params = {
    name: "example.com",
    custom_return_path: "outbound"
  }
  domain = Resend::Domains.create(params)
  puts domain
  ```

  ```go Go
  import 	"github.com/resend/resend-go/v2"

  client := resend.NewClient("re_xxxxxxxxx")

  params := &resend.CreateDomainRequest{
      Name: "example.com",
      CustomReturnPath: "outbound",
  }

  domain, err := client.Domains.Create(params)
  ```

  ```rust Rust
  use resend_rs::{types::CreateDomainOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _domain = resend
      .domains
      .add(CreateDomainOptions::new("example.com").with_custom_return_path("outbound"))
      .await?;

    Ok(())
  }
  ```

  ```java Java
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateDomainOptions params = CreateDomainOptions
                  .builder()
                  .name("example.com")
                  .customReturnPath("outbound")
                  .build();

          CreateDomainResponse domain = resend.domains().create(params);
      }
  }
  ```

  ```csharp .NET
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.DomainAddAsync( "example.com", new DomainAddOptions { CustomReturnPath = "outbound" } );
  Console.WriteLine( "Domain Id={0}", resp.Content.Id );
  ```

  ```bash cURL
  curl -X POST 'https://api.resend.com/domains' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "example.com",
    "custom_return_path": "outbound"
  }'
  ```
</CodeGroup>

Custom return paths must adhere to the following rules:

* Must be 63 characters or less
* Must start with a letter, end with a letter or number, and contain only letters, numbers, and hyphens

Avoid setting values that could undermine credibility (e.g. `testing`), as they may be exposed to recipients in some email clients.

## What are DKIM records

DomainKeys Identified Mail (DKIM) is an email security standard designed to make sure that an email that claims to have come from a specific domain was indeed authorized by the owner of that domain.

The DKIM configuration is made of a TXT record that contains a public key that is used to verify the authenticity of the email.

<img alt="DKIM Records" src="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=345d1dc6b7c138dbd92bd6928c634bd9" data-og-width="2992" width="2992" data-og-height="1868" height="1868" data-path="images/dashboard-domains-resend-dkim.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?w=280&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=37e5d282deda4e727e9f002cf5b8f0dd 280w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?w=560&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=978f4a7f13387c0d721acd80a944123c 560w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?w=840&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=cd473e4cdd467d31c1e2d4a507f5d914 840w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?w=1100&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=784706a47cae7451a0200c461831bc30 1100w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?w=1650&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=9780d5ff17771270ed33a0176bd7bd55 1650w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-resend-dkim.png?w=2500&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=46f59e55a1a791b4a32e13bc49e5f0cd 2500w" />

## Understand a domain status

Domains can have different statuses, including:

* `not_started`: You've added a domain to Resend, but you haven't clicked on `Verify DNS Records` yet.
* `pending`: Resend is still trying to verify the domain.
* `verified`: Your domain is successfully verified for sending in Resend.
* `failed`: Resend was unable to detect the DNS records within 72 hours.
* `temporary_failure`: For a previously verified domain, Resend will periodically check for the DNS record required for verification. If at some point, Resend is unable to detect the record, the status would change to "Temporary Failure". Resend will recheck for the DNS record for 72 hours, and if it's unable to detect the record, the domain status would change to "Failure". If it's able to detect the record, the domain status would change to "Verified".

## Open and Click Tracking

Open and click tracking is disabled by default for all domains. You can enable it by clicking on the toggles within the domain settings.

<img alt="Open and Click Tracking" src="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=b753867f46e27a252b8d8d8a93a3fedb" data-og-width="2992" width="2992" data-og-height="1868" height="1868" data-path="images/dashboard-domains-open-and-click-tracking.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?w=280&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=6c5ef4bccc165d9274c083deeda77133 280w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?w=560&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=8ccf76e39ec29b96f3958b331edc4c43 560w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?w=840&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=6e5ed082462edd154ab22d647395f517 840w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?w=1100&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=d0c20eea121ae04af95ba1375728a9eb 1100w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?w=1650&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=955450d58fe48389f12fc0f28e33d96f 1650w, https://mintcdn.com/resend/JHWt09hsc7E33HK2/images/dashboard-domains-open-and-click-tracking.png?w=2500&fit=max&auto=format&n=JHWt09hsc7E33HK2&q=85&s=16ac8e9a32fef1e0b72cedc4f1df2dca 2500w" />

<Info>
  For best deliverability, we recommend disabling click and open tracking [for
  sensitive transactional
  emails](/dashboard/emails/deliverability-insights#disable-click-tracking).
</Info>

## How Open Tracking Works

A 1x1 pixel transparent GIF image is inserted in each email and includes a unique reference to this image file. When the image is downloaded, Resend can tell exactly which message was opened and by whom.

## How Click Tracking Works

To track clicks, Resend modifies each link in the body of the HTML email. When recipients open a link, they are sent to a Resend server, and are immediately redirected to the URL destination.

<Snippet file="exports-section.mdx" />