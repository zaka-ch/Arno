import { ChatWindow } from "@/components/chat/chat-window";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arno — Chat",
};

export default function ChatPage() {
  return <ChatWindow />;
}
