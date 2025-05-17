import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stack,
  Text,
  Box,
} from '@chakra-ui/react';

const ShippingSelector = React.memo(({
  shippingInfo,
  selectedShippingMethod,
  onShippingMethodChange,
  isLoading,
}) => {
  if (!shippingInfo) return null;

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4}>
      <FormControl isRequired>
        <FormLabel>Shipping Method</FormLabel>
        <RadioGroup
          value={selectedShippingMethod}
          onChange={onShippingMethodChange}
          isDisabled={isLoading}
        >
          <Stack direction="column" spacing={4}>
            {Object.entries(shippingInfo).map(([method, info]) => (
              <Box
                key={method}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
                cursor="pointer"
              >
                <Radio value={method} w="100%">
                  <Stack direction="column" spacing={1}>
                    <Text fontWeight="medium">
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      First item: ${(info.first_item / 100).toFixed(2)}
                      {info.additional_items > 0 && 
                        ` + $${(info.additional_items / 100).toFixed(2)} per additional item`}
                    </Text>
                    {info.handling_time && (
                      <Text fontSize="sm" color="gray.500">
                        Handling time: {info.handling_time} days
                      </Text>
                    )}
                  </Stack>
                </Radio>
              </Box>
            ))}
          </Stack>
        </RadioGroup>
      </FormControl>
    </Box>
  );
});

ShippingSelector.displayName = 'ShippingSelector';

export default ShippingSelector; 