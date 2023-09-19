const { AuthClient, CacheClient, Configurations, CacheGet, CredentialProvider, ExpiresIn, GenerateDisposableToken, TopicRole, AllTopics, CacheRole } = require('@gomomento/sdk');
let authClient;
let cacheClient;

export default async function handler(req, res) {
  try {
    await initializeMomento();

    const userId = req.query.user;    
    const cacheResponse = await cacheClient.get(process.env.NEXT_PUBLIC_CACHE_NAME, `${userId}-token`);
    if (cacheResponse instanceof CacheGet.Hit) {
      res.status(200).json(JSON.parse(cacheResponse.valueString()));
    } else {
      const scope = {
        permissions: [
          {
            role: 'publishsubscribe',
            cache: process.env.NEXT_PUBLIC_CACHE_NAME,
            topic: `${userId}-notifications`
          },
          {
            role: 'readwrite',
            cache: process.env.NEXT_PUBLIC_CACHE_NAME,
            item: {
              keyPrefix: `${userId}-`
            }
          }
        ]
      };

      const token = await authClient.generateDisposableToken(scope, ExpiresIn.minutes(60));      
      if (token instanceof GenerateDisposableToken.Success) {
        const vendedToken = {
          token: token.authToken,
          exp: token.expiresAt.epoch()
        };

        await cacheClient.set(process.env.NEXT_PUBLIC_CACHE_NAME, `${userId}-token`, JSON.stringify(vendedToken));
        res.status(200).json(vendedToken);
      } else {
        throw new Error('Unable to create auth token');
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({message: 'Something went wrong'});
  }
};

const initializeMomento = async () => {
  if (cacheClient && authClient) {
    return;
  }

  cacheClient = await CacheClient.create({
    configuration: Configurations.Laptop.latest(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({ environmentVariableName: 'MOMENTO_API_KEY' }),
    defaultTtlSeconds: 3300    
  });

  authClient = new AuthClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable({ environmentVariableName: 'MOMENTO_API_KEY' }),
  });
};
