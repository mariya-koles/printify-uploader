import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Text,
  HStack,
  VStack,
  Button,
  Flex,
} from '@chakra-ui/react';

const ColorPicker = ({ selectedColor, onColorChange, selectedImage }) => {
  const canvasRef = useRef(null);
  const magnifierRef = useRef(null);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate aspect ratio to fit within 300px width
        const scale = Math.min(300 / img.width, 300 / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      
      img.src = selectedImage.preview;
    }
  }, [selectedImage]);

  const updateMagnifier = (e) => {
    if (!isPickingColor || !canvasRef.current || !magnifierRef.current) return;

    const canvas = canvasRef.current;
    const magnifier = magnifierRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update magnifier position
    const magnifierSize = 100; // Size of the magnifier
    setMagnifierPos({
      x: Math.min(Math.max(x - magnifierSize/2, 0), canvas.width),
      y: Math.max(y - magnifierSize - 10, 0) // Position above cursor
    });

    // Draw magnified portion
    const ctx = magnifier.getContext('2d');
    const zoom = 4;
    const size = magnifierSize / zoom;

    ctx.clearRect(0, 0, magnifierSize, magnifierSize);
    ctx.drawImage(
      canvas,
      Math.max(0, Math.min(x - size/2, canvas.width - size)),
      Math.max(0, Math.min(y - size/2, canvas.height - size)),
      size,
      size,
      0,
      0,
      magnifierSize,
      magnifierSize
    );

    // Draw crosshair
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(magnifierSize/2, 0);
    ctx.lineTo(magnifierSize/2, magnifierSize);
    ctx.moveTo(0, magnifierSize/2);
    ctx.lineTo(magnifierSize, magnifierSize/2);
    ctx.stroke();
  };

  const handleCanvasClick = (e) => {
    if (!isPickingColor || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    
    const color = `#${[pixel[0], pixel[1], pixel[2]]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')}`;
    
    onColorChange(color);
    setIsPickingColor(false);
    setShowMagnifier(false);
  };

  return (
    <FormControl>
      <FormLabel>Background Color</FormLabel>
      <VStack align="start" spacing={4}>
        <HStack spacing={4} align="center" width="100%">
          <Input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            width="100px"
          />
          <Text>{selectedColor.toUpperCase()}</Text>
          {selectedImage && (
            <>
              <Button
                onClick={() => {
                  setIsPickingColor(!isPickingColor);
                  setShowMagnifier(!isPickingColor);
                }}
                colorScheme={isPickingColor ? "green" : "blue"}
              >
                {isPickingColor ? "Picking Color..." : "Pick from Image"}
              </Button>
              {isPickingColor && (
                <Text
                  fontSize="sm"
                  color="blue.600"
                  bg="blue.50"
                  p={2}
                  borderRadius="md"
                >
                  Click anywhere on the image to pick a color
                </Text>
              )}
            </>
          )}
        </HStack>
        
        <Flex gap={4}>
          <Box
            width="150px"
            height="150px"
            backgroundColor={selectedColor}
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          />
          
          {selectedImage && (
            <Box
              position="relative"
              cursor={isPickingColor ? "crosshair" : "default"}
              borderRadius="md"
              overflow="hidden"
              border="1px solid"
              borderColor="gray.200"
              onMouseMove={updateMagnifier}
              onMouseEnter={() => setShowMagnifier(true)}
              onMouseLeave={() => setShowMagnifier(false)}
            >
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  maxWidth: "300px",
                  height: "auto"
                }}
              />
              {showMagnifier && (
                <Box
                  position="absolute"
                  left={`${magnifierPos.x}px`}
                  top={`${magnifierPos.y}px`}
                  width="100px"
                  height="100px"
                  borderRadius="full"
                  overflow="hidden"
                  border="2px solid white"
                  boxShadow="lg"
                  pointerEvents="none"
                >
                  <canvas
                    ref={magnifierRef}
                    width="100"
                    height="100"
                  />
                </Box>
              )}
            </Box>
          )}
        </Flex>
      </VStack>
    </FormControl>
  );
};

export default ColorPicker; 