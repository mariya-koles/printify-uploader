import React from 'react';
import {
  FormControl,
  FormLabel,
  Select,
  FormErrorMessage,
} from '@chakra-ui/react';

const ShopSelector = ({ 
  shops, 
  selectedShop, 
  onShopSelect, 
  isLoading 
}) => {
  return (
    <FormControl isRequired>
      <FormLabel>Select Shop</FormLabel>
      <Select
        placeholder="Select a shop"
        value={selectedShop}
        onChange={(e) => onShopSelect(e.target.value)}
        isDisabled={isLoading}
      >
        {shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.title || shop.name}
          </option>
        ))}
      </Select>
      <FormErrorMessage>Please select a shop</FormErrorMessage>
    </FormControl>
  );
};

export default ShopSelector; 