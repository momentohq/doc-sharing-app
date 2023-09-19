const { AuthClient, CredentialProvider, ExpiresIn, GenerateDisposableToken } = require('@gomomento/sdk');
let authClient;

export default async function handler(req, res) {
  const { ttl, userId } = req.body;
  if (!ttl || !userId) {
    return res.status(400).json({ message: 'You must include "ttl" and "userId" values in the body' });
  }

  if (!authClient) {
    authClient = new AuthClient({
      credentialProvider: CredentialProvider.fromEnvironmentVariable({ environmentVariableName: 'MOMENTO_API_KEY' }),
    });
  }

  try {
    const scope = {
      permissions: [        
        {
          role: 'readonly',
          cache: process.env.NEXT_PUBLIC_CACHE_NAME,
          item: {
            key: `${userId}-${req.query.name}`
          }
        }
      ]
    };

    const token = await authClient.generateDisposableToken(scope, ExpiresIn.minutes(ttl));
    if (token instanceof GenerateDisposableToken.Success) {
      const vendedToken = {
        token: token.authToken
      };

      res.status(200).json(vendedToken);
    } else {
      throw new Error('Unable to create auth token');
    }
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
}