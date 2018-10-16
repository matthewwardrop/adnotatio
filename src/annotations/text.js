'use strict';

import Annotation from './base';
import {get_element_xpath} from '../utils.js';

export default class TextAnnotation extends Annotation {

    static TYPE = 'text';

    isOrphaned = (root=document.body) => {
        return this.toRange(root) === null ? true : false;
    }

    get highlighted_text() {
        return this.spec.text;
    }

    render = (root, bglayer, fglayer) => {
        let range = this.toRange(root);
        if (range) addClientRects(range, bglayer);
    }

    // Conversion to and from DOM Range

    static fromRange(range, root=document.body) {
        return new this({
            ...this.get_spec_base(),
            text: range.toString(),
            startContext: {
                xpath: get_element_xpath(range.startContainer, root),
                offset: range.startOffset
            },
            endContext: {
                xpath: get_element_xpath(range.endContainer, root),
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


function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY
  };
}


function addClientRects(elt, root=document.body) {
	// Absolutely position a div over each client rect so that its border width
	// is the same as the rectangle's width.
	// Note: the overlays will be out of place if the user resizes or zooms.
    var offset = getOffset(root)
    console.log(elt);
	var rects = elt.getClientRects();
	for (var i = 0; i != rects.length; i++) {
		var rect = rects[i];
		var tableRectDiv = document.createElement('div');
		tableRectDiv.style.position = 'absolute';
        tableRectDiv.className = 'highlight';
		var scrollTop = (
            (document.documentElement.scrollTop || document.body.scrollTop)
            - offset.top);
		var scrollLeft = (
            (document.documentElement.scrollLeft || document.body.scrollLeft)
            - offset.left);
		tableRectDiv.style.top = (rect.top + scrollTop) + 'px';
		tableRectDiv.style.left = (rect.left + scrollLeft) + 'px';
		// we want rect.width to be the border width, so content width is 2px less.
		tableRectDiv.style.width = (rect.width - 2) + 'px';
		tableRectDiv.style.height = (rect.height - 2) + 'px';
		root.appendChild(tableRectDiv);
	}
}
