import React from 'react';
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
} from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { Link as RouterLink } from 'react-router-dom';
import { accountService, tradingService, handleApiError } from '../services/apiService';

const Dashboard: React.FC = () => {
  // Fetch account overview
  const { data: accountData, isLoading: accountLoading } = useQuery(
    'accountOverview',
    () => accountService.getAccountDetails()
  );

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery(
    'walletBalance',
    () => accountService.getWalletBalance()
  );

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery(
    'recentOrders',
    () => tradingService.getRecentOrders()
  );

  // Fetch portfolio holdings
  const { data: portfolio, isLoading: portfolioLoading } = useQuery(
    'portfolio',
    () => tradingService.getStockPortfolio()
  );

  if (accountLoading || walletLoading || ordersLoading || portfolioLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

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
                  <StatNumber>${accountData?.portfolio_value?.toFixed(2) || '0.00'}</StatNumber>
                  <StatHelpText>
                    <StatArrow
                      type={accountData?.portfolio_change >= 0 ? 'increase' : 'decrease'}
                    />
                    {accountData?.portfolio_change}%
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
                  <StatNumber>{accountData?.active_orders || 0}</StatNumber>
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
                  <StatNumber>{accountData?.total_trades || 0}</StatNumber>
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
              to="/orders"
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
                  </Tr>
                </Thead>
                <Tbody>
                  {recentOrders?.slice(0, 5).map((order: any) => (
                    <Tr key={order.id}>
                      <Td>{order.symbol}</Td>
                      <Td>
                        <Badge
                          colorScheme={order.type === 'BUY' ? 'green' : 'red'}
                        >
                          {order.type}
                        </Badge>
                      </Td>
                      <Td>{order.quantity}</Td>
                      <Td>${order.price}</Td>
                      <Td>{getStatusBadge(order.status)}</Td>
                      <Td>{new Date(order.created_at).toLocaleString()}</Td>
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