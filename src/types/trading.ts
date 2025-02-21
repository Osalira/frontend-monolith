export type OrderStatus = 'PENDING' | 'PARTIALLY_COMPLETE' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export type OrderType = 'BUY' | 'SELL';
export type OrderMethod = 'MARKET' | 'LIMIT';

export interface Order {
    id: string;
    symbol: string;
    order_type: OrderType;
    type: string;  // For backward compatibility
    quantity: number;
    original_quantity: number;
    executed_quantity?: number;
    price: number;
    status: OrderStatus;
    created_at: string;
    completed_at?: string;
    total?: number;
}

export interface OrderResponse {
    success: boolean;
    data: {
        results: Order[];
    };
}

export interface TradeNotification {
    type: string;
    trade: {
        buy_order_id: string;
        sell_order_id: string;
        symbol: string;
        price: string;
        quantity: string;
        executed_at: string;
        buyer_user_id: string;
        seller_user_id: string;
    };
    timestamp: string;
}

export interface WebSocketState {
    socket: WebSocket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number | undefined;
    connectionTimeout: ReturnType<typeof setTimeout> | null;
} 