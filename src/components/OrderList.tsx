interface Order {
    id: string;
    symbol: string;
    order_type: 'BUY' | 'SELL';
    quantity: number;
    original_quantity: number;
    price: number;
    status: 'PENDING' | 'COMPLETED' | 'PARTIALLY_COMPLETE' | 'CANCELLED' | 'FAILED';
    created_at: string;
}

const OrderList: React.FC = () => {
    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'green';
            case 'PARTIALLY_COMPLETE':
                return 'yellow';
            case 'PENDING':
                return 'blue';
            case 'CANCELLED':
                return 'gray';
            case 'FAILED':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getOrderProgress = (order: Order) => {
        if (order.status === 'PARTIALLY_COMPLETE') {
            const filledQuantity = order.original_quantity - order.quantity;
            return `${filledQuantity}/${order.original_quantity}`;
        }
        return order.quantity;
    };

    return (
        <Box>
            <Heading size="md" mb={4}>Orders</Heading>
            <Table variant="simple">
                <Thead>
                    <Tr>
                        <Th>Symbol</Th>
                        <Th>Type</Th>
                        <Th>Quantity</Th>
                        <Th>Price</Th>
                        <Th>Status</Th>
                        <Th>Created At</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {orders.map((order) => (
                        <Tr key={order.id}>
                            <Td>{order.symbol}</Td>
                            <Td>
                                <Badge colorScheme={order.order_type === 'BUY' ? 'green' : 'red'}>
                                    {order.order_type}
                                </Badge>
                            </Td>
                            <Td>
                                {order.status === 'PARTIALLY_COMPLETE' ? (
                                    <Tooltip label={`Filled: ${getOrderProgress(order)}`}>
                                        <Text>{order.original_quantity}</Text>
                                    </Tooltip>
                                ) : (
                                    order.quantity
                                )}
                            </Td>
                            <Td>${order.price.toFixed(2)}</Td>
                            <Td>
                                <Badge colorScheme={getStatusBadgeColor(order.status)}>
                                    {order.status.replace('_', ' ')}
                                </Badge>
                            </Td>
                            <Td>{new Date(order.created_at).toLocaleString()}</Td>
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </Box>
    );
};

export default OrderList; 