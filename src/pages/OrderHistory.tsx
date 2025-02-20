import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Badge,
  useToast,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  HStack,
  Select,
  Input,
  FormControl,
  FormLabel,
  Tooltip,
  Progress,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tradingService, handleApiError } from '../services/apiService';
import { format } from 'date-fns';
import { useWebSocket } from '../services/websocketService';

interface OrderResponse {
  success: boolean;
  data: {
    results: Order[];
  };
}

interface Order {
  id: string;
  symbol: string;
  order_type: string;
  quantity: number;
  executed_quantity?: number;
  price: number;
  status: OrderStatus;
  created_at: string;
  completed_at?: string;
  type: string;
}

type OrderStatus = 'PENDING' | 'PARTIALLY_COMPLETE' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

const OrderHistory: React.FC = () => {
  const [symbolFilter, setSymbolFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();
  const isConnected = useWebSocket(); // WebSocket connection status

  // Query for fetching orders with improved error handling
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', symbolFilter, dateFilter],
    queryFn: async (): Promise<Order[]> => {
      try {
        const response = await tradingService.getOrders(symbolFilter, dateFilter);
        
        // Validate response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format from server');
        }

        const typedResponse = response as OrderResponse;
        
        // Ensure we have the expected data structure
        if (!typedResponse.data || !Array.isArray(typedResponse.data.results)) {
          console.warn('Unexpected response format:', typedResponse);
          return [];
        }

        return typedResponse.data.results;
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error Fetching Orders',
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return [];
      }
    },
    refetchInterval: isConnected ? false : 5000,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
  });

  // Mutation for canceling orders
  const cancelMutation = useMutation(
    (orderId: string) => tradingService.cancelOrder(orderId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        toast({
          title: 'Order Cancelled',
          status: 'success',
          duration: 3000,
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to cancel order',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  // Mutation for canceling partial orders
  const cancelPartialMutation = useMutation(
    () => tradingService.cancelPartialOrders(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        toast({
          title: 'Partial Orders Cancelled',
          status: 'success',
          duration: 3000,
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to cancel partial orders',
          description: error.message,
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  // Filter orders with type safety
  const filteredOrders = React.useMemo(() => {
    return (orders as Order[]).filter((order: Order) => {
      const matchesSymbol = !symbolFilter || 
        order.symbol.toLowerCase().includes(symbolFilter.toLowerCase());
      const matchesDate = !dateFilter || 
        order.created_at.includes(dateFilter);
      return matchesSymbol && matchesDate;
    });
  }, [orders, symbolFilter, dateFilter]);

  // Separate active and completed orders with proper typing
  const activeOrders = React.useMemo(() => 
    filteredOrders.filter((order: Order) => 
      ['PENDING', 'PARTIALLY_COMPLETE'].includes(order.status)
    ), [filteredOrders]);

  const completedOrders = React.useMemo(() => 
    filteredOrders.filter((order: Order) => 
      ['COMPLETED', 'CANCELLED', 'FAILED'].includes(order.status)
    ), [filteredOrders]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleCancelOrder = (orderId: string) => {
    cancelMutation.mutate(orderId);
  };

  const handleCancelPartialOrders = () => {
    cancelPartialMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'yellow',
      PARTIALLY_COMPLETE: 'orange',
      COMPLETED: 'green',
      CANCELLED: 'red',
      FAILED: 'gray'
    };
    return <Badge colorScheme={statusColors[status as keyof typeof statusColors]}>{status}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  const getProgressValue = (order: Order): number => {
    if (!order.executed_quantity) return 0;
    return (order.executed_quantity / order.quantity) * 100;
  };

  const getOrderStatus = (order: Order): string => {
    switch (order.status) {
      case 'PENDING':
        return 'Pending';
      case 'PARTIALLY_COMPLETE':
        return 'Partially Complete';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Order History</Heading>

      {/* Actions */}
      <HStack w="100%" justify="space-between" mb={6}>
        {/* Filters */}
        <HStack spacing={4} align="flex-end">
          <FormControl maxW="200px">
            <FormLabel>Symbol</FormLabel>
            <Input
              placeholder="Filter by symbol"
              value={symbolFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSymbolFilter(e.target.value)}
              data-cy="symbol-filter"
            />
          </FormControl>
          
          <FormControl maxW="200px">
            <FormLabel>Date</FormLabel>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              data-cy="date-filter"
            />
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <Button
            colorScheme="red"
            onClick={handleCancelPartialOrders}
            isLoading={cancelPartialMutation.isLoading}
            data-cy="cancel-partial-orders"
          >
            Cancel Partial Orders
          </Button>
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => queryClient.invalidateQueries(['orders'])}
            data-cy="refresh-orders"
          >
            Refresh
          </Button>
          {!isConnected && (
            <Badge colorScheme="red">
              WebSocket Disconnected - Falling back to polling
            </Badge>
          )}
        </HStack>
      </HStack>

      <Tabs>
        <TabList>
          <Tab>Active Orders ({activeOrders.length})</Tab>
          <Tab>Completed Orders ({completedOrders.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {activeOrders.length === 0 ? (
              <Text color="gray.500">No active orders</Text>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Order ID</Th>
                      <Th>Symbol</Th>
                      <Th>Type</Th>
                      <Th>Quantity</Th>
                      <Th>Progress</Th>
                      <Th>Price</Th>
                      <Th>Status</Th>
                      <Th>Created At</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activeOrders.map(order => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.symbol}</Td>
                        <Td>{order.type}</Td>
                        <Td>
                          <Tooltip 
                            label={`Executed: ${order.executed_quantity || 0} / ${order.quantity}`}
                            isDisabled={!order.executed_quantity}
                          >
                            <Box>
                              {order.quantity}
                              {order.executed_quantity && (
                                <Progress 
                                  value={getProgressValue(order)}
                                  size="sm"
                                  mt={1}
                                  colorScheme="blue"
                                />
                              )}
                            </Box>
                          </Tooltip>
                        </Td>
                        <Td>{formatPrice(order.price)}</Td>
                        <Td>{getStatusBadge(order.status)}</Td>
                        <Td>{formatDateTime(order.created_at)}</Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleCancelOrder(order.id)}
                            isLoading={cancelMutation.isLoading}
                            data-cy="cancel-order"
                          >
                            Cancel
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>

          <TabPanel>
            {completedOrders.length === 0 ? (
              <Text color="gray.500">No completed orders</Text>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Order ID</Th>
                      <Th>Symbol</Th>
                      <Th>Type</Th>
                      <Th>Quantity</Th>
                      <Th>Price</Th>
                      <Th>Status</Th>
                      <Th>Created At</Th>
                      <Th>Completed At</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {completedOrders.map(order => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.symbol}</Td>
                        <Td>{order.type}</Td>
                        <Td>{order.quantity}</Td>
                        <Td>{formatPrice(order.price)}</Td>
                        <Td>{getStatusBadge(order.status)}</Td>
                        <Td>{formatDateTime(order.created_at)}</Td>
                        <Td>{order.completed_at && formatDateTime(order.completed_at)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default OrderHistory; 