'use strict';

export function getXPath(element, root=document.body) {
    if (element===root) return '';

    let nodePath = null;
    let nodeName = element.nodeName === "#text" ? 'text()' : element.nodeName;

    if (element.id !== '' && element.id !== undefined) {
        nodePath = nodeName + '[@id="'+element.id+'"]';
    } else {
        let offset = 1;
        let siblings = element.parentNode.childNodes;
        for (let i= 0; i<siblings.length; i++) {
            let sibling = siblings[i];
            if (sibling === element) {
                nodePath = nodeName+'[' + offset + ']';
                break;
            }
            let siblingName = sibling.nodeName === "#text" ? 'text()' : sibling.nodeName;
            if ([1,3].includes(sibling.nodeType) && siblingName === nodeName) offset++;
        }
    }

    if (element.parentNode !== root) {
        nodePath = getXPath(element.parentNode, root) + '/' + nodePath;
    }
    return nodePath;
}

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
        left: rect.left + scrollX
    }
}

export function getViewportOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left
    }
}
