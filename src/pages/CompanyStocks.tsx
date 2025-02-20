import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Heading,
  Card,
  CardBody,
  FormErrorMessage,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  NumberInput,
  NumberInputField,
  Text,
  Divider,
  Select,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tradingService } from '../services/apiService';

interface StockFormData {
  stock_name: string;
}

interface SellSharesFormData {
  stock_id: number;
  quantity: number;
  price: number;
}

interface Stock {
  id: number;
  name: string;
  symbol: string;
  current_price: number;
  total_shares: number;
  shares_available: number;
}

const CompanyStocks: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [stockData, setStockData] = useState<StockFormData>({
    stock_name: ''
  });
  const [sellData, setSellData] = useState<SellSharesFormData>({
    stock_id: 0,
    quantity: 0,
    price: 0
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch company's stocks
  const { data: stocksResponse, isLoading, isError } = useQuery(
    'company-stocks',
    () => tradingService.getCompanyStocks(),
    {
      onError: (error: any) => {
        toast({
          title: 'Failed to fetch stocks',
          description: error.response?.data?.error || 'An error occurred',
          status: 'error',
          duration: 5000,
        });
      }
    }
  );

  const stocks = stocksResponse?.data?.stocks || [];

  // Create stock mutation
  const createStockMutation = useMutation(
    (data: StockFormData) => tradingService.createStock(data),
    {
      onSuccess: () => {
        toast({
          title: 'Stock created successfully',
          status: 'success',
          duration: 3000,
        });
        // Reset form
        setStockData({
          stock_name: ''
        });
        // Refresh stocks list
        queryClient.invalidateQueries('company-stocks');
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to create stock',
          description: error.response?.data?.error || 'An error occurred',
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  // Sell shares mutation
  const sellSharesMutation = useMutation(
    (data: SellSharesFormData) => tradingService.placeOrder({
      stock_id: data.stock_id.toString(),
      is_buy: false,
      order_type: 'MARKET',
      quantity: data.quantity,
      price: data.price
    }),
    {
      onSuccess: () => {
        toast({
          title: 'Shares added successfully',
          status: 'success',
          duration: 3000,
        });
        // Reset form
        setSellData({
          stock_id: 0,
          quantity: 0,
          price: 0
        });
        // Refresh stocks list
        queryClient.invalidateQueries('company-stocks');
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to add shares',
          description: error.response?.data?.error || 'An error occurred',
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  const validateCreateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!stockData.stock_name) newErrors.stock_name = 'Stock name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSellForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!sellData.stock_id) newErrors.stock_id = 'Stock is required';
    if (!sellData.quantity || sellData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!sellData.price || sellData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCreateForm()) {
      createStockMutation.mutate(stockData);
    }
  };

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSellForm()) {
      sellSharesMutation.mutate(sellData);
    }
  };

  const handleCreateChange = (field: keyof StockFormData, value: string) => {
    setStockData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user changes value
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSellChange = (field: keyof SellSharesFormData, value: number) => {
    setSellData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user changes value
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Manage Company Stocks</Heading>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Create New Stock</Heading>
            <form onSubmit={handleCreateSubmit}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.stock_name}>
                  <FormLabel>Stock Name</FormLabel>
                  <Input
                    value={stockData.stock_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCreateChange('stock_name', e.target.value)}
                    placeholder="e.g., Apple Inc."
                    data-cy="stock-name-input"
                  />
                  <FormErrorMessage>{errors.stock_name}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  isLoading={createStockMutation.isLoading}
                  data-cy="create-stock-button"
                >
                  Create Stock
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Add Initial Shares</Heading>
            <form onSubmit={handleSellSubmit}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.stock_id}>
                  <FormLabel>Select Stock</FormLabel>
                  <Select
                    value={sellData.stock_id.toString()}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSellChange('stock_id', parseInt(e.target.value))}
                    placeholder="Select a stock"
                    data-cy="stock-select"
                    isDisabled={isLoading || isError || !stocks.length}
                  >
                    {stocks.map((stock: Stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.name} ({stock.symbol})
                      </option>
                    ))}
                  </Select>
                  {isLoading && <Text color="gray.500" mt={2}>Loading stocks...</Text>}
                  {isError && <Text color="red.500" mt={2}>Failed to load stocks</Text>}
                  {!isLoading && !isError && stocks.length === 0 && (
                    <Text color="gray.500" mt={2}>No stocks available. Create a stock first.</Text>
                  )}
                  <FormErrorMessage>{errors.stock_id}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.quantity}>
                  <FormLabel>Number of Shares</FormLabel>
                  <NumberInput
                    value={sellData.quantity}
                    onChange={(_: string, value: number) => handleSellChange('quantity', value)}
                    min={1}
                    precision={0}
                  >
                    <NumberInputField data-cy="shares-input" />
                  </NumberInput>
                  <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.price}>
                  <FormLabel>Price per Share ($)</FormLabel>
                  <NumberInput
                    value={sellData.price}
                    onChange={(_: string, value: number) => handleSellChange('price', value)}
                    min={0.01}
                    precision={2}
                  >
                    <NumberInputField data-cy="price-input" />
                  </NumberInput>
                  <FormErrorMessage>{errors.price}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="green"
                  width="100%"
                  isLoading={sellSharesMutation.isLoading}
                  data-cy="add-shares-button"
                >
                  Add Shares
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        <Divider />

        <Card>
          <CardBody>
            <Heading size="md" mb={4}>Company Stocks</Heading>
            {isLoading ? (
              <Text>Loading stocks...</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Symbol</Th>
                    <Th>Name</Th>
                    <Th>Current Price</Th>
                    <Th>Total Shares</Th>
                    <Th>Available Shares</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stocks.map((stock: Stock) => (
                    <Tr key={stock.id} data-cy={`stock-row-${stock.symbol}`}>
                      <Td>{stock.symbol}</Td>
                      <Td>{stock.name}</Td>
                      <Td>${stock.current_price}</Td>
                      <Td>{stock.total_shares}</Td>
                      <Td>{stock.shares_available}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default CompanyStocks; 