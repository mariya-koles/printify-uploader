import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Heading,
  Text,
} from '@chakra-ui/react';

const VariantDisplay = React.memo(({ selectedVariants, selectedProvider }) => {
  if (!selectedProvider || !selectedVariants?.length) {
    return null;
  }

  // Helper function to format orientation text
  const formatOrientation = (orientation) => {
    if (!orientation) return 'Square';
    return orientation.charAt(0).toUpperCase() + orientation.slice(1);
  };

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <Heading size="md" mb={4}>
        Print Provider: {selectedProvider.title}
      </Heading>
      <Text mb={4} color="gray.600">
        Selected canvas sizes and prices:
      </Text>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Size</Th>
            <Th>Orientation</Th>
            <Th>Price</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {selectedVariants.map((variant) => {
            const size = variant.options?.size || variant.matchedSize || variant.title;
            const orientation = variant.options?.orientation || variant.matchedOrientation || 'square';
            
            return (
              <Tr key={variant.id}>
                <Td fontWeight="medium">{size}</Td>
                <Td>
                  <Badge
                    colorScheme={orientation === 'square' ? 'purple' : 'blue'}
                    px={2}
                    py={1}
                    borderRadius="full"
                  >
                    {formatOrientation(orientation)}
                  </Badge>
                </Td>
                <Td>${(variant.price / 100).toFixed(2)}</Td>
                <Td>
                  <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                    Selected
                  </Badge>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
});

VariantDisplay.displayName = 'VariantDisplay';

export default VariantDisplay; 