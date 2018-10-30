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
