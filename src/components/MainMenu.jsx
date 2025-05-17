import React from 'react';
import {
  VStack,
  Button,
  Heading,
  Container,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

const MainMenu = ({ onNavigate }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const buttonBgColor = useColorModeValue('teal.500', 'teal.200');
  const buttonTextColor = useColorModeValue('white', 'gray.800');

  return (
    <Container maxW="container.md" py={10}>
      <VStack
        spacing={8}
        p={8}
        bg={bgColor}
        borderRadius="lg"
        boxShadow="md"
        align="stretch"
      >
        <Heading textAlign="center">Printify Product Manager</Heading>
        <Text textAlign="center" fontSize="lg">
          Select an option to manage your Printify products
        </Text>
        
        <Button
          size="lg"
          bg={buttonBgColor}
          color={buttonTextColor}
          _hover={{ opacity: 0.9 }}
          onClick={() => onNavigate('upload')}
        >
          Upload New Product
        </Button>
        
        <Button
          size="lg"
          bg={buttonBgColor}
          color={buttonTextColor}
          _hover={{ opacity: 0.9 }}
          onClick={() => onNavigate('update')}
        >
          Update Products
        </Button>
      </VStack>
    </Container>
  );
};

export default MainMenu; 