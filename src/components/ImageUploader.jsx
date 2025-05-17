import React from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Box,
  Image,
  Progress,
  Text,
  VStack,
} from '@chakra-ui/react';

// Constants for image dimensions
const TARGET_IMAGE_SIZE = 6000;
const MIN_IMAGE_SIZE = 1000;

const ImageUploader = ({
  selectedImage,
  onImageChange,
  uploadProgress,
  isLoading,
}) => {
  return (
    <FormControl isRequired>
      <FormLabel>Upload Image</FormLabel>
      <Input
        type="file"
        accept="image/*"
        onChange={onImageChange}
        disabled={isLoading}
      />
      {selectedImage && (
        <VStack mt={4} spacing={4}>
          <Box boxSize="200px">
            <Image
              src={selectedImage.preview}
              alt="Preview"
              objectFit="contain"
              w="100%"
              h="100%"
            />
          </Box>
          <Text fontSize="sm" color="gray.600">
            Image dimensions should be at least {MIN_IMAGE_SIZE}x{MIN_IMAGE_SIZE}px
          </Text>
          {uploadProgress > 0 && (
            <Progress
              value={uploadProgress}
              width="100%"
              colorScheme="blue"
              size="sm"
            />
          )}
        </VStack>
      )}
    </FormControl>
  );
};

export default ImageUploader; 