/**
 * Bundle/Pack Selector
 * Handles bundle selection and quantity updates
 */

class BundleSelector {
  constructor(container) {
    this.container = container;
    this.options = container.querySelectorAll('[data-bundle-option]');
    this.quantityInput = container.querySelector('[data-bundle-quantity-input]');
    this.productForm = this.findProductForm();
    this.init();
  }
  
  init() {
    if (this.options.length === 0) return;
    
    // Find and select the recommended option, or first option
    const recommendedOption = this.container.querySelector('.t4s-bundle-option--recommended');
    const defaultOption = recommendedOption || this.options[0];
    
    this.selectOption(defaultOption, false);
    
    // Add click handlers
    this.options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        this.selectOption(option, true);
      });
      
      // Keyboard accessibility
      option.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectOption(option, true);
        }
      });
      
      // Make focusable
      option.setAttribute('tabindex', '0');
      option.setAttribute('role', 'radio');
    });
  }
  
  findProductForm() {
    // Try to find the product form
    const formId = this.container.closest('[data-product-featured]')?.dataset?.productFeatured;
    if (formId) {
      try {
        const data = JSON.parse(formId);
        return document.querySelector(data.formID);
      } catch (e) {
        console.warn('Could not parse product data');
      }
    }
    
    // Fallback: find nearest form
    return this.container.closest('form') || document.querySelector('form[action*="/cart/add"]');
  }
  
  selectOption(selectedOption, animated = true) {
    // Remove selected class from all options
    this.options.forEach(opt => {
      opt.classList.remove('is-selected');
      opt.setAttribute('aria-checked', 'false');
    });
    
    // Add selected class to clicked option
    selectedOption.classList.add('is-selected');
    selectedOption.setAttribute('aria-checked', 'true');
    
    // Get data
    const quantity = parseInt(selectedOption.dataset.quantity) || 1;
    const price = selectedOption.dataset.price;
    
    // Update quantity input
    this.updateQuantity(quantity);
    
    // Update price display
    this.updatePriceDisplay(price);
    
    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('bundleChanged', {
      detail: {
        quantity: quantity,
        price: price,
        option: selectedOption
      },
      bubbles: true
    }));
    
    // Analytics tracking (if available)
    this.trackSelection(selectedOption);
  }
  
  updateQuantity(quantity) {
    // Update hidden input
    if (this.quantityInput) {
      this.quantityInput.value = quantity;
      this.quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Update visible quantity selector if exists
    const qtySelector = this.productForm?.querySelector('input[name="quantity"]');
    if (qtySelector && qtySelector !== this.quantityInput) {
      qtySelector.value = quantity;
      qtySelector.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Update quantity display
    const qtyDisplay = this.productForm?.querySelector('[data-quantity-display]');
    if (qtyDisplay) {
      qtyDisplay.textContent = quantity;
    }
  }
  
  updatePriceDisplay(price) {
    if (!price) return;
    
    // Find price elements
    const priceElements = document.querySelectorAll('[data-product-price], .t4s-product-price');
    
    priceElements.forEach(element => {
      // This is a simplified version - adjust based on your theme's price formatting
      const formattedPrice = this.formatPrice(price);
      const priceSpan = element.querySelector('.money, [data-price-value]');
      if (priceSpan) {
        priceSpan.textContent = formattedPrice;
      }
    });
  }
  
  formatPrice(cents) {
    // Basic price formatting - adjust based on your store's currency settings
    const dollars = (parseInt(cents) / 100).toFixed(2);
    return `$${dollars}`;
  }
  
  trackSelection(option) {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'bundle_selected', {
        'event_category': 'Product',
        'event_label': option.dataset.quantity + ' pack',
        'value': option.dataset.price
      });
    }
    
    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
      fbq('track', 'AddToCart', {
        content_type: 'product_group',
        content_ids: [option.dataset.quantity],
        value: option.dataset.price / 100,
        currency: 'USD'
      });
    }
  }
}

// Initialize all bundle selectors
function initBundleSelectors() {
  const selectors = document.querySelectorAll('[data-bundle-selector]');
  selectors.forEach(selector => {
    if (!selector.bundleSelectorInstance) {
      selector.bundleSelectorInstance = new BundleSelector(selector);
    }
  });
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBundleSelectors);
} else {
  initBundleSelectors();
}

// Re-initialize on Shopify section load (for theme editor)
if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', initBundleSelectors);
}

// Export for use in other scripts
window.BundleSelector = BundleSelector;
window.initBundleSelectors = initBundleSelectors;
