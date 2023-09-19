import { Card, Flex, Heading, Image, Text, TextField, Button } from '@aws-amplify/ui-react';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import { Menu, Item, Separator, useContextMenu } from 'react-contexify'
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
const OPTIONS = 'optionsmenu';

const Document = ({ data, userId, cacheClient, refresh }) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [ttl, setTtl] = useState('');
  const [ttlErrorMessage, setTtlErrorMessage] = useState(null);
  const [closeButtonLabel, setCloseButtonLabel] = useState('Cancel');
  const [link, setLink] = useState('');

  const menuId = `${OPTIONS}-${data.name}`;
  const { show } = useContextMenu({ id: menuId });

  useEffect(() => {
    if (isPopupVisible) {
      let minutes = Math.floor(((new Date(data.expiresAt) - new Date()) / (1000 * 60)));
      if(minutes > 60){
        minutes = 60;
      }
      setTimeLeft(minutes);
      setTtl(minutes - 1);
      setCloseButtonLabel('Cancel');
    }

  }, [isPopupVisible])

  const handleContextMenu = (event) => {
    event.stopPropagation();
    show({ event });
  };

  const onDelete = async (documentName) => {
    await cacheClient.setRemoveElement(`${userId}-list`, documentName);
    await cacheClient.delete(`${userId}-${documentName}`);
    refresh();
  };

  const getShareLink = async (documentName) => {
    const response = await fetch(`/api/documents/${documentName}/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ttl,
        userId
      })
    });
    const data = await response.json();
    if (response.status > 200) {
      console.log(data)
      toast.error('Something went wrong sharing your document', { position: 'top-right', autoClose: 5000, draggable: false, hideProgressBar: true, theme: 'colored' })
    } else {
      const url = encodeURI(`${process.env.NEXT_PUBLIC_DOMAIN_NAME}/documents/${documentName}?token=${data.token}&userId=${userId}`);
      setLink(url);
      setCloseButtonLabel('Close');
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success('Share link copied to clipboard', { position: 'top-right', autoClose: 5000, draggable: false, hideProgressBar: true, theme: 'colored' })
      }
    }
  };

  const handleTtlChange = (event) => {
    const newTtl = event.target.value;
    if (newTtl > timeLeft) {
      setTtlErrorMessage(`You cannot grant access longer than ${timeLeft} minutes!`);
    } else {
      setTtlErrorMessage('');
    }
    setTtl(newTtl)
  }

  return (
    <>
      <Card ariation="elevated" borderRadius="large" paddingRight="relative.xs">
        <Flex direction="row" gap=".1em" height="100%">
          <Flex direction="column" justifyContent="flex-end" gap=".5em">
            {data.type.startsWith('image') && (
              <Image src={`data:${data.type};base64,${data.content}`} maxHeight={"12em"} maxWidth={"12em"} height="auto" width="auto" />
            )}
            <Text fontWeight="bold">{data.name}</Text>
            <Text>Valid until {new Date(data.expiresAt).toLocaleTimeString()}</Text>
          </Flex>
          <BiDotsVerticalRounded size="20" style={{ cursor: 'pointer' }} onClick={handleContextMenu} />
          <Menu id={menuId}>
            <Item id="share" onClick={() => setIsPopupVisible(true)}>Share</Item>
            <Separator />
            <Item id="delete" onClick={onDelete.bind(null, data.name)}>Delete</Item>
          </Menu>
        </Flex>
      </Card>
      {isPopupVisible && (
        <Card variation="outlined" boxShadow="large" borderRadius='large' width="80%" position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" style={{ zIndex: 1000 }}>
          <Flex direction="column" width="100%" justifyContent="center">
            <Heading level={4}>Generate Share Link</Heading>
            <Text>Share <i>{data.name}</i> with anyone for the next <b>{timeLeft} minutes</b>.</Text>
            <Text>Anyone who has the link will have access.</Text>
            <Flex direction="column">
              <label htmlFor="ttl_field">Grant access for long?</label>
              <input id="ttl_field" type="number" value={ttl} onChange={handleTtlChange} placeholder='Time in minutes' />
              {ttlErrorMessage && <Text color="red" fontStyle="italic" fontSize=".9rem">{ttlErrorMessage}</Text>}
            </Flex>
            <TextField value={link} label="Share link" size="small" />
            <Flex direction="row" justifyContent="space-between">
              <Button variation="warning" onClick={() => setIsPopupVisible(false)}>{closeButtonLabel}</Button>
              <Button variation="primary" isDisabled={link} onClick={getShareLink.bind(null, data.name)}>Get Link</Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </>
  )
};

export default Document;