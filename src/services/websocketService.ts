import { create } from 'zustand';
import { useQueryClient } from 'react-query';
import { useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useRef } from 'react';
import { WebSocketState, TradeNotification } from '../types/trading';

// Get the WebSocket URL from environment variables, defaulting to the current host if not set
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:4000/ws`;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const RECONNECT_BASE_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
    socket: null,
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    heartbeatInterval: undefined,
    connectionTimeout: null as ReturnType<typeof setTimeout> | null,

    connect: () => {
        const { socket, heartbeatInterval, connectionTimeout } = get();
        
        // If we already have a socket that's connecting or connected, don't create a new one
        if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
            return;
        }

        // Clear existing intervals if any
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (connectionTimeout) clearTimeout(connectionTimeout);

        try {
            console.log(`Connecting to WebSocket at ${WS_URL}`);
            const ws = new WebSocket(WS_URL);
            
            // Set connection timeout
            const timeout = setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    console.log('WebSocket connection timeout');
                    ws.close();
                }
            }, CONNECTION_TIMEOUT);

            set({ socket: ws });

            // Don't set up handlers here - they will be set up in the useWebSocket hook
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            set({ socket: null, isConnected: false });
        }
    },

    disconnect: () => {
        const { socket, heartbeatInterval } = get();
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (socket) {
            socket.close();
            set({ socket: null, isConnected: false, heartbeatInterval: undefined });
        }
    }
}));

export function useWebSocket() {
    const queryClient = useQueryClient();
    const toast = useToast();
    const reconnectAttemptsRef = useRef(0);
    const socketRef = useRef<WebSocket | null>(null);

    const handleTradeNotification = useCallback((notification: TradeNotification) => {
        queryClient.invalidateQueries(['orders']);
        
        toast({
            title: 'Trade Executed',
            description: `${notification.trade.symbol}: ${notification.trade.quantity} shares @ $${notification.trade.price}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
            position: 'top-right',
        });
    }, [queryClient, toast]);

    useEffect(() => {
        if (socketRef.current) return;

        const setupSocket = () => {
            try {
                const ws = new WebSocket(WS_URL);
                socketRef.current = ws;

                ws.onopen = () => {
                    console.log('WebSocket connection established');
                    useWebSocketStore.setState({ isConnected: true });
                    reconnectAttemptsRef.current = 0;

                    // Set up heartbeat
                    const heartbeat = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'heartbeat' }));
                        }
                    }, HEARTBEAT_INTERVAL);
                    useWebSocketStore.setState({ heartbeatInterval: heartbeat as unknown as number });
                };

                ws.onmessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'pong') return;
                        handleTradeNotification(data as TradeNotification);
                    } catch (error) {
                        console.error('Error processing WebSocket message:', error);
                    }
                };

                ws.onclose = (event: CloseEvent) => {
                    console.log('WebSocket closed:', event.code, event.reason);
                    const { heartbeatInterval } = useWebSocketStore.getState();
                    
                    if (heartbeatInterval) {
                        clearInterval(heartbeatInterval);
                    }
                    
                    useWebSocketStore.setState({ 
                        isConnected: false, 
                        heartbeatInterval: undefined 
                    });
                    socketRef.current = null;
                    
                    if (event.code !== 1000) {
                        console.log('Abnormal WebSocket closure, attempting reconnect...');
                        if (reconnectAttemptsRef.current < 5) {
                            const delay = Math.min(
                                RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptsRef.current),
                                MAX_RECONNECT_DELAY
                            );
                            reconnectAttemptsRef.current += 1;
                            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/5)`);
                            setTimeout(setupSocket, delay);
                        } else {
                            console.error('Failed to reconnect: Max reconnection attempts reached');
                            toast({
                                title: 'Connection Lost',
                                description: 'Unable to reconnect to server. Please refresh the page.',
                                status: 'error',
                                duration: null,
                                isClosable: true,
                            });
                        }
                    }
                };

                ws.onerror = (error: Event) => {
                    console.error('WebSocket error:', error);
                };

            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                socketRef.current = null;
                useWebSocketStore.setState({ isConnected: false });
            }
        };

        setupSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            const { heartbeatInterval } = useWebSocketStore.getState();
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
            }
            useWebSocketStore.setState({ 
                isConnected: false, 
                heartbeatInterval: undefined 
            });
            reconnectAttemptsRef.current = 0;
        };
    }, [handleTradeNotification, toast]);

    return useWebSocketStore((state) => state.isConnected);
} 