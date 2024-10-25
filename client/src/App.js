import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import config from './config';

const API_URL = config.apiBaseUrl;

const App = () => {
  const [message, setMessage] = useState('');
  const [sendId, setSendId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const MESSAGE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

  const isMessageExpired = useCallback((timestamp) => {
    return Date.now() - timestamp >= MESSAGE_EXPIRATION_TIME;
  }, [MESSAGE_EXPIRATION_TIME]);

  const removeExpiredMessages = useCallback(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));
    localStorage.setItem('messages', JSON.stringify(validMessages));
  }, [isMessageExpired]);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));
    localStorage.setItem('messages', JSON.stringify(validMessages));

    const pusher = new Pusher('673ad43ec9062d1735b2', { cluster: 'ap2' });
    const channel = pusher.subscribe('my-channel');

    channel.bind('my-event', (data) => {
      const newMessage = { ...data, timestamp: Date.now() };
      const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
      const existingMessageIndex = storedMessages.findIndex((msg) => msg.id === data.id);
      let updatedMessages;

      if (existingMessageIndex !== -1) {
        updatedMessages = [...storedMessages];
        updatedMessages[existingMessageIndex] = newMessage;
      } else {
        updatedMessages = [...storedMessages, newMessage];
      }

      localStorage.setItem('messages', JSON.stringify(updatedMessages));
    });

    const interval = setInterval(() => {
      removeExpiredMessages();
    }, 60000);

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [isMessageExpired, removeExpiredMessages]);

  const validateMessage = (msg) => {
    if (!msg || msg.trim().length === 0) return 'Message cannot be empty.';
    return null;
  };

  const validateId = (id) => {
    if (!id || id.trim().length === 0) return 'ID cannot be empty.';
    if (!/^[a-zA-Z0-9]+$/.test(id)) return 'ID must be alphanumeric.';
    return null;
  };

  const notify = (message) => toast.dark(message);

  const sendMessage = async () => {
    const messageError = validateMessage(message);
    const idError = validateId(sendId);

    if (messageError || idError) {
      notify(messageError || idError);
      return;
    }

    setIsSending(true);

    try {
      await axios.post(`${API_URL}/trigger-message`, { message, id: sendId });
      notify(`Message sent with ID: ${sendId}`);
      setMessage('');
      setSendId('');
    } catch (error) {
      notify('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const searchMessage = async () => {
    const idError = validateId(searchId);

    if (idError) {
      notify(idError);
      return;
    }

    try {
      const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
      const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));
      const messageToFetch = validMessages.find((msg) => msg.id === searchId);

      if (messageToFetch) {
        setMessage(messageToFetch.message);
        notify('Message retrieved from localStorage successfully!');
      } else {
        const response = await axios.get(`${API_URL}/messages/${searchId}`);
        if (response.data && response.data[0].message) {
          const fetchedMessage = response.data[0].message;
          const newMessage = { message: fetchedMessage, id: searchId, timestamp: Date.now() };
          const updatedMessages = [...validMessages, newMessage];
          localStorage.setItem('messages', JSON.stringify(updatedMessages));
          setMessage(fetchedMessage);
          notify('Message retrieved from the server successfully!');
        } else {
          setMessage('');
          notify('Message not found on the server.');
        }
      }
    } catch (error) {
      notify('Failed to retrieve message. Please try again.');
    }
  };

  const copyToClipboard = () => {
    if (message) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message)
          .then(() => notify('Message copied to clipboard!'))
          .catch(() => fallbackCopyToClipboard(message));
      } else {
        fallbackCopyToClipboard(message);
      } 
    } else {
      notify('No message to copy!');
    }
  };

  const fallbackCopyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      notify('Message copied to clipboard using fallback method!');
    } catch (error) {
      notify('Failed to copy message using fallback method.');
    }
    document.body.removeChild(textarea);
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-center" />
      <h1 className="app-title">Real-Time Messenger</h1>
  
      <div className="top-section">
        <div className="search-id">
          <label>Search ID</label>
          <input
            type="text"
            placeholder="Enter ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <button onClick={searchMessage} className="search-button">Search</button>
        </div>
  
        <div className="create-id">
          <label>Create ID</label>
          <input
            type="text"
            placeholder="Enter ID"
            value={sendId}
            onChange={(e) => setSendId(e.target.value)}
          />
          <button onClick={sendMessage} className="send-button" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
  
      <div className="message-section">
        <div className="note-section">
          <div className="note-rule">
            <label>NOTE: <span style={{ color: 'red', fontSize: '12px' }}>* The message will be deleted in 5 min</span></label>
          </div>
          <div className="note-button">
            <button onClick={copyToClipboard} className="copy-button">Copy</button>
          </div>
        </div>
        <textarea
          placeholder="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="code-textarea"
        />
      </div>
  
      {/* Google AdSense Ad */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
        <div className="adsense-container">
          <ins className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '90px' }}
            data-ad-client="ca-pub-2993063833837423"
            data-ad-slot="9071445971"
            data-ad-format="auto"
            data-full-width-responsive="true"></ins>
        </div>
      </div>
    </div>
  );
  

};

export default App;
