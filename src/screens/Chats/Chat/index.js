/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useCallback } from 'react';
import useState from 'react-usestateref';
import { Platform, View, Text, StyleSheet, KeyboardAvoidingView, Alert, Keyboard } from 'react-native';
import { Composer, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import emojiUtils from 'emoji-utils';
import SlackMessage from './SlackMessage';
import _ from 'lodash';
import { requests, url, utils, colors, DEBUG } from 'src/helpers';
import { parseText } from 'src/components/ParsedText';
import schema from 'src/schema';
import { io } from 'socket.io-client';

const socket = io(url.socket, { forceNew: true, secure: true });

export default function Chat(props) {
  // console.log("route.params", props.route.params);
  const { navigation, route, route: { params, params: { room: _room } } } = props;
  const roomId = params?.roomId || 0;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [room, setRoom] = useState(_room || {});
  const [messages, setMessages, messagesRef] = useState([]);
  const [loggedUser] = useState(utils.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputText, setInputText] = useState(route?.params?.inputText || '');
  const [searchText, setSearchText] = useState('');
  const [response, setResonse] = useState({});
  const { nextURL } = response;
  // const searchInput=useRef()
  const query = schema.message;
  const startURL = `${url.chats.message}?room__id=${roomId}&query=${query}&order_by=-id`;
  async function fetchRoom() {
    if (roomId) {
      const link = url.getURL('chats.room', { type: 'detail', item: { id: roomId } });
      const res = await requests.get(link);
      if (res.id) {
        setRoom(res);
      }
      else {
        setError(res);
      }
    }
  }
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    } else {
      Alert.alert('Error Getting Room', JSON.stringify(params), [{ text: 'Dismiss', onPress: navigation.goBack }]);
    }
  }, [roomId]);


  async function markMessageRead(m) {
    const link = url.getURL('chats.message', {
      type: 'detail',
      item: m,
    });
    return await requests.post(`${link}mark_read/`);
  }

  const fetchData = async (link) => {
    // fetch data on refresh or mount
    setLoading(true);
    try {
      const res = await requests.get(link);
      if (res.page === 1) {
        setMessages(res.results);
      } else {
        setMessages([...messages, ...res.results]);
      }
      setResonse({
        nextURL: res.next,
        previousURL: res.previous,
        count: res.count,
      });
      res.results.length > 0 && debounceMarkMessageRead(res.results.slice(-1)[0]);
    } catch (e) {
      Alert.alert('Error Getting Messages', 'Error: ' + JSON.stringify(e.data?.detail || e.message));
    }
    setLoading(false);
  };

  const debounceMarkMessageRead = useCallback(
    _.debounce(
      m => markMessageRead(m),
      800,
      {
        // 'wait': 3000,
        'leading': false,
      }), []);

  useEffect(() => {
    roomId && fetchData(`${startURL}?search=${searchText}`);
  }, [startURL, roomId, searchText]);

  const onLoadEarlier = () => fetchData(nextURL);

  const user = {
    _id: loggedUser?.id,
    id: loggedUser?.id,
    name: loggedUser?.first_name || loggedUser?.email,
    // avatar: null,
  };

  useEffect(() => {
    room.name && navigation.setOptions({
      title: room.display_name || room.name,
    });
  }, [room]);

  // const onRefresh = () => {
  //   setLoading(true);
  //   setTimeout(() => fetchData(startURL), 1000);
  // };

  // const onEndReached = () => {
  //   nextURL && fetchData(nextURL);
  // };

  const sendRemoteMessage = async (msg) => {
    /*
      post message to server and then emit its id to the entire room
    */
    const res = await requests.post(`${url.chats.message}?query=${query}`, msg);
    emitMessages({
      messages: [{
        id: res.id,
        sender: loggedUser.id,
      },
      ],
      room: room?.id,
      // lastMessage:res.id
    });
  };

  const showOnChat = (newMessages) => {
    const prevMessages = messagesRef.current;
    // remove the ones without original ID;  GiftedChat.append(prevMessages, newMessages)
    const results = utils.distinct([...prevMessages, ...newMessages], '_id');
    // console.log("messages.length103", prevMessages.length, "newMessages", newMessages);
    setMessages(
      results
    );
  };

  const onSend = (newMessages = []) => {
    /*[{
    "text": "poa tu",
    "user": {
      "_id": 3,
      "name": "admin2@email.com",
      "avatar": null
    },
    "createdAt": "2021-09-28T19:27:52.188Z",
    "_id": "b842b30d-8fa9-471b-8ce8-dabbc62170c8"
  }]*/
    // console.log("local message", newMessages)
    newMessages.map(m => sendRemoteMessage({
      _id: m._id,
      text: m.text,
      image: m.image,
      video: m.video,
      room: room?.id,
      user: m.user?._id,
      created: m.createdAt,
    }));
    showOnChat(newMessages.map(m => {
      return {
        ...m,
        sent: false,
        received: false,
        pending: true,
      };
    }));

  };
  // socket
  const emitMessages = (_messages) => {
    /*
      this internally retries sending messages
      when successfully reconnected so no hustle
    */
    // console.log("socket is connected ", socket.connected, this.state.loggedUser.username, this.state.room.id)
    socket.emit('messages', _messages);
  };
  useEffect(() => {
    socket.emit('connected', { user: loggedUser.id, room: room?.id });
  }, []);

  useEffect(() => {
    const connectToSocket = () => {
      socket.connect();
    };
    const getRemoteMessage = async ({ id } = {}) => {
      // if already exist do nto query
      if (messagesRef.current.map(m => m.id === id)[0]) {
        DEBUG && console.log('Message alread exists', messagesRef.current.map(m => m.id === id));
        return;
      }
      const link = url.getURL('chats.message', {
        type: 'detail',
        item: { id },
      });
      const message = await requests.get(`${link}?room__id=${room?.id}&query=${query}`);
      if (message.id) {
        showOnChat([message]);
      }
    };

    const onDisconnect = (reason) => {
      DEBUG && console.log('Disconnecting ', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        //console.log("I was forced so reconnecting now")
        connectToSocket();
      } else {
        // else the socket will automatically try to reconnect
        //console.log("Peaceful disconnect")
      }
    };

    const onReconnect = (attempt) => {
      /*
        check for any messages they missed after reconnecting
        :what did I miss? Emit missed messages to this user then
      */
      console.log('on reconnect attempt', attempt);
      // Actions.toast("Reconnected to socket")
    };


    const onConnectionError = (errors) => {
      // Actions.toast(i18n.t("Socket Connection error: %{error}", {error:error.message}))
      // force reconnection
      DEBUG && console.log('connection error', loggedUser?.email, errors);
      connectToSocket();
    };

    const onJoined = (data) => {
      /* {user, room} */
      DEBUG && console.log('User joined', data);
    };


    const onMessages = (receivedMessages) => {
      /*
        Download a message from socket server and show it on the chat
        @receivedMessages: [{"id": 105, "sender": 1}]
      */
      receivedMessages.map(message => {
        getRemoteMessage(message);
      });
      const lastMessage = receivedMessages.slice(-1)[0];
      lastMessage && markMessageRead(lastMessage);
    };
    connectToSocket();
    socket.on('joined', onJoined);
    socket.on('messages', onMessages);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect', onReconnect);
    socket.on('connect_error', onConnectionError);
    //then announce to everyone I am connected
    return () => {
      DEBUG && console.log('Disconnecting for good');
      socket.off('joined', onJoined);
      socket.off('messages', onMessages);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect', onReconnect);
      socket.off('connect_error', onConnectionError);
      socket.disconnect();
    };
  }, []);
  // socket end
  const renderMessage = (_props) => {
    const {
      currentMessage: { text: currText },
    } = _props;
    let messageTextStyle;
    // Make "pure emoji" messages much bigger than plain text.
    if (currText && emojiUtils.isPureEmojiString(currText)) {
      messageTextStyle = {
        fontSize: 28,
        // Emoji get clipped if lineHeight isn't increased; make it consistent across platforms.
        lineHeight: Platform.OS === 'android' ? 34 : 30,
      };
    }
    return <SlackMessage {..._props} messageTextStyle={messageTextStyle} />;
  };

  return (
    <View style={style.root}>
      <GiftedChat
        // style={style.root}
        messages={messages}
        onSend={onSend}
        user={user}
        renderMessage={(room.category !== 'private') ? renderMessage : undefined}
        //extra settings
        touchableProps={{
          activeOpacity: 0.7, //default is 0.2
        }}
        keyboardShouldPersistTaps={'never'}
        // renderChatEmpty={() => <View style={style.center}>
        //   <Text style={style.emptyChat}>Be the first to say hello</Text>
        // </View>}
        // renderAccessory={this.renderAccessory}
        // renderChatFooter={this.renderChatFooter}
        // renderFooter={() => <Text style={{ marginLeft: 20, color: colors.primary }}>Giki is tryping...</Text>}
        // customization
        inverted={false}
        isLoadingEarlier={loading}
        showAvatarForEveryMessage={true}
        //only show load earlier link if next link is valid
        loadEarlier={!!nextURL || loading}
        onLoadEarlier={onLoadEarlier}
        infiniteScroll={!loading}
        parsePatterns={(linkStyle) => parseText}
        // placeholder={i18n.t("Type a message")}
        text={inputText}
        onInputTextChanged={text => {
          !loading && setInputText(text);
        }}
        sendButtonProps={{ style: style.sendContainer }}
        renderInputToolbar={(_props) => <InputToolbar {..._props} containerStyle={style.inputContainer} />}
        renderComposer={(_props) => <Composer {..._props}
          composerHeight={75}
          textInputStyle={style.textInputStyle}
        />}
        isTyping={false}
        isKeyboardInternallyHandled={true}
        textInputProps={{
          onFocus: () => setIsKeyboardVisible(true),
          onBlur: () => setIsKeyboardVisible(false),
        }}
      />
      {Platform.OS === 'android' && isKeyboardVisible && <KeyboardAvoidingView style={style.avoidView} behavior="padding" keyboardVerticalOffset={80} />}
    </View>
  );
}

const style = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  avoidView: { minHeight: 180 },
  center: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  emptyChat: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingTop: '40%',
    // color:colors.grey
  },
  textInputStyle: { backgroundColor: colors.backgroundColor2, borderRadius: 20, paddingLeft: 10 },
  sendContainer: { paddingBottom: 20 },
  inputContainer: { borderTopWidth: 0, marginRight: 10 },
});
