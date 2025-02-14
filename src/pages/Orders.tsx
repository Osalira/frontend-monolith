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
  Badge,
  Button,
  useToast,
  Text,
  VStack,
  Card,
  CardBody,
  HStack,
  Spinner,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { tradingService } from '../services/apiService';

const Orders: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders, isLoading } = useQuery(
    'orders',
    () => tradingService.getOrders()
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
      onError: (error: any) => {
        toast({
          title: 'Failed to cancel order',
          description: error.response?.data?.data?.error || 'An error occurred',
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
    const colorScheme = {
      PENDING: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
      FAILED: 'gray',
    }[status] || 'gray';

    return (
      <Badge colorScheme={colorScheme} data-cy={`status-${status.toLowerCase()}`}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack>
          <Spinner size="xl" />
          <Text>Loading orders...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <HStack w="100%" justify="space-between">
          <Heading>Orders</Heading>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => queryClient.invalidateQueries('orders')}
            data-cy="refresh-orders"
          >
            Refresh
          </Button>
        </HStack>

        <Card w="100%">
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Order ID</Th>
                  <Th>Stock</Th>
                  <Th>Type</Th>
                  <Th>Quantity</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th>Created At</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders?.map((order: any) => (
                  <Tr key={order.id} data-cy={`order-row-${order.id}`}>
                    <Td>{order.id}</Td>
                    <Td>{order.stock_name}</Td>
                    <Td>{order.order_type}</Td>
                    <Td>{order.quantity}</Td>
                    <Td>${order.price}</Td>
                    <Td>{getStatusBadge(order.status)}</Td>
                    <Td>{format(new Date(order.created_at), 'PPp')}</Td>
                    <Td>
                      {order.status === 'PENDING' && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleCancelOrder(order.id)}
                          isLoading={cancelMutation.isLoading}
                          data-cy={`cancel-order-${order.id}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
                {(!orders || orders.length === 0) && (
                  <Tr>
                    <Td colSpan={8} textAlign="center">
                      No orders found
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Orders; 