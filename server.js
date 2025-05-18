import express from 'express';
import cors from 'cors';
import axios from 'axios';
import PropertiesReader from 'properties-reader';

const app = express();
const port = 3001;

// Read the API token from secrets file
const properties = PropertiesReader('D:\\secrets\\printify-secrets.properties');
const API_TOKEN = properties.get('apiKey');

if (!API_TOKEN) {
  console.error('Error: API token not found in secrets file');
  process.exit(1);
}

app.use(cors());
// Increase the JSON payload limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DESIRED_SIZES = ['6x6', '10x10', '12x12', '14x14', '16x16', '20x20'];

// Proxy endpoint for getting shops
app.get('/api/shops', async (req, res) => {
  try {
    const response = await axios.get('https://api.printify.com/v1/shops.json', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    // Ensure we're sending back the correct data structure
    const shops = response.data;
    res.json({ data: Array.isArray(shops) ? shops : [] });
  } catch (error) {
    console.error('Error fetching shops:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for uploading images
app.post('/api/uploads/images', async (req, res) => {
  const imageData = req.body;

  try {
    const response = await axios.post('https://api.printify.com/v1/uploads/images.json', imageData, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error uploading image:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for creating a product
app.post('/api/shops/:shopId/products', async (req, res) => {
  const { shopId } = req.params;
  const productData = req.body;

  try {
    const response = await axios.post(`https://api.printify.com/v1/shops/${shopId}/products.json`, productData, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error creating product:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for getting catalog
app.get('/api/catalog', async (req, res) => {
  try {
    const response = await axios.get('https://api.printify.com/v1/catalog/blueprints.json', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    // Ensure we're sending a consistent data format
    const blueprints = response.data.data || response.data || [];
    res.json({ data: blueprints });
  } catch (error) {
    console.error('Error fetching catalog:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for getting blueprint details
app.get('/api/catalog/:blueprintId', async (req, res) => {
  const { blueprintId } = req.params;
  try {
    const response = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}.json`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching blueprint details:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for getting print providers for a blueprint
app.get('/api/catalog/:blueprintId/print_providers', async (req, res) => {
  const { blueprintId } = req.params;
  try {
    const response = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers.json`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    // Extract providers from response and ensure it's an array
    let providers = [];
    if (response.data && response.data.data) {
      providers = response.data.data;
    } else if (Array.isArray(response.data)) {
      providers = response.data;
    }

    // Try different ways to find Jondo provider
    const jondoProvider = providers.find(p => 
      p.title?.toLowerCase().includes('jondo') || 
      p.name?.toLowerCase().includes('jondo') ||
      p.id?.toString() === '1' // Jondo is often provider ID 1
    );

    if (!jondoProvider) {
      return res.status(404).json({
        message: 'Jondo provider not found',
        available_providers: providers.map(p => p.title)
      });
    }
    
    res.json({ data: [jondoProvider] });
  } catch (error) {
    console.error('Error fetching print providers:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Error fetching print providers',
      error: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for getting variants for a specific print provider
app.get('/api/catalog/:blueprintId/print_providers/:providerId/variants', async (req, res) => {
  const { blueprintId, providerId } = req.params;
  try {
    const response = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    // Handle different response structures
    let variants = {};
    if (response.data?.variants) {
      variants = response.data.variants;
    } else if (response.data?.data?.variants) {
      variants = response.data.data.variants;
    } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
      variants = response.data;
    }

    // Validate variant structure
    const validVariants = Object.entries(variants).reduce((acc, [key, variant]) => {
      if (variant && variant.title && variant.id) {
        acc[key] = variant;
      }
      return acc;
    }, {});

    if (Object.keys(validVariants).length === 0) {
      return res.status(404).json({
        message: 'No valid variants found',
        error: 'The API response did not contain any valid variants'
      });
    }

    res.json({ data: validVariants });
  } catch (error) {
    console.error('Error fetching variants:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Error fetching variants',
      error: error.response?.data || error.message,
      details: {
        blueprintId,
        providerId,
        errorStatus: error.response?.status,
        errorMessage: error.message
      }
    });
  }
});

// Proxy endpoint for getting products for a shop
app.get('/api/shops/:shopId/products', async (req, res) => {
  const { shopId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  try {
    const response = await axios.get(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      params: {
        page,
        limit
      }
    });
    
    // Ensure we're sending a consistent data format with pagination info
    const products = response.data.data || response.data || [];
    res.json({
      data: products,
      total: response.data.total || products.length,
      current_page: parseInt(page),
      last_page: response.data.last_page || 1
    });
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for getting all print providers
app.get('/api/print-providers', async (req, res) => {
  try {
    const response = await axios.get('https://api.printify.com/v1/catalog/print_providers.json', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    // Get all providers and filter for just Jondo and Sensaria
    const allProviders = response.data.data || response.data || [];
    const filteredProviders = allProviders.filter(provider => 
      provider.title === 'Jondo' || provider.title === 'Sensaria'
    );
    
    res.json(filteredProviders);
  } catch (error) {
    console.error('Error fetching print providers:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Failed to fetch print providers'
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
  console.log('Using API token from secrets file');
}); 