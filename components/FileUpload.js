import React, { useState } from 'react';
import { Input, Label, Button, Flex, TextField, Text } from '@aws-amplify/ui-react';
import { CollectionTtl } from '@gomomento/sdk-web';

const FileUpload = ({ cacheClient, userId, refresh }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileErrorMessage, setFileErrorMessage] = useState(null);
  const [ttl, setTtl] = useState('');
  const [ttlErrorMessage, setTtlErrorMessage] = useState(null);

  const handleFileChange = (event) => {
    const chosenFile = event.target.files[0];
    if (chosenFile && chosenFile.size <= 1000000) { // 1MB in bytes
      setFile(chosenFile);
      setFileErrorMessage('');
    } else {
      setFileErrorMessage('File size should be less than 1MB.');
    }
  };

  const handleTtlChange = (event) => {
    const newTtl = event.target.value;
    if (newTtl > 1440) {
      setTtlErrorMessage('Retention minutes cannot be creater than 1440 (24 hours)');
    } else {
      setTtlErrorMessage('');
    }
    setTtl(newTtl)
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file && fileName && ttl) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = btoa(
          new Uint8Array(event.target.result)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        const fileData = {
          content: base64Image,
          type: file.type,
          expiresAt: new Date(Date.now() + ttl * 60000).toISOString()
        }
        let r = await cacheClient.dictionarySetFields(`${userId}-${fileName}`, fileData, { ttl: new CollectionTtl(ttl * 60) });
        console.log(r)
        r = await cacheClient.setAddElement(`${userId}-list`, fileName);
        console.log(r);

        setFile('');
        setFileName('');
        refresh();
      }

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <Flex direction="column">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap=".5em">
          <Flex direction="column" gap=".2em">
            <label htmlFor="file_picker">Select a file (Max: 1MB)</label>
            <input id="file_picker" type="file" onChange={handleFileChange} />
            {fileErrorMessage && <Text color="red" fontStyle="italic">{fileErrorMessage}</Text>}
          </Flex>
          <TextField
            id="file_name"
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            required
            size="small"
          />
          <Flex direction="column" gap=".2em" width="fit-content">
            <label htmlFor="ttl_field">Set retention minutes (Max: 24 hours)</label>
            <input id="ttl_field" type="number" value={ttl} onChange={handleTtlChange} />
            {ttlErrorMessage && <Text color="red" fontStyle="italic" fontSize=".9rem">{ttlErrorMessage}</Text>}
          </Flex>
          <Button type="submit" variation="primary" width="25%" minWidth="5em">Upload</Button>
        </Flex>
      </form>
    </Flex>
  );
};

export default FileUpload;
