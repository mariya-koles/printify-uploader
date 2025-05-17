import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  Heading,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const UpdateProducts = ({ selectedShop, onBack }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (selectedShop) {
      fetchProducts();
    }
  }, [selectedShop]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/shops/${selectedShop}/products`);
      const fetchedProducts = response.data.data || [];
      
      // Log the complete products data
      console.log('Fetched products:', JSON.stringify(fetchedProducts, null, 2));
      
      // Log a summary of each product
      fetchedProducts.forEach((product, index) => {
        console.log(`\nProduct ${index + 1} Summary:`);
        console.log('- Basic Info:');
        console.log(`  • ID: ${product.id}`);
        console.log(`  • Title: ${product.title}`);
        console.log(`  • Description: ${product.description?.substring(0, 100)}...`);
        
        console.log('- Variants:');
        product.variants?.forEach(variant => {
          console.log(`  • ${variant.title}: $${variant.price / 100} (ID: ${variant.id})`);
        });
        
        console.log('- Print Areas:');
        product.print_areas?.forEach(area => {
          console.log(`  • Position: ${area.position}`);
          console.log(`  • Images: ${area.placeholders?.[0]?.images?.length || 0}`);
        });
        
        console.log('- Status Info:');
        console.log(`  • Visible: ${product.visible}`);
        console.log(`  • Created: ${product.created_at}`);
        console.log(`  • Updated: ${product.updated_at}`);
        console.log('----------------------------------------');
      });
      
      setProducts(fetchedProducts);
    } catch (error) {
      toast({
        title: 'Error fetching products',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={5} align="stretch">
        <Button onClick={onBack} alignSelf="flex-start">
          Back to Menu
        </Button>
        
        <Heading size="lg">Update Products</Heading>
        
        {isLoading ? (
          <Spinner size="xl" alignSelf="center" />
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {products.map((product) => (
                <Tr key={product.id}>
                  <Td>{product.title}</Td>
                  <Td>{product.description}</Td>
                  <Td>{product.status}</Td>
                  <Td>
                    <Button size="sm" colorScheme="teal">
                      Edit
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>
    </Container>
  );
};

export default UpdateProducts; 