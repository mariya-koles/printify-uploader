/**
 * Product model based on Printify API specification
 * @see https://developers.printify.com/#products
 */
class Product {
  constructor({
    title,
    description,
    blueprint_id,
    print_provider_id,
    variants,
    print_areas,
    shipping_from = null,
    shipping_method = 'standard',
    print_details = {
      format: 'jpg',
      print_on_side: 'regular'
    }
  }) {
    this.title = title;
    this.description = description;
    this.blueprint_id = blueprint_id;
    this.print_provider_id = print_provider_id;
    this.variants = this.formatVariants(variants);
    this.print_areas = this.formatPrintAreas(print_areas);
    this.shipping_from = shipping_from;
    this.shipping_method = shipping_method;
    this.print_details = print_details;
  }

  /**
   * Format variants to match Printify API requirements
   * @param {Array} variants - Array of variant objects
   * @returns {Array} Formatted variants
   */
  formatVariants(variants) {
    return variants.map(variant => ({
      id: variant.id,
      price: variant.price,
      is_enabled: variant.is_enabled ?? true // Default to true if not specified
    }));
  }

  /**
   * Format print areas to match Printify API requirements
   * @param {Array} printAreas - Array of print area objects
   * @returns {Array} Formatted print areas
   */
  formatPrintAreas(printAreas) {
    return printAreas.map(area => ({
      position: area.position,
      variant_ids: area.variant_ids,
      background: area.background,
      placeholders: area.placeholders.map(placeholder => ({
        position: placeholder.position,
        images: placeholder.images.map(image => ({
          id: image.id,
          x: image.x ?? 0.5,
          y: image.y ?? 0.5,
          scale: image.scale ?? 1,
          angle: image.angle ?? 0
        }))
      }))
    }));
  }

  /**
   * Validate the product data
   * @returns {Object} Validation result { isValid: boolean, errors: Array }
   */
  validate() {
    const errors = [];

    // Required fields
    if (!this.title) errors.push('Title is required');
    if (!this.description) errors.push('Description is required');
    if (!this.blueprint_id) errors.push('Blueprint ID is required');
    if (!this.print_provider_id) errors.push('Print provider ID is required');
    
    // Variants validation
    if (!Array.isArray(this.variants) || this.variants.length === 0) {
      errors.push('At least one variant is required');
    } else {
      this.variants.forEach((variant, index) => {
        if (!variant.id) errors.push(`Variant ${index + 1}: ID is required`);
        if (typeof variant.price !== 'number') errors.push(`Variant ${index + 1}: Price must be a number`);
      });
    }

    // Print areas validation
    if (!Array.isArray(this.print_areas) || this.print_areas.length === 0) {
      errors.push('At least one print area is required');
    } else {
      this.print_areas.forEach((area, index) => {
        if (!area.position) errors.push(`Print area ${index + 1}: Position is required`);
        if (!Array.isArray(area.variant_ids) || area.variant_ids.length === 0) {
          errors.push(`Print area ${index + 1}: At least one variant ID is required`);
        }
        if (!Array.isArray(area.placeholders)) {
          errors.push(`Print area ${index + 1}: Placeholders must be an array`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert the product to a plain object for API submission
   * @returns {Object} Plain object representation of the product
   */
  toJSON() {
    return {
      title: this.title,
      description: this.description,
      blueprint_id: this.blueprint_id,
      print_provider_id: this.print_provider_id,
      variants: this.variants,
      print_areas: this.print_areas,
      shipping_from: this.shipping_from,
      shipping_method: this.shipping_method,
      print_details: this.print_details
    };
  }
}

export default Product; 