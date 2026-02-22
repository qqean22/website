/**
 * Work gallery: category filter, clickable images, lightbox with prev/next.
 */
(function () {
    const baseUrl = 'images/work/';
    const container = document.getElementById('workContent');
    if (!container) return;

    const categoryLabels = {
        'personal-branding': 'Personal branding',
        'clothing': 'Clothing',
        'products': 'Products',
        'events': 'Events'
    };

    const categoryOrder = ['personal-branding', 'clothing', 'products', 'events'];

    let allImages = [];
    let currentFilter = 'all';
    let lightboxVisibleList = [];
    let lightboxPosition = 0;

    function formatShootName(str) {
        return str
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function getVisibleList() {
        if (currentFilter === 'all') return allImages;
        return allImages.filter(function (img) { return img.category === currentFilter; });
    }

    function buildShootGrid(categoryKey, shootName, images) {
        var grid = document.createElement('div');
        grid.className = 'work-shoot-grid';
        images.forEach(function (filename) {
            var src = baseUrl + encodeURIComponent(categoryKey) + '/' + encodeURIComponent(shootName) + '/' + encodeURIComponent(filename);
            var alt = formatShootName(shootName) + ' — ' + filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
            var idx = allImages.length;
            allImages.push({ src: src, alt: alt, category: categoryKey, globalIndex: idx });

            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'work-item';
            item.setAttribute('data-gallery-index', idx);
            item.setAttribute('aria-label', 'View ' + alt);
            var img = document.createElement('img');
            img.src = src;
            img.alt = alt;
            img.loading = 'lazy';
            item.appendChild(img);
            grid.appendChild(item);
        });
        return grid;
    }

    function renderFilterBar(containerEl) {
        var bar = document.createElement('div');
        bar.className = 'work-filter';
        bar.setAttribute('role', 'tablist');
        bar.setAttribute('aria-label', 'Filter by category');

        function addTab(value, label) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'work-filter-btn' + (value === currentFilter ? ' is-active' : '');
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', value === currentFilter ? 'true' : 'false');
            btn.textContent = label;
            btn.addEventListener('click', function () {
                currentFilter = value;
                bar.querySelectorAll('.work-filter-btn').forEach(function (b) {
                    b.classList.toggle('is-active', b === btn);
                    b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
                });
                containerEl.querySelectorAll('.work-category').forEach(function (section) {
                    var cat = section.getAttribute('data-category');
                    var show = value === 'all' || cat === value;
                    section.classList.toggle('is-hidden', !show);
                });
            });
            bar.appendChild(btn);
        }

        addTab('all', 'All');
        categoryOrder.forEach(function (key) { addTab(key, categoryLabels[key]); });
        return bar;
    }

    function openLightbox(globalIndex) {
        lightboxVisibleList = getVisibleList();
        var pos = lightboxVisibleList.findIndex(function (img) { return img.globalIndex === globalIndex; });
        if (pos < 0) pos = 0;
        lightboxPosition = pos;
        lightbox.show();
        lightbox.updateImage();
    }

    function createLightbox() {
        var overlay = document.createElement('div');
        overlay.className = 'work-lightbox';
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Image viewer');
        overlay.setAttribute('hidden', '');

        overlay.innerHTML =
            '<button type="button" class="work-lightbox-close" aria-label="Close">×</button>' +
            '<button type="button" class="work-lightbox-prev" aria-label="Previous image">‹</button>' +
            '<div class="work-lightbox-content">' +
            '  <img src="" alt="" class="work-lightbox-img">' +
            '  <span class="work-lightbox-counter"></span>' +
            '</div>' +
            '<button type="button" class="work-lightbox-next" aria-label="Next image">›</button>';

        var content = overlay.querySelector('.work-lightbox-content');
        var imgEl = overlay.querySelector('.work-lightbox-img');
        var counterEl = overlay.querySelector('.work-lightbox-counter');
        var closeBtn = overlay.querySelector('.work-lightbox-close');
        var prevBtn = overlay.querySelector('.work-lightbox-prev');
        var nextBtn = overlay.querySelector('.work-lightbox-next');

        function updateImage() {
            var list = lightboxVisibleList;
            if (list.length === 0) return;
            var cur = list[lightboxPosition];
            imgEl.src = cur.src;
            imgEl.alt = cur.alt;
            counterEl.textContent = (lightboxPosition + 1) + ' / ' + list.length;
            prevBtn.style.visibility = list.length > 1 ? 'visible' : 'hidden';
            nextBtn.style.visibility = list.length > 1 ? 'visible' : 'hidden';
        }

        function show() {
            overlay.removeAttribute('hidden');
            document.body.style.overflow = 'hidden';
            updateImage();
        }

        function hide() {
            overlay.setAttribute('hidden', '');
            document.body.style.overflow = '';
        }

        function go(delta) {
            var list = lightboxVisibleList;
            if (list.length === 0) return;
            lightboxPosition = (lightboxPosition + delta + list.length) % list.length;
            updateImage();
        }

        closeBtn.addEventListener('click', hide);
        prevBtn.addEventListener('click', function () { go(-1); });
        nextBtn.addEventListener('click', function () { go(1); });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) hide();
        });

        document.addEventListener('keydown', function (e) {
            if (overlay.hasAttribute('hidden')) return;
            if (e.key === 'Escape') hide();
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
        });

        imgEl.addEventListener('click', function (e) { e.stopPropagation(); });

        var lightbox = {
            show: show,
            hide: hide,
            updateImage: updateImage,
            overlay: overlay
        };

        document.body.appendChild(overlay);
        return lightbox;
    }

    var lightbox = createLightbox();

    fetch(baseUrl + 'gallery.json')
        .then(function (res) { return res.ok ? res.json() : {}; })
        .then(function (gallery) {
            if (typeof gallery !== 'object') return;

            var filterWrap = document.createElement('div');
            filterWrap.className = 'work-filter-wrap';
            filterWrap.appendChild(renderFilterBar(container));
            container.appendChild(filterWrap);

            var hasAny = false;
            categoryOrder.forEach(function (categoryKey) {
                var shoots = gallery[categoryKey];
                if (!Array.isArray(shoots) || shoots.length === 0) return;
                hasAny = true;

                var section = document.createElement('section');
                section.className = 'work-category';
                section.setAttribute('data-category', categoryKey);

                var heading = document.createElement('h2');
                heading.className = 'work-category-title';
                heading.textContent = categoryLabels[categoryKey] || categoryKey;

                var categoryInner = document.createElement('div');
                categoryInner.className = 'work-category-inner';

                shoots.forEach(function (entry) {
                    var shootName = entry.shoot;
                    var images = entry.images || [];
                    if (images.length === 0) return;

                    var block = document.createElement('div');
                    block.className = 'work-shoot';
                    var shootHeading = document.createElement('h3');
                    shootHeading.className = 'work-shoot-title';
                    shootHeading.textContent = formatShootName(shootName);
                    block.appendChild(shootHeading);
                    block.appendChild(buildShootGrid(categoryKey, shootName, images));
                    categoryInner.appendChild(block);
                });

                section.appendChild(heading);
                section.appendChild(categoryInner);
                container.appendChild(section);
            });

            container.querySelectorAll('.work-item').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var idx = parseInt(btn.getAttribute('data-gallery-index'), 10);
                    openLightbox(idx);
                });
            });

            if (!hasAny) {
                filterWrap.remove();
                container.innerHTML = '<p class="work-empty">No work to show yet. Check back soon.</p>';
            }
        })
        .catch(function () {
            container.innerHTML = '<p class="work-empty">Gallery is temporarily unavailable.</p>';
        });
})();
