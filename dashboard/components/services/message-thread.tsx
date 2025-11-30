'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './message-thread.module.css';

interface Message {
  type: 'user' | 'admin';
  content: string;
  timestamp: string;
  label: string;
}

interface MessageThreadProps {
  messages: Message[];
}

export function MessageThread({ messages }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on mount and when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No hay mensajes en esta conversación.
      </p>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className={`flex flex-col space-y-3 max-h-96 overflow-y-auto p-4 pr-2 scroll-smooth ${styles.scrollContainer}`}
    >
      {messages.map((msg, index) => {
        if (msg.type === 'user') {
          return (
            <div key={`msg-${index}`} className="flex justify-end">
              <div className="max-w-[70%]">
                <div className="flex justify-end items-baseline gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.timestamp), "dd/MM HH:mm", { locale: es })}
                  </span>
                  <span className="font-semibold text-sm">Tú</span>
                </div>
                <div className="p-3 bg-primary text-primary-foreground rounded-lg rounded-br-none shadow-sm">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div key={`msg-${index}`} className="flex justify-start">
              <div className="max-w-[70%]">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-sm">Equipo Minery</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(msg.timestamp), "dd/MM HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="p-3 bg-muted rounded-lg rounded-bl-none shadow-sm">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}