import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Pusher from 'pusher-js';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import config from "./config";


const API_URL = config.apiBaseUrl;

const App = () => {
  const [message, setMessage] = useState('');
  const [sendId, setSendId] = useState('');
  const [searchId, setSearchId] = useState('');
  const [isSending, setIsSending] = useState(false);

  const MESSAGE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minute in milliseconds

  // Memoize the function to avoid unnecessary re-renders
  const isMessageExpired = useCallback((timestamp) => {
    return (Date.now() - timestamp) >= MESSAGE_EXPIRATION_TIME;
  }, [MESSAGE_EXPIRATION_TIME]);

  // Remove expired messages from localStorage
  const removeExpiredMessages = useCallback(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));

    localStorage.setItem('messages', JSON.stringify(validMessages));
  }, [isMessageExpired]);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
    const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));

    localStorage.setItem('messages', JSON.stringify(validMessages));

    const pusher = new Pusher('673ad43ec9062d1735b2', {
      cluster: 'ap2',
    });

    const channel = pusher.subscribe('my-channel');

    channel.bind('my-event', (data) => {
      // Add timestamp when the message is received, not during sending
      const newMessage = { ...data, timestamp: Date.now() };

      // Update local storage with the updated messages array
      const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
      const existingMessageIndex = storedMessages.findIndex((msg) => msg.id === data.id);
      let updatedMessages;

      if (existingMessageIndex !== -1) {
        // If the message with the same ID exists, replace it
        updatedMessages = [...storedMessages];
        updatedMessages[existingMessageIndex] = newMessage;
      } else {
        // If no message with the same ID exists, add it as a new entry
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
    if (!msg || msg.trim().length === 0) {
      return 'Message cannot be empty.';
    }
    return null;
  };

  const validateId = (id) => {
    if (!id || id.trim().length === 0) {
      return 'ID cannot be empty.';
    }
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
      return 'ID must be alphanumeric.';
    }
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
      // First, check if the message is available in localStorage
      const storedMessages = JSON.parse(localStorage.getItem('messages')) || [];
      const validMessages = storedMessages.filter(msg => !isMessageExpired(msg.timestamp));

      const messageToFetch = validMessages.find((msg) => msg.id === searchId);

      if (messageToFetch) {
        // If the message exists in localStorage and is valid
        setMessage(messageToFetch.message);
        notify('Message retrieved from localStorage successfully!');
      } else {
        // If the message is not in localStorage, make an API call to fetch it from the server
        const response = await axios.get(`${API_URL}/messages/${searchId}`);

        if (response.data && response.data[0].message) {
          const fetchedMessage = response.data[0].message;

          // Save it in localStorage with a timestamp
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
      console.error('Error fetching message:', error);
      notify('Failed to retrieve message. Please try again.');
    }
  };


  const copyToClipboard = () => {
    if (message) {
      // Check if the Clipboard API is supported
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message)
          .then(() => {
            notify('Message copied to clipboard!');
          })
          .catch((error) => {
            console.error('Could not copy text: ', error);
            notify('Failed to copy message, falling back to older method.');
            fallbackCopyToClipboard(message);
          });
      } else {
        console.error('Clipboard API not supported, using fallback method.');
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
      console.error('Fallback: Could not copy text: ', error);
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
            <label>NOTE:<span style={{ color: 'red', fontSize: '12px' }}>* The message will be deleted in 5 min</span></label>
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

    </div>
  );
};

export default App;
