# Printify Uploader

A React application for uploading and managing products on Printify, specifically designed for canvas products with Jondo as the print provider.

## Features

- Upload images for canvas products
- Automatic image optimization and resizing
- Support for multiple canvas sizes (6x6" to 20x20")
- Pre-configured variant pricing
- Integration with Printify API

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Printify account with API access

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd printify-uploader
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Printify API credentials:
```
VITE_PRINTIFY_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

1. Select your shop from the available options
2. Upload your image (minimum 1000x1000px)
3. Enter product details (title, description)
4. Review the available canvas sizes
5. Submit the product for creation

## Development

This project uses:
- React with Vite
- Chakra UI for components
- Axios for API requests

## License

MIT 