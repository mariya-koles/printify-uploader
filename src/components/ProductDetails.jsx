import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  FormErrorMessage,
} from '@chakra-ui/react';

const ProductDetails = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  isLoading,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel>Product Title</FormLabel>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter product title"
          isDisabled={isLoading}
        />
        <FormErrorMessage>Title is required</FormErrorMessage>
      </FormControl>

      <FormControl>
        <FormLabel>Product Description</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter product description"
          size="sm"
          isDisabled={isLoading}
        />
      </FormControl>
    </VStack>
  );
};

export default ProductDetails; 