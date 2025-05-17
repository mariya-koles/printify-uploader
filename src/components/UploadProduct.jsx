import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  VStack,
  Heading,
  useToast,
  Text,
  Progress,
} from '@chakra-ui/react';
import axios from 'axios';

import ImageUploader from './ImageUploader';
import ProductDetails from './ProductDetails';
import ShippingSelector from './ShippingSelector';
import VariantDisplay from './VariantDisplay';

const API_BASE_URL = 'http://localhost:3001/api';

// Maximum image dimensions for Printify canvas products
const TARGET_IMAGE_SIZE = 6000;
const MIN_IMAGE_SIZE = 1000;

// Define the desired variant sizes and their prices
const DESIRED_VARIANTS = {
  '6" x 6"': 2000,
  '10" x 10"': 2500,
  '12" x 12"': 3000,
  '14" x 14"': 3500,
  '16" x 16"': 4000,
  '20" x 20"': 5000
};

const UploadProduct = ({ selectedShop, onBack }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [blueprintDetails, setBlueprintDetails] = useState(null);
  const [printProviders, setPrintProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providerVariants, setProviderVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState('standard');
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (selectedShop && isMounted) {
        await initializeProductDetails();
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [selectedShop]);

  // Function to resize image if needed
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const objectUrl = URL.createObjectURL(file);
      
      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
          cleanup();
          toast({
            title: 'Image too small',
            description: `Image must be at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels`,
            status: 'error',
            duration: 5000,
          });
          resolve(null);
          return;
        }

        if (width < TARGET_IMAGE_SIZE && height < TARGET_IMAGE_SIZE) {
          canvas.width = width;
          canvas.height = height;
        } else {
          if (width > height) {
            height = (height * TARGET_IMAGE_SIZE) / width;
            width = TARGET_IMAGE_SIZE;
          } else {
            width = (width * TARGET_IMAGE_SIZE) / height;
            height = TARGET_IMAGE_SIZE;
          }

          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          cleanup();
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95);
      };

      img.onerror = () => {
        cleanup();
        resolve(null);
      };

      img.src = objectUrl;
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const optimizedFile = await resizeImage(file);
        if (!optimizedFile) return;
        
        const reader = new FileReader();
        const readerPromise = new Promise((resolve, reject) => {
          reader.onloadend = () => {
            setSelectedImage({
              file: optimizedFile,
              preview: reader.result,
            });
            resolve();
          };
          reader.onerror = () => {
            reject(reader.error);
          };
          reader.readAsDataURL(optimizedFile);
        });

        await readerPromise;
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: 'Error processing image',
          description: 'Failed to process the selected image',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      let isAborted = false;

      reader.onload = async () => {
        if (isAborted) return;
        try {
          const base64Data = reader.result.split(',')[1];
          const response = await axios.post(
            `${API_BASE_URL}/uploads/images`,
            { 
              file_name: selectedImage.file.name,
              contents: base64Data 
            },
            {
              onUploadProgress: (progressEvent) => {
                if (!isAborted) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(percentCompleted);
                }
              },
            }
          );

          if (!isAborted) {
            console.log('Image upload API response:', response.data);
            if (!response.data || !response.data.id) {
              throw new Error('Invalid image upload response');
            }
            resolve(response.data.id);
          }
        } catch (error) {
          if (!isAborted) {
            console.error('Image upload error:', error);
            reject(error);
          }
        }
      };

      reader.onerror = () => {
        if (!isAborted) {
          reject(reader.error);
        }
      };

      reader.readAsDataURL(selectedImage.file);

      return () => {
        isAborted = true;
        reader.abort();
      };
    });
  };

  const initializeProductDetails = async () => {
    let isMounted = true;
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/catalog`);
      const blueprints = response.data.data || response.data || [];
      const canvasBlueprint = blueprints.find(
        (bp) => bp.title === 'Matte Canvas, Stretched, 1.25"'
      );

      if (!isMounted) return;

      if (canvasBlueprint) {
        setBlueprintDetails(canvasBlueprint);
        await fetchPrintProviders(canvasBlueprint.id);
      } else {
        toast({
          title: 'Blueprint not found',
          description: 'Canvas blueprint not found in catalog',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      if (!isMounted) return;
      console.error('Error initializing product details:', error);
      toast({
        title: 'Initialization error',
        description: error.response?.data?.message || 'Failed to initialize product details',
        status: 'error',
        duration: 5000,
      });
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  };

  const fetchPrintProviders = async (blueprintId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/catalog/${blueprintId}/print_providers`
      );
      
      const providers = response.data.data || [];
      setPrintProviders(providers);

      if (providers.length === 0) {
        throw new Error('No print providers available');
      }

      const provider = providers[0]; // We should only get Jondo from the backend
      if (!provider) {
        throw new Error('Print provider not found');
      }

      console.log('Selected print provider:', provider.title);
      setSelectedProvider(provider);
      
      // Fetch variants and shipping info in parallel
      await Promise.all([
        fetchProviderVariants(blueprintId, provider.id),
        fetchShippingInfo(blueprintId, provider.id)
      ]);
    } catch (error) {
      console.error('Error fetching print providers:', error);
      let errorMessage = 'Failed to fetch print providers';
      
      if (error.response?.data?.available_providers) {
        errorMessage += `. Available providers: ${error.response.data.available_providers.join(', ')}`;
      }
      
      toast({
        title: 'Error fetching print providers',
        description: error.response?.data?.message || errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true
      });
      
      // Reset provider-related state
      setSelectedProvider(null);
      setPrintProviders([]);
      setProviderVariants([]);
      setSelectedVariants([]);
      setShippingInfo(null);
    }
  };

  const fetchProviderVariants = async (blueprintId, providerId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/catalog/${blueprintId}/print_providers/${providerId}/variants`
      );

      // Ensure we have variants data
      const variants = response.data?.data || {};
      if (!variants || typeof variants !== 'object') {
        throw new Error('Invalid variants data received');
      }

      // Convert variants object to array and log raw data
      const variantsArray = Object.values(variants);

      // Create a normalized version of DESIRED_VARIANTS
      const normalizedDesiredVariants = {};
      Object.entries(DESIRED_VARIANTS).forEach(([key, value]) => {
        const normalized = key.replace(/["""″]/g, '"');
        normalizedDesiredVariants[normalized] = value;
      });

      // Match variants with our desired sizes
      const matchedVariants = variantsArray
        .map(variant => {
          // Get the size directly from options
          const variantSize = variant.options?.size;
          if (!variantSize) {
            return null;
          }

          // Normalize the variant size
          const normalizedSize = variantSize.replace(/["""″]/g, '"');

          // Check if this is a size we want
          if (!normalizedDesiredVariants.hasOwnProperty(normalizedSize)) {
            return null;
          }

          return {
            ...variant,
            price: normalizedDesiredVariants[normalizedSize],
            matchedSize: variantSize
          };
        })
        .filter(Boolean);

      // Sort variants by size
      const sortedVariants = matchedVariants.sort((a, b) => {
        const sizeA = parseInt(a.options.size);
        const sizeB = parseInt(b.options.size);
        return sizeA - sizeB;
      });

      if (sortedVariants.length === 0) {
        throw new Error('No matching variants found for the desired sizes');
      }

      setProviderVariants(variants);
      setSelectedVariants(sortedVariants);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: 'Error fetching variants',
        description: error.message || 'Failed to fetch variants',
        status: 'error',
        duration: 7000,
        isClosable: true
      });
    }
  };

  const fetchShippingInfo = async (blueprintId, providerId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/catalog/${blueprintId}/print_providers/${providerId}/shipping`
      );
      const shipping = response.data.data || response.data || {};
      
      // Convert shipping info to the expected format if needed
      const formattedShipping = {
        standard: {
          first_item: shipping.standard?.first_item || 0,
          additional_items: shipping.standard?.additional_items || 0,
          handling_time: shipping.standard?.handling_time || 0
        },
        express: {
          first_item: shipping.express?.first_item || 0,
          additional_items: shipping.express?.additional_items || 0,
          handling_time: shipping.express?.handling_time || 0
        }
      };

      setShippingInfo(formattedShipping);
    } catch (error) {
      console.error('Error fetching shipping info:', error);
      toast({
        title: 'Error fetching shipping info',
        description: error.message || 'Failed to fetch shipping information',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpload = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!selectedImage) {
        throw new Error('Please select an image');
      }
      if (!title) {
        throw new Error('Please enter a title');
      }
      if (!description) {
        throw new Error('Please enter a description');
      }
      if (!selectedProvider || selectedVariants.length === 0) {
        throw new Error('No variants selected');
      }
      if (!selectedShippingMethod) {
        throw new Error('Please select a shipping method');
      }

      // Upload image first
      const imageUploadResponse = await uploadImage();
      if (!imageUploadResponse) {
        throw new Error('Failed to upload image');
      }

      console.log('Image upload response:', imageUploadResponse);

      const productData = {
        title,
        description,
        blueprint_id: blueprintDetails.id,
        print_provider_id: selectedProvider.id,
        variants: selectedVariants.map(variant => ({
          id: variant.id,
          price: variant.price,
        })),
        print_areas: [
          {
            position: 'front',
            variant_ids: selectedVariants.map(variant => variant.id),
            placeholders: [
              {
                position: 'front',
                images: [
                  {
                    id: imageUploadResponse,
                    x: 0.5,
                    y: 0.5,
                    scale: 1,
                    angle: 0
                  }
                ]
              }
            ]
          }
        ],
        shipping_from: selectedShippingMethod,
      };

      console.log('Sending product data:', productData);

      const response = await axios.post(
        `${API_BASE_URL}/shops/${selectedShop}/products`,
        productData
      );

      toast({
        title: 'Success',
        description: 'Product uploaded successfully',
        status: 'success',
        duration: 5000,
      });

      // Reset form
      setSelectedImage(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);
    } catch (error) {
      console.error('Error uploading product:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload product',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Button onClick={onBack} alignSelf="flex-start">
          Back to Menu
        </Button>

        <Heading as="h1" size="xl" textAlign="center">
          Upload New Product
        </Heading>

        {isLoading && !selectedProvider && (
          <Progress size="xs" isIndeterminate colorScheme="blue" />
        )}

        {selectedProvider && (
          <>
            <Box p={4} borderRadius="lg" borderWidth="1px">
              <VStack spacing={2}>
                <Text color="gray.600" fontSize="md">
                  Print Provider: {selectedProvider.title}
                </Text>
              </VStack>
            </Box>

            <VStack spacing={6} align="stretch">
              <ImageUploader
                selectedImage={selectedImage}
                onImageChange={handleImageChange}
                uploadProgress={uploadProgress}
                isLoading={isLoading}
              />

              <ProductDetails
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                isLoading={isLoading}
              />

              {selectedProvider && selectedVariants.length > 0 && (
                <VariantDisplay
                  selectedVariants={selectedVariants}
                  selectedProvider={selectedProvider}
                />
              )}

              {shippingInfo && Object.keys(shippingInfo).length > 0 && (
                <ShippingSelector
                  shippingInfo={shippingInfo}
                  selectedShippingMethod={selectedShippingMethod}
                  onShippingMethodChange={setSelectedShippingMethod}
                  isLoading={isLoading}
                />
              )}

              <Button
                colorScheme="green"
                onClick={handleUpload}
                isLoading={isLoading}
                isDisabled={
                  !selectedImage ||
                  !title ||
                  !description ||
                  !selectedProvider ||
                  selectedVariants.length === 0 ||
                  !selectedShippingMethod
                }
                size="lg"
              >
                Upload Product
              </Button>

              {isLoading && (
                <Progress
                  size="xs"
                  isIndeterminate
                  colorScheme="blue"
                  width="100%"
                />
              )}
            </VStack>
          </>
        )}

        {!isLoading && !selectedProvider && (
          <Box textAlign="center" p={8}>
            <Text color="red.500">
              Failed to initialize product details. Please try again.
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default UploadProduct; 