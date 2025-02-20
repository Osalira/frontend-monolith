import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  useToast,
  Text,
  Heading,
  Card,
  CardBody,
  FormErrorMessage,
  RadioGroup,
  Radio,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'react-query';
import { tradingService, OrderRequest, authService } from '../services/apiService';

interface Stock {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
}

interface StockHolding {
  stock_id: string;
  quantity: number;
  average_price: number;
}

interface OrderResponse {
  success: boolean;
  data: {
    order_id?: string;
    error?: string;
  };
}

const Trading: React.FC = () => {
  const toast = useToast();
  const [orderData, setOrderData] = useState<OrderRequest>({
    stock_id: '',
    is_buy: true,
    order_type: 'MARKET',
    quantity: 0,
    price: undefined
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch available stocks
  const { data: stocksResponse, isLoading: stocksLoading, error: stocksError } = useQuery(
    'stocks',
    () => tradingService.getStockPrices(),
    {
      onError: (error: any) => {
        toast({
          title: 'Failed to fetch stocks',
          description: error.message || 'An error occurred while fetching stocks',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  );
  console.log("stocksResponse from getStockPrices:", stocksResponse);

  // Combine all available stocks
  const stocks = stocksResponse?.stocks || [];
  console.log("All available stocks:", stocks);

  // Get user's portfolio to check owned stocks
  const { data: portfolioResponse } = useQuery(
    'portfolio',
    () => tradingService.getStockPortfolio(),
    {
      onError: (error: any) => {
        toast({
          title: 'Failed to fetch portfolio',
          description: error.message || 'An error occurred while fetching portfolio',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  );
  console.log("Portfolio response:", portfolioResponse);

  const ownedStocks = portfolioResponse?.data?.holdings || [];
  console.log("Owned stocks:", ownedStocks);

  // Get company's created stocks if user is a company
  const { data: companyStocksResponse } = useQuery(
    'company-stocks',
    () => tradingService.getCompanyStocks(),
    {
      enabled: authService.isCompanyAccount(), // Only fetch if user is a company
      onError: (error: any) => {
        toast({
          title: 'Failed to fetch company stocks',
          description: error.message || 'An error occurred while fetching company stocks',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  );
  console.log("Company stocks response:", companyStocksResponse);
  
  const companyCreatedStocks = companyStocksResponse?.data?.stocks || [];
  console.log("Company created stocks:", companyCreatedStocks);

  // Place order mutation
  const placeMutation = useMutation(
    (data: OrderRequest) => tradingService.placeOrder(data),
    {
      onSuccess: (response: OrderResponse) => {
        if (response.success) {
          toast({
            title: 'Order placed successfully',
            description: `Order ID: ${response.data.order_id}`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          // Reset form
          setOrderData({
            stock_id: '',
            is_buy: true,
            order_type: 'MARKET',
            quantity: 0,
            price: undefined
          });
        } else {
          toast({
            title: 'Failed to place order',
            description: response.data?.error || 'An error occurred',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.data?.error || error.message || 'An error occurred';
        toast({
          title: 'Failed to place order',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const validateForm = () => {
    console.log('Starting form validation with data:', orderData);
    console.log('User is company account:', authService.isCompanyAccount());
    
    const newErrors: { [key: string]: string } = {};
    if (!orderData.stock_id) newErrors.stock_id = 'Stock is required';
    if (orderData.quantity <= 0) newErrors.quantity = 'Quantity must be positive';
    if (orderData.order_type === 'LIMIT' && !orderData.price) {
      newErrors.price = 'Price is required for limit orders';
    }
    if (orderData.order_type === 'LIMIT' && orderData.price && orderData.price <= 0) {
      newErrors.price = 'Price must be positive for limit orders';
    }

    // Validate sell orders
    if (!orderData.is_buy) {
      console.log('Validating sell order...');
      
      // Check in both regular stocks and company created stocks
      const selectedStock = stocks.find((s: Stock) => String(s.id) === String(orderData.stock_id)) || 
                          companyCreatedStocks.find((s: Stock) => String(s.id) === String(orderData.stock_id));
      
      console.log('Selected stock:', selectedStock);
      console.log('Looking for stock with ID:', orderData.stock_id);
      console.log('Available stocks:', stocks);
      console.log('Company created stocks:', companyCreatedStocks);
      
      if (!selectedStock) {
        newErrors.stock_id = 'Invalid stock selected';
        console.log('Error: Invalid stock selected');
        return false;
      }

      // Check if user owns the stock (either through portfolio or as company creator)
      const ownedStock = ownedStocks.find((s: StockHolding) => String(s.stock_id) === String(orderData.stock_id));
      const isCompanyCreatedStock = companyCreatedStocks.some((s: Stock) => String(s.id) === String(orderData.stock_id));
      
      console.log('Owned stock:', ownedStock);
      console.log('Is company created stock:', isCompanyCreatedStock);

      if (!ownedStock && !isCompanyCreatedStock) {
        newErrors.stock_id = 'You can only sell stocks you own or created';
        console.log('Error: Stock not owned or created by company');
      } else if (ownedStock && !isCompanyCreatedStock && ownedStock.quantity < orderData.quantity) {
        newErrors.quantity = 'Insufficient shares to sell';
        console.log('Error: Insufficient shares to sell');
      }
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting order with data:', orderData);
    
    if (validateForm()) {
      const orderRequest: OrderRequest = {
        stock_id: orderData.stock_id,
        is_buy: orderData.is_buy,
        order_type: orderData.order_type,
        quantity: orderData.quantity,
        ...(orderData.order_type === 'LIMIT' && { price: orderData.price })
      };
      
      console.log('Order request being sent:', orderRequest);
      placeMutation.mutate(orderRequest);
    } else {
      console.log('Form validation failed');
    }
  };

  const handleChange = (
    field: keyof typeof orderData,
    value: string | number | boolean
  ) => {
    setOrderData(prev => ({
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

  if (stocksLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="center">
          <Heading>Place Order</Heading>
          <Text>Loading stocks...</Text>
        </VStack>
      </Container>
    );
  }

  if (stocksError) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="center">
          <Heading>Place Order</Heading>
          <Text color="red.500">Error loading stocks. Please try again later.</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8}>
        <Heading>Place Order</Heading>

        <Card w="100%">
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.stock_id}>
                  <FormLabel>Stock</FormLabel>
                  <Select
                    value={orderData.stock_id}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('stock_id', e.target.value)}
                    placeholder="Select stock"
                    data-cy="stock-select"
                  >
                    {stocks.map((stock: any) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.name} ({stock.symbol}) - ${stock.current_price}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.stock_id}</FormErrorMessage>
                </FormControl>

                <FormControl>
                  <FormLabel>Order Type</FormLabel>
                  <RadioGroup
                    value={orderData.is_buy ? 'BUY' : 'SELL'}
                    onChange={(value: string) => handleChange('is_buy', value === 'BUY')}
                  >
                    <HStack spacing={4}>
                      <Radio value="BUY" data-cy="order-type-buy">Buy</Radio>
                      <Radio value="SELL" data-cy="order-type-sell">Sell</Radio>
                    </HStack>
                  </RadioGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Order Method</FormLabel>
                  <RadioGroup
                    value={orderData.order_type}
                    onChange={(value: string) => handleChange('order_type', value)}
                  >
                    <HStack spacing={4}>
                      <Radio value="MARKET" data-cy="order-method-market">Market</Radio>
                      <Radio value="LIMIT" data-cy="order-method-limit">Limit</Radio>
                    </HStack>
                  </RadioGroup>
                </FormControl>

                <FormControl isInvalid={!!errors.quantity}>
                  <FormLabel>Quantity</FormLabel>
                  <NumberInput
                    min={1}
                    value={orderData.quantity}
                    onChange={(_: string, value: number) => handleChange('quantity', value)}
                  >
                    <NumberInputField data-cy="quantity-input" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <FormErrorMessage>{errors.quantity}</FormErrorMessage>
                </FormControl>

                {orderData.order_type === 'LIMIT' && (
                  <FormControl isInvalid={!!errors.price}>
                    <FormLabel>Price</FormLabel>
                    <NumberInput
                      min={0.01}
                      precision={2}
                      value={orderData.price}
                      onChange={(_: string, value: number) => handleChange('price', value)}
                    >
                      <NumberInputField data-cy="price-input" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormErrorMessage>{errors.price}</FormErrorMessage>
                  </FormControl>
                )}

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="100%"
                  mt={4}
                  isLoading={placeMutation.isLoading}
                  data-cy="place-order-button"
                >
                  Place Order
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Trading; 