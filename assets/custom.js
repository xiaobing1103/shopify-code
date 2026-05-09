jQuery_T4NT(document).ready(function($) {

     // ========== ADD TO CART Loading状态修复 (增强版) ==========
     
     // 强制重置单个按钮的loading状态
     function forceResetButton(btn) {
       var $btn = $(btn);
       
       // 移除所有loading相关类名
       $btn.removeClass('is--loading pplr_adding t4s-btn-loading');
       
       // 移除disabled状态
       $btn.removeAttr('aria-disabled').prop('disabled', false);
       
       // 重置按钮内部的所有spinner元素
       var $spinners = $btn.find('.t4s-loading__spinner, .t4s-svg-spinner, .t4s-svg__spinner');
       $spinners.each(function() {
         var el = this;
         el.hidden = true;
         el.setAttribute('hidden', 'hidden');
         el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
       });
       
       // 重置按钮内SVG spinner元素（包括#p_loading-spinner）
       $btn.find('svg.t4s-svg-spinner, svg.t4s-svg__spinner, #p_loading-spinner, svg[id*="loading"], svg[id*="spinner"]').each(function() {
         this.hidden = true;
         this.setAttribute('hidden', 'hidden');
         this.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
       });
       
       // 确保按钮文字和图标正常显示
       $btn.find('.t4s-btn-atc_text').css({
         'opacity': '1',
         'visibility': 'visible'
       });
       $btn.find('.t4s-btn-icon').css({
         'opacity': '1',
         'visibility': 'visible'
       });
     }
     
     // 全局重置所有ATC按钮的loading状态
     function resetAllATCLoadingStates() {
       // 选择所有可能的ATC按钮
       var $atcButtons = $('[data-atc-form], .t4s-product-form__submit, [data-action-atc], .t4s-btn-loading__svg, button[type="submit"][name="add"]');
       
       $atcButtons.each(function() {
         forceResetButton(this);
       });
       
       // 全局重置所有spinner元素（不仅仅是按钮内的）
       $('.t4s-loading__spinner, .t4s-svg-spinner, .t4s-svg__spinner').each(function() {
         this.hidden = true;
         this.setAttribute('hidden', 'hidden');
         this.style.display = 'none';
       });
     }
     
     // 使用原生JavaScript直接操作DOM，绕过可能的jQuery缓存问题
     function nativeResetLoadingStates() {
       // 移除所有is--loading类和pplr_adding类
       document.querySelectorAll('.is--loading, .pplr_adding').forEach(function(el) {
         el.classList.remove('is--loading', 'pplr_adding', 't4s-btn-loading');
         el.removeAttribute('aria-disabled');
         if (el.disabled) el.disabled = false;
       });
       
       // 隐藏所有spinner（包括#p_loading-spinner）
       document.querySelectorAll('.t4s-loading__spinner, .t4s-svg-spinner, .t4s-svg__spinner, #p_loading-spinner, [id*="loading-spinner"]').forEach(function(el) {
         el.hidden = true;
         el.setAttribute('hidden', 'hidden');
         el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
       });
       
       // 隐藏按钮内所有SVG spinner
       document.querySelectorAll('.t4s-product-form__submit svg[id*="loading"], .t4s-product-form__submit svg[id*="spinner"], [data-atc-form] svg').forEach(function(el) {
         if (el.classList.contains('t4s-btn-icon')) return; // 跳过按钮图标
         el.hidden = true;
         el.setAttribute('hidden', 'hidden');
         el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important;';
       });
       
       // 确保按钮文字可见
       document.querySelectorAll('.t4s-btn-atc_text, .t4s-btn-icon').forEach(function(el) {
         el.style.opacity = '1';
         el.style.visibility = 'visible';
       });
     }
     
     // 综合重置函数
     function fullResetLoadingStates() {
       resetAllATCLoadingStates();
       nativeResetLoadingStates();
     }
     
     // 监听购物车添加成功事件
     $(document).on('add:cart:success cart:updated', function() {
       // 立即重置
       fullResetLoadingStates();
       // 多次延迟重置以确保在各种情况下都能生效
       setTimeout(fullResetLoadingStates, 50);
       setTimeout(fullResetLoadingStates, 150);
       setTimeout(fullResetLoadingStates, 300);
       setTimeout(fullResetLoadingStates, 500);
       setTimeout(fullResetLoadingStates, 1000);
     });
     
     // 监听购物车抽屉打开事件
     $(document).on('drawer:open drawer:opened ajaxCart:afterRender cart:open', function(e, drawerType) {
       fullResetLoadingStates();
       setTimeout(fullResetLoadingStates, 50);
       setTimeout(fullResetLoadingStates, 150);
       setTimeout(fullResetLoadingStates, 300);
     });

     // ========== Guard against duplicate studio add-to-cart requests on cart page ==========
     var CART_ADD_ALLOW_KEY = 't4s_studio_cart_add_allow_until';
     var CART_ADD_ALLOW_TTL = 4000;

     function readSessionJSON(key) {
       try {
         var raw = window.sessionStorage.getItem(key);
         return raw ? JSON.parse(raw) : null;
       } catch (e) {
         return null;
       }
     }

     function writeSessionJSON(key, value) {
       try {
         window.sessionStorage.setItem(key, JSON.stringify(value));
       } catch (e) {
         // Ignore storage write failures
       }
     }

     function removeSessionKey(key) {
       try {
         window.sessionStorage.removeItem(key);
       } catch (e) {
         // Ignore storage removal failures
       }
     }

     function isCartPage() {
       return window.location.pathname === '/cart' || document.body.classList.contains('template-cart');
     }

     function allowNextCartAdd() {
       writeSessionJSON(CART_ADD_ALLOW_KEY, {
         expiresAt: Date.now() + CART_ADD_ALLOW_TTL
       });
     }

     function hasExplicitCartAddAllowance() {
       var allowance = readSessionJSON(CART_ADD_ALLOW_KEY);
       if (!allowance || !allowance.expiresAt) return false;

       if (allowance.expiresAt <= Date.now()) {
         removeSessionKey(CART_ADD_ALLOW_KEY);
         return false;
       }

       return true;
     }

     function consumeExplicitCartAddAllowance() {
       if (hasExplicitCartAddAllowance()) {
         removeSessionKey(CART_ADD_ALLOW_KEY);
         return true;
       }

       return false;
     }

     function getRequestUrl(input) {
       if (!input) return '';
       if (typeof input === 'string') return input;
       if (typeof Request !== 'undefined' && input instanceof Request) return input.url || '';
       return input.url || '';
     }

     function isCartAddUrl(url) {
       if (!url) return false;

       try {
         var parsed = new URL(url, window.location.origin);
         return parsed.pathname.indexOf('/cart/add') !== -1;
       } catch (e) {
         return String(url).indexOf('/cart/add') !== -1;
       }
     }

     function cartPageHasStudioItem() {
       if (!isCartPage()) return false;

       var cartItems = document.querySelectorAll('[data-cart-item]');
       if (!cartItems.length) return false;

       return Array.prototype.some.call(cartItems, function(cartItem) {
         var title = cartItem.querySelector('.t4s-page_cart__title, .t4s-mini_cart__title');
         var titleText = title ? title.textContent.toLowerCase() : '';
         if (titleText.indexOf('studio') !== -1) return true;

         var meta = cartItem.querySelector('.t4s-cart_meta_propertyList, .t4s-page_cart__meta, .t4s-mini_cart__meta');
         var metaText = meta ? meta.textContent.toLowerCase() : '';
         return metaText.indexOf('choose metal color') !== -1 ||
           metaText.indexOf('choose your finish') !== -1 ||
           metaText.indexOf('additional comments') !== -1 ||
           metaText.indexOf('design:') !== -1;
       });
     }

     function isExplicitCartAddTrigger(target) {
       if (!target || typeof target.closest !== 'function') return false;

       return !!target.closest(
         '[data-atc-form], [data-action-atc], [data-add-gift], a[href*="/cart/add"], ' +
         'button[type="submit"][name="add"], input[type="submit"][name="add"], ' +
         '.t4s-quantity-selector, .t4s-quantity-wrapper button, [data-quantity-selector], [data-cart-qty]'
       );
     }

     function isHeaderNavigationTrigger(target) {
       if (!target || typeof target.closest !== 'function') return false;

       var link = target.closest('.t4s-section-header a[href], .t4s-header__wrapper a[href], [data-menu-drawer]');
       if (!link) return false;
       return !isCartAddUrl(link.getAttribute('href') || link.href || '');
     }

     function shouldBlockSilentCartAdd(url) {
       if (!isCartPage() || !isCartAddUrl(url)) return false;
       if (!cartPageHasStudioItem()) return false;
       if (consumeExplicitCartAddAllowance()) return false;
       return true;
     }

     function blockedCartAddResponse() {
       var body = JSON.stringify({ blocked: true });
       if (typeof Response === 'function') {
         return new Response(body, {
           status: 200,
           headers: { 'Content-Type': 'application/json' }
         });
       }

       return {
         ok: true,
         status: 200,
         json: function() {
           return Promise.resolve({ blocked: true });
         },
         text: function() {
           return Promise.resolve(body);
         }
       };
     }

     document.addEventListener('click', function(event) {
       if (!isCartPage()) return;

       if (isHeaderNavigationTrigger(event.target)) {
         removeSessionKey(CART_ADD_ALLOW_KEY);
         return;
       }

       if (isExplicitCartAddTrigger(event.target)) {
         allowNextCartAdd();
       }
     }, true);

     document.addEventListener('submit', function(event) {
       var form = event.target;
       if (!(form instanceof HTMLFormElement)) return;

       var action = form.getAttribute('action') || '';
       if (!isCartAddUrl(action)) return;

       if (isCartPage()) {
         if (cartPageHasStudioItem() && !hasExplicitCartAddAllowance()) {
           event.preventDefault();
           event.stopPropagation();
           return;
         }

         consumeExplicitCartAddAllowance();
       }
     }, true);

     (function() {
       if (typeof HTMLFormElement === 'undefined') return;

       var nativeSubmit = HTMLFormElement.prototype.submit;
       if (typeof nativeSubmit === 'function') {
         HTMLFormElement.prototype.submit = function() {
           var action = this.getAttribute('action') || '';
           if (shouldBlockSilentCartAdd(action)) return;
           return nativeSubmit.apply(this, arguments);
         };
       }

       var nativeRequestSubmit = HTMLFormElement.prototype.requestSubmit;
       if (typeof nativeRequestSubmit === 'function') {
         HTMLFormElement.prototype.requestSubmit = function() {
           var action = this.getAttribute('action') || '';
           if (isCartAddUrl(action) && isCartPage() && cartPageHasStudioItem() && !hasExplicitCartAddAllowance()) return;
           return nativeRequestSubmit.apply(this, arguments);
         };
       }
     })();

     (function() {
       if (!window.navigator || typeof window.navigator.sendBeacon !== 'function') return;

       var originalSendBeacon = window.navigator.sendBeacon.bind(window.navigator);
       window.navigator.sendBeacon = function(url, data) {
         if (shouldBlockSilentCartAdd(url)) return true;
         return originalSendBeacon(url, data);
       };
     })();
     
     // 监听fetch请求完成 - 拦截Ajax请求
     (function() {
       var originalFetch = window.fetch;
       if (typeof originalFetch !== 'function') return;

       window.fetch = function(input, init) {
         var requestUrl = getRequestUrl(input);
         if (shouldBlockSilentCartAdd(requestUrl)) {
           return Promise.resolve(blockedCartAddResponse());
         }

         var promise = originalFetch.apply(this, arguments);
         promise.then(function(response) {
           if (requestUrl && (requestUrl.indexOf('/cart') !== -1 || requestUrl.indexOf('add.js') !== -1)) {
             setTimeout(fullResetLoadingStates, 100);
             setTimeout(fullResetLoadingStates, 300);
           }
           return response;
         }).catch(function() {
           setTimeout(fullResetLoadingStates, 100);
         });
         return promise;
       };
     })();

     (function() {
       var originalOpen = XMLHttpRequest.prototype.open;
       var originalSend = XMLHttpRequest.prototype.send;

       XMLHttpRequest.prototype.open = function(method, url) {
         this._t4sRequestUrl = url;
         return originalOpen.apply(this, arguments);
       };

       XMLHttpRequest.prototype.send = function() {
         if (shouldBlockSilentCartAdd(this._t4sRequestUrl)) {
           this.abort();
           return;
         }

         return originalSend.apply(this, arguments);
       };
     })();
     
     // 监听DOM变化 - 当购物车侧边栏出现时重置loading状态
     var cartDrawerObserver = new MutationObserver(function(mutations) {
       var shouldReset = false;
       mutations.forEach(function(mutation) {
         if (mutation.type === 'attributes' || mutation.type === 'childList') {
           var target = mutation.target;
           // 检查是否是购物车抽屉打开相关的变化
           if (target.classList && (
               target.classList.contains('is--opend-drawer') || 
               target.classList.contains('is--visible') ||
               target.classList.contains('t4s-drawer__cart') ||
               target.hasAttribute('data-mini-cart'))) {
             shouldReset = true;
           }
         }
       });
       if (shouldReset) {
         setTimeout(fullResetLoadingStates, 50);
         setTimeout(fullResetLoadingStates, 150);
       }
     });
     
     // 观察body和购物车抽屉的变化
     if (document.body) {
       cartDrawerObserver.observe(document.body, { 
         attributes: true, 
         attributeFilter: ['class'],
         subtree: true,
         childList: true
       });
     }
     
     // 为ATC按钮添加点击后自动重置的安全机制
     $(document).on('click', '.t4s-product-form__submit, [data-action-atc], [data-atc-form]', function() {
       var clickedBtn = this;
       // 设置最大loading时间，超时后自动重置
       setTimeout(function() {
         forceResetButton(clickedBtn);
         fullResetLoadingStates();
       }, 5000); // 5秒后强制重置
     });

     /**
     *  Variant selection changed
     *  data-variant-toggle="{{ variant.id }}"
     */
	   $( document ).on( "variant:changed", function( evt ) {
	     // $('[data-variant-toggle]').hide(0);
	     // $('[data-variant-toggle="'+evt.currentVariant.id+'"']').show(0);
	     
	     // 更新 Black Friday 折扣价格
	     updateBFDiscountPrice(evt.currentVariant);
	   });
	   
	   // ========== Black Friday 折扣价格功能 ==========
	   
	   // localStorage 工具函数
	   var StorageUtil = {
	     get: function(key) {
	       try {
	         return localStorage.getItem(key);
	       } catch (e) {
	         // localStorage 读取失败
	         return null;
	       }
	     }
	   };
	   
	   // 更新折扣价格显示
	   function updateBFDiscountPrice(variant) {
	     var isDiscountApplied = StorageUtil.get('bf_discount_applied') === 'true';
	     var priceContainer = $('[data-bf-price-container]');
	     
	     // Black Friday 价格更新
	     
	     if (priceContainer.length === 0) {
	       // 未找到价格容器
	       return;
	     }
	     
	     var originalPriceEl = priceContainer.find('[data-bf-original-price]');
	     var discountPriceEl = priceContainer.find('[data-bf-discount-price]');
	     
	     if (isDiscountApplied) {
	       // 显示折扣价格
	       // 显示折扣价，隐藏原价
	       originalPriceEl.hide();
	       discountPriceEl.show();
	       
	       // 如果有 variant 信息，更新折扣价格
	       if (variant && variant.price) {
	         updateDiscountPriceHTML(discountPriceEl, variant.price);
	       }
	     } else {
	       // 显示原始价格
	       // 显示原价，隐藏折扣价
	       originalPriceEl.show();
	       discountPriceEl.hide();
	     }
	   }
	   
	   // 更新折扣价格 HTML
	   function updateDiscountPriceHTML(element, price) {
	     var discountPrice = Math.round(price * 0.8);
	     var currencyCode = window.Shopify && window.Shopify.currency ? window.Shopify.currency.active : 'USD';
	     
	     // 格式化价格
	     var originalFormatted = formatMoney(price);
	     var discountFormatted = formatMoney(discountPrice);
	     
	     var html = '<span style="text-decoration: line-through; color: var(--price-color);">' + originalFormatted + '</span>';
	     html += '<span style="color: var(--price-sale-color); margin-left: 6px; font-weight: var(--price-weight);">' + discountFormatted + '</span>';
	     
	     element.html(html);
	   }
	   
	   // 价格格式化函数
	   function formatMoney(cents) {
	     if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
	       return Shopify.formatMoney(cents, window.theme.moneyFormat || '${{amount}}');
	     }
	     // Fallback
	     return '$' + (cents / 100).toFixed(2);
	   }

	   // ========== Cart image persistence for customized studio items ==========
	   var CART_IMAGE_STATE_KEY = 't4s_cart_item_images';
	   var cartImageState = readCartImageState();

	   function readCartImageState() {
	     try {
	       var stored = window.sessionStorage.getItem(CART_IMAGE_STATE_KEY);
	       return stored ? JSON.parse(stored) : {};
	     } catch (e) {
	       return {};
	     }
	   }

	   function writeCartImageState() {
	     try {
	       window.sessionStorage.setItem(CART_IMAGE_STATE_KEY, JSON.stringify(cartImageState));
	     } catch (e) {
	       // Ignore storage write failures
	     }
	   }

	   function getCartImageNodes(cartItem) {
	     if (!cartItem) return {};
	     var imageLink = cartItem.querySelector('[data-cart-item-image]');
	     if (!imageLink) return {};
	     return {
	       imageLink: imageLink,
	       imageTag: imageLink.querySelector('img')
	     };
	   }

	   function normalizeBackgroundImage(backgroundImage) {
	     if (!backgroundImage || backgroundImage === 'none') return '';
	     return backgroundImage;
	   }

	   function captureCartItemImages(context) {
	     var root = context && context.querySelectorAll ? context : document;
	     root.querySelectorAll('[data-cart-item-key]').forEach(function(cartItem) {
	       var itemKey = cartItem.getAttribute('data-cart-item-key');
	       var nodes = getCartImageNodes(cartItem);
	       if (!itemKey || !nodes.imageLink) return;

	       var imageSrc = '';
	       var dataSrc = '';
	       if (nodes.imageTag) {
	         imageSrc = nodes.imageTag.getAttribute('src') || '';
	         dataSrc = nodes.imageTag.getAttribute('data-src') || '';
	       }

	       var backgroundImage = normalizeBackgroundImage(nodes.imageLink.style.backgroundImage || window.getComputedStyle(nodes.imageLink).backgroundImage);
	       if (!backgroundImage && !imageSrc && !dataSrc) return;

	       cartImageState[itemKey] = {
	         backgroundImage: backgroundImage,
	         src: imageSrc,
	         dataSrc: dataSrc
	       };
	     });

	     writeCartImageState();
	   }

	   function restoreCartItemImages(context) {
	     var root = context && context.querySelectorAll ? context : document;
	     root.querySelectorAll('[data-cart-item-key]').forEach(function(cartItem) {
	       var itemKey = cartItem.getAttribute('data-cart-item-key');
	       var state = itemKey ? cartImageState[itemKey] : null;
	       var nodes = getCartImageNodes(cartItem);

	       if (!state || !nodes.imageLink) return;

	       if (state.backgroundImage) {
	         nodes.imageLink.style.backgroundImage = state.backgroundImage;
	       }

	       if (nodes.imageTag) {
	         if (state.dataSrc) {
	           nodes.imageTag.setAttribute('data-src', state.dataSrc);
	         }
	         if (state.src) {
	           nodes.imageTag.setAttribute('src', state.src);
	         } else if (state.dataSrc) {
	           nodes.imageTag.setAttribute('src', state.dataSrc);
	         }
	         nodes.imageTag.removeAttribute('srcset');
	       }
	     });
	   }

	   function syncCartItemImages(context) {
	     restoreCartItemImages(context);
	     captureCartItemImages(context);
	   }

	   function queueCartImageSync() {
	     setTimeout(function() {
	       syncCartItemImages(document);
	     }, 0);
	     setTimeout(function() {
	       syncCartItemImages(document);
	     }, 120);
	     setTimeout(function() {
	       syncCartItemImages(document);
	     }, 350);
	   }

	   document.addEventListener('click', function(event) {
	     if (event.target.closest('[data-increase-qty], [data-decrease-qty], [data-cart-remove], [data-action-change]')) {
	       captureCartItemImages(document);
	     }
	   }, true);

	   document.addEventListener('change', function(event) {
	     if (event.target.matches('[data-action-change]')) {
	       captureCartItemImages(document);
	     }
	   }, true);

	   $(document).on('add:cart:success cart:updated ajaxCart:afterRender cart:refresh drawer:open drawer:opened', function() {
	     queueCartImageSync();
	   });

	   if (window.MutationObserver) {
	     var cartImageObserver = new MutationObserver(function(mutations) {
	       var shouldSync = mutations.some(function(mutation) {
	         if (mutation.type !== 'childList') return false;
	         return Array.prototype.some.call(mutation.addedNodes, function(node) {
	           if (!node || node.nodeType !== 1) return false;
	           return node.matches('[data-cart-item], [data-cart-items]') || !!node.querySelector('[data-cart-item], [data-cart-items]');
	         });
	       });

	       if (shouldSync) {
	         queueCartImageSync();
	       }
	     });

	     cartImageObserver.observe(document.body, {
	       childList: true,
	       subtree: true
	     });
	   }
	   
	   // 页面加载时初始化
	   updateBFDiscountPrice();
	   queueCartImageSync();
});
