import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tradingService } from '../services/apiService';

interface WalletResponse {
  success: boolean;
  data: {
    balance: number;
    error?: string;
  };
}

const Account: React.FC = () => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading, error: walletError } = useQuery(
    'walletBalance',
    () => tradingService.getWalletBalance(),
    {
      retry: 3,
      onError: (error: any) => {
        const errorMessage = error.response?.data?.data?.error || error.message || 'Failed to fetch wallet balance';
        toast({
          title: 'Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  );

  // Add money mutation
  const depositMutation = useMutation(
    (amount: number) => tradingService.addFunds({
      token: localStorage.getItem('token') || '',
      amount: amount
    }),
    {
      onSuccess: (response: WalletResponse) => {
        if (response.success) {
          queryClient.invalidateQueries('walletBalance');
          toast({
            title: 'Deposit successful',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          setIsDepositModalOpen(false);
          setDepositAmount(0);
        } else {
          toast({
            title: 'Failed to add funds',
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
          title: 'Failed to add funds',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleDeposit = () => {
    const amount = Number(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a positive amount',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    depositMutation.mutate(amount);
  };

  if (walletLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (walletError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color="red.500">Failed to load wallet information. Please try again later.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading mb={6}>Wallet Management</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="md">Available Balance</Heading>
              </CardHeader>
              <CardBody>
                <Stat>
                  <StatLabel>Current Balance</StatLabel>
                  <StatNumber>${walletData?.data?.balance?.toFixed(2) || '0.00'}</StatNumber>
                  <StatHelpText>
                    Last updated: {new Date().toLocaleTimeString()}
                  </StatHelpText>
                  <Button
                    colorScheme="blue"
                    onClick={() => setIsDepositModalOpen(true)}
                    mt={4}
                    data-cy="add-funds-button"
                  >
                    Add Funds
                  </Button>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Deposit Modal */}
        <Modal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add Funds to Wallet</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel>Amount to Deposit ($)</FormLabel>
                <NumberInput
                  min={0.01}
                  step={0.01}
                  precision={2}
                  value={depositAmount}
                  onChange={(valueString: string) => setDepositAmount(Number(valueString))}
                  data-cy="deposit-amount-input"
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={handleDeposit}
                isLoading={depositMutation.isLoading}
                data-cy="confirm-deposit"
              >
                Deposit
              </Button>
              <Button variant="ghost" onClick={() => setIsDepositModalOpen(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default Account; 