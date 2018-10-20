'use strict';

import Annotation from './base';
import {getViewportOffset, getXPath} from '../utils.js';

export default class TextAnnotation extends Annotation {

    static TYPE = 'text';

    isOrphaned = (root=document.body) => {
        return this.toRange(root) === null ? true : false;
    }

    get highlighted_text() {
        return this.spec.text;
    }

    render = (root, bglayer, fglayer, onclick=null, onmouseover=null, onmouseout=null) => {
        let range = this.toRange(root);
        if (!range) return;

        var rootOffset = getViewportOffset(fglayer);
    	var rects = range.getClientRects();

        let highlightContainer = document.createElement('div');
        highlightContainer.className = 'adnotatio-text-highlight';
        highlightContainer.style.top = '0px';
        highlightContainer.style.left = '0px';
        highlightContainer.style.width = '0px';
        highlightContainer.style.height = '0px';
        if (onclick) highlightContainer.onclick = onclick;
        if (onmouseover) highlightContainer.onmouseover = onmouseover;
        if (onmouseout) highlightContainer.onmouseout = onmouseout;

        let minOffsetY = Infinity;

    	for (var i = 0; i != rects.length; i++) {
    		var rect = rects[i];
    		var highlightDiv = document.createElement('div');
            minOffsetY = Math.min(minOffsetY, rect.top - rootOffset.top);
    		highlightDiv.style.top = (rect.top - rootOffset.top) + 'px';
    		highlightDiv.style.left = (rect.left - rootOffset.left) + 'px';
    		highlightDiv.style.width = rect.width + 'px';
    		highlightDiv.style.height = rect.height + 'px';
    		highlightContainer.appendChild(highlightDiv);
    	}

        highlightContainer.dataset.minOffsetY = minOffsetY;

        fglayer.appendChild(highlightContainer);

        return highlightContainer;
    }

    // Conversion to and from DOM Range

    static fromRange(range, root=document.body) {
        return new this({
            ...this.get_spec_base(),
            text: range.toString(),
            startContext: {
                xpath: getXPath(range.startContainer, root),
                offset: range.startOffset
            },
            endContext: {
                xpath: getXPath(range.endContainer, root),
                offset: range.endOffset
            }
        })
    }

    toRange = (root=document.body) => {
        let range = document.createRange();

        try {
            range.setStart(document.evaluate(this.spec.startContext.xpath, root).iterateNext(), this.spec.startContext.offset)
            range.setEnd(document.evaluate(this.spec.endContext.xpath, root).iterateNext(), this.spec.endContext.offset)
            if (range.toString() !== this.spec.text) {
                return null;
            }
        } catch {
            return null;
        }

        return range;
    }

}
