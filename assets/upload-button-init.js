/**
 * Upload Button Icon & Text Initializer
 * 为 upload 按钮动态添加图标和文字
 * + 动态修改 pplr 文件上传属性名为固定名称 tm_customer_upload_image
 * + 将文件名存储在隐藏字段 _tm_customer_upload_filename
 */

(function() {
  'use strict';

  function initUploadButton() {
    // 查找所有的 upload 按钮
    const uploadButtons = document.querySelectorAll('.pplrfileuploadbutton');

    uploadButtons.forEach(function(button) {
      // 检查是否已经初始化过
      if (button.querySelector('.upload-icon')) {
        return;
      }

      // 创建图标 img 元素
      const icon = document.createElement('img');
      icon.className = 'upload-icon';
      icon.src = '//tekmark.store/cdn/shop/t/7/assets/Upload%20(2).png?v=11019';
      icon.alt = 'Upload Icon';

      // 创建文字 span 元素
      const text = document.createElement('span');
      text.className = 'upload-text';
      text.textContent = 'Upload Logo';

      // 插入到按钮中
      button.appendChild(icon);
      button.appendChild(text);
    });
  }

  /**
   * 监听 Product Personalizer 文件上传，修改属性名为固定值
   * 并将文件名存储在隐藏字段中
   */
  function initPplrFileNameReplacer() {
    // 查找所有 pplr 文件上传输入框
    const fileInputs = document.querySelectorAll('.pplrfileuploadbutton input[type="file"].fileupload');
    
    fileInputs.forEach(function(input) {
      // 避免重复绑定
      if (input.dataset.fileNameReplacerBound) return;
      input.dataset.fileNameReplacerBound = 'true';
      
      // 立即修改属性名为固定值
      const currentName = input.name;
      if (currentName && currentName.startsWith('properties[')) {
        input.name = 'properties[tm_customer_upload_image]';
        console.log('[PPLR] File input name changed from', currentName, 'to', input.name);
      }
      
      // 创建隐藏的文件名字段（如果不存在）
      let filenameInput = document.querySelector('input[name="properties[_tm_customer_upload_filename]"]');
      if (!filenameInput) {
        filenameInput = document.createElement('input');
        filenameInput.type = 'hidden';
        filenameInput.name = 'properties[_tm_customer_upload_filename]';
        const form = input.closest('form');
        if (form) {
          form.appendChild(filenameInput);
        }
      }
      
      input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 更新隐藏的文件名字段
        if (filenameInput) {
          filenameInput.value = file.name;
          console.log('[PPLR] Filename stored:', file.name);
        }
      });
    });
    
    // 同样处理 pplr 文本输入框，改为固定属性名 tm_customer_remark
    const textInputs = document.querySelectorAll('.pplr-wrapper.pplr-single-line-text input[type="text"], .pplr-wrapper.pplr-text textarea');
    textInputs.forEach(function(input) {
      if (input.dataset.remarkReplacerBound) return;
      input.dataset.remarkReplacerBound = 'true';
      
      const currentName = input.name;
      if (currentName && currentName.startsWith('properties[')) {
        input.name = 'properties[tm_customer_remark]';
        console.log('[PPLR] Text input name changed from', currentName, 'to', input.name);
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initUploadButton();
      initPplrFileNameReplacer();
    });
  } else {
    initUploadButton();
    initPplrFileNameReplacer();
  }

  // 监听动态添加的元素（适用于 AJAX 加载的情况）
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          initUploadButton();
          initPplrFileNameReplacer();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
