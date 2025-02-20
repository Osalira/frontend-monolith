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

  // Cancel transaction mutation
  const cancelMutation = useMutation(
    (txId: string) => tradingService.cancelTransaction(txId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast({
          title: 'Transaction cancelled successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.data?.error || error.message || 'An error occurred';
        toast({
          title: 'Failed to cancel transaction',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
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
          isClosable: true,
        });
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.data?.error || error.message || 'An error occurred';
        toast({
          title: 'Failed to cancel partial orders',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleCancelTransaction = (txId: string) => {
    if (window.confirm('Are you sure you want to cancel this transaction?')) {
      cancelMutation.mutate(txId);
    }
  };

  const handleCancelPartialOrders = () => {
    if (window.confirm('Are you sure you want to cancel all partially complete orders?')) {
      cancelPartialMutation.mutate();
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
                          onClick={() => handleCancelTransaction(order.id)}
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