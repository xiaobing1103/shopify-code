(function() {
  var SNAPSHOT_KEY = 'tm_studio_cart_snapshots';
  var ALLOW_UNTIL_KEY = 'tm_studio_cart_add_allow_until';
  var allowMs = 4000;

  function isCartPage() {
    return window.location.pathname === '/cart' || document.body.classList.contains('template-cart');
  }

  function isCartAddUrl(url) {
    if (!url) return false;
    try {
      return new URL(url, window.location.origin).pathname.indexOf('/cart/add') !== -1;
    } catch (e) {
      return String(url).indexOf('/cart/add') !== -1;
    }
  }

  function readJSON(key, fallback) {
    try {
      var value = window.sessionStorage.getItem(key) || window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeSnapshot(value) {
    try {
      window.sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(value));
      window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(value));
    } catch (e) {
      // Storage can be disabled in private browsing.
    }
  }

  function setAllowance() {
    try {
      window.sessionStorage.setItem(ALLOW_UNTIL_KEY, String(Date.now() + allowMs));
    } catch (e) {
      // Ignore storage failures.
    }
  }

  function hasAllowance() {
    try {
      var expiresAt = parseInt(window.sessionStorage.getItem(ALLOW_UNTIL_KEY) || '0', 10);
      if (expiresAt > Date.now()) return true;
      window.sessionStorage.removeItem(ALLOW_UNTIL_KEY);
    } catch (e) {
      // Ignore storage failures.
    }
    return false;
  }

  function consumeAllowance() {
    if (!hasAllowance()) return false;
    try {
      window.sessionStorage.removeItem(ALLOW_UNTIL_KEY);
    } catch (e) {
      // Ignore storage failures.
    }
    return true;
  }

  function getRequestUrl(input) {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (typeof Request !== 'undefined' && input instanceof Request) return input.url || '';
    return input.url || '';
  }

  function cartPageHasStudioDomItem() {
    if (!isCartPage()) return false;
    var items = document.querySelectorAll('[data-cart-item]');
    return Array.prototype.some.call(items, function(item) {
      var text = item.textContent.toLowerCase();
      return text.indexOf('studio') !== -1 ||
        text.indexOf('choose metal color') !== -1 ||
        text.indexOf('choose your finish') !== -1 ||
        text.indexOf('design:') !== -1;
    });
  }

  function isExplicitCartAddClick(target) {
    return !!(target && target.closest && target.closest(
      '[data-atc-form], [data-action-atc], [data-add-gift], a[href*="/cart/add"], ' +
      'button[type="submit"][name="add"], input[type="submit"][name="add"]'
    ));
  }

  function shouldBlockCartAdd(url) {
    return isCartPage() && isCartAddUrl(url) && cartPageHasStudioDomItem() && !consumeAllowance();
  }

  function blockedResponse() {
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
      json: function() { return Promise.resolve({ blocked: true }); },
      text: function() { return Promise.resolve(body); }
    };
  }

  function getDesignFromText(text) {
    var match = String(text || '').match(/Design:\s*([^\s<]+)/i);
    return match ? match[1] : '';
  }

  function captureStudioSnapshots() {
    if (!isCartPage()) return;

    var snapshots = readJSON(SNAPSHOT_KEY, {});
    document.querySelectorAll('[data-cart-item]').forEach(function(item) {
      var title = item.querySelector('.t4s-page_cart__title, .t4s-mini_cart__title');
      var titleText = title ? title.textContent.trim() : '';
      var meta = item.querySelector('.t4s-cart_meta_propertyList');
      var metaText = meta ? meta.textContent : '';
      var design = getDesignFromText(metaText);
      var hasFullStudioProperties = /Choose Metal Color|Choose Your Finish|Additional Comments|Would you like/i.test(metaText);

      if (!design || !hasFullStudioProperties) return;

      var imageWrap = item.querySelector('[data-cart-item-image]');
      var image = imageWrap ? imageWrap.querySelector('img') : null;
      snapshots[design] = {
        title: titleText,
        metaHTML: meta.innerHTML,
        imageBackground: imageWrap ? imageWrap.style.backgroundImage : '',
        imageSrc: image ? image.getAttribute('src') : '',
        imageDataSrc: image ? image.getAttribute('data-src') : ''
      };
    });

    writeSnapshot(snapshots);
  }

  function restoreStudioSnapshots() {
    if (!isCartPage()) return;

    var snapshots = readJSON(SNAPSHOT_KEY, {});
    document.querySelectorAll('[data-cart-item]').forEach(function(item) {
      var meta = item.querySelector('.t4s-cart_meta_propertyList');
      if (!meta) return;

      var design = getDesignFromText(meta.textContent);
      var snapshot = design ? snapshots[design] : null;
      if (!snapshot || !snapshot.metaHTML) return;

      var hasFullStudioProperties = /Choose Metal Color|Choose Your Finish|Additional Comments|Would you like/i.test(meta.textContent);
      if (!hasFullStudioProperties) {
        meta.innerHTML = snapshot.metaHTML;
      }

      var imageWrap = item.querySelector('[data-cart-item-image]');
      var image = imageWrap ? imageWrap.querySelector('img') : null;
      if (imageWrap && snapshot.imageBackground) imageWrap.style.backgroundImage = snapshot.imageBackground;
      if (image && snapshot.imageDataSrc) image.setAttribute('data-src', snapshot.imageDataSrc);
      if (image && snapshot.imageSrc) image.setAttribute('src', snapshot.imageSrc);
      if (image) image.removeAttribute('srcset');
    });
  }

  function getVisibleProperties(item) {
    var props = item && item.properties ? item.properties : {};
    return Object.keys(props).filter(function(key) {
      return key.charAt(0) !== '_' &&
        key.indexOf('_bundle_') === -1 &&
        key.indexOf('_mczr_') === -1 &&
        props[key] !== null &&
        props[key] !== '';
    });
  }

  function getDesignFromItem(item) {
    var props = item && item.properties ? item.properties : {};
    return props.Design || props.design || props._mczr_designId || '';
  }

  function isStudioCartItem(item) {
    var title = ((item && (item.product_title || item.title)) || '').toLowerCase();
    return title.indexOf('studio') !== -1 || !!getDesignFromItem(item);
  }

  function updateHeaderCartCount(count) {
    document.querySelectorAll('[data-cart-count], [data-cart-ttcount]').forEach(function(node) {
      node.textContent = String(count);
    });
  }

  function removeDuplicateStudioItems() {
    if (!window.fetch) return Promise.resolve(false);

    return fetch('/cart.js', { credentials: 'same-origin' })
      .then(function(response) { return response.json(); })
      .then(function(cart) {
        var groups = {};

        (cart.items || []).forEach(function(item, index) {
          if (!isStudioCartItem(item)) return;

          var design = getDesignFromItem(item);
          if (!design) return;

          var groupKey = [item.product_id, item.variant_id, design].join(':');
          var visibleProps = getVisibleProperties(item);
          var score = visibleProps.length;

          if (!groups[groupKey]) groups[groupKey] = [];
          groups[groupKey].push({
            key: item.key,
            index: index,
            score: score
          });
        });

        var keysToRemove = [];
        Object.keys(groups).forEach(function(groupKey) {
          var group = groups[groupKey];
          if (group.length < 2) return;

          group.sort(function(a, b) {
            if (b.score !== a.score) return b.score - a.score;
            return a.index - b.index;
          });

          group.slice(1).forEach(function(entry) {
            keysToRemove.push(entry.key);
          });
        });

        if (!keysToRemove.length) return false;

        return keysToRemove.reduce(function(chain, key) {
          return chain.then(function() {
            return fetch('/cart/change.js', {
              method: 'POST',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ id: key, quantity: 0 })
            });
          });
        }, Promise.resolve()).then(function() {
          return fetch('/cart.js', { credentials: 'same-origin' });
        }).then(function(response) {
          return response.json();
        }).then(function(updatedCart) {
          updateHeaderCartCount(updatedCart.item_count || 0);
          document.dispatchEvent(new CustomEvent('cart:refresh'));
          if (isCartPage()) window.location.reload();
          return true;
        });
      }).catch(function() {
        return false;
      });
  }

  document.addEventListener('click', function(event) {
    if (isExplicitCartAddClick(event.target)) {
      setAllowance();
    }
  }, true);

  document.addEventListener('submit', function(event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!shouldBlockCartAdd(form.getAttribute('action') || '')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  if (window.fetch) {
    var originalFetch = window.fetch;
    window.fetch = function(input, init) {
      var url = getRequestUrl(input);
      if (shouldBlockCartAdd(url)) return Promise.resolve(blockedResponse());
      return originalFetch.apply(this, arguments);
    };
  }

  if (window.XMLHttpRequest) {
    var originalOpen = XMLHttpRequest.prototype.open;
    var originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._tmStudioCartGuardUrl = url;
      return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      if (shouldBlockCartAdd(this._tmStudioCartGuardUrl)) {
        this.abort();
        return;
      }
      return originalSend.apply(this, arguments);
    };
  }

  if (typeof HTMLFormElement !== 'undefined') {
    var nativeSubmit = HTMLFormElement.prototype.submit;
    if (typeof nativeSubmit === 'function') {
      HTMLFormElement.prototype.submit = function() {
        if (shouldBlockCartAdd(this.getAttribute('action') || '')) return;
        return nativeSubmit.apply(this, arguments);
      };
    }
  }

  function init() {
    captureStudioSnapshots();
    restoreStudioSnapshots();
    removeDuplicateStudioItems().then(function(removed) {
      if (!removed) {
        captureStudioSnapshots();
        restoreStudioSnapshots();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
