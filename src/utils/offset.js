export function getDocumentOffset(el) {
    const rect = el.getBoundingClientRect();
    let scrollX = window.scrollX;
    let scrollY = window.scrollY;
    do {
        scrollX += el.scrollLeft || 0;
        scrollY += el.scrollTop || 0;
        el = el.parentNode;
    } while (el);
    return {
        top: rect.top + scrollY,
        left: rect.left + scrollX,
    };
}

export function getViewportOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
    };
}
