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
import { tradingService } from '../services/apiService';

const Trading: React.FC = () => {
  const toast = useToast();
  const [orderData, setOrderData] = useState({
    stock_id: '',
    is_buy: true,
    order_type: 'MARKET',
    quantity: 0,
    price: 0,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch available stocks
  const { data: stocks, isLoading: stocksLoading } = useQuery(
    'stocks',
    () => tradingService.getStockPrices()
  );

  // Place order mutation
  const placeMutation = useMutation(
    (data: typeof orderData) => tradingService.placeOrder(data),
    {
      onSuccess: (response) => {
        toast({
          title: 'Order placed successfully',
          description: `Order ID: ${response.order_id}`,
          status: 'success',
          duration: 5000,
        });
        // Reset form
        setOrderData({
          stock_id: '',
          is_buy: true,
          order_type: 'MARKET',
          quantity: 0,
          price: 0,
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to place order',
          description: error.response?.data?.data?.error || 'An error occurred',
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!orderData.stock_id) newErrors.stock_id = 'Stock is required';
    if (orderData.quantity <= 0) newErrors.quantity = 'Quantity must be positive';
    if (orderData.order_type === 'LIMIT' && orderData.price <= 0) {
      newErrors.price = 'Price must be positive for limit orders';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      placeMutation.mutate(orderData);
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
    return <Text>Loading stocks...</Text>;
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
                    onChange={(e) => handleChange('stock_id', e.target.value)}
                    placeholder="Select stock"
                    data-cy="stock-select"
                  >
                    {stocks?.map((stock: any) => (
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
                    onChange={(value) => handleChange('is_buy', value === 'BUY')}
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
                    onChange={(value) => handleChange('order_type', value)}
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
                    onChange={(_, value) => handleChange('quantity', value)}
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
                      onChange={(_, value) => handleChange('price', value)}
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