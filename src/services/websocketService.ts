import { create } from 'zustand';
import { useQueryClient } from 'react-query';
import { useToast } from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WebSocketState, TradeNotification } from '../types/trading';

// Get the WebSocket URL from environment variables, defaulting to the current host if not set
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:4000/ws`;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const RECONNECT_BASE_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 90000; // 90 seconds

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
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            // Create WebSocket with auth token
            const ws = new WebSocket(WS_URL, ['trading-protocol']);
            
            // Add authorization header to the first message
            ws.onopen = function(this: WebSocket) {
                console.log('WebSocket connection established');
                useWebSocketStore.setState({ 
                    isConnected: true,
                    reconnectAttempts: 0
                });

                // Send authorization
                this.send(JSON.stringify({
                    type: 'auth',
                    token: token
                }));

                // Set up heartbeat
                const heartbeat = setInterval(() => {
                    if (this.readyState === WebSocket.OPEN) {
                        this.send(JSON.stringify({ type: 'heartbeat' }));
                    }
                }, HEARTBEAT_INTERVAL);
                useWebSocketStore.setState({ heartbeatInterval: heartbeat as unknown as number });
            };
            
            // Set connection timeout
            const timeout = setTimeout(() => {
                if (ws.readyState === WebSocket.CONNECTING) {
                    console.log('WebSocket connection timeout');
                    ws.close();
                }
            }, CONNECTION_TIMEOUT);

            set({ socket: ws, connectionTimeout: timeout });

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            set({ socket: null, isConnected: false });
        }
    },

    disconnect: () => {
        const { socket, heartbeatInterval, connectionTimeout } = get();
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (connectionTimeout) clearTimeout(connectionTimeout);
        if (socket) {
            socket.close();
            set({ 
                socket: null, 
                isConnected: false, 
                heartbeatInterval: undefined,
                connectionTimeout: null 
            });
        }
    }
}));

export const useWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const socket = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const queryClient = useQueryClient();
    const toast = useToast();

    const connect = useCallback(() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No authentication token found');
                return;
            }

            const ws = new WebSocket(WS_URL);
            
            ws.onopen = () => {
                console.log('WebSocket connected');
                // Send authentication immediately after connection
                ws.send(JSON.stringify({ type: 'auth', token }));
                setIsConnected(true);
                reconnectAttempts.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'trade') {
                        // Invalidate queries to refresh data
                        queryClient.invalidateQueries(['orders']);
                        queryClient.invalidateQueries(['portfolio']);
                        // Show trade notification
                        toast({
                            title: 'Trade Executed',
                            description: `${data.trade.quantity} shares of ${data.trade.symbol} at $${data.trade.price}`,
                            status: 'success',
                            duration: 5000,
                            isClosable: true,
                        });
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            ws.onclose = (event) => {
                console.log(`WebSocket closed: ${event.code}`);
                setIsConnected(false);
                
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
                    console.log(`Attempting to reconnect in ${timeout}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
                    setTimeout(connect, timeout);
                    reconnectAttempts.current++;
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            socket.current = ws;
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }, [queryClient]);

    useEffect(() => {
        connect();
        return () => {
            if (socket.current) {
                socket.current.close();
            }
        };
    }, [connect]);

    return isConnected;
}; 