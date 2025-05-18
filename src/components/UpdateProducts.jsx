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
  HStack,
  Heading,
  useToast,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Image,
  Box,
  Text,
  Checkbox,
  Badge,
  Flex,
  ButtonGroup,
  Progress,
} from '@chakra-ui/react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const ITEMS_PER_PAGE = 50; // Printify's max limit

const UpdateProducts = ({ selectedShop, onBack }) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [printProvider, setPrintProvider] = useState('all');
  const [printProviders, setPrintProviders] = useState([]);
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const toast = useToast();

  // Add new effect to log product count when loading completes
  useEffect(() => {
    if (loadingProgress === 100 && products.length > 0) {
      const jondoCount = products.filter(p => p.print_provider_id === 105).length;
      const sensariaCount = products.filter(p => p.print_provider_id === 2).length;
      
      console.log('Loading Complete! Product Counts:', {
        total: products.length,
        jondo: jondoCount,
        sensaria: sensariaCount
      });
    }
  }, [loadingProgress, products]);

  useEffect(() => {
    if (selectedShop) {
      // Set static print providers
      setPrintProviders([
        { id: 105, title: 'Jondo' },
        { id: 2, title: 'Sensaria' }
      ]);
      // Reset state when shop changes
      setProducts([]);
      setCurrentPage(1);
      setTotalProducts(0);
      fetchInitialProducts();
    }
  }, [selectedShop]);

  const fetchInitialProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/shops/${selectedShop}/products`, {
        params: {
          page: 1,
          limit: ITEMS_PER_PAGE
        }
      });

      const { data, total } = response.data;
      const filteredData = data.filter(product => 
        product.print_provider_id === 105 || product.print_provider_id === 2
      );
      setProducts(filteredData);
      setTotalProducts(total);
      setLoadingProgress((1 / Math.ceil(total / ITEMS_PER_PAGE)) * 100);

      // Start fetching remaining pages
      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      if (totalPages > 1) {
        fetchRemainingPages(totalPages);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const fetchRemainingPages = async (totalPages) => {
    try {
      for (let page = 2; page <= totalPages; page++) {
        const response = await axios.get(`${API_BASE_URL}/shops/${selectedShop}/products`, {
          params: {
            page,
            limit: ITEMS_PER_PAGE
          }
        });

        const { data } = response.data;
        const filteredData = data.filter(product => 
          product.print_provider_id === 105 || product.print_provider_id === 2
        );
        
        setProducts(prev => [...prev, ...filteredData]);
        setLoadingProgress((page / totalPages) * 100);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (error) => {
    toast({
      title: 'Error fetching products',
      description: error.response?.data?.message || 'An error occurred',
      status: 'error',
      duration: 5000,
    });
  };

  // Filter products based on search query and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrintProvider = printProvider === 'all' || product.print_provider_id === parseInt(printProvider);
    const matchesStatus = status === 'all' || product.visible === (status === 'published');
    return matchesSearch && matchesPrintProvider && matchesStatus;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={5} align="stretch">
        <Button onClick={onBack} alignSelf="flex-start">
          Back to Menu
        </Button>
        
        <Heading size="lg">My Products</Heading>

        {/* Search and Filters */}
        <HStack spacing={4}>
          <InputGroup maxW="400px">
            <Input
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          <Select
            value={printProvider}
            onChange={(e) => setPrintProvider(e.target.value)}
            maxW="200px"
          >
            <option value="all">All Print Providers</option>
            {printProviders.map(provider => (
              <option key={`provider-${provider.id}`} value={provider.id}>
                {provider.title}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxW="200px"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </Select>
        </HStack>

        {/* Loading Progress */}
        {loadingProgress < 100 && (
          <Progress value={loadingProgress} size="xs" colorScheme="blue" />
        )}

        {isLoading && products.length === 0 ? (
          <Spinner size="xl" alignSelf="center" />
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th width="30px">
                  <Checkbox
                    isChecked={selectedProducts.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    size="lg"
                    colorScheme="blue"
                    borderColor="gray.400"
                  />
                </Th>
                <Th>Product</Th>
                <Th>Status</Th>
                <Th width="120px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredProducts.map((product, index) => {
                // Create a stable unique key using product properties and index
                const uniqueId = `${product.id}-${product.print_provider_id}-${index}`;
                return (
                  <Tr key={uniqueId}>
                    <Td>
                      <Checkbox
                        isChecked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        size="lg"
                        colorScheme="blue"
                        borderColor="gray.400"
                      />
                    </Td>
                    <Td>
                      <HStack spacing={3}>
                        <Image
                          src={product.images?.[0]?.src || 'placeholder.jpg'}
                          alt={product.title}
                          boxSize="50px"
                          objectFit="cover"
                          cursor="pointer"
                          onClick={() => {
                            console.log('Product Details:', {
                              id: product.id,
                              title: product.title,
                              print_provider_id: product.print_provider_id,
                              print_provider: product.print_provider,
                              visible: product.visible,
                              variants: product.variants,
                              images: product.images,
                              description: product.description,
                              blueprint_id: product.blueprint_id,
                              created_at: product.created_at,
                              updated_at: product.updated_at
                            });
                          }}
                          _hover={{
                            transform: 'scale(1.05)',
                            transition: 'transform 0.2s'
                          }}
                        />
                        <Box>
                          <Text fontWeight="medium">{product.title}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {product.print_provider?.title || 'Generic brand'} • 1 size • 1 depth • Total 1 variant
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={product.visible ? 'green' : 'yellow'}
                        variant="subtle"
                        px={2}
                        py={1}
                      >
                        {product.visible ? 'Published' : 'Click to publish'}
                      </Badge>
                    </Td>
                    <Td>
                      <ButtonGroup size="sm" spacing={2}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </ButtonGroup>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </VStack>
    </Container>
  );
};

export default UpdateProducts; 