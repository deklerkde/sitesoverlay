(function () {
    // Remove old stage if exists
    const oldStage = document.getElementById('ds-ghost-stage');
    if (oldStage) oldStage.remove();

    // Create new stage
    const stage = document.createElement('div');
    stage.id = 'ds-ghost-stage';
    Object.assign(stage.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: document.body.scrollHeight + 'px',
        pointerEvents: 'none',
        zIndex: '999999'
    });
    document.body.appendChild(stage);

    // Helper function to create ghost overlay
    function createGhost(el, label, color, borderStyle, overlayAttr) {
        const rect = el.getBoundingClientRect();

        // Skip if element is not visible
        if (rect.width === 0 && rect.height === 0) return;

        const ghost = document.createElement('div');
        if (overlayAttr) {
            ghost.setAttribute(overlayAttr, 'true');
        }

        Object.assign(ghost.style, {
            position: 'absolute',
            top: (rect.top + window.scrollY) + 'px',
            left: (rect.left + window.scrollX) + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px',
            border: '3px ' + borderStyle + ' ' + color,
            backgroundColor: color + '18',
            boxSizing: 'border-box',
            zIndex: '100'
        });

        const labelDiv = document.createElement('div');
        labelDiv.innerText = label;
        Object.assign(labelDiv.style, {
            position: 'absolute',
            top: '-22px',
            left: '0',
            background: color,
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '4px 8px',
            whiteSpace: 'nowrap',
            borderRadius: '3px'
        });

        ghost.appendChild(labelDiv);
        stage.appendChild(ghost);
    }

    // Track what we've already marked to avoid duplicates
    const marked = new Set();

    // 1. Major Layout Sections
    const layoutSections = [
        { selector: '.tf-lhs-col', label: 'LHS Column', color: '#ff0055' },
        { selector: '.tf-rhs-col', label: 'RHS Column', color: '#ff6600' },
        { selector: '.header', label: 'Header', color: '#9933ff' },
        { selector: '.footer', label: 'Footer', color: '#666666' }
    ];

    layoutSections.forEach(function (item) {
        const el = document.querySelector(item.selector);
        if (el && !marked.has(el)) {
            createGhost(el, item.label, item.color, 'solid', 'data-overlay-layout');
            marked.add(el);
        }
    });

    // 2. Article Containers with HTML comment names
    const articleContainers = [
        { selector: '.in-focus', label: 'In Focus Widget', color: '#0099ff' },
        { selector: '.featured', label: 'Featured Article', color: '#0099ff' }
    ];

    articleContainers.forEach(function (item) {
        document.querySelectorAll(item.selector).forEach(function (el) {
            if (!marked.has(el)) {
                let commentLabel = item.label;
                let node = el.previousSibling;

                while (node) {
                    if (node.nodeType === 8) { // Node.COMMENT_NODE
                        const commentText = node.nodeValue.trim();
                        if (commentText && commentText.length > 3 && !commentText.includes('---')) {
                            commentLabel = commentText;
                            break;
                        }
                    }
                    node = node.previousSibling;
                }

                createGhost(el, commentLabel, item.color, 'solid', 'data-overlay-article');
                marked.add(el);
            }
        });
    });

    // Also mark article-list--container elements with their comment names
    document.querySelectorAll('.article-list--container').forEach(function (el) {
        if (!marked.has(el)) {
            let commentLabel = 'Article List Container';
            let node = el.previousSibling;

            while (node) {
                if (node.nodeType === 8) { // Node.COMMENT_NODE
                    const commentText = node.nodeValue.trim();
                    if (commentText && commentText.length > 3 && !commentText.includes('---')) {
                        commentLabel = commentText;
                        break;
                    }
                }
                node = node.previousSibling;
            }

            createGhost(el, commentLabel, '#0066cc', 'solid', 'data-overlay-article');
            marked.add(el);
        }
    });

    // 3. Card Types within Article Lists (examples only)
    const cardTypes = [
        { selector: '.article-item.thumb--small', label: 'Small Thumb Card', color: '#33ccff' },
        { selector: '.article-item.thumb--medium', label: 'Medium Thumb Card', color: '#33aaff' }
    ];

    cardTypes.forEach(function (item) {
        document.querySelectorAll(item.selector).forEach(function (el, idx) {
            if (idx < 3 && !marked.has(el)) {
                createGhost(el, item.label + ' (example)', item.color, 'dashed', 'data-overlay-cards');
                marked.add(el);
            }
        });
    });

    // 4. RHS Components - Find all elements preceded by significant HTML comments
    // Walk the tree to find commented elements throughout the document
    function walkTreeForComments(parentNode, elementsWithComments) {
        let node = parentNode.firstChild;

        while (node) {
            if (node.nodeType === 8) { // Node.COMMENT_NODE
                const commentText = node.nodeValue.trim();
                // Look for meaningful comments (exclude very short ones and system comments)
                if (commentText && commentText.length > 3 &&
                    !commentText.includes('---') &&
                    !commentText.toLowerCase().includes('google tag manager') &&
                    !commentText.toLowerCase().includes('end google') &&
                    !commentText.toLowerCase().includes('dwc') &&
                    !commentText.toLowerCase().startsWith('adslot')) {

                    // Find the next element sibling (skip text nodes)
                    let nextNode = node.nextSibling;
                    while (nextNode && nextNode.nodeType !== 1) { // Node.ELEMENT_NODE
                        nextNode = nextNode.nextSibling;
                    }

                    // Add element if it exists and isn't already marked
                    if (nextNode && !marked.has(nextNode)) {
                        elementsWithComments.push({
                            element: nextNode,
                            comment: commentText
                        });
                    }
                }
            }

            // Recurse into child nodes
            if (node.nodeType === 1) { // Node.ELEMENT_NODE
                walkTreeForComments(node, elementsWithComments);
            }

            node = node.nextSibling;
        }
    }

    // Collect all comment-preceded elements
    const commentedElements = [];
    walkTreeForComments(document.body, commentedElements);

    // Create overlays for comment-preceded elements
    commentedElements.forEach(function (item) {
        if (!marked.has(item.element)) {
            // Only create overlay if element is visible
            const rect = item.element.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) {
                createGhost(item.element, item.comment, '#00cc66', 'solid', 'data-overlay-widgets');
                marked.add(item.element);
            }
        }
    });

    // 4b. Also include specific RHS widget selectors as fallback
    const rhsComponents = [
        { selector: '.most-read-widget', label: 'Most Read Widget', color: '#00cc66' },
        { selector: '.vote-widget', label: 'Vote Widget', color: '#00cc66' },
        { selector: '.newsletter-subscription', label: 'Newsletter Subscription', color: '#00cc66' },
        { selector: '.traffic-widget', label: 'Traffic Widget', color: '#00cc66' },
        { selector: '.site-search-query', label: 'Search Widget', color: '#00cc66' }
    ];

    rhsComponents.forEach(function (item) {
        document.querySelectorAll(item.selector).forEach(function (el, idx) {
            if (!marked.has(el)) {
                const finalLabel = document.querySelectorAll(item.selector).length > 1
                    ? item.label + ' ' + (idx + 1)
                    : item.label;
                createGhost(el, finalLabel, item.color, 'solid', 'data-overlay-widgets');
                marked.add(el);
            }
        });
    });

    // 5. Ad Slots
    const adContainers = document.querySelectorAll('[data-adname]');
    const adTypes = {};

    adContainers.forEach(function (el) {
        const adName = el.getAttribute('data-adname');
        if (!adTypes[adName]) {
            adTypes[adName] = [];
        }
        adTypes[adName].push(el);
    });

    Object.entries(adTypes).forEach(function (entry) {
        const adName = entry[0];
        const elements = entry[1];

        elements.forEach(function (el, idx) {
            if (!marked.has(el)) {
                const label = elements.length > 1
                    ? 'AD: ' + adName + ' ' + (idx + 1)
                    : 'AD: ' + adName;
                createGhost(el, label, '#bc13fe', 'solid', 'data-overlay-ads');
                marked.add(el);
            }
        });
    });

    // 6. Add legend with checkboxes
    const legend = document.createElement('div');
    Object.assign(legend.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.92)',
        color: '#fff',
        padding: '12px',
        fontSize: '12px',
        zIndex: '1000000',
        borderRadius: '6px',
        maxWidth: '240px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    });

    const overlayTypes = [
        { id: 'layout', label: 'Layout Sections', color: '#ff0055', attr: 'data-overlay-layout' },
        { id: 'articles', label: 'Article Containers', color: '#0066cc', attr: 'data-overlay-article' },
        { id: 'cards', label: 'Card Examples', color: '#33ccff', attr: 'data-overlay-cards' },
        { id: 'widgets', label: 'RHS Widgets', color: '#00cc66', attr: 'data-overlay-widgets' },
        { id: 'ads', label: 'Ad Slots', color: '#bc13fe', attr: 'data-overlay-ads' }
    ];

    let legendHTML = '<div style="font-weight:bold;margin-bottom:10px;font-size:13px">Component Overview</div>';

    overlayTypes.forEach(function (type) {
        legendHTML += '<label style="display:flex;align-items:center;margin:8px 0;cursor:pointer">';
        legendHTML += '<input type="checkbox" id="toggle-' + type.id + '" data-overlay-type="' + type.attr + '" checked style="margin-right:8px;cursor:pointer;width:14px;height:14px">';
        legendHTML += '<span style="color:' + type.color + ';margin-right:8px;font-size:16px">■</span>';
        legendHTML += '<span style="font-size:11px">' + type.label + '</span>';
        legendHTML += '</label>';
    });

    legendHTML += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #666">';
    legendHTML += '<button id="toggle-all-btn" style="width:100%;padding:6px;cursor:pointer;margin-bottom:6px;border-radius:3px;border:none;background:#444;color:#fff">Toggle All</button>';
    legendHTML += '<button id="remove-overlays-btn" style="width:100%;padding:6px;cursor:pointer;border-radius:3px;border:none;background:#d32f2f;color:#fff">Remove Overlays</button>';
    legendHTML += '</div>';

    legend.innerHTML = legendHTML;
    document.body.appendChild(legend);

    // Add event listeners for checkboxes
    overlayTypes.forEach(function (type) {
        const checkbox = document.getElementById('toggle-' + type.id);
        checkbox.addEventListener('change', function (e) {
            const overlays = stage.querySelectorAll('[' + type.attr + ']');
            overlays.forEach(function (overlay) {
                overlay.style.display = e.target.checked ? 'block' : 'none';
            });
        });
    });

    // Remove overlays button
    document.getElementById('remove-overlays-btn').addEventListener('click', function () {
        stage.remove();
        legend.remove();
    });

    // Toggle all button
    document.getElementById('toggle-all-btn').addEventListener('click', function () {
        const checkboxes = legend.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(function (cb) {
            return cb.checked;
        });
        checkboxes.forEach(function (cb) {
            cb.checked = !allChecked;
            cb.dispatchEvent(new Event('change'));
        });
    });

    console.log('✅ Component overlays created successfully');
    console.log('📊 Components marked: ' + marked.size);
})();
