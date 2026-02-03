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
     
     // 监听fetch请求完成 - 拦截Ajax请求
     (function() {
       var originalFetch = window.fetch;
       window.fetch = function() {
         var promise = originalFetch.apply(this, arguments);
         promise.then(function(response) {
           // 检查是否是购物车相关请求
           if (arguments[0] && typeof arguments[0] === 'string' && 
               (arguments[0].includes('/cart') || arguments[0].includes('add.js'))) {
             setTimeout(fullResetLoadingStates, 100);
             setTimeout(fullResetLoadingStates, 300);
           }
           return response;
         }).catch(function() {
           // 请求失败也要重置loading状态
           setTimeout(fullResetLoadingStates, 100);
         });
         return promise;
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
	     // console.log( evt.currentVariant );
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
	         console.error('localStorage 读取失败:', e);
	         return null;
	       }
	     }
	   };
	   
	   // 更新折扣价格显示
	   function updateBFDiscountPrice(variant) {
	     var isDiscountApplied = StorageUtil.get('bf_discount_applied') === 'true';
	     var priceContainer = $('[data-bf-price-container]');
	     
	     console.log('Black Friday 价格更新:', {
	       isDiscountApplied: isDiscountApplied,
	       containerFound: priceContainer.length > 0,
	       variant: variant
	     });
	     
	     if (priceContainer.length === 0) {
	       console.warn('未找到价格容器 [data-bf-price-container]');
	       return;
	     }
	     
	     var originalPriceEl = priceContainer.find('[data-bf-original-price]');
	     var discountPriceEl = priceContainer.find('[data-bf-discount-price]');
	     
	     console.log('价格元素:', {
	       originalPrice: originalPriceEl.length,
	       discountPrice: discountPriceEl.length
	     });
	     
	     if (isDiscountApplied) {
	       console.log('显示折扣价格');
	       // 显示折扣价，隐藏原价
	       originalPriceEl.hide();
	       discountPriceEl.show();
	       
	       // 如果有 variant 信息，更新折扣价格
	       if (variant && variant.price) {
	         updateDiscountPriceHTML(discountPriceEl, variant.price);
	       }
	     } else {
	       console.log('显示原始价格');
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
	   
	   // 页面加载时初始化
	   updateBFDiscountPrice();
});


