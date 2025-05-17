import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Text,
  Image as ChakraImage,
  Select,
  Textarea,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  RadioGroup,
  Radio,
  Stack,
  ChakraProvider,
} from '@chakra-ui/react';
import axios from 'axios';

import ShopSelector from './components/ShopSelector';
import ImageUploader from './components/ImageUploader';
import ProductDetails from './components/ProductDetails';
import VariantDisplay from './components/VariantDisplay';
import MainMenu from './components/MainMenu';
import UploadProduct from './components/UploadProduct';
import UpdateProducts from './components/UpdateProducts';

const API_BASE_URL = 'http://localhost:3001/api';

// Maximum image dimensions for Printify canvas products
const TARGET_IMAGE_SIZE = 6000;
const MIN_IMAGE_SIZE = 1000;

// Define the desired variant sizes and their prices
const DESIRED_VARIANTS = {
  '6x6': 2000,
  '12x12': 3000,
  '14x14': 3500,
  '16x16': 4000,
  '20x20': 5000
};

// Define exact variant titles we want to match
const EXACT_VARIANTS = [
  '6" x 6" / 1.25"',
  '12" x 12" / 1.25"',
  '14" x 14" / 1.25"',
  '16" x 16" / 1.25"',
  '20" x 20" / 1.25"'
];

function App() {
  const [currentView, setCurrentView] = useState('menu');
  const [selectedShop, setSelectedShop] = useState('');
  const [shops, setShops] = useState([]);
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
  const toast = useToast();

  useEffect(() => {
    handleGetShops();
  }, []);

  const handleGetShops = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/shops`);
      const shopsData = response.data.data || response.data || [];
      
      if (shopsData.length === 0) {
        toast({
          title: 'No shops found',
          description: 'No shops were found for this account',
          status: 'error',
          duration: 5000,
        });
        return;
      }

      // Automatically select the first shop but don't initialize product details
      setShops(shopsData);
      setSelectedShop(shopsData[0].id);
      
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: 'Error retrieving shops',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'upload':
        return (
          <UploadProduct
            selectedShop={selectedShop}
            onBack={() => setCurrentView('menu')}
          />
        );
      case 'update':
        return (
          <UpdateProducts
            selectedShop={selectedShop}
            onBack={() => setCurrentView('menu')}
          />
        );
      default:
        return <MainMenu onNavigate={handleNavigation} />;
    }
  };

  // Function to resize image if needed
  const resizeImage = (file) => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Check if image is too small
        if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) {
          toast({
            title: 'Image too small',
            description: `Image must be at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels`,
            status: 'error',
            duration: 5000,
          });
          resolve(null);
          return;
        }

        // For images smaller than target size, maintain original dimensions
        if (width < TARGET_IMAGE_SIZE && height < TARGET_IMAGE_SIZE) {
          canvas.width = width;
          canvas.height = height;
        } else {
          // Calculate new dimensions while maintaining aspect ratio
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
        
        // Convert to JPEG format with high quality
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.95); // Increased quality for better print results
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const optimizedFile = await resizeImage(file);
        if (!optimizedFile) {
          return; // Image was too small, error already shown
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage({
            file: optimizedFile,
            preview: reader.result,
          });
        };
        reader.readAsDataURL(optimizedFile);
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
      reader.onload = async () => {
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
                const progress = (progressEvent.loaded / progressEvent.total) * 100;
                setUploadProgress(Math.round(progress));
              },
            }
          );
          resolve(response.data);
        } catch (error) {
          console.error('Error uploading image:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(selectedImage.file);
    });
  };

  // Function to fetch variants for a specific print provider
  const fetchProviderVariants = async (blueprintId, providerId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/catalog/${blueprintId}/print_providers/${providerId}/variants`
      );
      
      const providerData = response.data;
      if (!providerData || !providerData.variants) {
        throw new Error('Invalid variant data received');
      }

      const variants = providerData.variants;
      
      // Log only the raw variants data
      console.log('All available variants:', variants);

      // Define exact titles we want to match
      const allowedTitles = [
        '6" x 6" / 1.25"',
        '12" x 12" / 1.25"',
        '14" x 14" / 1.25"',
        '16" x 16" / 1.25"',
        '20" x 20" / 1.25"'
      ];

      // Filter variants to only include exact matches
      const desiredVariants = Object.values(variants)
        .filter(variant => allowedTitles.includes(variant.title))
        .map(variant => {
          const size = variant.title.match(/^(\d+)"/)[1];
          const sizeStr = `${size}x${size}`;
          
          return {
            ...variant,
            price: DESIRED_VARIANTS[sizeStr],
            is_enabled: true,
            options: {
              ...(variant.options || {}),
              size: sizeStr,
              orientation: 'square'
            },
            matchedSize: sizeStr
          };
        });

      // Sort variants by size
      const sortedVariants = desiredVariants.sort((a, b) => {
        const sizeA = parseInt(a.options.size.split('x')[0]);
        const sizeB = parseInt(b.options.size.split('x')[0]);
        return sizeA - sizeB;
      });

      setProviderVariants(variants);
      setSelectedVariants(sortedVariants);
      return sortedVariants;
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: 'Error fetching variants',
        description: error.message || 'Failed to fetch variants',
        status: 'error',
        duration: 5000,
      });
      return [];
    }
  };

  // Function to fetch print providers for a blueprint
  const fetchPrintProviders = async (blueprintId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/catalog/${blueprintId}/print_providers`);
      const providers = Array.isArray(response.data) ? response.data : [];
      setPrintProviders(providers);
      
      // Get the Jondo provider (should be the only one in the array)
      const jondoProvider = providers[0];
      
      if (jondoProvider) {
        setSelectedProvider(jondoProvider);
        
        // Wait for variants to be fetched
        const variants = await fetchProviderVariants(blueprintId, jondoProvider.id);
        
        if (!variants.length) {
          throw new Error('Failed to load product details');
        }
      } else {
        throw new Error('Jondo provider not found');
      }
      
      return providers;
    } catch (error) {
      console.error('Error fetching print providers:', error);
      toast({
        title: 'Error fetching print providers',
        description: error.message || 'Failed to fetch print providers',
        status: 'error',
        duration: 5000,
      });
      return [];
    }
  };

  // Function to initialize product details after shop selection
  const initializeProductDetails = async () => {
    try {
      setIsLoading(true);
      
      // First get the catalog to find the Matte Canvas blueprint
      const catalogResponse = await axios.get(`${API_BASE_URL}/catalog`);
      const blueprints = catalogResponse.data.data || catalogResponse.data || [];
      const matteCanvas = blueprints.find(
        blueprint => blueprint.title === 'Matte Canvas, Stretched, 1.25"'
      );

      if (!matteCanvas) {
        throw new Error('Matte Canvas blueprint not found in catalog');
      }

      // Store blueprint details
      const result = {
        blueprintId: matteCanvas.id,
        printProviderId: null,
        variants: []
      };
      setBlueprintDetails(result);

      // Fetch print providers and their details
      await fetchPrintProviders(matteCanvas.id);
      
    } catch (error) {
      console.error('Error initializing product details:', error);
      toast({
        title: 'Error initializing product details',
        description: error.message || 'Failed to initialize product details',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update the shop selection handler
  const handleShopSelect = async (shopId) => {
    setSelectedShop(shopId);
    if (shopId) {
      await initializeProductDetails();
    }
  };

  // Update verifyBlueprintDetails to use existing data
  const verifyBlueprintDetails = async () => {
    try {
      if (!blueprintDetails) {
        throw new Error('Blueprint details not found');
      }

      if (!selectedProvider) {
        throw new Error('No print provider selected');
      }

      // Update the result with selected provider details
      const result = {
        ...blueprintDetails,
        printProviderId: selectedProvider.id,
        variants: selectedVariants
      };

      return result;
    } catch (error) {
      console.error('Error verifying blueprint details:', error);
      toast({
        title: 'Error verifying product details',
        description: error.message || 'Failed to verify product details',
        status: 'error',
        duration: 5000,
      });
      return null;
    }
  };

  const handleUpload = async () => {
    if (!selectedShop) {
      toast({
        title: 'Shop not selected',
        description: 'Please select a shop first',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!selectedImage) {
      toast({
        title: 'Image not selected',
        description: 'Please upload an image',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!title) {
      toast({
        title: 'Title required',
        description: 'Please enter a product title',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!description) {
      toast({
        title: 'Description required',
        description: 'Please enter a product description',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!selectedProvider || selectedVariants.length === 0) {
      toast({
        title: 'Product variants not loaded',
        description: 'Please wait for product variants to load or try selecting the shop again',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);

      // Verify blueprint details first
      const details = await verifyBlueprintDetails();
      if (!details) {
        throw new Error('Failed to verify product details');
      }

      // First upload the image
      const imageUploadResult = await uploadImage();
      if (!imageUploadResult) {
        throw new Error('Failed to upload image');
      }

      // Create the product with the uploaded image and selected variants
      const productData = {
        title,
        description,
        blueprint_id: details.blueprintId,
        print_provider_id: selectedProvider.id,
        shipping_template_id: null,
        print_details: {
          format: "jpg",
          print_on_side: "regular"
        },
        variants: selectedVariants.map(variant => ({
          id: variant.id,
          price: variant.price,
          is_enabled: true
        })),
        print_areas: [
          {
            variant_ids: selectedVariants.map(v => v.id),
            placeholders: [
              {
                position: "front",
                images: [
                  {
                    id: imageUploadResult.id,
                    x: 0.5,
                    y: 0.5,
                    scale: 1,
                    angle: 0
                  }
                ]
              }
            ]
          }
        ]
      };

      console.log('Uploading product with data:', productData);

      const response = await axios.post(
        `${API_BASE_URL}/shops/${selectedShop}/products`,
        productData
      );

      toast({
        title: 'Product created successfully',
        description: 'Your product has been uploaded to Printify',
        status: 'success',
        duration: 5000,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Error creating product',
        description: error.response?.data?.message || error.message || 'An error occurred while creating the product',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider>
      {renderCurrentView()}
    </ChakraProvider>
  );
}

export default App; 