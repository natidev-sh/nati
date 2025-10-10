# Create API key

> Add a new API key to authenticate communications with Resend.

export const ResendParamField = ({children, body, path, ...props}) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('code') || '"Node.js"';
  });
  useEffect(() => {
    const onStorage = event => {
      const key = event.detail.key;
      if (key === 'code') {
        setLang(event.detail.value);
      }
    };
    document.addEventListener('mintlify-localstorage', onStorage);
    return () => {
      document.removeEventListener('mintlify-localstorage', onStorage);
    };
  }, []);
  const toCamelCase = str => typeof str === 'string' ? str.replace(/[_-](\w)/g, (_, c) => c.toUpperCase()) : str;
  const resolvedBody = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(body) : body;
  }, [body, lang]);
  const resolvedPath = useMemo(() => {
    const value = JSON.parse(lang);
    return value === 'Node.js' ? toCamelCase(path) : path;
  }, [path, lang]);
  return <ParamField body={resolvedBody} path={resolvedPath} {...props}>
      {children}
    </ParamField>;
};

## Body Parameters

<ParamField body="name" type="string" required>
  The API key name.
</ParamField>

<ParamField body="permission" type="full_access | sending_access">
  The API key can have full access to Resend's API or be only restricted to send
  emails. \* `full_access`: Can create, delete, get, and update any resource. \*
  `sending_access`: Can only send emails.
</ParamField>

<ResendParamField body="domain_id" type="string">
  Restrict an API key to send emails only from a specific domain. This is only
  used when the `permission` is set to `sending_access`.
</ResendParamField>

<RequestExample>
  ```ts Node.js
  import { Resend } from 'resend';

  const resend = new Resend('re_xxxxxxxxx');

  const { data, error } = await resend.apiKeys.create({ name: 'Production' });
  ```

  ```php PHP
  $resend = Resend::client('re_xxxxxxxxx');

  $resend->apiKeys->create([
    'name' => 'Production'
  ]);
  ```

  ```python Python
  import resend

  resend.api_key = "re_xxxxxxxxx"

  params: resend.ApiKeys.CreateParams = {
    "name": "Production",
  }

  resend.ApiKeys.create(params)
  ```

  ```ruby Ruby
  require "resend"

  Resend.api_key = "re_xxxxxxxxx"

  params = {
    name: "Production"
  }
  Resend::ApiKeys.create(params)
  ```

  ```go Go
  import 	"github.com/resend/resend-go/v2"

  client := resend.NewClient("re_xxxxxxxxx")
  params := &resend.CreateApiKeyRequest{
      Name: "Production",
  }
  apiKey, _ := client.ApiKeys.Create(params)
  ```

  ```rust Rust
  use resend_rs::{types::CreateApiKeyOptions, Resend, Result};

  #[tokio::main]
  async fn main() -> Result<()> {
    let resend = Resend::new("re_xxxxxxxxx");

    let _api_key = resend
      .api_keys
      .create(CreateApiKeyOptions::new("Production"))
      .await?;

    Ok(())
  }
  ```

  ```java Java
  import com.resend.*;

  public class Main {
      public static void main(String[] args) {
          Resend resend = new Resend("re_xxxxxxxxx");

          CreateApiKeyOptions params = CreateApiKeyOptions
                  .builder()
                  .name("Production").build();

          CreateApiKeyResponse apiKey = resend.apiKeys().create(params);
      }
  }
  ```

  ```csharp .NET
  using Resend;

  IResend resend = ResendClient.Create( "re_xxxxxxxxx" ); // Or from DI

  var resp = await resend.ApiKeyCreateAsync( "Production" );
  Console.WriteLine( "Token={0}", resp.Content.Token );
  ```

  ```bash cURL
  curl -X POST 'https://api.resend.com/api-keys' \
       -H 'Authorization: Bearer re_xxxxxxxxx' \
       -H 'Content-Type: application/json' \
       -d $'{
    "name": "Production"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json Response
  {
    "id": "dacf4072-4119-4d88-932f-6202748ac7c8",
    "token": "re_c1tpEyD8_NKFusih9vKVQknRAQfmFcWCv"
  }
  ```
</ResponseExample>