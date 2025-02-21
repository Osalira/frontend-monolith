import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Text,
  Spinner,
  Center,
  Button,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { Link as RouterLink } from 'react-router-dom';
import { accountService, tradingService, handleApiError } from '../services/apiService';
import { useQueryClient } from 'react-query';

const Dashboard: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Helper function to merge duplicate holdings
  const mergeHoldings = (holdings: any[]) => {
    const merged = holdings.reduce((acc: any, holding: any) => {
      const existing = acc[holding.symbol];
      if (existing) {
        // Merge quantities and recalculate average price
        const totalQuantity = existing.quantity + holding.quantity;
        const totalValue = (existing.quantity * existing.average_price) + 
                         (holding.quantity * holding.average_price);
        existing.quantity = totalQuantity;
        existing.average_price = totalValue / totalQuantity;
      } else {
        acc[holding.symbol] = { ...holding };
      }
      return acc;
    }, {});
    return Object.values(merged);
  };

  // Fetch portfolio with merged holdings
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = useQuery(
    'portfolio',
    async () => {
      console.log('Fetching portfolio...');
      const response = await tradingService.getStockPortfolio();
      console.log('Portfolio response:', response);
      const mergedData = {
        ...response.data,
        holdings: mergeHoldings(response.data?.holdings || [])
      };
      return mergedData || { holdings: [], total_value: 0, active_orders: 0 };
    },
    {
      onError: (error: any) => {
        console.error('Error fetching portfolio:', error);
        toast({
          title: 'Error fetching portfolio',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      }
    }
  );

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading, error: walletError } = useQuery(
    'walletBalance',
    async () => {
      console.log('Fetching wallet balance...');
      const response = await accountService.getWalletBalance();
      console.log('Wallet balance response:', response);
      return response;
    },
    {
      onError: (error: any) => {
        console.error('Error fetching wallet balance:', error);
        toast({
          title: 'Error fetching wallet balance',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      }
    }
  );

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery(
    'recentOrders',
    async () => {
      console.log('Fetching recent orders...');
      const response = await tradingService.getRecentOrders();
      console.log('Recent orders response:', response);
      return response.data?.results || [];
    },
    {
      onError: (error: any) => {
        console.error('Error fetching recent orders:', error);
        toast({
          title: 'Error fetching recent orders',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      }
    }
  );

  // Add effect to log data changes
  useEffect(() => {
    console.log('Wallet Data:', walletData);
    console.log('Recent Orders:', recentOrders);
    console.log('Portfolio:', portfolio);
  }, [walletData, recentOrders, portfolio]);

  if (portfolioLoading || walletLoading || ordersLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Helper function to determine if an order is complete
  const isOrderComplete = (order: any) => {
    return order.status === 'COMPLETED' || 
           (order.status === 'PARTIALLY_COMPLETE' && order.quantity === 0);
  };

  // Helper function to determine if an order can be cancelled
  const canCancelOrder = (order: any) => {
    return order.status === 'PENDING' || 
           (order.status === 'PARTIALLY_COMPLETE' && order.quantity > 0);
  };

  // Helper function to get order progress
  const getOrderProgress = (order: any) => {
    if (order.status === 'PARTIALLY_COMPLETE') {
      const executedQty = order.original_quantity - order.quantity;
      return `${executedQty}/${order.original_quantity}`;
    }
    return order.quantity;
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string, order: any) => {
    const statusColors: { [key: string]: string } = {
      PENDING: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
      FAILED: 'red',
      PARTIALLY_COMPLETE: 'blue'
    };

    const displayStatus = status === 'PARTIALLY_COMPLETE' 
      ? `PARTIAL (${getOrderProgress(order)})` 
      : status;

    return (
      <Badge colorScheme={statusColors[status] || 'gray'}>
        {displayStatus}
      </Badge>
    );
  };

  // Function to handle order cancellation
  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await tradingService.cancelStockTransaction(orderId);
      if (response.success) {
        toast({
          title: 'Order cancelled successfully',
          description: response.data.message,
          status: 'success',
          duration: 5000,
        });
        // Refetch orders and portfolio data
        queryClient.invalidateQueries('recentOrders');
        queryClient.invalidateQueries('portfolio');
      }
    } catch (error) {
      toast({
        title: 'Error cancelling order',
        description: handleApiError(error),
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Filter complete orders
  const completeOrders = recentOrders?.filter(isOrderComplete) || [];

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Overview Section */}
        <Box>
          <Heading mb={6}>Trading Dashboard</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="sm">Portfolio Value</Heading>
              </CardHeader>
              <CardBody>
                <Stat>
                  <StatNumber>${portfolio?.total_value?.toFixed(2) || '0.00'}</StatNumber>
                  <StatHelpText>
                    Total portfolio value
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Available Balance</Heading>
              </CardHeader>
              <CardBody>
                <Stat>
                  <StatNumber>${walletData?.data?.balance?.toFixed(2) || '0.00'}</StatNumber>
                  <StatHelpText>
                    Available for trading
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Active Orders</Heading>
              </CardHeader>
              <CardBody>
                <Stat>
                  <StatNumber>{portfolio?.active_orders || 0}</StatNumber>
                  <StatHelpText>
                    Pending transactions
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Total Trades</Heading>
              </CardHeader>
              <CardBody>
                <Stat>
                  <StatNumber>{completeOrders.length}</StatNumber>
                  <StatHelpText>
                    Completed transactions
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Portfolio Holdings */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Portfolio Holdings</Heading>
            <Button
              as={RouterLink}
              to="/trading"
              colorScheme="blue"
              size="sm"
            >
              Trade Now
            </Button>
          </HStack>
          {portfolio?.holdings?.length === 0 ? (
            <Text color="gray.500">No stocks in portfolio</Text>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Symbol</Th>
                    <Th>Quantity</Th>
                    <Th>Average Price</Th>
                    <Th>Current Price</Th>
                    <Th>Market Value</Th>
                    <Th>Profit/Loss</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {portfolio?.holdings?.map((holding: any) => (
                    <Tr key={holding.symbol}>
                      <Td>{holding.symbol}</Td>
                      <Td>{holding.quantity}</Td>
                      <Td>${holding.average_price.toFixed(2)}</Td>
                      <Td>${holding.current_price.toFixed(2)}</Td>
                      <Td>${(holding.quantity * holding.current_price).toFixed(2)}</Td>
                      <Td>
                        <Text
                          color={holding.profit_loss >= 0 ? 'green.500' : 'red.500'}
                        >
                          {holding.profit_loss >= 0 ? '+' : ''}
                          ${Math.abs(holding.profit_loss).toFixed(2)}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        {/* Recent Orders */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Recent Orders</Heading>
            <Button
              as={RouterLink}
              to="/order-history"
              colorScheme="blue"
              size="sm"
            >
              View All Orders
            </Button>
          </HStack>
          {recentOrders?.length === 0 ? (
            <Text color="gray.500">No recent orders</Text>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Symbol</Th>
                    <Th>Type</Th>
                    <Th>Quantity</Th>
                    <Th>Price</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentOrders?.slice(0, 5).map((order: any) => (
                    <Tr key={order.id}>
                      <Td>{order.stock_name}</Td>
                      <Td>
                        <Badge
                          colorScheme={order.order_type === 'BUY' ? 'green' : 'red'}
                        >
                          {order.order_type}
                        </Badge>
                      </Td>
                      <Td>{order.quantity}</Td>
                      <Td>${Number(order.price).toFixed(2)}</Td>
                      <Td>{getStatusBadge(order.status, order)}</Td>
                      <Td>{new Date(order.created_at).toLocaleString()}</Td>
                      <Td>
                        {canCancelOrder(order) && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default Dashboard; 