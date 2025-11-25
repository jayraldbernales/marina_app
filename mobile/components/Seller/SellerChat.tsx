import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, router } from "expo-router";
import { COLORS } from "../../constants";
import { chatStyles } from "../styles/chatStyles";

type Message = {
  id: string;
  text: string;
  isOwn: boolean;
  timestamp: string;
};

type Conversation = {
  id: string;
  customerName: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
};

const mockConversations: Conversation[] = [
  {
    id: "1",
    customerName: "John Doe",
    lastMessage: "Thanks for the delivery!",
    timestamp: "Today",
    unreadCount: 0,
  },
  {
    id: "2",
    customerName: "Jane Smith",
    lastMessage: "When will it arrive?",
    timestamp: "Yesterday",
    unreadCount: 3,
  },
  {
    id: "3",
    customerName: "Mike Johnson",
    lastMessage: "Issue with the order.",
    timestamp: "2 days ago",
    unreadCount: 1,
  },
  {
    id: "4",
    customerName: "Sarah Wilson",
    lastMessage: "Great service!",
    timestamp: "Today",
    unreadCount: 0,
  },
];

const mockMessages: { [key: string]: Message[] } = {
  "1": [
    {
      id: "1-1",
      text: "Hi! Thanks for the quick delivery.",
      isOwn: false,
      timestamp: "10:30 AM",
    },
    {
      id: "1-2",
      text: "You're welcome! Glad it arrived safely.",
      isOwn: true,
      timestamp: "10:31 AM",
    },
  ],
  "2": [
    {
      id: "2-1",
      text: "Hi! I have a question about my delivery.",
      isOwn: false,
      timestamp: "9:15 AM",
    },
    {
      id: "2-2",
      text: "What's the estimated arrival time?",
      isOwn: false,
      timestamp: "9:16 AM",
    },
    {
      id: "2-3",
      text: "It should arrive within 30 minutes.",
      isOwn: true,
      timestamp: "9:17 AM",
    },
  ],
  "3": [
    {
      id: "3-1",
      text: "There was a problem with the packaging.",
      isOwn: false,
      timestamp: "8:45 AM",
    },
  ],
  "4": [
    {
      id: "4-1",
      text: "Excellent job as always!",
      isOwn: false,
      timestamp: "11:20 AM",
    },
    {
      id: "4-2",
      text: "Thank you! Happy to help.",
      isOwn: true,
      timestamp: "11:21 AM",
    },
  ],
};

const ChatSeller = () => {
  const [view, setView] = useState<"list" | "chat">("list");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState(mockConversations);
  const scrollViewRef = useRef<ScrollView>(null);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (view === "chat") {
      scrollToBottom();
    }
  }, [messages, view]);

  const handleSend = () => {
    if (inputText.trim() && currentChatId) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isOwn: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), newMessage],
      }));
      setInputText("");
    }
  };

  const handleSelectConversation = (id: string) => {
    setCurrentChatId(id);
    setView("chat");
  };

  const currentMessages = currentChatId ? messages[currentChatId] || [] : [];
  const currentConversation = conversations.find((c) => c.id === currentChatId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.light.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={chatStyles.headerBar}>
          <TouchableOpacity
            onPress={() =>
              view === "chat" ? setView("list") : router.push("/(seller-tabs)")
            }
            style={chatStyles.headerBackBtn}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.light.primary}
            />
          </TouchableOpacity>
          <Text style={chatStyles.headerTitle}>
            {view === "list"
              ? "Seller Messages"
              : currentConversation?.customerName || "Chat"}
          </Text>
          {view === "chat" && (
            <TouchableOpacity>
              <Ionicons
                name="call-outline"
                size={24}
                color={COLORS.light.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        {view === "list" ? (
          <View style={{ flex: 1 }}>
            {/* Search Bar */}
            <View style={chatStyles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORS.light.oceanMedium}
                style={chatStyles.searchIcon}
              />
              <TextInput
                style={chatStyles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search messages..."
                placeholderTextColor={COLORS.light.oceanMedium}
              />
            </View>
            {/* Conversations List */}
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={chatStyles.conversationItem}
                  onPress={() => handleSelectConversation(item.id)}
                >
                  <View style={chatStyles.conversationAvatar}>
                    <Text style={chatStyles.avatarText}>
                      {item.customerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={chatStyles.conversationDetails}>
                    <Text style={chatStyles.conversationName}>
                      {item.customerName}
                    </Text>
                    <Text
                      style={chatStyles.conversationLastMessage}
                      numberOfLines={1}
                    >
                      {item.lastMessage}
                    </Text>
                  </View>
                  <View style={chatStyles.conversationMeta}>
                    <Text style={chatStyles.conversationTimestamp}>
                      {item.timestamp}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={chatStyles.unreadBadge}>
                        <Text style={chatStyles.unreadText}>
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={chatStyles.listContainer}
            />
          </View>
        ) : (
          <>
            {/* Messages List */}
            <ScrollView
              ref={scrollViewRef}
              style={chatStyles.messagesContainer}
              contentContainerStyle={chatStyles.messagesContent}
            >
              {currentMessages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    chatStyles.messageContainer,
                    message.isOwn
                      ? chatStyles.ownMessageContainer
                      : chatStyles.otherMessageContainer,
                  ]}
                >
                  <View
                    style={[
                      chatStyles.messageBubble,
                      message.isOwn
                        ? chatStyles.ownMessageBubble
                        : chatStyles.otherMessageBubble,
                    ]}
                  >
                    <Text
                      style={[
                        chatStyles.messageText,
                        message.isOwn
                          ? chatStyles.ownMessageText
                          : chatStyles.otherMessageText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text style={chatStyles.timestamp}>
                      {message.timestamp}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            {/* Input Area */}
            <View style={chatStyles.inputContainer}>
              <TextInput
                style={chatStyles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                multiline
                placeholderTextColor={COLORS.light.oceanMedium}
              />
              <TouchableOpacity
                style={[
                  chatStyles.sendButton,
                  !inputText.trim() && chatStyles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    inputText.trim()
                      ? COLORS.common.white
                      : COLORS.light.oceanMedium
                  }
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatSeller;
