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

const OrderHistory: React.FC = () => {
  const [filterSymbol, setFilterSymbol] = React.useState('');
  const [filterDateRange, setFilterDateRange] = React.useState('7'); // days
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch orders with filters
  const { data: orders, isLoading } = useQuery(
    ['orders', filterSymbol, filterDateRange],
    () => tradingService.getOrders(),
    {
      select: (data) => {
        let filteredOrders = [...data];
        
        // Apply symbol filter
        if (filterSymbol) {
          filteredOrders = filteredOrders.filter(
            order => order.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
          );
        }
        
        // Apply date filter
        if (filterDateRange) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - parseInt(filterDateRange));
          filteredOrders = filteredOrders.filter(
            order => new Date(order.created_at) >= cutoffDate
          );
        }
        
        return filteredOrders;
      }
    }
  );

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
      onError: (error) => {
        toast({
          title: 'Failed to cancel order',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelMutation.mutate(orderId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      PENDING: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
      FAILED: 'red',
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

  const activeOrders = orders?.filter(order => order.status === 'PENDING') || [];
  const completedOrders = orders?.filter(order => order.status !== 'PENDING') || [];

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Order History</Heading>

      {/* Filters */}
      <Box mb={6}>
        <HStack spacing={4} align="flex-end">
          <FormControl maxW="200px">
            <FormLabel>Symbol</FormLabel>
            <Input
              placeholder="Filter by symbol"
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
            />
          </FormControl>
          
          <FormControl maxW="200px">
            <FormLabel>Time Range</FormLabel>
            <Select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="">All time</option>
            </Select>
          </FormControl>
        </HStack>
      </Box>

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
                    {activeOrders.map((order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.symbol}</Td>
                        <Td>
                          <Badge
                            colorScheme={order.type === 'BUY' ? 'green' : 'red'}
                          >
                            {order.type}
                          </Badge>
                        </Td>
                        <Td>{order.quantity}</Td>
                        <Td>${order.price.toFixed(2)}</Td>
                        <Td>${(order.quantity * order.price).toFixed(2)}</Td>
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
                    {completedOrders.map((order) => (
                      <Tr key={order.id}>
                        <Td>{order.id}</Td>
                        <Td>{order.symbol}</Td>
                        <Td>
                          <Badge
                            colorScheme={order.type === 'BUY' ? 'green' : 'red'}
                          >
                            {order.type}
                          </Badge>
                        </Td>
                        <Td>{order.quantity}</Td>
                        <Td>${order.price.toFixed(2)}</Td>
                        <Td>${(order.quantity * order.price).toFixed(2)}</Td>
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