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
import { accountService, handleApiError } from '../services/apiService';

const Account: React.FC = () => {
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch account details
  const { data: accountDetails, isLoading: accountLoading } = useQuery(
    'accountDetails',
    () => accountService.getAccountDetails()
  );

  // Fetch wallet balance
  const { data: walletData, isLoading: walletLoading } = useQuery(
    'walletBalance',
    () => accountService.getWalletBalance()
  );

  // Add money mutation
  const depositMutation = useMutation(
    (amount: number) => accountService.addMoney(amount),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('walletBalance');
        toast({
          title: 'Deposit successful',
          status: 'success',
          duration: 3000,
        });
        setIsDepositModalOpen(false);
        setDepositAmount(0);
      },
      onError: (error) => {
        toast({
          title: 'Deposit failed',
          description: handleApiError(error),
          status: 'error',
          duration: 5000,
        });
      },
    }
  );

  const handleDeposit = () => {
    if (depositAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    depositMutation.mutate(depositAmount);
  };

  if (accountLoading || walletLoading) {
    return (
      <Center h="200px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading mb={6}>Account Overview</Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Card>
              <CardHeader>
                <Heading size="md">Account Details</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Username</Text>
                    <Text>{accountDetails?.username}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Email</Text>
                    <Text>{accountDetails?.email}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Account Created</Text>
                    <Text>
                      {new Date(accountDetails?.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Wallet</Heading>
              </CardHeader>
              <CardBody>
                <Stat>
                  <StatLabel>Available Balance</StatLabel>
                  <StatNumber>${walletData?.balance.toFixed(2)}</StatNumber>
                  <StatHelpText>
                    Last updated: {new Date().toLocaleTimeString()}
                  </StatHelpText>
                  <Button
                    colorScheme="blue"
                    onClick={() => setIsDepositModalOpen(true)}
                    mt={4}
                  >
                    Add Money
                  </Button>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="md">Trading Summary</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Total Trades</Text>
                    <Text>{accountDetails?.total_trades || 0}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Active Orders</Text>
                    <Text>{accountDetails?.active_orders || 0}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Portfolio Value</Text>
                    <Text>${accountDetails?.portfolio_value?.toFixed(2) || '0.00'}</Text>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      </VStack>

      {/* Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Money to Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Amount to Deposit</FormLabel>
              <NumberInput
                min={0.01}
                step={0.01}
                precision={2}
                value={depositAmount}
                onChange={(_, value) => setDepositAmount(value)}
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
            >
              Deposit
            </Button>
            <Button variant="ghost" onClick={() => setIsDepositModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Account; 