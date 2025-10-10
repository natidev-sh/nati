# Batch Validation Modes

> Control how batch validation is performed.

The batch validation header controls how emails are validated in batch sending.

`x-batch-validation`

Choose between `strict` and `permissive` mode.

## Strict mode (default)

Strict mode sends the batch only if all emails in the batch request are valid.

* **Atomic behavior**: if any email in the batch fails validation, the entire batch is rejected
* **Error details**: only the validation error causing the failure is returned

If the header is omitted, strict mode applies.

## Permissive mode

Permissive mode processes all emails, allowing for partial success and returns the following two arrays:

* **data**: array of objects for all created emails, each containing an email `id`.
* **errors**: array of objects for emails which could not be created due to validation errors. Each object contains the following properties:
  * `index`: index of the email in the batch request
  * `message`: error message identifying the validation error

## How to use batch validation modes

<CodeGroup>
  ```ts Node.js {21}
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, errors } = await resend.batch.send(
    [
      {
        from: 'Acme <onboarding@resend.dev>',
        to: ['foo@gmail.com'],
        subject: 'hello world',
        html: '<h1>it works!</h1>',
      },
      {
        from: 'Acme <onboarding@resend.dev>',
        to: ['bar@outlook.com'],
        subject: 'world hello',
        html: '<p>it works!</p>',
      },
    ],
    {
      batchValidation: 'permissive',
    },
  );
  ```

  ```php PHP {19}
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->batch->send(
    [
      [
        'from' => 'Acme <onboarding@resend.dev>',
        'to' => ['foo@gmail.com'],
        'subject' => 'hello world',
        'html' => '<h1>it works!</h1>',
      ],
      [
        'from' => 'Acme <onboarding@resend.dev>',
        'to' => ['bar@outlook.com'],
        'subject' => 'world hello',
        'html' => '<p>it works!</p>',
      ]
    ],
    [
      'batch_validation' => 'permissive',
    ]
  );
  ```

  ```py Python {22}
  import resend
  from typing import List

  resend.api_key = "re_xxxxxxxxx"

  params: List[resend.Emails.SendParams] = [
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
    }
  ]

  options: resend.Batch.SendOptions = {
    "batch_validation": "permissive",
  }

  resend.Batch.send(params, options)
  ```

  ```rb Ruby {22}
  require "resend"

  Resend.api_key = 're_xxxxxxxxx'

  params = [
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>",
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>",
    }
  ]

  Resend::Batch.send(
    params,
    options: { batch_validation: "permissive" }
  )
  ```

  ```go Go {32}
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
      },
      {
        From:    "Acme <onboarding@resend.dev>",
        To:      []string{"bar@outlook.com"},
        Subject: "world hello",
        Html:    "<p>it works!</p>",
      },
    }

    options := &resend.BatchSendEmailOptions{
      BatchValidation: "permissive",
    }

    sent, err := client.Batch.SendWithOptions(ctx, batchEmails, options)

    if err != nil {
      panic(err)
    }
    fmt.Println(sent.Data)
  }
  ```

  ```rust Rust {25}
  use resend_rs::types::{BatchValidation, CreateEmailBaseOptions};
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
      .with_html("<h1>it works!</h1>"),
      CreateEmailBaseOptions::new(
        "Acme <onboarding@resend.dev>",
        vec!["bar@outlook.com"],
        "world hello",
      )
      .with_html("<p>it works!</p>"),
    ];

    let _emails = resend
      .batch
      .send_with_batch_validation(emails, BatchValidation::Permissive)
      .await?;

    Ok(())
  }
  ```

  ```java Java {23}
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {

          Resend resend = new Resend("re_xxxxxxxxx");

          CreateEmailOptions firstEmail = CreateEmailOptions.builder()
              .from("Acme <onboarding@resend.dev>")
              .to("foo@gmail.com")
              .subject("hello world")
              .html("<h1>it works!</h1>")
              .build();

          CreateEmailOptions secondEmail = CreateEmailOptions.builder()
              .from("Acme <onboarding@resend.dev>")
              .to("bar@outlook.com")
              .subject("world hello")
              .html("<p>it works!</p>")
              .build();

          RequestOptions options = RequestOptions.builder()
              .add("x-batch-validation", "permissive")
              .build();

          CreateBatchEmailsResponse data = resend.batch()
            .send(
              Arrays.asList(firstEmail, secondEmail),
              options
            );
      }
  }
  ```

  ```csharp .NET {5}
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var key = BatchValidation.New<int>( "permissive" );

  var mail1 = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "foo@gmail.com",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
  };

  var mail2 = new EmailMessage()
  {
      From = "Acme <onboarding@resend.dev>",
      To = "bar@outlook.com",
      Subject = "hello world",
      HtmlBody = "<p>it works!</p>",
  };

  var resp = await resend.EmailBatchAsync(
      [ mail1, mail2 ],
      EmailBatchValidationMode.Permissive
  );

  Console.WriteLine( "Nr Emails={0}", resp.Content.Data.Count );

  if ( resp.Content.Errors?.Count > 0 )
  {
      foreach ( var error in resp.Content.Errors )
      {
          Console.WriteLine( "Error at index {0}: {1}", error.Index, error.Message );
      }
  }
  ```

  ```bash cURL {4}
  curl -X POST 'https://api.resend.com/emails/batch' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -H 'x-batch-validation: permissive' \
       -d $'[
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["foo@gmail.com"],
      "subject": "hello world",
      "html": "<h1>it works!</h1>"
    },
    {
      "from": "Acme <onboarding@resend.dev>",
      "to": ["bar@outlook.com"],
      "subject": "world hello",
      "html": "<p>it works!</p>"
    }
  ]'
  ```
</CodeGroup>

## Example response

```json Response
{
  "data": [
    {
      "id": "ae2014de-c168-4c61-8267-70d2662a1ce1"
    },
    {
      "id": "faccb7a5-8a28-4e9a-ac64-8da1cc3bc1cb"
    }
  ],
  // the `errors` array is only present in permissive batch validation mode
  "errors": [
    {
      "index": 2, // 0-indexed (first item is index 0)
      "message": "The `to` field is missing."
    }
  ]
}
```

## Which errors are returned?

Only `permissive` mode returns an errors array, since the entire batch is rejected if any email fails validation in `strict` mode.

When an email in your payload causes an error, that email cannot be created, so an error object is returned.

Reasons your email may cause an error include:

* Required fields are missing.
* Fields contain invalid data.
* The batch contains more than 100 emails.

Importantly, this means the following:

* The email will not appear in the dashboard, since it could not be created.
* The error object will be included in the `errors` array.
* The only way to understand why the email failed is to inspect the returned error object.