import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Text, Image, Link, Loader } from '@aws-amplify/ui-react';
import { CacheClient, CredentialProvider, Configurations, CacheSetFetch, CacheDictionaryFetch } from '@gomomento/sdk-web';
import Head from 'next/head';


const DocPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [document, setDocument] = useState(null)

  useEffect(() => {
    async function loadDocument(token, userId, name) {
      const cacheClient = new CacheClient({
        credentialProvider: CredentialProvider.fromString({ authToken: router.query.token }),
        configuration: Configurations.Browser.latest(),
        defaultTtlSeconds: 3600
      });

      const response = await cacheClient.dictionaryFetch(process.env.NEXT_PUBLIC_CACHE_NAME, `${userId}-${name}`);
      if (response instanceof CacheDictionaryFetch.Hit) {
        setDocument(response.value());
        setIsAuthenticated(true);
      }

      setIsLoading(false);
    }

    if (router.query.token && router.query.userId) {
      loadDocument(router.query.token, router.query.userId, router.query.name);
    } else {
      setIsLoading(false);
    }
  }, [router.query]);

  return (
    <>
      <Head>
        <title>{isAuthenticated ? 'View Document | Momento' : 'Unauthorized'}</title>
      </Head>
      {isLoading ?
        <Loader variation="linear" />
        :
        <Flex direction="column" width="100%" alignItems="center">
          {isAuthenticated ?
            <>
              <Flex direction="column" justifyContent="flex-end" gap=".5em">
                {document.type.startsWith('image') && (
                  <Image src={`data:${document.type};base64,${document.content}`} borderRadius="medium" boxShadow="large" maxHeight={"60em"} maxWidth={"60em"} height="auto" width="auto" />
                )}
                <Card variation="elevated" borderRadius="medium">
                  <Text fontWeight="bold">{router.query.name}</Text>
                  <Text>Valid until {new Date(document.expiresAt).toLocaleTimeString()}</Text>
                </Card>
              </Flex>
            </>
            :
            <Flex direction="column" justifyContent="center" alignItems="center" height="90vh">
              <Card variation="elevated" borderRadius="large" padding="1.5em 3em" maxWidth="90%" marginTop="1em">
                <Flex direction="column" alignItems="center" textAlign="center" gap="1em">
                  <Heading level={4}>STOP RIGHT THERE!</Heading>
                  <Text>You aren't allowed to view this document.</Text>
                  <Image src="/stop.png" width="20em" height="auto" />
                  <Link href="/">Go back</Link>
                </Flex>
              </Card>
            </Flex>
          }
        </Flex>
      }
    </>
  );
};

export default DocPage;

