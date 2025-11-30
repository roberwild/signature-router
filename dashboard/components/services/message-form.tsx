'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Textarea } from '@workspace/ui/components/textarea';
import { Label } from '@workspace/ui/components/label';
import { addUserMessage } from '~/actions/services/add-user-message';
import { toast } from 'sonner';

interface MessageFormProps {
  requestId: string;
  onMessageSent?: () => void;
}

export function MessageForm({ requestId, onMessageSent }: MessageFormProps) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const messageToSend = message;
    setMessage(''); // Clear input immediately for better UX
    
    startTransition(async () => {
      try {
        await addUserMessage(requestId, messageToSend);
        toast.success('Mensaje enviado correctamente');
        onMessageSent?.();
      } catch (_error) {
        toast.error('Error al enviar el mensaje');
        setMessage(messageToSend); // Restore message on error
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="message">Tu mensaje</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            rows={4}
            className="mt-1"
            required
            disabled={isPending}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isPending || !message.trim()}
        >
          {isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar Mensaje
            </>
          )}
        </Button>
      </div>
    </form>
  );
}