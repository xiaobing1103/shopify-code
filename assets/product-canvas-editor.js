/**
 * Product Canvas Editor
 * 商品卡片 Canvas 编辑器
 */

class ProductCanvasEditor {
  constructor(sectionId) {
    this.sectionId = sectionId;
    this.canvas = null;
    this.cardImage = null;
    this.uploadedImage = null;
    this.productData = null;
    this.currentVariant = null;
    
    this.init();
  }

  /**
   * 加载产品数据
   */
  loadProductData() {
    const dataScript = document.querySelector(`#canvas-product-data-${this.sectionId}`);
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent);
        this.productData = data.product;
        this.currentVariant = data.currentVariant;
        this.settings = data.settings;
        console.log('Product data loaded:', this.productData);
      } catch (error) {
        console.error('Failed to parse product data:', error);
      }
    }
  }

  /**
   * 初始化编辑器
   */
  init() {
    // 等待 Fabric.js 加载
    if (typeof fabric === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    this.loadProductData();
    this.initCanvas();
    this.bindEvents();
    this.loadCardImage();
  }

  /**
   * 初始化 Canvas
   */
  initCanvas() {
    const canvasEl = document.querySelector(`#canvas-${this.sectionId}`);
    if (!canvasEl) return;

    // 从数据属性获取尺寸
    const width = parseInt(canvasEl.dataset.cardWidth) || 800;
    const height = parseInt(canvasEl.dataset.cardHeight) || 500;

    // 计算适合容器的尺寸
    const container = canvasEl.closest('.t4s-canvas-wrapper');
    const maxWidth = container ? container.clientWidth - 40 : 800;
    const scale = Math.min(maxWidth / width, 1);

    // 计算 Canvas 尺寸 - 必须是整数！
    const canvasWidth = Math.floor(width * scale);
    const canvasHeight = Math.floor(height * scale);

    this.canvas = new fabric.Canvas(canvasEl, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true
    });

    console.log('Canvas initialized:', { width: canvasWidth, height: canvasHeight, scale: scale });

    // 保存到全局变量以便调试
    window.debugCanvas = this.canvas;
    console.log('Canvas saved to window.debugCanvas for debugging');

    // 保存原始尺寸用于导出
    this.originalWidth = width;
    this.originalHeight = height;
    this.canvasScale = scale;

    // 设置选中样式
    fabric.Object.prototype.set({
      transparentCorners: false,
      borderColor: '#3b82f6',
      cornerColor: '#3b82f6',
      cornerSize: 10,
      cornerStyle: 'circle'
    });
  }

  /**
   * 加载卡片图片作为背景
   */
  loadCardImage() {
    const canvasEl = document.querySelector(`#canvas-${this.sectionId}`);
    if (!canvasEl) {
      console.error('Canvas element not found');
      return;
    }

    let cardImageUrl = canvasEl.dataset.cardImage;
    console.log('Loading card image:', cardImageUrl);
    
    if (!cardImageUrl || cardImageUrl === '') {
      console.warn('No card image URL provided');
      return;
    }

    // 确保 URL 有完整的协议
    if (cardImageUrl.startsWith('//')) {
      cardImageUrl = 'https:' + cardImageUrl;
    }

    console.log('Final image URL:', cardImageUrl);

    // 使用 Fabric.js 加载图片
    fabric.Image.fromURL(cardImageUrl, (img) => {
      if (!img || !img.width || !img.height) {
        console.error('Failed to load image or invalid image dimensions');
        return;
      }

      console.log('Image loaded successfully:', img.width, 'x', img.height);

      // 缩放图片以适应 canvas，保持宽高比
      const scaleX = this.canvas.width / img.width;
      const scaleY = this.canvas.height / img.height;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 留一些边距
      
      img.scale(scale);
      
      // 居中图片
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      img.set({
        left: (this.canvas.width - scaledWidth) / 2,
        top: (this.canvas.height - scaledHeight) / 2,
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        hasControls: false,
        hasBorders: false,
        opacity: 1
      });

      this.canvas.add(img);
      this.canvas.sendToBack(img);
      this.cardImage = img;
      
      // 添加一个测试矩形来验证 Canvas 是否工作
      const testRect = new fabric.Rect({
        left: 50,
        top: 50,
        width: 100,
        height: 100,
        fill: 'red',
        opacity: 0.5
      });
      this.canvas.add(testRect);
      
      // 强制多次渲染确保显示
      this.canvas.renderAll();
      setTimeout(() => this.canvas.renderAll(), 100);
      setTimeout(() => this.canvas.renderAll(), 500);
      
      console.log('Card image added to canvas');
      console.log('Canvas objects count:', this.canvas.getObjects().length);
      console.log('Image position:', { left: img.left, top: img.top, width: scaledWidth, height: scaledHeight });
      console.log('Canvas size:', { width: this.canvas.width, height: this.canvas.height });
      console.log('Image scale:', scale);
      console.log('Image visible:', img.visible);
      console.log('Image opacity:', img.opacity);
    }, { 
      crossOrigin: 'anonymous'
    });
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 添加文字
    document.querySelector('.t4s-add-text-btn')?.addEventListener('click', () => {
      this.addText();
    });

    // 文字样式按钮
    document.querySelectorAll('.t4s-style-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.classList.toggle('active');
      });
    });

    // 图片上传
    const fileInput = document.querySelector(`#image-upload-${this.sectionId}`);
    fileInput?.addEventListener('change', (e) => {
      this.handleImageUpload(e);
    });

    // 添加图片到 canvas
    document.querySelector('.t4s-add-image-btn')?.addEventListener('click', () => {
      this.addImageToCanvas();
    });

    // Canvas 工具栏
    document.querySelectorAll('.t4s-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleToolAction(action);
      });
    });

    // 数量控制
    document.querySelectorAll('.t4s-qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleQuantityChange(e.currentTarget.dataset.action);
      });
    });

    // 变体选择 - 监听 select 变化
    document.querySelectorAll('.t4s-variant-select').forEach(select => {
      select.addEventListener('change', () => {
        this.updateVariant();
        this.updateCanvasImage();
      });
    });

    // 监听主题的变体切换事件（jQuery 触发的）
    const self = this;
    if (typeof jQuery !== 'undefined') {
      jQuery(document).on('variant:changed', function(evt) {
        console.log('Theme variant changed event:', evt);
        if (evt.currentVariant) {
          self.currentVariant = evt.currentVariant;
          self.updateCanvasImage();
          
          // 更新隐藏的变体 ID
          const variantInput = document.querySelector('[name="id"]');
          if (variantInput) {
            variantInput.value = evt.currentVariant.id;
          }
          
          // 更新价格和按钮状态
          self.updatePrice(evt.currentVariant);
          self.updateButtonState(evt.currentVariant);
        }
      });
    }

    // 表单提交（添加购物车）
    const form = document.querySelector(`#canvas-product-form-${this.sectionId}`);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }
  }

  /**
   * 添加文字到 Canvas
   */
  addText() {
    const textInput = document.querySelector(`#text-input-${this.sectionId}`);
    const fontFamily = document.querySelector(`#font-family-${this.sectionId}`);
    const fontSize = document.querySelector(`#font-size-${this.sectionId}`);
    const textColor = document.querySelector(`#text-color-${this.sectionId}`);

    const text = textInput?.value.trim();
    if (!text) {
      alert('Please enter some text');
      return;
    }

    // 获取样式
    const isBold = document.querySelector('.t4s-style-btn[data-style="bold"]')?.classList.contains('active');
    const isItalic = document.querySelector('.t4s-style-btn[data-style="italic"]')?.classList.contains('active');
    const isUnderline = document.querySelector('.t4s-style-btn[data-style="underline"]')?.classList.contains('active');

    const textObj = new fabric.Text(text, {
      left: this.canvas.width / 2,
      top: this.canvas.height / 2,
      fontFamily: fontFamily?.value || 'Arial',
      fontSize: parseInt(fontSize?.value) || 24,
      fill: textColor?.value || '#000000',
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      underline: isUnderline,
      originX: 'center',
      originY: 'center'
    });

    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    this.canvas.renderAll();

    // 清空输入
    if (textInput) textInput.value = '';
  }

  /**
   * 处理图片上传
   */
  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.match('image.*')) {
      alert('Please upload an image file');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this.uploadedImage = event.target.result;
      this.showImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  /**
   * 显示图片预览
   */
  showImagePreview(dataUrl) {
    const preview = document.querySelector('.t4s-uploaded-preview');
    const img = preview?.querySelector('.t4s-preview-img');
    
    if (img && preview) {
      img.src = dataUrl;
      preview.style.display = 'flex';
    }
  }

  /**
   * 添加图片到 Canvas
   */
  addImageToCanvas() {
    if (!this.uploadedImage) return;

    fabric.Image.fromURL(this.uploadedImage, (img) => {
      // 缩放图片
      const maxSize = Math.min(this.canvas.width, this.canvas.height) * 0.5;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      
      img.scale(scale);
      img.set({
        left: this.canvas.width / 2,
        top: this.canvas.height / 2,
        originX: 'center',
        originY: 'center'
      });

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
    });
  }

  /**
   * 处理工具栏操作
   */
  handleToolAction(action) {
    const activeObject = this.canvas.getActiveObject();

    switch (action) {
      case 'delete':
        if (activeObject) {
          this.canvas.remove(activeObject);
          this.canvas.renderAll();
        }
        break;

      case 'bring-forward':
        if (activeObject) {
          this.canvas.bringForward(activeObject);
          this.canvas.renderAll();
        }
        break;

      case 'send-backward':
        if (activeObject) {
          this.canvas.sendBackwards(activeObject);
          this.canvas.renderAll();
        }
        break;

      case 'clear':
        if (confirm('Are you sure you want to clear all objects?')) {
          const objects = this.canvas.getObjects().filter(obj => obj.selectable !== false);
          objects.forEach(obj => this.canvas.remove(obj));
          this.canvas.renderAll();
        }
        break;
    }
  }

  /**
   * 处理数量变化
   */
  handleQuantityChange(action) {
    const input = document.querySelector('.t4s-qty-input');
    if (!input) return;

    let value = parseInt(input.value) || 1;
    const min = parseInt(input.min) || 1;
    const max = parseInt(input.max) || 99;
    const step = parseInt(input.step) || 1;

    if (action === 'increase') {
      value = Math.min(value + step, max);
    } else if (action === 'decrease') {
      value = Math.max(value - step, min);
    }

    input.value = value;
  }

  /**
   * 更新变体
   */
  updateVariant() {
    if (!this.productData) return;

    // 获取所有选项值
    const options = [];
    document.querySelectorAll('.t4s-variant-select').forEach(select => {
      options.push(select.value);
    });

    // 查找匹配的变体
    const variant = this.productData.variants.find(v => {
      return options.every((option, index) => {
        return v[`option${index + 1}`] === option;
      });
    });

    if (variant) {
      this.currentVariant = variant;
      
      // 更新隐藏的变体 ID 输入框
      const variantInput = document.querySelector('[name="id"]');
      if (variantInput) {
        variantInput.value = variant.id;
      }

      // 更新价格显示
      this.updatePrice(variant);

      // 更新按钮状态
      this.updateButtonState(variant);

      console.log('Variant updated:', variant);
    }
  }

  /**
   * 更新价格显示
   */
  updatePrice(variant) {
    const priceEl = document.querySelector('.t4s-product-price');
    if (!priceEl) return;

    const formatMoney = (cents) => {
      return (cents / 100).toFixed(2);
    };

    let priceHTML = '';
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      priceHTML = `
        <del>$${formatMoney(variant.compare_at_price)}</del>
        <ins>$${formatMoney(variant.price)}</ins>
      `;
    } else {
      priceHTML = `<span>$${formatMoney(variant.price)}</span>`;
    }

    priceEl.innerHTML = priceHTML;
  }

  /**
   * 更新按钮状态
   */
  updateButtonState(variant) {
    const btn = document.querySelector('.t4s-btn-add-cart');
    const btnText = btn?.querySelector('.t4s-btn-text');
    
    if (!btn || !btnText) return;

    if (variant.available) {
      btn.disabled = false;
      btn.classList.remove('is-disabled');
      btnText.textContent = 'Add to Cart';
    } else {
      btn.disabled = true;
      btn.classList.add('is-disabled');
      btnText.textContent = 'Sold Out';
    }
  }

  /**
   * 更新 Canvas 图片（当变体切换时）
   */
  updateCanvasImage() {
    if (!this.currentVariant || !this.canvas) {
      console.log('Cannot update canvas image: missing variant or canvas');
      return;
    }

    console.log('Updating canvas image for variant:', this.currentVariant);

    // 获取变体的特色图片
    let imageUrl = null;
    
    if (this.currentVariant.featured_image) {
      imageUrl = this.currentVariant.featured_image.src;
    } else if (this.currentVariant.featured_media && this.currentVariant.featured_media.preview_image) {
      imageUrl = this.currentVariant.featured_media.preview_image.src;
    } else if (this.productData.featured_image) {
      imageUrl = this.productData.featured_image;
    }

    if (!imageUrl) {
      console.log('No image found for variant');
      return;
    }

    // 确保使用 HTTPS
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }

    // 添加图片尺寸参数和时间戳防止缓存
    const timestamp = new Date().getTime();
    if (!imageUrl.includes('width=')) {
      imageUrl += (imageUrl.includes('?') ? '&' : '?') + 'width=1200';
    }
    imageUrl += '&t=' + timestamp;

    console.log('Loading new card image:', imageUrl);

    // 获取所有对象
    const objects = this.canvas.getObjects();
    console.log('Current canvas objects BEFORE removal:', objects.map(obj => ({ 
      type: obj.type, 
      name: obj.name,
      src: obj.type === 'image' ? obj.getSrc() : null 
    })));
    
    // 找到并移除所有卡片图片（索引 0 的图片）
    const objectsToRemove = [];
    objects.forEach((obj, index) => {
      if (obj.name === 'cardImage' || (obj.type === 'image' && index === 0)) {
        objectsToRemove.push(obj);
      }
    });
    
    console.log('Objects to remove:', objectsToRemove.length);
    
    objectsToRemove.forEach(obj => {
      this.canvas.remove(obj);
    });

    // 清除 Fabric.js 缓存
    if (fabric.util && fabric.util.clearFabricFontCache) {
      fabric.util.clearFabricFontCache();
    }

    // 强制渲染
    this.canvas.renderAll();
    this.canvas.requestRenderAll();

    console.log('After removal, objects count:', this.canvas.getObjects().length);

    // 加载新图片
    const self = this;
    
    // 清除图片缓存
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      console.log('Image loaded from network:', img.width, 'x', img.height);
      
      fabric.Image.fromURL(imageUrl, (fabricImg) => {
        if (!fabricImg || !fabricImg.width) {
          console.error('Failed to create fabric image');
          return;
        }

        console.log('Fabric image created:', fabricImg.width, 'x', fabricImg.height);

        // 计算缩放比例
        const canvasWidth = self.canvas.width;
        const canvasHeight = self.canvas.height;
        const imgRatio = fabricImg.width / fabricImg.height;
        const canvasRatio = canvasWidth / canvasHeight;

        let scale;
        if (imgRatio > canvasRatio) {
          scale = (canvasWidth * 0.9) / fabricImg.width;
        } else {
          scale = (canvasHeight * 0.9) / fabricImg.height;
        }

        console.log('Calculated scale:', scale);

        fabricImg.set({
          name: 'cardImage',
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
          objectCaching: false // 禁用对象缓存
        });

        // 再次确保没有旧的 cardImage
        const currentObjects = self.canvas.getObjects();
        currentObjects.forEach(obj => {
          if (obj.name === 'cardImage') {
            self.canvas.remove(obj);
          }
        });

        // 添加到最底层
        self.canvas.insertAt(fabricImg, 0);
        
        // 禁用 Canvas 缓存并强制重绘
        self.canvas.renderOnAddRemove = true;
        self.canvas.requestRenderAll();
        self.canvas.renderAll();
        
        console.log('Card image added to canvas');
        console.log('Final canvas objects:', self.canvas.getObjects().map(obj => ({ 
          type: obj.type, 
          name: obj.name,
          src: obj.type === 'image' ? obj.getSrc() : null 
        })));
        
        // 延迟再次渲染
        setTimeout(() => {
          self.canvas.renderAll();
          console.log('Final render complete');
        }, 100);
        
      }, { crossOrigin: 'anonymous' });
    };
    
    img.onerror = function() {
      console.error('Failed to load image from URL');
    };
    
    img.src = imageUrl;
  }

  /**
   * 导出 Canvas 数据
   */
  exportCanvasData() {
    return {
      image: this.canvas.toDataURL({ format: 'png', quality: 1 }),
      json: JSON.stringify(this.canvas.toJSON())
    };
  }

  /**
   * 添加到购物车
   */
  async addToCart() {
    const form = document.querySelector(`#canvas-product-form-${this.sectionId}`);
    const btn = document.querySelector('.t4s-btn-add-cart');
    if (!form || !btn) return;

    // 获取表单数据
    const formData = new FormData(form);
    const variantId = formData.get('id');
    const quantity = parseInt(formData.get('quantity')) || 1;

    // 验证变体
    if (!variantId) {
      this.showNotification('Please select a variant', 'error');
      return;
    }

    // 导出 Canvas 数据
    const canvasData = this.exportCanvasData();

    // 显示加载状态
    btn.classList.add('is-loading');
    btn.disabled = true;

    try {
      // 准备购物车数据
      const cartData = {
        items: [{
          id: parseInt(variantId),
          quantity: quantity,
          properties: {
            '_Canvas Design': canvasData.image,
            '_Canvas Data': canvasData.json,
            '_Timestamp': new Date().toISOString()
          }
        }]
      };

      console.log('Adding to cart:', cartData);

      // 添加到购物车
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to add to cart');
      }

      const result = await response.json();
      console.log('Added to cart successfully:', result);

      // 显示成功消息
      this.showNotification('Product added to cart!', 'success');

      // 更新购物车数量
      this.updateCartCount();

      // 触发购物车更新事件
      document.dispatchEvent(new CustomEvent('cart:updated'));

      // 如果有 Ajax Cart，触发更新
      if (window.theme && window.theme.cart) {
        window.theme.cart.getCart();
      }

      // 延迟后跳转到购物车（可选）
      setTimeout(() => {
        if (confirm('Product added! Go to cart?')) {
          window.location.href = '/cart';
        }
      }, 1000);

    } catch (error) {
      console.error('Error adding to cart:', error);
      this.showNotification(error.message || 'Failed to add to cart. Please try again.', 'error');
    } finally {
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  }

  /**
   * 更新购物车数量
   */
  async updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // 更新购物车数量显示
      const cartCountElements = document.querySelectorAll('[data-cart-count]');
      cartCountElements.forEach(el => {
        el.textContent = cart.item_count;
      });
    } catch (error) {
      console.error('Failed to update cart count:', error);
    }
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `t4s-notification t4s-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#059669' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒后移除
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// 初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
  const canvasEditor = document.querySelector('.t4s-canvas-editor-wrapper');
  if (canvasEditor) {
    const sectionId = canvasEditor.dataset.sectionId;
    new ProductCanvasEditor(sectionId);
  }
});

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
