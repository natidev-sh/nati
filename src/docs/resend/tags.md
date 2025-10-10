# Managing Tags

> Add unique identifiers to emails sent.

Tags are unique identifiers you can add to your emails. They help associate emails with your application. They are passed in key/value pairs. After the email is sent, the tag is included in the webhook event. Tags can include ASCII letters, numbers, underscores, or dashes.

Some examples of when to use a tag:

* Associate the email a "customer ID" from your application
* Add a label from your database like "free" or "enterprise"
* Note the category of email sent, like "welcome" or "password reset"

Here's how you can add custom tags to your emails.

## Add tags on the `POST /emails` endpoint

<CodeGroup>
  ```ts Node.js {10-15}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['delivered@resend.dev'],
    subject: 'hello world',
    html: '<p>it works!</p>',
    tags: [
      {
        name: 'category',
        value: 'confirm_email',
      },
    ],
  });
  ```

  ```php PHP {8-13}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->emails->send([
    'from' => 'Acme <onboarding@resend.dev>',
    'to' => ['delivered@resend.dev'],
    'subject' => 'hello world',
    'html' => '<p>it works!</p>',
    'tags' => [
      [
        'name' => 'category',
        'value' => 'confirm_email',
      ],
    ]
  ]);
  ```

  ```python Python {10-12}
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.Emails.SendParams = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "tags": [
      {"name": "category", "value": "confirm_email"},
    ],
  }

  email = resend.Emails.send(params)
  print(email)
  ```

  ```rb Ruby {10-12}
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "tags": [
      {"name": "category", "value": "confirm_email"}
    ]
  }

  sent = Resend::Emails.send(params)
  puts sent
  ```

  ```go Go {16}
  import (
  	"fmt"

  	"github.com/resend/resend-go/v2"
  )

  func main() {
    ctx := context.TODO()
    client := resend.NewClient("re_xxxxxxxxx")

    params := &resend.SendEmailRequest{
        From:        "Acme <onboarding@resend.dev>",
        To:          []string{"delivered@resend.dev"},
        Text:        "<p>it works!</p>",
        Subject:     "hello world",
        Tags:        []resend.Tag{{Name: "category", Value: "confirm_email"}},
    }

    sent, err := client.Emails.SendWithContext(ctx, params)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Id)
  }
  ```

  ```rust Rust {14}
  use resend_rs::types::{CreateEmailBaseOptions, Tag};
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let from = "Acme <onboarding@resend.dev>";
    let to = ["delivered@resend.dev"];
    let subject = "hello world";

    let email = CreateEmailBaseOptions::new(from, to, subject)
      .with_html("<p>it works!</p>")
      .with_tag(Tag::new("category", "confirm_email"));

    let _email = resend.emails.send(email).await?;

    Ok(())
  }
  ```

  ```java Java {17}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          Tag tag = Tag.builder()
                  .name("category")
                  .value("confirm_email")
                  .build();

          SendEmailRequest sendEmailRequest = SendEmailRequest.builder()
                  .from("Acme <onboarding@resend.dev>")
                  .to("delivered@resend.dev")
                  .subject("hello world")
                  .html("<p>it works!</p>")
                  .tags(tag)
                  .build();

          SendEmailResponse data = resend.emails().send(sendEmailRequest);
      }
  }
  ```

  ```csharp .NET {12}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.EmailSendAsync( new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "delivered@resend.dev",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
      ReplyTo = "onboarding@resend.dev",
      Tags = new List<Tag> { Tag.Builder().Name("category").Value("confirm_email").Build() }
  } );
  Console.WriteLine( "Email Id={0}", resp.Content );
  ```

  ```bash cURL {9-14}
  curl -X POST 'https://api.resend.com/emails' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>",
    "tags": [
      {
        "name": "category",
        "value": "confirm_email"
      }
    ]
  }'
  ```
</CodeGroup>

## Add tags on the `POST /emails/batch` endpoint

<CodeGroup>
  ```ts Node.js {11-16,23-28}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.batch.send([
    {
      from: 'Acme <onboarding@resend.dev>',
      to: ['foo@gmail.com'],
      subject: 'hello world',
      html: '<h1>it works!</h1>',
      tags: [
        {
          name: 'category',
          value: 'confirm_email',
        },
      ],
    },
    {
      from: 'Acme <onboarding@resend.dev>',
      to: ['bar@outlook.com'],
      subject: 'world hello',
      html: '<p>it works!</p>',
      tags: [
        {
          name: 'category',
          value: 'confirm_email',
        },
      ],
    },
  ]);
  ```

  ```php PHP {9-13,21-25}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->batch->send([
    [
      'from' => 'Acme <onboarding@resend.dev>',
      'to' => ['foo@gmail.com'],
      'subject' => 'hello world',
      'html' => '<h1>it works!</h1>',
      'tags' => [
        [
          'name' => 'category',
          'value' => 'confirm_email'
        ]
      ]
    ],
    [
      'from' => 'Acme <onboarding@resend.dev>',
      'to' => ['bar@outlook.com'],
      'subject' => 'world hello',
      'html' => '<p>it works!</p>',
      'tags' => [
        [
          'name' => 'category',
          'value' => 'confirm_email'
        ]
      ]
    ]
  ]);
  ```

  ```py Python {12-17,24-29}
  import resend
  from typing import List

  resend.api_key = "re_xxxxxxxxx"

  params: List[resend.Emails.SendParams] = [
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
      "tags": [
        {
          "name": "category",
          "value": "confirm_email"
        }
      ]
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
      "tags": [
        {
          "name": "category",
          "value": "confirm_email"
        }
      ]
    }
  ]

  resend.Batch.send(params)
  ```

  ```rb Ruby {11-16,23-28}
  require "resend"

  Resend.api_key = 're_xxxxxxxxx'

  params = [
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
      "tags": [
        {
          "name": "category",
          "value": "confirm_email"
        }
      ]
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
      "tags": [
        {
          "name": "category",
          "value": "confirm_email"
        }
      ]
    }
  ]

  Resend::Batch.send(params)
  ```

  ```go Go {22,29}
  package examples

  import (
  	"fmt"
  	"os"

  	"github.com/resend/resend-go/v2"
  )

  func main() {

    ctx := context.TODO()

    client := resend.NewClient("re_xxxxxxxxx")

    var batchEmails = []*resend.SendEmailRequest{
      {
        From:    "Acme <onboarding@resend.dev>",
        To:      []string{"foo@gmail.com"},
        Subject: "hello world",
        Html:    "<h1>it works!</h1>",
        Tags:    []resend.Tag{{Name: "category", Value: "confirm_email"}},
      },
      {
        From:    "Acme <onboarding@resend.dev>",
        To:      []string{"bar@outlook.com"},
        Subject: "world hello",
        Html:    "<p>it works!</p>",
        Tags:    []resend.Tag{{Name: "category", Value: "confirm_email"}},
      },
    }

    sent, err := client.Batch.SendWithContext(ctx, batchEmails)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Data)
  }
  ```

  ```rust Rust {15,22}
  use resend_rs::types::CreateEmailBaseOptions;
  use resend_rs::{Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let emails = vec![
      CreateEmailBaseOptions::new(
        "Acme <onboarding@resend.dev>",
        vec!["foo@gmail.com"],
        "hello world",
      )
      .with_html("<h1>it works!</h1>")
      .with_tag(Tag::new("category", "confirm_email")),
      CreateEmailBaseOptions::new(
        "Acme <onboarding@resend.dev>",
        vec!["bar@outlook.com"],
        "world hello",
      )
      .with_html("<p>it works!</p>")
      .with_tag(Tag::new("category", "confirm_email")),
    ];

    let _emails = resend.batch.send(emails).await?;

    Ok(())
  }
  ```

  ```java Java {12-15,23-26}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateEmailOptions firstEmail = CreateEmailOptions.builder()
              .from("Acme <onboarding@resend.dev>")
              .to("foo@gmail.com")
              .subject("hello world")
              .html("<h1>it works!</h1>")
              .tags(Tag.builder()
                  .name("category")
                  .value("confirm_email")
                  .build())
              .build();

          CreateEmailOptions secondEmail = CreateEmailOptions.builder()
              .from("Acme <onboarding@resend.dev>")
              .to("bar@outlook.com")
              .subject("world hello")
              .html("<p>it works!</p>")
              .tags(Tag.builder()
                  .name("category")
                  .value("confirm_email")
                  .build())
              .build();

          CreateBatchEmailsResponse data = resend.batch().send(
              Arrays.asList(firstEmail, secondEmail)
          );
      }
  }
  ```

  ```csharp .NET {11,20}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var mail1 = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "foo@gmail.com",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
      Tags = new List<Tag> { Tag.Builder().Name("category").Value("confirm_email").Build() }
  };

  var mail2 = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "bar@outlook.com",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
      Tags = new List<Tag> { Tag.Builder().Name("category").Value("confirm_email").Build() }
  };

  var resp = await resend.EmailBatchAsync( [ mail1, mail2 ] );
  Console.WriteLine( "Nr Emails={0}", resp.Content.Count );
  ```

  ```bash cURL {10-15,22-27}
  curl -X POST 'https://api.resend.com/emails/batch' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'[
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
      "tags": [
        {
          "name": "category",
          "value": "confirm_email"
        }
      ]
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
      "tags": [
        {
          "name": "category",
          "value": "confirm_email"
        }
      ]
    }
  ]'
  ```
</CodeGroup>