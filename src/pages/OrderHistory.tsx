import React from 'react';
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
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tradingService, handleApiError } from '../services/apiService';
import { format } from 'date-fns';

interface Order {
  id: string;
  symbol: string;
  order_type: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
  completed_at?: string;
}

const OrderHistory: React.FC = () => {
  const [filterSymbol, setFilterSymbol] = React.useState('');
  const [filterDateRange, setFilterDateRange] = React.useState('7'); // days
  const toast = useToast();
  const queryClient = useQueryClient();

  // Cancel order mutation
  const cancelMutation = useMutation(
    (orderId: string) => tradingService.cancelOrder(orderId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast({
          title: 'Order cancelled successfully',
          status: 'success',
          duration: 3000,
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Failed to cancel order',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  // Cancel partial orders mutation
  const cancelPartialMutation = useMutation(
    () => tradingService.cancelPartialOrders(),
    {
      onSuccess: (response: { success: boolean; data?: any }) => {
        queryClient.invalidateQueries('orders');
        toast({
          title: 'Partial orders cancelled',
          description: `Cancelled ${response.data.cancelledOrders.length} orders`,
          status: 'success',
          duration: 3000,
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Failed to cancel partial orders',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  // Fetch orders with filters
  const { data: orders, isLoading, error: ordersError } = useQuery(
    ['orders', filterSymbol, filterDateRange],
    async () => {
      console.log('Fetching orders...');
      const response = await tradingService.getOrders();
      console.log('Orders response:', response);
      return response;
    },
    {
      onError: (error: any) => {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Failed to fetch orders',
          description: error.message || 'An unexpected error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
      select: (data: Order[]) => {
        console.log('Processing orders data:', data);
        let filteredOrders = [...data];
        
        // Apply symbol filter
        if (filterSymbol) {
          console.log('Applying symbol filter:', filterSymbol);
          filteredOrders = filteredOrders.filter(
            order => order.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
          );
          console.log('Orders after symbol filter:', filteredOrders);
        }
        
        // Apply date filter
        if (filterDateRange) {
          console.log('Applying date filter:', filterDateRange, 'days');
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(filterDateRange));
          filteredOrders = filteredOrders.filter(
            order => new Date(order.created_at) >= cutoffDate
          );
          console.log('Orders after date filter:', filteredOrders);
        }
        
        return filteredOrders;
      }
    }
  );

  // Add logging for active and completed orders
  const [activeOrders, setActiveOrders] = React.useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = React.useState<Order[]>([]);

  React.useEffect(() => {
    if (orders) {
      const active = orders.filter((order: Order) => 
        order.status === 'PENDING' || order.status === 'PARTIALLY_COMPLETE'
      );
      const completed = orders.filter((order: Order) => 
        order.status !== 'PENDING' && order.status !== 'PARTIALLY_COMPLETE'
      );
      
      setActiveOrders(active);
      setCompletedOrders(completed);
      
      console.log('All orders:', orders);
      console.log('Active orders:', active);
      console.log('Completed orders:', completed);
    }
  }, [orders]);

  // Add logging to price formatting
  const formatPrice = (price: any) => {
    console.log('Formatting price:', { original: price, type: typeof price });
    const numPrice = Number(price);
    console.log('Converted price:', { numPrice, type: typeof numPrice });
    return numPrice.toFixed(2);
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelMutation.mutate(orderId);
    }
  };

  const handleCancelPartialOrders = () => {
    if (window.confirm('Are you sure you want to cancel all partially complete orders?')) {
      cancelPartialMutation.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      PENDING: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
      FAILED: 'red',
      PARTIALLY_COMPLETE: 'blue',
    };

    return (
      <Badge colorScheme={statusColors[status] || 'gray'}>
        {status}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
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
              value={filterSymbol}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilterSymbol(e.target.value)}
            />
          </FormControl>
          
          <FormControl maxW="200px">
            <FormLabel>Time Range</FormLabel>
            <Select
              value={filterDateRange}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="">All time</option>
            </Select>
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
            onClick={() => queryClient.invalidateQueries('orders')}
            data-cy="refresh-orders"
          >
            Refresh
          </Button>
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
                      <Th>Price</Th>
                      <Th>Total</Th>
                      <Th>Status</Th>
                      <Th>Created At</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activeOrders.map((order: Order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.symbol}</Td>
                        <Td>
                          <Badge
                            colorScheme={order.order_type === 'BUY' ? 'green' : 'red'}
                          >
                            {order.order_type}
                          </Badge>
                        </Td>
                        <Td>{order.quantity}</Td>
                        <Td>${formatPrice(order.price)}</Td>
                        <Td>${(order.quantity * Number(formatPrice(order.price))).toFixed(2)}</Td>
                        <Td>{getStatusBadge(order.status)}</Td>
                        <Td>{formatDateTime(order.created_at)}</Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleCancelOrder(order.id)}
                            isLoading={cancelMutation.isLoading}
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
                      <Th>Total</Th>
                      <Th>Status</Th>
                      <Th>Created At</Th>
                      <Th>Completed At</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {completedOrders.map((order: Order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.symbol}</Td>
                        <Td>
                          <Badge
                            colorScheme={order.order_type === 'BUY' ? 'green' : 'red'}
                          >
                            {order.order_type}
                          </Badge>
                        </Td>
                        <Td>{order.quantity}</Td>
                        <Td>${formatPrice(order.price)}</Td>
                        <Td>${(order.quantity * Number(formatPrice(order.price))).toFixed(2)}</Td>
                        <Td>{getStatusBadge(order.status)}</Td>
                        <Td>{formatDateTime(order.created_at)}</Td>
                        <Td>
                          {order.completed_at
                            ? formatDateTime(order.completed_at)
                            : '-'}
                        </Td>
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