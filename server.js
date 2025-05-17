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
    console.log('Fetching shops from Printify...');
    const response = await axios.get('https://api.printify.com/v1/shops.json', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    console.log('Shops response:', response.data);
    // Ensure we're sending back the correct data structure
    const shops = response.data;
    res.json({ data: Array.isArray(shops) ? shops : [] });
  } catch (error) {
    console.error('Error fetching shops. Status:', error.response?.status);
    console.error('Error details:', error.response?.data);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for uploading images
app.post('/api/uploads/images', async (req, res) => {
  const imageData = req.body;

  try {
    console.log('Uploading image to Printify...');
    const response = await axios.post('https://api.printify.com/v1/uploads/images.json', imageData, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    console.log('Image upload successful');
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
    console.log('Creating product in Printify...');
    const response = await axios.post(`https://api.printify.com/v1/shops/${shopId}/products.json`, productData, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Product creation successful');
    res.json(response.data);
  } catch (error) {
    console.error('Error creating product:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

// Proxy endpoint for getting catalog
app.get('/api/catalog', async (req, res) => {
  try {
    console.log('Fetching catalog from Printify...');
    const response = await axios.get('https://api.printify.com/v1/catalog/blueprints.json', {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    // Ensure we're sending a consistent data format
    const blueprints = response.data.data || response.data || [];
    console.log('Found blueprints:', blueprints.length);
    
    // Log the titles to help with debugging
    console.log('Blueprint titles:', blueprints.map(b => b.title));
    
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
    console.log(`Fetching blueprint ${blueprintId} details...`);
    const response = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}.json`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    console.log('Blueprint response structure:', {
      hasData: !!response.data,
      isArray: Array.isArray(response.data),
      hasDataProperty: !!response.data.data
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
    console.log(`Fetching print providers for blueprint ${blueprintId}...`);
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

    console.log('Available providers:', providers.map(p => ({
      id: p.id,
      title: p.title
    })));
    
    // Try different ways to find Jondo provider
    const jondoProvider = providers.find(p => 
      p.title?.toLowerCase().includes('jondo') || 
      p.name?.toLowerCase().includes('jondo') ||
      p.id?.toString() === '1' // Jondo is often provider ID 1
    );

    if (!jondoProvider) {
      console.log('No Jondo provider found among available providers');
      // Instead of sending empty array, send error to trigger proper error handling
      return res.status(404).json({
        message: 'Jondo provider not found',
        available_providers: providers.map(p => p.title)
      });
    }

    console.log('Found Jondo provider:', {
      id: jondoProvider.id,
      title: jondoProvider.title
    });
    
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
    console.log(`Fetching variants for blueprint ${blueprintId} and provider ${providerId}...`);
    const response = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );

    // Log the raw response for debugging
    console.log('Raw variants response:', JSON.stringify(response.data, null, 2));

    // Handle different response structures
    let variants = {};
    if (response.data?.variants) {
      variants = response.data.variants;
    } else if (response.data?.data?.variants) {
      variants = response.data.data.variants;
    } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
      variants = response.data;
    }

    // Log the extracted variants
    console.log('Extracted variants:', {
      count: Object.keys(variants).length,
      sampleTitles: Object.values(variants)
        .slice(0, 3)
        .map(v => v?.title || 'No title')
    });

    // Validate variant structure
    const validVariants = Object.entries(variants).reduce((acc, [key, variant]) => {
      if (variant && variant.title && variant.id) {
        acc[key] = variant;
      } else {
        console.log('Skipping invalid variant:', variant);
      }
      return acc;
    }, {});

    // Log validation results
    console.log('Validation results:', {
      originalCount: Object.keys(variants).length,
      validCount: Object.keys(validVariants).length
    });

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

// Proxy endpoint for getting shipping information for a specific print provider
app.get('/api/catalog/:blueprintId/print_providers/:providerId/shipping', async (req, res) => {
  const { blueprintId, providerId } = req.params;
  try {
    console.log(`Fetching shipping info for blueprint ${blueprintId} and provider ${providerId}...`);
    const response = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    );
    console.log('Shipping response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching shipping info:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running at http://localhost:${port}`);
  console.log('Using API token from secrets file');
}); 