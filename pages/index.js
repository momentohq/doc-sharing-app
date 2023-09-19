import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Flex, Card, Heading, Divider, Text } from '@aws-amplify/ui-react';
import { CacheClient, CredentialProvider, Configurations, CacheSetFetch, CacheDictionaryFetch } from '@gomomento/sdk-web';
import Head from 'next/head';
import { getUserDetail } from '../utils/Device';
import FileUpload from '../components/FileUpload';
import Document from '../components/Document';
import { getToken } from '../utils/Auth';
import { toast } from 'react-toastify';


const Home = () => {
	const router = useRouter();
	const [user, setUser] = useState('');
	const [cacheClient, setCacheClient] = useState(null);
	const [docList, setDocList] = useState([]);
	const [documents, setDocuments] = useState([]);

	useEffect(() => {
		const user = getUserDetail();
		if (!user?.username) {
			router.push(`/profile?redirect=/`);
		} else {
			setUser(user);
		}
	}, []);

	useEffect(() => {
		async function initializeCacheClient() {
			const authToken = await getToken();
			const newCacheClient = new CacheClient({
				credentialProvider: CredentialProvider.fromString({ authToken }),
				configuration: Configurations.Browser.latest(),
				defaultTtlSeconds: 3600
			});

			const tempCacheClient = newCacheClient.cache(process.env.NEXT_PUBLIC_CACHE_NAME);
			setCacheClient(tempCacheClient);

			const response = await tempCacheClient.setFetch(`${user.id}-list`);
			if (response instanceof CacheSetFetch.Hit) {
				const docs = response.value();
				setDocList(docs);
			}
			tempCacheClient.setAddElement(`${user.id}#${user.username}`);
		}

		if (user) {
			initializeCacheClient();
		}
	}, [user]);

	useEffect(() => {
		async function loadDocs() {
			const docsToRemove = [];
			const docs = [];
			for (const doc of docList) {
				const response = await cacheClient.dictionaryFetch(`${user.id}-${doc}`);
				if (response instanceof CacheDictionaryFetch.Hit) {
					docs.push({ ...response.value(), name: doc });
				} else {
					docsToRemove.push(doc);
				}
			}

			setDocuments(docs);
			if (docsToRemove.length) {
				await cacheClient.setRemoveElements(`${user.id}-list`, docsToRemove);
			}
		}

		loadDocs();
	}, [docList]);


	const refresh = async () => {
		let docs = [];
		const response = await cacheClient.setFetch(`${user.id}-list`);
		if (response instanceof CacheSetFetch.Hit) {
			docs = response.value();
		} else if (response instanceof CacheSetFetch.Error) {
			toast.error('Could not load your documents. Please try refreshing.', { position: 'top-right', autoClose: 5000, draggable: false, hideProgressBar: true, theme: 'colored' });
		}

		setDocList(docs);
	};

	return (
		<>
			<Head>
				<title>Momento Doc Sharing</title>
			</Head>
			<Flex direction="column" width="100%" alignItems="center" height="90vh">
				<Card variation="elevated" borderRadius="large" padding="1.5em 3em" maxWidth="90%" marginTop="1em">
					<Flex direction="column" gap="1em">
						<Heading level={4}>Upload some files</Heading>
						<Text>Do you have some files you need to store temporarily and share with your friends? Cool! Try it here.</Text>
					</Flex>
					<Divider orientation="horizontal" marginTop={"1.5em"} marginBottom={"1.5em"} />
					<FileUpload cacheClient={cacheClient} userId={user.id} refresh={refresh} />
				</Card>
				<Flex direction="row" wrap="wrap">
					{documents.map(document => (
						<Document data={document} userId={user.id} cacheClient={cacheClient} refresh={refresh} key={document.name} />
					))}
				</Flex>
			</Flex>
		</>
	);
};

export default Home;